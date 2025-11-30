import os
import datetime
import secrets
import string
import re
import unidecode
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter
from pydantic import BaseModel
import httpx

app = FastAPI()

# Microsoft Graph Secrets
TENANT_ID = os.getenv("MS_GRAPH_TENANT_ID")
CLIENT_ID = os.getenv("MS_GRAPH_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_GRAPH_CLIENT_SECRET")
DOMAIN = os.getenv("MS_GRAPH_DOMAIN", "salvemundi.nl")
ATTRIBUTE_SET_NAME = "SalveMundiLidmaatschap"

# Directus Provisioning Secrets
DIRECTUS_API_URL = os.getenv("DEV_DIRECTUS_URL")
DIRECTUS_SYSTEM_TOKEN = os.getenv("DEV_DIRECTUS_API_TOKEN")
DIRECTUS_MEMBER_ROLE_ID = os.getenv("DIRECTUS_MEMBER_ROLE_ID")

router = APIRouter(prefix="/api/membership")

class CreateMemberRequest(BaseModel):
    first_name: str
    last_name: str
    personal_email: str

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

            if "client_secret" in error_message or "expired" in error_message.lower() or "invalid_client" in error_message.lower():
                raise HTTPException(
                    status_code=500, 
                    detail=f"CRITICAL AUTH ERROR: Azure Client Secret is invalid or expired. Update MS_GRAPH_CLIENT_SECRET in GitHub Secrets. (Details: {error_message})"
                )
            
            raise HTTPException(
                status_code=500, 
                detail=f"Graph Authentication Failed. Check Configuration. (Azure Error: {error_message})"
            )
        
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
            else:
                print(f"UPN Check Error: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to check UPN uniqueness")
            
            counter += 1

async def create_azure_user(data: CreateMemberRequest, token: str):
    password = generate_password()
    upn = await find_unique_upn(data.first_name, data.last_name, token)
    
    user_payload = {
        "accountEnabled": True,
        "displayName": f"{data.first_name} {data.last_name}",
        "mailNickname": upn.split('@')[0],
        "userPrincipalName": upn,
        "passwordProfile": {
            "forceChangePasswordNextSignIn": True,
            "password": password
        },
        "givenName": data.first_name,
        "surname": data.last_name,
        "otherMails": [data.personal_email] 
    }
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        response = await client.post("https://graph.microsoft.com/v1.0/users", json=user_payload, headers=headers)
        
        if response.status_code != 201:
            error_detail = response.json()
            print(f"Create User Error: {error_detail}")
            raise HTTPException(status_code=400, detail=f"User creation failed: {error_detail}")
            
        user_data = response.json()
        return {
            "id": user_data["id"],
            "upn": user_data["userPrincipalName"],
            "password": password
        }

async def update_user_attributes(user_id: str):
    try:
        token = await get_graph_token()
        vandaag = datetime.date.today()
        volgend_jaar = vandaag.replace(year=vandaag.year + 1)
        betaal_datum = vandaag.strftime("%Y%m%d")
        verloop_datum = volgend_jaar.strftime("%Y%m%d")
        
        url = f"https://graph.microsoft.com/v1.0/users/{user_id}"
        payload = {
            "customSecurityAttributes": {
                ATTRIBUTE_SET_NAME: {
                    "OrigineleBetaalDatumStr": betaal_datum,
                    "VerloopdatumStr": verloop_datum
                }
            }
        }
        headers = { "Authorization": f"Bearer {token}", "Content-Type": "application/json" }

        async with httpx.AsyncClient() as client:
            res = await client.patch(url, json=payload, headers=headers)
            if res.status_code not in [200, 204]:
                print(f"Graph Patch Error: {res.text}")
            else:
                print(f"Attributes updated for {user_id}")
    except Exception as e:
        print(f"Attribute update error: {e}")

async def provision_directus_user(user_data: dict):
    # Waarom: Nieuw lid moet direct na aanmaak in Entra ID ook lokaal in Directus bestaan 
    # om onmiddellijke SSO inlog/herkenning door andere flows te garanderen.
    if not DIRECTUS_API_URL or not DIRECTUS_SYSTEM_TOKEN or not DIRECTUS_MEMBER_ROLE_ID:
        print("CRITICAL: Essential Directus provisioning secrets/role ID are not configured. Skipping.")
        return

    directus_api_url = f"{DIRECTUS_API_URL}/users"

    directus_payload = {
        "first_name": user_data["first_name"],
        "last_name": user_data["last_name"],
        "email": user_data["upn"],
        "provider": "microsoft",
        "role": DIRECTUS_MEMBER_ROLE_ID, 
        "status": "active",
        "external_identifier": user_data["id"] 
    }
    
    headers = {
        "Authorization": f"Bearer {DIRECTUS_SYSTEM_TOKEN}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(directus_api_url, json=directus_payload, headers=headers)
            
            if response.status_code == 200:
                print(f"Directus user provisioned successfully: {user_data['upn']}")
            else:
                # Directus geeft 400 als de gebruiker al bestaat, wat kan gebeuren als de webhook 
                # dubbel wordt aangeroepen. Dit mag de flow niet stoppen.
                if response.status_code == 400 and "ALREADY_EXISTS" in response.text:
                    print(f"Directus provisioning warning: User already exists ({user_data['upn']}).")
                else:
                    print(f"Directus provisioning failed for {user_data['upn']} (Status: {response.status_code}, Response: {response.text})")
        except Exception as e:
            print(f"CRITICAL Directus API connection error: {e}")


@router.post("/create-user")
async def create_user_endpoint(request: CreateMemberRequest, background_tasks: BackgroundTasks):
    token = await get_graph_token()
    
    new_user_data = await create_azure_user(request, token)
    
    user_provisioning_data = {
        "id": new_user_data["id"],
        "upn": new_user_data["upn"],
        "first_name": request.first_name,
        "last_name": request.last_name
    }
    
    # Patch de Entra ID attributes (lidmaatschapsdatum)
    background_tasks.add_task(update_user_attributes, user_provisioning_data["id"])
    
    # Provision de Directus gebruiker (cruciale fix voor het inlogprobleem)
    background_tasks.add_task(provision_directus_user, user_provisioning_data)
    
    return {
        "status": "created",
        "user_id": new_user_data["id"],
        "upn": new_user_data["upn"],
        "password": new_user_data["password"]
    }

@router.post("/register")
async def register_member(request: MembershipRequest, background_tasks: BackgroundTasks):
    if not request.user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    background_tasks.add_task(update_user_attributes, request.user_id)
    return {"status": "processing"}

@router.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(router)