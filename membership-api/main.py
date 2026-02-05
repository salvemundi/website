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
from infisical_sdk import InfisicalSDKClient


app = FastAPI()

logger = logging.getLogger("membership-api")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG if os.getenv("DEBUG", "1") == "1" else logging.INFO)

ATTRIBUTE_SET_NAME = "SalveMundiLidmaatschap"
REQUIRED_GRAPH_KEYS = [
    "MS_GRAPH_TENANT_ID",
    "MS_GRAPH_CLIENT_ID",
    "MS_GRAPH_CLIENT_SECRET",
    "MS_GRAPH_DOMAIN",
]

TENANT_ID = os.getenv("MS_GRAPH_TENANT_ID")
CLIENT_ID = os.getenv("MS_GRAPH_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_GRAPH_CLIENT_SECRET")
DOMAIN = os.getenv("MS_GRAPH_DOMAIN")

_config_loaded = False


def _load_graph_config_from_infisical():
    global TENANT_ID, CLIENT_ID, CLIENT_SECRET, DOMAIN, _config_loaded

    values = {
        "MS_GRAPH_TENANT_ID": TENANT_ID,
        "MS_GRAPH_CLIENT_ID": CLIENT_ID,
        "MS_GRAPH_CLIENT_SECRET": CLIENT_SECRET,
        "MS_GRAPH_DOMAIN": DOMAIN,
    }
    missing = [key for key, value in values.items() if not value]
    if not missing:
        _config_loaded = True
        return

    inf_client_id = os.getenv("INFISICAL_CLIENT_ID")
    inf_client_secret = os.getenv("INFISICAL_CLIENT_SECRET")
    inf_project_slug = os.getenv("INFISICAL_PROJECT_SLUG", "salvemundi-2-j-tu")
    inf_environment = os.getenv("INFISICAL_ENVIRONMENT", os.getenv("INFISICAL_ENV", "local"))
    inf_secret_path = os.getenv("INFISICAL_SECRET_PATH", "/")
    inf_host = os.getenv("INFISICAL_HOST", "https://infisical.salvemundi.nl")

    if not inf_client_id or not inf_client_secret:
        logger.warning("Infisical credentials missing; cannot fetch secrets.")
        _config_loaded = True
        return

    try:
        client = InfisicalSDKClient(host=inf_host)
        client.auth.universal_auth.login(
            client_id=inf_client_id,
            client_secret=inf_client_secret,
        )

        for key in missing:
            secret = client.secrets.get_secret_by_name(
                secret_name=key,
                project_slug=inf_project_slug,
                environment_slug=inf_environment,
                secret_path=inf_secret_path,
                view_secret_value=True,
            )
            secret_value = getattr(secret, "secretValue", None) or getattr(secret, "secret_value", None)
            if not secret_value:
                raise ValueError(f"Infisical secret '{key}' returned empty value")
            values[key] = secret_value

        TENANT_ID = values["MS_GRAPH_TENANT_ID"]
        CLIENT_ID = values["MS_GRAPH_CLIENT_ID"]
        CLIENT_SECRET = values["MS_GRAPH_CLIENT_SECRET"]
        DOMAIN = values["MS_GRAPH_DOMAIN"]
    except Exception as exc:
        logger.error("Infisical secret fetch failed: %s", exc)
    finally:
        _config_loaded = True


def _ensure_graph_config():
    if not _config_loaded or not all([TENANT_ID, CLIENT_ID, CLIENT_SECRET, DOMAIN]):
        _load_graph_config_from_infisical()
    current_values = {
        "MS_GRAPH_TENANT_ID": TENANT_ID,
        "MS_GRAPH_CLIENT_ID": CLIENT_ID,
        "MS_GRAPH_CLIENT_SECRET": CLIENT_SECRET,
        "MS_GRAPH_DOMAIN": DOMAIN,
    }
    missing = [key for key, value in current_values.items() if not value]
    if missing:
        logger.error(
            "Missing required environment variables for membership-api: %s",
            ",".join(missing),
        )


@app.on_event("startup")
async def startup_event():
    _ensure_graph_config()


def validate_env():
    missing = []
    for name, val in (("MS_GRAPH_TENANT_ID", TENANT_ID), ("MS_GRAPH_CLIENT_ID", CLIENT_ID), ("MS_GRAPH_CLIENT_SECRET", CLIENT_SECRET), ("MS_GRAPH_DOMAIN", DOMAIN)):
        if not val:
            missing.append(name)
    if missing:
        logger.error("Missing required environment variables for membership-api: %s", ",".join(missing))
        # Do not raise here - allow container to start but fail fast on requests with clear log

    # Basic sanity check for DOMAIN: it should look like a domain (no @)
    if DOMAIN and "@" in DOMAIN:
        logger.warning("MS_GRAPH_DOMAIN looks like a full email address (contains '@'). It should be a domain like 'example.com' not a user@domain. Current value: %s", DOMAIN)
    elif DOMAIN:
        # mask domain minimally when logging (domain is not secret)
        logger.info("MS_GRAPH_DOMAIN set to '%s'", DOMAIN)


validate_env()

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
    _ensure_graph_config()
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
                    attr_data = check_res.json().get("customSecurityAttributes", {})
                    current_expiry = attr_data.get(ATTRIBUTE_SET_NAME, {}).get("VerloopdatumStr")
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

@router.get("/health")
def health_check(): return {"status": "ok"}

app.include_router(router)