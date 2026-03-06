from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from pypdf import PdfWriter, PdfReader
from io import BytesIO
import base64
import aiofiles
import shutil
from google.oauth2 import id_token
from google.auth.transport import requests
import openrouteservice
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"

# SendGrid
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@reliefhands.org')

# Google OAuth
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')

# OpenRouteService
OPENROUTE_API_KEY = os.environ.get('OPENROUTE_SERVICE_KEY')

# File uploads
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
CAMPAIGNS_DIR = UPLOAD_DIR / "campaigns"
CAMPAIGNS_DIR.mkdir(exist_ok=True)
NGOS_DIR = UPLOAD_DIR / "ngos"
NGOS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "volunteer"  # admin, volunteer

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    verified: bool
    createdAt: str

class NGOCreate(BaseModel):
    ngoName: str
    registrationId: str
    email: EmailStr
    password: str
    mission: str
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class NGOResponse(BaseModel):
    id: str
    ngoName: str
    registrationId: str
    email: str
    mission: str
    status: str
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image: Optional[str] = None
    createdAt: str

class CampaignCreate(BaseModel):
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    startDate: str
    endDate: str
    volunteersNeeded: int
    isEmergency: Optional[bool] = False

class CampaignResponse(BaseModel):
    id: str
    ngoId: str
    ngoName: str
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    startDate: str
    endDate: str
    volunteersNeeded: int
    status: str
    isEmergency: Optional[bool] = False
    emergencyApproved: Optional[bool] = False
    featuredImage: Optional[str] = None
    galleryImages: Optional[List[str]] = []
    createdAt: str

class VolunteerRequestCreate(BaseModel):
    campaignId: str

class RequestResponse(BaseModel):
    id: str
    volunteerId: str
    volunteerName: str
    campaignId: str
    campaignTitle: str
    status: str
    appliedAt: str

class ApprovalUpdate(BaseModel):
    status: str  # Approved, Rejected

class CertificateResponse(BaseModel):
    id: str
    volunteerId: str
    campaignId: str
    campaignTitle: str
    ngoName: str
    volunteerName: str
    completionDate: str

class GoogleAuthRequest(BaseModel):
    token: str

class EmergencyApprovalUpdate(BaseModel):
    emergencyApproved: bool

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def send_email(to_email: str, subject: str, content: str):
    if not SENDGRID_API_KEY or len(SENDGRID_API_KEY) < 20:
        print(f"⚠️  SendGrid API key not configured or invalid. Email notification skipped.")
        print(f"📧 Would send to {to_email}")
        print(f"📌 Subject: {subject}")
        print(f"📄 Content preview: {content[:100]}...")
        return
    
    try:
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=content
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"✅ Email sent successfully to {to_email}, status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error sending email to {to_email}: {str(e)}")
        print(f"   Subject was: {subject}")

