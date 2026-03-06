import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Dummy data
NGOS_DATA = [
    {
        "ngoName": "Green Earth Foundation",
        "registrationId": "NGO2024001",
        "email": "contact@greenearthfoundation.org",
        "password": "GreenEarth@123",
        "mission": "Promoting environmental conservation and sustainable living practices",
        "phone": "+1-555-0101",
        "address": "123 Eco Street, San Francisco, CA 94102",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "status": "Approved"
    },
    {
        "ngoName": "Hope for Children",
        "registrationId": "NGO2024002",
        "email": "info@hopeforchildren.org",
        "password": "Hope@Children123",
        "mission": "Providing education and healthcare to underprivileged children",
        "phone": "+1-555-0102",
        "address": "456 Care Avenue, Los Angeles, CA 90001",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "status": "Approved"
    },
    {
        "ngoName": "Community Food Bank",
        "registrationId": "NGO2024003",
        "email": "admin@communityfoodbank.org",
        "password": "FoodBank@123",
        "mission": "Fighting hunger by distributing food to those in need",
        "phone": "+1-555-0103",
        "address": "789 Helping Hand Road, New York, NY 10001",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "status": "Approved"
    },
    {
        "ngoName": "Clean Water Initiative",
        "registrationId": "NGO2024004",
        "email": "contact@cleanwaterinitiative.org",
        "password": "CleanWater@123",
        "mission": "Ensuring access to clean drinking water in rural communities",
        "phone": "+1-555-0104",
        "address": "321 Water Street, Chicago, IL 60601",
        "latitude": 41.8781,
        "longitude": -87.6298,
        "status": "Approved"
    },
    {
        "ngoName": "Senior Care Network",
        "registrationId": "NGO2024005",
        "email": "info@seniorcarenetwork.org",
        "password": "SeniorCare@123",
        "mission": "Providing support and companionship to elderly citizens",
        "phone": "+1-555-0105",
        "address": "654 Elder Lane, Miami, FL 33101",
        "latitude": 25.7617,
        "longitude": -80.1918,
        "status": "Approved"
    },
    {
        "ngoName": "Youth Empowerment Program",
        "registrationId": "NGO2024006",
        "email": "contact@youthempowerment.org",
        "password": "YouthPower@123",
        "mission": "Empowering young adults through skill development and mentorship",
        "phone": "+1-555-0106",
        "address": "987 Future Road, Seattle, WA 98101",
        "latitude": 47.6062,
        "longitude": -122.3321,
        "status": "Approved"
    },
    {
        "ngoName": "Animal Rescue Society",
        "registrationId": "NGO2024007",
        "email": "rescue@animalrescue.org",
        "password": "AnimalRescue@123",
        "mission": "Rescuing and rehabilitating abandoned and injured animals",
        "phone": "+1-555-0107",
        "address": "147 Pet Paradise, Austin, TX 78701",
        "latitude": 30.2672,
        "longitude": -97.7431,
        "status": "Approved"
    },
    {
        "ngoName": "Disaster Relief Corps",
        "registrationId": "NGO2024008",
        "email": "emergency@disasterrelief.org",
        "password": "DisasterRelief@123",
        "mission": "Providing immediate relief and support during natural disasters",
        "phone": "+1-555-0108",
        "address": "258 Emergency Drive, Houston, TX 77001",
        "latitude": 29.7604,
        "longitude": -95.3698,
        "status": "Approved"
    }
]

