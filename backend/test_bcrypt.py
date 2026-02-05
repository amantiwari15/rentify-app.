from passlib.context import CryptContext
import traceback

print("Testing usage of passlib with bcrypt...")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    password = "AMAN15"
    print(f"Password: {password} (len={len(password)})")
    hashed = pwd_context.hash(password)
    print(f"Success: {hashed}")
except Exception:
    traceback.print_exc()
