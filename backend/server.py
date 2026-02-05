from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
# from emergentintegrations.llm.chat import LlmChat, UserMessage
import base64
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
def log_to_file(msg):
    with open("debug.log", "a") as f:
        f.write(f"{datetime.now()}: {msg}\n")

try:
    mongo_url = os.environ['MONGO_URL']
    log_to_file(f"Connecting to MongoDB at {mongo_url}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    log_to_file(f"Database selected: {os.environ['DB_NAME']}")
except Exception as e:
    log_to_file(f"Failed to initialize MongoDB connection: {e}")
    raise e

# Security
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET_KEY')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PropertyListing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Core Fields
    purpose: str  # 'Rent' or 'Resale'
    category: str  # 'Residential', 'Commercial', 'Industrial', 'Agricultural', 'Institutional'
    property_type: str  # Dynamic sub-types
    is_plot: bool = False
    
    # Location
    city: str
    locality: str
    pincode: str
    landmark: Optional[str] = None
    address: str
    
    # Building Specifications (nullable)
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_number: Optional[int] = None
    total_floors: Optional[int] = None
    furnishing: Optional[str] = None  # 'Semi', 'Full', 'None'
    
    # Commercial/Industrial (nullable)
    power_load_kva: Optional[int] = None
    ceiling_height_ft: Optional[float] = None
    conference_rooms: Optional[int] = None
    
    # Land/Agricultural (nullable)
    plot_area_sqft: Optional[float] = None
    plot_area_acres: Optional[float] = None
    soil_type: Optional[str] = None  # 'Black', 'Red', etc.
    irrigation_source: Optional[str] = None  # 'Canal', 'Borewell'
    boundary_wall: Optional[bool] = None
    
    # Financials
    price: float
    deposit: Optional[float] = None  # Rent only
    maintenance: Optional[float] = None
    negotiable: bool = False
    
    # Amenities
    has_lift: bool = False
    has_parking: bool = False
    has_gym: bool = False
    has_pool: bool = False
    near_metro: bool = False
    has_security: bool = False
    has_cctv: bool = False
    has_wifi: bool = False
    has_ac: bool = False
    has_geyser: bool = False
    has_video_doorbell: bool = False
    has_fire_safety: bool = False
    has_intercom: bool = False
    
    # Tenant Preference
    tenant_preference: Optional[str] = None
    
    # Ownership & Contact
    listed_by: str = "Owner"  # Owner, Broker, Builder
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    
    # Generated Description
    ai_description: Optional[str] = None
    
    # Images (base64 encoded)
    images: List[str] = []
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PropertyCreate(BaseModel):
    purpose: str
    category: str
    property_type: str
    is_plot: bool = False
    city: str
    locality: str
    pincode: str
    landmark: Optional[str] = None
    address: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_number: Optional[int] = None
    total_floors: Optional[int] = None
    furnishing: Optional[str] = None
    power_load_kva: Optional[int] = None
    ceiling_height_ft: Optional[float] = None
    conference_rooms: Optional[int] = None
    plot_area_sqft: Optional[float] = None
    plot_area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    irrigation_source: Optional[str] = None
    boundary_wall: Optional[bool] = None
    price: float
    deposit: Optional[float] = None
    maintenance: Optional[float] = None
    negotiable: bool = False
    has_lift: bool = False
    has_parking: bool = False
    has_gym: bool = False
    has_pool: bool = False
    near_metro: bool = False
    has_security: bool = False
    has_cctv: bool = False
    has_wifi: bool = False
    has_ac: bool = False
    has_geyser: bool = False
    has_video_doorbell: bool = False
    has_fire_safety: bool = False
    has_intercom: bool = False
    has_intercom: bool = False
    tenant_preference: Optional[str] = None
    listed_by: str = "Owner"
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    images: List[str] = []

# Utility Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def generate_ai_description(property_data: dict) -> str:
    """Generate detailed mock description (AI unavailable)"""
    
    category = property_data.get('category', 'Residential')
    prop_type = property_data['property_type']
    city = property_data['city']
    locality = property_data['locality']
    purpose = property_data['purpose']
    
    # Common features helper
    features = []
    if property_data.get('has_lift'): features.append('Lift')
    if property_data.get('has_parking'): features.append('Reserved Parking')
    if property_data.get('has_gym'): features.append('Gymnasium')
    if property_data.get('has_pool'): features.append('Swimming Pool')
    if property_data.get('has_wifi'): features.append('High-speed WiFi')
    if property_data.get('has_ac'): features.append('Air Conditioning')
    if property_data.get('has_security'): features.append('24/7 Security')
    if property_data.get('has_cctv'): features.append('CCTV Surveillance')
    if property_data.get('has_video_doorbell'): features.append('Video Doorbell')
    if property_data.get('near_metro'): features.append('Near Metro Station')
    
    features_str = ", ".join(features) if features else "essential amenities"

    # Listed By Intro
    listed_by = property_data.get('listed_by', 'Owner')
    intro_prefix = f"Directly listed by {listed_by}," if listed_by == 'Owner' else f"Listed by {listed_by},"

    # --- AGRICULTURAL TEMPLATE ---
    if category == 'Agricultural':
        soil = property_data.get('soil_type', 'fertile')
        irrigation = property_data.get('irrigation_source', 'natural sources')
        area = property_data.get('plot_area_acres') or property_data.get('plot_area_sqft')
        
        p1 = f"{intro_prefix} this Prime {prop_type} available for {purpose} in the peaceful vicinity of {locality}, {city}. This fertile land is perfect for farming, organic cultivation, or as a long-term investment asset. Away from the city noise, it offers a serene environment."
        
        p2 = f"The land features {soil} soil tailored for high-yield crops and is supported by {irrigation} for consistent water supply. With an area of approx {area}, it provides ample space for varied agricultural activities or farmhouse construction."
        
        p3 = f"An excellent opportunity for investors and farmers alike. This {prop_type} in {city} holds immense potential for appreciation. Contact us to explore this green investment today!"

    # --- COMMERCIAL / INDUSTRIAL TEMPLATE ---
    elif category in ['Commercial', 'Industrial']:
        power = f"{property_data.get('power_load_kva', 0)} KVA power load"
        
        p1 = f"{intro_prefix} this Strategically located {prop_type} available for {purpose} in the business hub of {locality}, {city}. This property offers high visibility and excellent connectivity, making it an ideal choice for your business operations."
        
        p2 = f"Designed for efficiency, the property comes with {power} and modern infrastructure. It includes {features_str}. The layout is optimized for smooth workflow and logistics, suitable for offices, showrooms, or industrial units."
        
        p3 = f"Boost your business presence in {city} with this premium location. Perfect for startups, established firms, or industrial setups. Schedule a site visit now!"

    # --- PG / CO-LIVING TEMPLATE ---
    elif category == 'PG/Co-living':
        tenant = property_data.get('tenant_preference', 'Students & Professionals')
        
        p1 = f"{intro_prefix} budget-friendly and comfortable {prop_type} available in {locality}, {city}. Ideally situated near colleges and IT parks, offering a hassle-free living experience for {tenant}."
        
        p2 = f"This fully managed property offers {features_str}. Residents can enjoy a community lifestyle with clean, well-maintained rooms and common areas. High-speed internet and security ensure you can work or study without interruption."
        
        p3 = f"Move into a safe and social environment in {city}. Slots are filling fast! Contact us immediately to book your bed/room."

    # --- RESIDENTIAL (Default) ---
    else:
        tenant_pref = property_data.get('tenant_preference', 'Anyone')
        tenant_text = f"Perfectly suited for {tenant_pref}." if tenant_pref and tenant_pref != 'Any' else "Ideal for families and professionals."
        
        p1 = f"{intro_prefix} check out this premium {prop_type} available for {purpose} in the heart of {locality}, {city}. This property offers a perfect blend of modern architecture and convenient living. Situated in a prime location, it provides easy access to schools, hospitals, and shopping centers."
        
        p2 = f"The property boasts {features_str}. It is spacious, well-ventilated, and designed to provide maximum comfort. Whether you are looking for a peaceful environment or a vibrant community, this property checks all the boxes. The interiors are tastefully done (if furnished), ensuring a luxurious lifestyle."
        
        p3 = f"{tenant_text} Don't miss out on this opportunity to live in one of the most sought-after neighborhoods in {city}. Contact us today to schedule a viewing and make this your new home!"
    
    return f"{p1}\n\n{p2}\n\n{p3}"

# Routes
@api_router.get("/")
async def root():
    return {"message": "Rentify API"}

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pwd = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hashed_pwd
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Generate token
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Remove password from response
    user_doc.pop('password')
    user = User(**user_doc)
    
    # Generate token
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return {"token": token, "user": user}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/properties", response_model=PropertyListing)
async def create_property(property_data: PropertyCreate, current_user: User = Depends(get_current_user)):
    # Generate AI description
    property_dict = property_data.model_dump()
    ai_desc = await generate_ai_description(property_dict)
    
    # Create property listing
    property_listing = PropertyListing(
        user_id=current_user.id,
        ai_description=ai_desc,
        **property_dict
    )
    
    doc = property_listing.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.properties.insert_one(doc)
    
    return property_listing

@api_router.get("/properties", response_model=List[PropertyListing])
async def get_properties(skip: int = 0, limit: int = 50):
    properties = await db.properties.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for prop in properties:
        if isinstance(prop['created_at'], str):
            prop['created_at'] = datetime.fromisoformat(prop['created_at'])
        if isinstance(prop['updated_at'], str):
            prop['updated_at'] = datetime.fromisoformat(prop['updated_at'])
    
    return properties

@api_router.get("/properties/my", response_model=List[PropertyListing])
async def get_my_properties(current_user: User = Depends(get_current_user)):
    properties = await db.properties.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    
    for prop in properties:
        if isinstance(prop['created_at'], str):
            prop['created_at'] = datetime.fromisoformat(prop['created_at'])
        if isinstance(prop['updated_at'], str):
            prop['updated_at'] = datetime.fromisoformat(prop['updated_at'])
    
    return properties

@api_router.get("/properties/{property_id}", response_model=PropertyListing)
async def get_property(property_id: str):
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if isinstance(property_doc['created_at'], str):
        property_doc['created_at'] = datetime.fromisoformat(property_doc['created_at'])
    if isinstance(property_doc['updated_at'], str):
        property_doc['updated_at'] = datetime.fromisoformat(property_doc['updated_at'])
    
    return PropertyListing(**property_doc)

@api_router.put("/properties/{property_id}", response_model=PropertyListing)
async def update_property(property_id: str, property_data: PropertyCreate, current_user: User = Depends(get_current_user)):
    # Check if property exists and belongs to user
    existing = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if existing['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Generate new AI description
    property_dict = property_data.model_dump()
    ai_desc = await generate_ai_description(property_dict)
    
    # Update property
    updated_data = property_dict.copy()
    updated_data['ai_description'] = ai_desc
    updated_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.properties.update_one(
        {"id": property_id},
        {"$set": updated_data}
    )
    
    # Fetch updated property
    updated_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    
    if isinstance(updated_doc['created_at'], str):
        updated_doc['created_at'] = datetime.fromisoformat(updated_doc['created_at'])
    if isinstance(updated_doc['updated_at'], str):
        updated_doc['updated_at'] = datetime.fromisoformat(updated_doc['updated_at'])
    
    return PropertyListing(**updated_doc)

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, current_user: User = Depends(get_current_user)):
    # Check if property exists and belongs to user
    existing = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if existing['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.properties.delete_one({"id": property_id})
    
    return {"message": "Property deleted successfully"}

@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        contents = await file.read()
        base64_encoded = base64.b64encode(contents).decode('utf-8')
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        data_uri = f"data:image/{file_ext};base64,{base64_encoded}"
        return {"image_url": data_uri}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

# Admin Dependency
async def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# Admin Routes
@api_router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    total_properties = await db.properties.count_documents({})
    return {"total_users": total_users, "total_properties": total_properties}

@api_router.get("/admin/users")
async def get_all_users(admin: User = Depends(get_current_admin)):
    cursor = db.users.find({}, {"_id": 0})
    users = await cursor.to_list(length=100)
    return users

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: User = Depends(get_current_admin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@api_router.get("/admin/properties")
async def get_all_properties(admin: User = Depends(get_current_admin)):
    cursor = db.properties.find({}, {"_id": 0})
    properties = await cursor.to_list(length=100)
    return properties

@api_router.delete("/admin/properties/{property_id}")
async def admin_delete_property(property_id: str, admin: User = Depends(get_current_admin)):
    # Verify property exists
    prop = await db.properties.find_one({"id": property_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Delete from DB
    await db.properties.delete_one({"id": property_id})
    return {"message": "Property deleted"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()