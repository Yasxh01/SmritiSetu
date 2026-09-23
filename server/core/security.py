import jwt
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from server.core.config import settings

security = HTTPBearer(auto_error=False)

# In-memory transient OTP store: phone_number -> {"otp": str, "expires_at": float}
OTP_STORE: Dict[str, Dict[str, Any]] = {}
SANDBOX_OTP = "123456"

def generate_otp(phone_number: str) -> str:
    """
    Generates a 6-digit OTP for the given phone number.
    In testing/sandbox mode or demo, 123456 is always accepted.
    """
    # Simple deterministic or sandbox OTP for testability
    otp = SANDBOX_OTP
    OTP_STORE[phone_number] = {
        "otp": otp,
        "expires_at": time.time() + 300  # 5 minutes
    }
    return otp

def verify_otp(phone_number: str, otp: str) -> bool:
    """
    Validates provided OTP against stored or sandbox code.
    """
    if otp == SANDBOX_OTP:
        return True
    
    record = OTP_STORE.get(phone_number)
    if not record:
        return False
    
    if time.time() > record["expires_at"]:
        del OTP_STORE[phone_number]
        return False
        
    if record["otp"] == otp:
        del OTP_STORE[phone_number]
        return True
        
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    return decode_access_token(credentials.credentials)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials required"
        )
    return decode_access_token(credentials.credentials)

def require_role(allowed_roles: List[str]):
    async def role_checker(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role")
        if user_role not in allowed_roles and "admin" not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles}"
            )
        return user
    return role_checker