# Auth Routes
@api_router.post("/auth/register-volunteer")
async def register_volunteer(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": "volunteer",
        "verified": False,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    await send_email(
        user.email,
        "Welcome to Relief Hands!",
        f"<h2>Welcome {user.name}!</h2><p>Your volunteer account is pending verification.</p>"
    )
    
    token = create_token(user_doc["id"], user_doc["email"], user_doc["role"])
    return {"token": token, "user": UserResponse(**user_doc)}

@api_router.post("/auth/register-ngo")
async def register_ngo(ngo: NGOCreate):
    existing = await db.ngos.find_one({"email": ngo.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    ngo_doc = {
        "id": str(uuid.uuid4()),
        "ngoName": ngo.ngoName,
        "registrationId": ngo.registrationId,
        "email": ngo.email,
        "password": hash_password(ngo.password),
        "mission": ngo.mission,
        "phone": ngo.phone,
        "address": ngo.address,
        "latitude": ngo.latitude,
        "longitude": ngo.longitude,
        "image": None,
        "status": "Pending",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ngos.insert_one(ngo_doc)
    
    await send_email(
        ngo.email,
        "NGO Registration Received",
        f"<h2>Hello {ngo.ngoName}!</h2><p>Your NGO registration is pending admin approval.</p>"
    )
    
    token = create_token(ngo_doc["id"], ngo_doc["email"], "ngo")
    return {"token": token, "ngo": NGOResponse(**ngo_doc)}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Check users
    user = await db.users.find_one({"email": credentials.email})
    if user and verify_password(credentials.password, user["password"]):
        token = create_token(user["id"], user["email"], user["role"])
        return {"token": token, "user": UserResponse(**user), "accountType": "user"}
    
    # Check NGOs
    ngo = await db.ngos.find_one({"email": credentials.email})
    if ngo and verify_password(credentials.password, ngo["password"]):
        token = create_token(ngo["id"], ngo["email"], "ngo")
        return {"token": token, "ngo": NGOResponse(**ngo), "accountType": "ngo"}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.post("/auth/google")
async def google_auth(auth_request: GoogleAuthRequest):
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            auth_request.token, requests.Request(), GOOGLE_CLIENT_ID
        )
        
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        # Check if user exists
        user = await db.users.find_one({"email": email})
        if user:
            token = create_token(user["id"], user["email"], user["role"])
            return {"token": token, "user": UserResponse(**user), "accountType": "user"}
        
        # Create new volunteer user
        user_doc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password": hash_password(str(uuid.uuid4())),  # Random password for OAuth users
            "role": "volunteer",
            "verified": True,  # Auto-verify Google users
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(user_doc)
        
        await send_email(
            email,
            "Welcome to Relief Hands!",
            f"<h2>Welcome {name}!</h2><p>Your volunteer account has been created via Google Sign-In.</p>"
        )
        
        token = create_token(user_doc["id"], user_doc["email"], user_doc["role"])
        return {"token": token, "user": UserResponse(**user_doc), "accountType": "user"}
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid Google token")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "ngo":
        ngo = await db.ngos.find_one({"id": current_user["user_id"]}, {"_id": 0})
        if ngo:
            return {"user": NGOResponse(**ngo), "accountType": "ngo"}
    else:
        user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
        if user:
            return {"user": UserResponse(**user), "accountType": "user"}
    
    raise HTTPException(status_code=404, detail="User not found")

# Admin Routes
@api_router.get("/admin/volunteers")
async def get_all_volunteers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    volunteers = await db.users.find({"role": "volunteer"}, {"_id": 0}).to_list(1000)
    return [UserResponse(**v) for v in volunteers]

@api_router.get("/admin/ngos")
async def get_all_ngos(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ngos = await db.ngos.find({}, {"_id": 0}).to_list(1000)
    return [NGOResponse(**n) for n in ngos]

@api_router.put("/admin/verify-volunteer/{volunteer_id}")
async def verify_volunteer(volunteer_id: str, update: ApprovalUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    volunteer = await db.users.find_one({"id": volunteer_id})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    verified = update.status == "Approved"
    await db.users.update_one(
        {"id": volunteer_id},
        {"$set": {"verified": verified}}
    )
    
    status_text = "approved" if verified else "rejected"
    await send_email(
        volunteer["email"],
        f"Account {status_text.capitalize()}",
        f"<h2>Hello {volunteer['name']}</h2><p>Your volunteer account has been {status_text}.</p>"
    )
    
    return {"message": f"Volunteer {status_text}"}

@api_router.put("/admin/verify-ngo/{ngo_id}")
async def verify_ngo(ngo_id: str, update: ApprovalUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ngo = await db.ngos.find_one({"id": ngo_id})
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    await db.ngos.update_one(
        {"id": ngo_id},
        {"$set": {"status": update.status}}
    )
    
    await send_email(
        ngo["email"],
        f"NGO Registration {update.status}",
        f"<h2>Hello {ngo['ngoName']}</h2><p>Your NGO registration has been {update.status.lower()}.</p>"
    )
    
    return {"message": f"NGO {update.status}"}

@api_router.get("/admin/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_volunteers = await db.users.count_documents({"role": "volunteer"})
    total_ngos = await db.ngos.count_documents({})
    total_campaigns = await db.campaigns.count_documents({})
    active_campaigns = await db.campaigns.count_documents({"status": "Active"})
    total_requests = await db.requests.count_documents({})
    
    return {
        "totalVolunteers": total_volunteers,
        "totalNGOs": total_ngos,
        "totalCampaigns": total_campaigns,
        "activeCampaigns": active_campaigns,
        "totalRequests": total_requests
    }

@api_router.get("/admin/campaigns")
async def get_all_campaigns_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    campaigns = await db.campaigns.find({}, {"_id": 0}).to_list(1000)
    return [CampaignResponse(**c) for c in campaigns]

@api_router.put("/admin/campaigns/{campaign_id}/approve-emergency")
async def approve_emergency_campaign(
    campaign_id: str,
    update: EmergencyApprovalUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"emergencyApproved": update.emergencyApproved}}
    )
    
    # Notify NGO
    ngo = await db.ngos.find_one({"id": campaign["ngoId"]})
    if ngo:
        status_text = "approved" if update.emergencyApproved else "rejected"
        await send_email(
            ngo["email"],
            f"Emergency Campaign {status_text.capitalize()}",
            f"<h2>Hello {ngo['ngoName']}</h2><p>Your emergency campaign '{campaign['title']}' has been {status_text}.</p>"
        )
    
    return {"message": f"Emergency status {status_text}"}

# NGO Routes
@api_router.post("/ngo/campaigns")
async def create_campaign(campaign: CampaignCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="NGO access required")
    
    ngo = await db.ngos.find_one({"id": current_user["user_id"]})
    if not ngo or ngo["status"] != "Approved":
        raise HTTPException(status_code=403, detail="NGO must be approved")
    
    campaign_doc = {
        "id": str(uuid.uuid4()),
        "ngoId": current_user["user_id"],
        "ngoName": ngo["ngoName"],
        "title": campaign.title,
        "description": campaign.description,
        "location": campaign.location,
        "latitude": campaign.latitude,
        "longitude": campaign.longitude,
        "startDate": campaign.startDate,
        "endDate": campaign.endDate,
        "volunteersNeeded": campaign.volunteersNeeded,
        "isEmergency": campaign.isEmergency or False,
        "emergencyApproved": False,
        "featuredImage": None,
        "galleryImages": [],
        "status": "Active",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.campaigns.insert_one(campaign_doc)
    return CampaignResponse(**campaign_doc)

@api_router.get("/ngo/campaigns")
async def get_ngo_campaigns(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="NGO access required")
    
    campaigns = await db.campaigns.find({"ngoId": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    return [CampaignResponse(**c) for c in campaigns]

@api_router.post("/ngo/campaigns/{campaign_id}/upload-images")
async def upload_campaign_images(
    campaign_id: str,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="NGO access required")
    
    campaign = await db.campaigns.find_one({"id": campaign_id, "ngoId": current_user["user_id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    uploaded_images = []
    campaign_dir = CAMPAIGNS_DIR / campaign_id
    campaign_dir.mkdir(exist_ok=True)
    
    for file in files:
        if not file.content_type.startswith('image/'):
            continue
        
        file_ext = file.filename.split('.')[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = campaign_dir / file_name
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        uploaded_images.append(f"/uploads/campaigns/{campaign_id}/{file_name}")
    
    # Update campaign with images
    update_data = {}
    if not campaign.get("featuredImage") and uploaded_images:
        update_data["featuredImage"] = uploaded_images[0]
    
    existing_gallery = campaign.get("galleryImages", [])
    update_data["galleryImages"] = existing_gallery + uploaded_images
    
    await db.campaigns.update_one({"id": campaign_id}, {"$set": update_data})
    
    return {"message": "Images uploaded successfully", "images": uploaded_images}

@api_router.get("/ngo/requests")
async def get_ngo_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="NGO access required")
    
    campaigns = await db.campaigns.find({"ngoId": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    campaign_ids = [c["id"] for c in campaigns]
    
    requests = await db.requests.find({"campaignId": {"$in": campaign_ids}}, {"_id": 0}).to_list(1000)
    return requests

@api_router.put("/ngo/requests/{request_id}")
async def update_request(request_id: str, update: ApprovalUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="NGO access required")
    
    request = await db.requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await db.requests.update_one(
        {"id": request_id},
        {"$set": {"status": update.status}}
    )
    
    volunteer = await db.users.find_one({"id": request["volunteerId"]})
    campaign = await db.campaigns.find_one({"id": request["campaignId"]})
    
    if volunteer and campaign:
        await send_email(
            volunteer["email"],
            f"Volunteer Request {update.status}",
            f"<h2>Hello {volunteer['name']}</h2><p>Your request for '{campaign['title']}' has been {update.status.lower()}.</p>"
        )
    
    return {"message": f"Request {update.status}"}

@api_router.put("/ngo/campaigns/{campaign_id}/complete")
async def complete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="NGO access required")
    
    campaign = await db.campaigns.find_one({"id": campaign_id, "ngoId": current_user["user_id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "Completed"}}
    )
    
    # Create certificates for approved volunteers
    requests = await db.requests.find({"campaignId": campaign_id, "status": "Approved"}, {"_id": 0}).to_list(1000)
    
    for req in requests:
        volunteer = await db.users.find_one({"id": req["volunteerId"]})
        if volunteer:
            cert_doc = {
                "id": str(uuid.uuid4()),
                "volunteerId": req["volunteerId"],
                "volunteerName": volunteer["name"],
                "campaignId": campaign_id,
                "campaignTitle": campaign["title"],
                "ngoName": campaign["ngoName"],
                "completionDate": datetime.now(timezone.utc).isoformat()
            }
            await db.certificates.insert_one(cert_doc)
            
            await send_email(
                volunteer["email"],
                "Certificate Available",
                f"<h2>Congratulations {volunteer['name']}!</h2><p>Your certificate for '{campaign['title']}' is now available for download.</p>"
            )
    
    return {"message": "Campaign completed and certificates generated"}

# Volunteer Routes
@api_router.get("/volunteer/campaigns")
async def get_all_campaigns(
    emergency_only: Optional[bool] = Query(None),
    location: Optional[str] = Query(None),
    ngo_id: Optional[str] = Query(None)
):
    query = {"status": "Active"}
    
    if emergency_only:
        query["isEmergency"] = True
        query["emergencyApproved"] = True
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    if ngo_id:
        query["ngoId"] = ngo_id
    
    campaigns = await db.campaigns.find(query, {"_id": 0}).to_list(1000)
    
    # Sort emergency campaigns to top
    campaigns.sort(key=lambda x: (
        not (x.get("isEmergency") and x.get("emergencyApproved")),
        x.get("createdAt", "")
    ))
    
    return [CampaignResponse(**c) for c in campaigns]

@api_router.get("/volunteer/past-campaigns")
async def get_past_campaigns(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access required")
    
    # Get approved requests for completed campaigns
    requests = await db.requests.find(
        {"volunteerId": current_user["user_id"], "status": "Approved"},
        {"_id": 0}
    ).to_list(1000)
    
    campaign_ids = [r["campaignId"] for r in requests]
    campaigns = await db.campaigns.find(
        {"id": {"$in": campaign_ids}, "status": "Completed"},
        {"_id": 0}
    ).to_list(1000)
    
    return [CampaignResponse(**c) for c in campaigns]

@api_router.get("/volunteer/ngos")
async def get_verified_ngos(location: Optional[str] = Query(None)):
    query = {"status": "Approved"}
    if location:
        query["address"] = {"$regex": location, "$options": "i"}
    
    ngos = await db.ngos.find(query, {"_id": 0}).to_list(1000)
    return [NGOResponse(**n) for n in ngos]

@api_router.get("/ngo/past-campaigns")
async def get_ngo_past_campaigns(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ngo":
        raise HTTPException(status_code=403, detail="NGO access required")
    
    campaigns = await db.campaigns.find(
        {"ngoId": current_user["user_id"], "status": "Completed"},
        {"_id": 0}
    ).to_list(1000)
    return [CampaignResponse(**c) for c in campaigns]

@api_router.get("/maps/nearby-ngos")
async def get_nearby_ngos(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(50)
):
    # Get all approved NGOs with location data
    ngos = await db.ngos.find(
        {
            "status": "Approved",
            "latitude": {"$ne": None},
            "longitude": {"$ne": None}
        },
        {"_id": 0}
    ).to_list(1000)
    
    # Filter by distance
    def calculate_distance(lat1, lon1, lat2, lon2):
        # Haversine formula
        R = 6371  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    nearby_ngos = []
    for ngo in ngos:
        distance = calculate_distance(latitude, longitude, ngo["latitude"], ngo["longitude"])
        if distance <= radius_km:
            ngo["distance"] = round(distance, 2)
            nearby_ngos.append(ngo)
    
    # Sort by distance
    nearby_ngos.sort(key=lambda x: x["distance"])
    
    return nearby_ngos

@api_router.get("/maps/directions")
async def get_directions(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    end_lat: float = Query(...),
    end_lng: float = Query(...)
):
    if not OPENROUTE_API_KEY:
        raise HTTPException(status_code=503, detail="Routing service not configured")
    
    try:
        client = openrouteservice.Client(key=OPENROUTE_API_KEY)
        coords = [[start_lng, start_lat], [end_lng, end_lat]]
        
        route = client.directions(
            coordinates=coords,
            profile='driving-car',
            format='geojson'
        )
        
        return route
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing error: {str(e)}")

@api_router.post("/volunteer/requests")
async def apply_for_campaign(request: VolunteerRequestCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access required")
    
    # Check if already applied
    existing = await db.requests.find_one({
        "volunteerId": current_user["user_id"],
        "campaignId": request.campaignId
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this campaign")
    
    volunteer = await db.users.find_one({"id": current_user["user_id"]})
    campaign = await db.campaigns.find_one({"id": request.campaignId})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    request_doc = {
        "id": str(uuid.uuid4()),
        "volunteerId": current_user["user_id"],
        "volunteerName": volunteer["name"],
        "campaignId": request.campaignId,
        "campaignTitle": campaign["title"],
        "status": "Pending",
        "appliedAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.requests.insert_one(request_doc)
    
    ngo = await db.ngos.find_one({"id": campaign["ngoId"]})
    if ngo:
        await send_email(
            ngo["email"],
            "New Volunteer Application",
            f"<h2>New Application</h2><p>{volunteer['name']} applied for '{campaign['title']}'</p>"
        )
    
    return RequestResponse(**request_doc)

@api_router.get("/volunteer/requests")
async def get_my_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access required")
    
    requests = await db.requests.find({"volunteerId": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    return requests

@api_router.get("/volunteer/certificates")
async def get_my_certificates(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access required")
    
    certificates = await db.certificates.find({"volunteerId": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    return [CertificateResponse(**c) for c in certificates]

@api_router.get("/volunteer/certificates/{certificate_id}/download")
async def download_certificate(certificate_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access required")
    
    cert = await db.certificates.find_one({"id": certificate_id, "volunteerId": current_user["user_id"]})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Generate PDF certificate with floral design
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import Image as RLImage
    from reportlab.graphics.shapes import Drawing, Circle, Rect
    
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Background color - light cream
    c.setFillColor(colors.Color(0.98, 0.98, 0.95))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Decorative floral border - teal/turquoise with orange/yellow accents
    border_color_teal = colors.Color(0.086, 0.627, 0.521)  # Teal
    border_color_orange = colors.Color(1, 0.647, 0.2)  # Orange
    border_color_yellow = colors.Color(1, 0.843, 0.2)  # Yellow
    
    # Draw decorative border frame
    c.setStrokeColor(border_color_teal)
    c.setLineWidth(8)
    c.rect(0.75*inch, 0.75*inch, width-1.5*inch, height-1.5*inch, fill=0, stroke=1)
    
    # Draw floral decorative elements (simplified)
    c.setFillColor(border_color_teal)
    c.setStrokeColor(border_color_teal)
    c.setLineWidth(2)
    
    # Top border decoration
    for i in range(8):
        x = 1.5*inch + i * (width-3*inch) / 7
        y = height - 1.2*inch
        # Leaf shapes
        c.ellipse(x-0.15*inch, y-0.1*inch, x+0.15*inch, y+0.1*inch, fill=1)
    
    # Bottom border decoration
    for i in range(8):
        x = 1.5*inch + i * (width-3*inch) / 7
        y = 1.2*inch
        c.ellipse(x-0.15*inch, y-0.1*inch, x+0.15*inch, y+0.1*inch, fill=1)
    
    # Add orange/yellow accents
    c.setFillColor(border_color_orange)
    for i in range(6):
        x = 2*inch + i * (width-4*inch) / 5
        y = height - 1.35*inch
        c.circle(x, y, 0.08*inch, fill=1)
    
    for i in range(6):
        x = 2*inch + i * (width-4*inch) / 5
        y = 1.05*inch
        c.circle(x, y, 0.08*inch, fill=1)
    
    # Title - RELIEF HANDS ASSOCIATION
    c.setFillColor(border_color_teal)
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(width/2, height-2.2*inch, "RELIEF HANDS")
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width/2, height-2.7*inch, "ASSOCIATION")
    
    # Subtitle
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width/2, height-3.3*inch, "CERTIFICATE OF PARTICIPATION")
    
    # Body text
    c.setFont("Helvetica", 14)
    c.drawCentredString(width/2, height-4*inch, "This is to proudly certify that")
    
    # Volunteer name
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width/2, height-4.6*inch, f"[{cert['volunteerName']}]")
    
    # Activity description
    c.setFont("Helvetica", 13)
    y_pos = height - 5.3*inch
    c.drawCentredString(width/2, y_pos, f"has actively participated as a volunteer")
    c.drawCentredString(width/2, y_pos-0.3*inch, f"in the [{cert['campaignTitle']}] organized by")
    c.drawCentredString(width/2, y_pos-0.6*inch, f"[{cert['ngoName']}] in association with")
    c.drawCentredString(width/2, y_pos-0.9*inch, "Relief Hands Association on")
    
    # Date
    completion_date = datetime.fromisoformat(cert["completionDate"]).strftime("%B %d, %Y")
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width/2, y_pos-1.3*inch, f"[{completion_date}].")
    
    # Appreciation message
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, y_pos-1.9*inch, "Your valuable time, dedication, and contribution have")
    c.drawCentredString(width/2, y_pos-2.15*inch, "made a positive difference in supporting")
    c.drawCentredString(width/2, y_pos-2.4*inch, "our mission of service to the community.")
    
    c.setFont("Helvetica-Oblique", 12)
    c.drawCentredString(width/2, y_pos-2.85*inch, "We deeply appreciate your commitment and compassion.")
    
    # Logo/Seal placeholder (circular design)
    seal_x = 2.5*inch
    seal_y = height - 6.5*inch
    c.setStrokeColor(border_color_teal)
    c.setLineWidth(3)
    c.circle(seal_x, seal_y, 0.6*inch, fill=0)
    c.setFillColor(border_color_teal)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(seal_x, seal_y+0.15*inch, "RELIEF HANDS")
    c.setFont("Helvetica", 8)
    c.drawCentredString(seal_x, seal_y-0.15*inch, "ASSOCIATION")
    
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=certificate_{cert['volunteerName'].replace(' ', '_')}.pdf"}
    )

# Include router
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)