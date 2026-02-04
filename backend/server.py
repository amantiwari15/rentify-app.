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
from emergentintegrations.llm.chat import LlmChat, UserMessage
import base64
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
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
    """Generate SEO-optimized property description using Claude Sonnet 4.5"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        # Build context for AI
        amenities_list = []
        if property_data.get('has_lift'): amenities_list.append('Lift')
        if property_data.get('has_parking'): amenities_list.append('Parking')
        if property_data.get('has_gym'): amenities_list.append('Gymnasium')
        if property_data.get('has_pool'): amenities_list.append('Swimming Pool')
        if property_data.get('near_metro'): amenities_list.append('Near Metro')
        if property_data.get('has_security'): amenities_list.append('24/7 Security')
        if property_data.get('has_cctv'): amenities_list.append('CCTV Surveillance')
        
        amenities_str = ", ".join(amenities_list) if amenities_list else "Basic amenities"
        
        prompt = f"""
Generate a compelling, SEO-optimized property description for the following listing:

Property Type: {property_data['property_type']} ({property_data['category']})
Purpose: {property_data['purpose']}
Location: {property_data['locality']}, {property_data['city']} - {property_data['pincode']}
"""
        
        if property_data.get('bedrooms'):
            prompt += f"Bedrooms: {property_data['bedrooms']} BHK\n"
        if property_data.get('bathrooms'):
            prompt += f"Bathrooms: {property_data['bathrooms']}\n"
        if property_data.get('furnishing'):
            prompt += f"Furnishing: {property_data['furnishing']}\n"
        if property_data.get('plot_area_sqft'):
            prompt += f"Plot Area: {property_data['plot_area_sqft']} sq.ft\n"
        if property_data.get('plot_area_acres'):
            prompt += f"Plot Area: {property_data['plot_area_acres']} acres\n"
        if property_data.get('soil_type'):
            prompt += f"Soil Type: {property_data['soil_type']}\n"
        if property_data.get('irrigation_source'):
            prompt += f"Irrigation: {property_data['irrigation_source']}\n"
        if property_data.get('power_load_kva'):
            prompt += f"Power Load: {property_data['power_load_kva']} KVA\n"
        if property_data.get('ceiling_height_ft'):
            prompt += f"Ceiling Height: {property_data['ceiling_height_ft']} ft\n"
        
        prompt += f"\nPrice: ₹{property_data['price']:,.0f}"
        if property_data['purpose'] == 'Rent':
            prompt += " per month"
        if property_data.get('deposit'):
            prompt += f" | Deposit: ₹{property_data['deposit']:,.0f}"
        
        prompt += f"\nAmenities: {amenities_str}\n"
        
        if property_data.get('landmark'):
            prompt += f"Landmark: {property_data['landmark']}\n"
        
        prompt += "\nWrite a 3-4 paragraph description that highlights the key features, location benefits, and value proposition. Make it engaging and professional."
        
        # Use Claude Sonnet 4.5
        chat = LlmChat(
            api_key=api_key,
            session_id=f"property_{uuid.uuid4()}",
            system_message="You are a professional real estate copywriter specializing in SEO-optimized property descriptions."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return response
    except Exception as e:
        logger.error(f"AI description generation error: {str(e)}")
        # Fallback description
        return f"{property_data['property_type']} available for {property_data['purpose']} in {property_data['locality']}, {property_data['city']}. Contact for more details."

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