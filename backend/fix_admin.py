import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.test_database
    
    # Regex search for the user
    regex_pattern = "amantiwari4422"
    
    user = await db.users.find_one({"email": {"$regex": regex_pattern, "$options": "i"}})
    
    if not user:
        print("NO USER FOUND matching 'amantiwari4422'")
        return

    print(f"FOUND USER: {user['email']}")
    print(f"Current Admin Status: {user.get('is_admin')}")
    
    # Update
    result = await db.users.update_one(
        {"_id": user['_id']},
        {"$set": {"is_admin": True}}
    )
    
    print(f"Updated? : {result.modified_count > 0}")
    
    # Verify
    user_after = await db.users.find_one({"_id": user['_id']})
    print(f"Final Admin Status: {user_after.get('is_admin')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin())