VOLUNTEERS_DATA = [
    {"name": "Sarah Johnson", "email": "sarah.johnson@email.com", "password": "Sarah@123"},
    {"name": "Michael Chen", "email": "michael.chen@email.com", "password": "Michael@123"},
    {"name": "Emily Rodriguez", "email": "emily.rodriguez@email.com", "password": "Emily@123"},
    {"name": "David Kim", "email": "david.kim@email.com", "password": "David@123"},
    {"name": "Jessica Williams", "email": "jessica.williams@email.com", "password": "Jessica@123"},
    {"name": "James Brown", "email": "james.brown@email.com", "password": "James@123"},
    {"name": "Maria Garcia", "email": "maria.garcia@email.com", "password": "Maria@123"},
    {"name": "Robert Taylor", "email": "robert.taylor@email.com", "password": "Robert@123"},
    {"name": "Linda Anderson", "email": "linda.anderson@email.com", "password": "Linda@123"},
    {"name": "Christopher Lee", "email": "christopher.lee@email.com", "password": "Christopher@123"},
    {"name": "Patricia Martinez", "email": "patricia.martinez@email.com", "password": "Patricia@123"},
    {"name": "Daniel White", "email": "daniel.white@email.com", "password": "Daniel@123"},
    {"name": "Jennifer Harris", "email": "jennifer.harris@email.com", "password": "Jennifer@123"},
    {"name": "Matthew Clark", "email": "matthew.clark@email.com", "password": "Matthew@123"},
    {"name": "Nancy Lewis", "email": "nancy.lewis@email.com", "password": "Nancy@123"},
]

CAMPAIGN_TEMPLATES = [
    {
        "title": "Beach Cleanup Drive",
        "description": "Join us for a community beach cleanup to protect marine life and keep our shores pristine.",
        "volunteersNeeded": 25,
        "isEmergency": False
    },
    {
        "title": "Food Distribution for Homeless",
        "description": "Help distribute meals to homeless individuals in downtown areas.",
        "volunteersNeeded": 15,
        "isEmergency": False
    },
    {
        "title": "Tree Plantation Campaign",
        "description": "Be part of our green initiative by planting trees in local parks and communities.",
        "volunteersNeeded": 30,
        "isEmergency": False
    },
    {
        "title": "Emergency Flood Relief",
        "description": "URGENT: Assist in providing relief supplies to flood-affected families.",
        "volunteersNeeded": 50,
        "isEmergency": True
    },
    {
        "title": "Senior Citizens Health Camp",
        "description": "Volunteer at our health screening and care camp for elderly citizens.",
        "volunteersNeeded": 20,
        "isEmergency": False
    },
    {
        "title": "Children's Education Workshop",
        "description": "Teach and mentor underprivileged children in basic education and life skills.",
        "volunteersNeeded": 12,
        "isEmergency": False
    },
    {
        "title": "Animal Shelter Support",
        "description": "Help care for rescued animals at our shelter - feeding, cleaning, and socializing.",
        "volunteersNeeded": 10,
        "isEmergency": False
    },
    {
        "title": "Emergency Wildfire Response",
        "description": "CRITICAL: Support evacuation and relief efforts for wildfire-affected communities.",
        "volunteersNeeded": 40,
        "isEmergency": True
    },
]

