import os
import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter
from pydantic import BaseModel
import httpx

app = FastAPI()

# Configuratie laden
TENANT_ID = os.getenv("MS_GRAPH_TENANT_ID")
CLIENT_ID = os.getenv("MS_GRAPH_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_GRAPH_CLIENT_SECRET")
ATTRIBUTE_SET_NAME = "SalveMundiLidmaatschap"

# --- ROUTER SETUP (Prefix methode) ---
# Dit zorgt dat de URL /api/membership/register wordt
router = APIRouter(prefix="/api/membership")

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
            print(f"Token Error: {response.text}")
            raise HTTPException(status_code=500, detail="Graph Auth Failed")
        return response.json().get("access_token")

async def update_user_attributes(user_id: str):
    try:
        token = await get_graph_token()
        
        vandaag = datetime.date.today()
        volgend_jaar = vandaag.replace(year=vandaag.year + 1)
        
        # CORRECTIE: Formaat YYYYMMDD (Zonder streepjes, zoals legacy script verwacht)
        betaal_datum = vandaag.strftime("%Y%m%d")
        verloop_datum = volgend_jaar.strftime("%Y%m%d")
        
        print(f"Updating {user_id}: {betaal_datum} - {verloop_datum}")

        url = f"https://graph.microsoft.com/v1.0/users/{user_id}"
        payload = {
            "customSecurityAttributes": {
                ATTRIBUTE_SET_NAME: {
                    "OrigineleBetaalDatumStr": betaal_datum,
                    "VerloopdatumStr": verloop_datum
                }
            }
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            res = await client.patch(url, json=payload, headers=headers)
            if res.status_code not in [200, 204]:
                print(f"Graph Patch Error: {res.text}")
            else:
                print(f"Successfully updated user {user_id}")
                
    except Exception as e:
        print(f"Error in background task: {e}")

# --- ROUTES ---
@router.post("/register")
async def register_member(request: MembershipRequest, background_tasks: BackgroundTasks):
    if not request.user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    background_tasks.add_task(update_user_attributes, request.user_id)
    return {"status": "processing", "message": "Membership provisioning started"}

@router.get("/health")
def health_check():
    return {"status": "ok"}

# Router koppelen
app.include_router(router)