import os
import datetime
import secrets
import string
import re
import logging
import unidecode
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, APIRouter
from pydantic import BaseModel
import httpx
import asyncio


app = FastAPI()

logger = logging.getLogger("membership-api")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG if os.getenv("DEBUG", "1") == "1" else logging.INFO)

# Filter out health check logs from uvicorn access logs
class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return "/api/membership/health" not in msg and "GET /health" not in msg

logging.getLogger("uvicorn.access").addFilter(EndpointFilter())

SERVICE_SECRET = os.getenv("SERVICE_SECRET")
TENANT_ID = os.getenv("MS_GRAPH_TENANT_ID")
CLIENT_ID = os.getenv("MS_GRAPH_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_GRAPH_CLIENT_SECRET")
DOMAIN = os.getenv("MS_GRAPH_DOMAIN")

def validate_env():
    missing = []
    required_vars = {
        "SERVICE_SECRET": SERVICE_SECRET,
        "MS_GRAPH_TENANT_ID": TENANT_ID,
        "MS_GRAPH_CLIENT_ID": CLIENT_ID,
        "MS_GRAPH_CLIENT_SECRET": CLIENT_SECRET,
        "MS_GRAPH_DOMAIN": DOMAIN
    }
    
    for name, val in required_vars.items():
        if not val:
            missing.append(name)
            
    if missing:
        logger.error("FATAL: Missing required environment variables: %s", ",".join(missing))
        import sys
        sys.exit(1)

    if DOMAIN and "@" in DOMAIN:
        logger.warning("MS_GRAPH_DOMAIN looks like a full email address (contains '@'). It should be a domain like 'example.com'. Current value: %s", DOMAIN)
    elif DOMAIN:
        logger.info("MS_GRAPH_DOMAIN set to '%s'", DOMAIN)

validate_env()

@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    if request.url.path == "/health" or request.url.path == "/api/membership/health":
        return await call_next(request)
    
    api_key = request.headers.get("x-api-key") or request.headers.get("x-internal-api-secret")
    if api_key != SERVICE_SECRET:
        logger.warning(f"Unauthorized access attempt from {request.client.host} to {request.url.path}")
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    return await call_next(request)

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
            # Try to surface any returned JSON error_description, otherwise include raw text
            try:
                error_response = response.json()
                error_message = error_response.get("error_description") or error_response.get("error") or response.text
            except Exception:
                error_message = response.text or "<no response body>"

            # Log full response for debugging (response body may contain useful details)
            logger.error("Graph Auth Failed. status=%s, body=%s", response.status_code, error_message)

            # Return more explicit detail to callers so admin-api logs are actionable
            raise HTTPException(status_code=500, detail=f"Graph Auth Failed: status={response.status_code} body={error_message}")
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
    max_attempts = 50
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        while counter < max_attempts:
            if counter > 0:
                candidate_upn = f"{base_name}{counter}@{DOMAIN}"
            url = f"https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '{candidate_upn}'&$select=id"
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if not data.get("value"): 
                    return candidate_upn
            elif response.status_code != 404:
                logger.error("Error checking UPN availability: %s - %s", response.status_code, response.text)
                raise HTTPException(status_code=500, detail="Error checking UPN availability")
                
            counter += 1
        
        logger.error("Failed to find unique UPN for %s %s after %d attempts", first_name, last_name, max_attempts)
        raise HTTPException(status_code=500, detail="Could not generate unique UPN")

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
            try:
                logger.debug("Current attributes in Azure for %s: %s", user_id, check_res.text)
            except Exception:
                logger.debug("Current attributes in Azure for %s: <unreadable response> (status=%s)", user_id, check_res.status_code)

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
            logger.debug("Sending PATCH (Dates) to %s with payload: %s", url_v1, payload_dates)
            res = await client.patch(url_v1, json=payload_dates, headers=headers)

            if res.status_code not in [200, 204]:
                logger.error("Graph Patch Error (Dates): %s - %s", res.status_code, res.text)
                raise Exception(f"Graph Patch Error (Dates): {res.status_code}")

            # 2. Update Date of Birth (Standard Property)
            if date_of_birth:
                # Ensure ISO 8601 format with Easter Egg time (404: Time Not Found)
                dob_payload = {"birthday": f"{date_of_birth}T04:04:04Z" if "T" not in date_of_birth else date_of_birth}
                logger.debug("Sending PATCH (Birthday) to %s with: %s", url_v1, dob_payload)
                res_dob = await client.patch(url_v1, json=dob_payload, headers=headers)
                if res_dob.status_code not in [200, 204]:
                     logger.warning("Birthday update failed: %s - %s", res_dob.status_code, res_dob.text)

            # VERIFICATION LOOP: Wait until Azure AD actually shows the new attributes
            logger.debug("Starting verification for %s...", user_id)
            for i in range(10):  # Max 10 attempts (10 seconds)
                await asyncio.sleep(1)
                check_res = await client.get(f"{url_beta}?$select=customSecurityAttributes", headers=headers)
                if check_res.status_code == 200:
                    # Azure may return customSecurityAttributes: null. Coerce to dict to avoid AttributeError.
                    resp_json = check_res.json()
                    attr_data = resp_json.get("customSecurityAttributes") or {}
                    current_expiry = (attr_data.get(ATTRIBUTE_SET_NAME) or {}).get("VerloopdatumStr")
                    if current_expiry == verloop_datum:
                        logger.info("Verified: Azure AD reflects expiry %s for %s after %ds", verloop_datum, user_id, i+1)
                        return
                logger.debug("Verification attempt %d failed for %s, retrying...", i+1, user_id)

            logger.warning("Attributes updated but could not be verified within 10s for %s", user_id)
    except HTTPException:
        # Re-raise FastAPI HTTPExceptions
        raise
    except Exception as e:
        logger.exception("Attribute update error for %s: %s", user_id, str(e))
        # Re-raise as generic exception so callers can see failure
        raise

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