async def seed_database():
    print("Starting database seeding...")
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    # await db.users.delete_many({"role": "volunteer"})
    # await db.ngos.delete_many({})
    # await db.campaigns.delete_many({})
    
    ngo_ids = []
    credentials_list = []
    
    # Create NGOs
    print("\nCreating NGOs...")
    for ngo_data in NGOS_DATA:
        ngo_id = str(uuid.uuid4())
        ngo_doc = {
            "id": ngo_id,
            "ngoName": ngo_data["ngoName"],
            "registrationId": ngo_data["registrationId"],
            "email": ngo_data["email"],
            "password": hash_password(ngo_data["password"]),
            "mission": ngo_data["mission"],
            "phone": ngo_data["phone"],
            "address": ngo_data["address"],
            "latitude": ngo_data["latitude"],
            "longitude": ngo_data["longitude"],
            "image": None,
            "status": ngo_data["status"],
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.ngos.insert_one(ngo_doc)
        ngo_ids.append(ngo_id)
        
        credentials_list.append({
            "type": "NGO",
            "name": ngo_data["ngoName"],
            "email": ngo_data["email"],
            "password": ngo_data["password"]
        })
        
        print(f"✓ Created NGO: {ngo_data['ngoName']}")
    
    # Create Volunteers
    print("\nCreating Volunteers...")
    volunteer_ids = []
    for vol_data in VOLUNTEERS_DATA:
        vol_id = str(uuid.uuid4())
        vol_doc = {
            "id": vol_id,
            "name": vol_data["name"],
            "email": vol_data["email"],
            "password": hash_password(vol_data["password"]),
            "role": "volunteer",
            "verified": True,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(vol_doc)
        volunteer_ids.append(vol_id)
        
        credentials_list.append({
            "type": "Volunteer",
            "name": vol_data["name"],
            "email": vol_data["email"],
            "password": vol_data["password"]
        })
        
        print(f"✓ Created Volunteer: {vol_data['name']}")
    
    # Create Campaigns
    print("\nCreating Campaigns...")
    campaign_ids = []
    for i, ngo_id in enumerate(ngo_ids):
        ngo = await db.ngos.find_one({"id": ngo_id})
        
        # Create 2-3 campaigns per NGO
        num_campaigns = 2 if i % 2 == 0 else 3
        for j in range(num_campaigns):
            template = CAMPAIGN_TEMPLATES[(i * 3 + j) % len(CAMPAIGN_TEMPLATES)]
            
            start_date = datetime.now(timezone.utc) + timedelta(days=7 + j * 14)
            end_date = start_date + timedelta(days=5)
            
            campaign_id = str(uuid.uuid4())
            campaign_doc = {
                "id": campaign_id,
                "ngoId": ngo_id,
                "ngoName": ngo["ngoName"],
                "title": template["title"],
                "description": template["description"],
                "location": ngo["address"],
                "latitude": ngo["latitude"],
                "longitude": ngo["longitude"],
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "volunteersNeeded": template["volunteersNeeded"],
                "isEmergency": template["isEmergency"],
                "emergencyApproved": template["isEmergency"],  # Auto-approve for seed data
                "featuredImage": None,
                "galleryImages": [],
                "status": "Active",
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            
            await db.campaigns.insert_one(campaign_doc)
            campaign_ids.append(campaign_id)
            
            emergency_text = " [EMERGENCY]" if template["isEmergency"] else ""
            print(f"✓ Created Campaign: {template['title']}{emergency_text}")
    
    # Create some volunteer requests
    print("\nCreating Volunteer Requests...")
    for i, campaign_id in enumerate(campaign_ids[:10]):  # First 10 campaigns
        campaign = await db.campaigns.find_one({"id": campaign_id})
        
        # Add 2-3 requests per campaign
        for j in range(2):
            volunteer_id = volunteer_ids[(i * 2 + j) % len(volunteer_ids)]
            volunteer = await db.users.find_one({"id": volunteer_id})
            
            request_doc = {
                "id": str(uuid.uuid4()),
                "volunteerId": volunteer_id,
                "volunteerName": volunteer["name"],
                "campaignId": campaign_id,
                "campaignTitle": campaign["title"],
                "status": "Approved" if j == 0 else "Pending",
                "appliedAt": datetime.now(timezone.utc).isoformat()
            }
            
            await db.requests.insert_one(request_doc)
    
    print(f"✓ Created volunteer requests")
    
    # Save credentials to file
    credentials_file = ROOT_DIR / "dummy_credentials.json"
    with open(credentials_file, 'w') as f:
        json.dump(credentials_list, f, indent=2)
    
    print(f"\n✅ Database seeding completed!")
    print(f"📄 Credentials saved to: {credentials_file}")
    print(f"\n📊 Summary:")
    print(f"   - NGOs: {len(NGOS_DATA)}")
    print(f"   - Volunteers: {len(VOLUNTEERS_DATA)}")
    print(f"   - Campaigns: {len(campaign_ids)}")
    
    # Also create an admin user if not exists
    admin_exists = await db.users.find_one({"role": "admin"})
    if not admin_exists:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "name": "Admin User",
            "email": "admin@reliefhands.org",
            "password": hash_password("Admin@123"),
            "role": "admin",
            "verified": True,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        print(f"\n✓ Admin user created:")
        print(f"   Email: admin@reliefhands.org")
        print(f"   Password: Admin@123")

if __name__ == "__main__":
    asyncio.run(seed_database())
