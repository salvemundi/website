import os
import datetime
import secrets
import string
import re
import unidecode
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, APIRouter
from pydantic import BaseModel
import httpx
import asyncio


app = FastAPI()

TENANT_ID = os.getenv("MS_GRAPH_TENANT_ID")
CLIENT_ID = os.getenv("MS_GRAPH_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_GRAPH_CLIENT_SECRET")
DOMAIN = os.getenv("MS_GRAPH_DOMAIN", "salvemundi.nl")
ATTRIBUTE_SET_NAME = "SalveMundiLidmaatschap"

router = APIRouter(prefix="/api/membership")

class CreateMemberRequest(BaseModel):
    first_name: str
    last_name: str
    personal_email: str
    phone_number: str = None
    date_of_birth: str = None

class MembershipRequest(BaseModel):
    user_id: str

async def get_graph_token():
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    data = {
        "client_id": CLIENT_ID,
        "scope": "https://graph.microsoft.com/.default",
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=data)
        if response.status_code != 200:
            error_response = response.json()
            error_message = error_response.get("error_description", "Unknown Authentication Error")
            raise HTTPException(status_code=500, detail=f"Graph Auth Failed: {error_message}")
        return response.json().get("access_token")

def generate_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for i in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password

def clean_name_for_upn(name: str):
    clean = unidecode.unidecode(name.strip().lower())
    return re.sub(r'[^a-z0-9]', '', clean)

async def find_unique_upn(first_name: str, last_name: str, token: str):
    base_name = f"{clean_name_for_upn(first_name)}.{clean_name_for_upn(last_name)}"
    candidate_upn = f"{base_name}@{DOMAIN}"
    counter = 0
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        while True:
            if counter > 0:
                candidate_upn = f"{base_name}{counter}@{DOMAIN}"
            url = f"https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '{candidate_upn}'&$select=id"
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if not data.get("value"): 
                    return candidate_upn
            counter += 1

async def create_azure_user(data: CreateMemberRequest, token: str):
    password = generate_password()
    upn = await find_unique_upn(data.first_name, data.last_name, token)
    user_payload = {
        "accountEnabled": True,
        "displayName": f"{data.first_name} {data.last_name}",
        "mailNickname": upn.split('@')[0],
        "userPrincipalName": upn,
        "passwordProfile": {"forceChangePasswordNextSignIn": True, "password": password},
        "givenName": data.first_name,
        "surname": data.last_name,
        "otherMails": [data.personal_email] 
    }
    if data.phone_number:
        user_payload["mobilePhone"] = data.phone_number
    # Note: birthday cannot be set in initial POST, will be set via PATCH in update_user_attributes
        
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        response = await client.post("https://graph.microsoft.com/v1.0/users", json=user_payload, headers=headers)
        if response.status_code != 201:
            raise HTTPException(status_code=400, detail=f"User creation failed: {response.text}")
        user_data = response.json()
        return {"id": user_data["id"], "upn": user_data["userPrincipalName"], "password": password}

async def update_user_attributes(user_id: str, date_of_birth: str = None):
    try:
        token = await get_graph_token()
        headers = { "Authorization": f"Bearer {token}", "Content-Type": "application/json" }
        
        # Wij berekenen de verloopdatum (vandaag + 1 jaar)
        vandaag = datetime.date.today()
        try:
            volgend_jaar = vandaag.replace(year=vandaag.year + 1)
        except ValueError:
            # Handle Feb 29th Case: move to Feb 28th
            volgend_jaar = vandaag.replace(year=vandaag.year + 1, day=28)

        betaal_datum = vandaag.strftime("%Y%m%d")
        verloop_datum = volgend_jaar.strftime("%Y%m%d")
        
        # We perform a GET first to verify current state (debugging)
        url_beta = f"https://graph.microsoft.com/beta/users/{user_id}"
        async with httpx.AsyncClient() as client:
            check_res = await client.get(f"{url_beta}?$select=customSecurityAttributes", headers=headers)
            print(f"DEBUG: Current attributes in Azure for {user_id}: {check_res.text}")

            # 1. Critical Update: Membership Dates
            payload_dates = {
                "customSecurityAttributes": {
                    ATTRIBUTE_SET_NAME: {
                        "@odata.type": "#microsoft.graph.customSecurityAttributeValue",
                        "OrigineleBetaalDatumStr": betaal_datum,
                        "VerloopdatumStr": verloop_datum,
                        "Geboortedatum": date_of_birth
                    }
                }
            }
            
            # Schrijven doen we via v1.0, dat is nu bewezen werkend met de type hint
            url_v1 = f"https://graph.microsoft.com/v1.0/users/{user_id}"
            print(f"DEBUG: Sending PATCH (Dates) to {url_v1} with payload: {payload_dates}")
            res = await client.patch(url_v1, json=payload_dates, headers=headers)
            
            if res.status_code not in [200, 204]:
                print(f"Graph Patch Error (Dates): {res.status_code} - {res.text}")
                return # Critical failure

            # 2. Update Date of Birth (Standard Property)
            if date_of_birth:
                # Ensure ISO 8601 format with Easter Egg time (404: Time Not Found)
                dob_payload = {"birthday": f"{date_of_birth}T04:04:04Z" if "T" not in date_of_birth else date_of_birth}
                print(f"DEBUG: Sending PATCH (Birthday) to {url_v1} with: {dob_payload}")
                res_dob = await client.patch(url_v1, json=dob_payload, headers=headers)
                if res_dob.status_code not in [200, 204]:
                     print(f"⚠️ Warning: perform Birthday update failed: {res_dob.status_code} - {res_dob.text}")
            
            # VERIFICATION LOOP: Wait until Azure AD actually shows the new attributes
            print(f"DEBUG: Starting verification for {user_id}...")
            for i in range(10):  # Max 10 attempts (10 seconds)
                await asyncio.sleep(1)
                check_res = await client.get(f"{url_beta}?$select=customSecurityAttributes", headers=headers)
                if check_res.status_code == 200:
                    attr_data = check_res.json().get("customSecurityAttributes", {})
                    current_expiry = attr_data.get(ATTRIBUTE_SET_NAME, {}).get("VerloopdatumStr")
                    if current_expiry == verloop_datum:
                        print(f"✅ Verified! Azure AD now reflects expiry {verloop_datum} for {user_id} after {i+1}s")
                        return
                print(f"DEBUG: Verification attempt {i+1} failed for {user_id}, retrying...")
            
            print(f"⚠️ Warning: Attributes updated but could not be verified within 10s for {user_id}")
    except Exception as e:
        print(f"Attribute update error: {e}")

@router.post("/create-user")
async def create_user_endpoint(request: CreateMemberRequest, background_tasks: BackgroundTasks):
    token = await get_graph_token()
    new_user_data = await create_azure_user(request, token)
    # Wacht even zodat user gepropageerd is
    await update_user_attributes(new_user_data["id"], date_of_birth=request.date_of_birth)
    return {
        "status": "created",
        "user_id": new_user_data["id"],
        "upn": new_user_data["upn"],
        "password": new_user_data["password"]
    }

@router.post("/register")
async def register_member(request: MembershipRequest, background_tasks: BackgroundTasks):
    if not request.user_id: raise HTTPException(status_code=400, detail="Missing user_id")
    await update_user_attributes(request.user_id)
    return {"status": "processing"}

@router.get("/health")
def health_check(): return {"status": "ok"}

app.include_router(router)