# --- Group Management ---

@router.get("/groups/{group_id}/members")
async def list_group_members(group_id: str):
    token = await get_graph_token()
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # Fetch members from Azure AD Group
        # Expand extension attributes if needed, or just select basic fields
        url = f"https://graph.microsoft.com/v1.0/groups/{group_id}/members?$select=id,displayName,userPrincipalName,mail,givenName,surname"
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
             logger.error("List Group Members Failed: %s - %s", response.status_code, response.text)
             raise HTTPException(status_code=response.status_code, detail="Failed to fetch group members")
        
        data = response.json()
        return data.get("value", [])

class AddGroupMemberRequest(BaseModel):
    email: str

@router.post("/groups/{group_id}/members")
async def add_group_member(group_id: str, request: AddGroupMemberRequest):
    token = await get_graph_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        # 1. Resolve user by email
        user_url = f"https://graph.microsoft.com/v1.0/users?$filter=mail eq '{request.email}' or userPrincipalName eq '{request.email}'&$select=id"
        user_res = await client.get(user_url, headers=headers)
        if user_res.status_code != 200:
             raise HTTPException(status_code=500, detail="Failed to resolve user")
        
        user_data = user_res.json()
        if not user_data.get("value"):
            raise HTTPException(status_code=404, detail="User not found in Azure AD")
            
        user_id = user_data["value"][0]["id"]
        
        # 2. Add member to group
        add_url = f"https://graph.microsoft.com/v1.0/groups/{group_id}/members/$ref"
        payload = {"@odata.id": f"https://graph.microsoft.com/v1.0/directoryObjects/{user_id}"}
        
        add_res = await client.post(add_url, json=payload, headers=headers)
        if add_res.status_code not in [204, 201]: # 204 No Content is success for $ref, sometimes 201
             logger.error("Add Group Member Failed: %s - %s", add_res.status_code, add_res.text)
             # Check if already exists
             if "Request_BadRequest" in add_res.text and "One or more added object references already exist" in add_res.text:
                 return {"status": "skipped", "message": "User already in group"}
             raise HTTPException(status_code=add_res.status_code, detail="Failed to add member to group")
             
        return {"status": "added", "user_id": user_id}

@router.delete("/groups/{group_id}/members/{member_id}")
async def remove_group_member(group_id: str, member_id: str):
    token = await get_graph_token()
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # Remove member ref
        url = f"https://graph.microsoft.com/v1.0/groups/{group_id}/members/{member_id}/$ref"
        response = await client.delete(url, headers=headers)
        
        if response.status_code not in [204, 200]:
             logger.error("Remove Group Member Failed: %s - %s", response.status_code, response.text)
             raise HTTPException(status_code=response.status_code, detail="Failed to remove member")
             
        return {"status": "removed"}


@router.get("/health")
def health_check(): return {"status": "ok"}

app.include_router(router)