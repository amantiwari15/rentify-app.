import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def promote_to_admin(email: str):
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rentify_db
    
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"Error: User with email '{email}' not found.")
        return

    await db.users.update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    print(f"Success! User '{user['name']}' ({email}) is now an Admin.")
    client.close()

if __name__ == "__main__":
    email = input("Enter email of user to promote to Admin: ")
    asyncio.run(promote_to_admin(email))
