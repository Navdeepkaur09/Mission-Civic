from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, Optional
from backend.app.models import UserRegister, UserLogin, TokenResponse, UserProfileResponse
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user
from backend.app.db import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    """Register a new citizen or municipal official and seed their Firestore profile."""
    db = get_db()
    
    # Check if user already exists
    user_ref = db.collection("users").document(user_in.email).get()
    if user_ref.exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email is already registered."
        )
    
    # Securely hash password
    hashed = hash_password(user_in.password)
    
    # Profile payload
    profile_data = {
        "name": user_in.name,
        "email": user_in.email,
        "password_hash": hashed,
        "role": user_in.role if user_in.role in ["citizen", "authority", "admin"] else "citizen",
        "points": 10,  # Starting civic balance
        "coins": 0,    # Starting coin balance
        "badges": [],
        "verificationsDone": 0,
        "reportsFiled": 0,
        "gameCompletedCount": 0
    }
    
    if user_in.department:
        profile_data["department"] = user_in.department

    # Save to Firestore
    db.collection("users").document(user_in.email).set(profile_data)
    
    # Return without returning password hash
    return UserProfileResponse(**profile_data)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Authenticate email and password, returning a JWT bearer token."""
    db = get_db()
    
    user_ref = db.collection("users").document(credentials.email).get()
    if not user_ref.exists:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
        
    user_data = user_ref.to_dict()
    
    # Validate hashed password if registered via form, or allow fallback for pre-seeded emails with empty passwords
    stored_hash = user_data.get("password_hash")
    if stored_hash:
        if not verify_password(credentials.password, stored_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
    else:
        # Pre-seeded users fallback: permit simple login for demonstration
        if credentials.password != "password" and credentials.password != "admin" and credentials.password != "authority":
             # Support simple credentials matching role
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password for pre-seeded user. Use 'password' or matching role name."
             )
             
    # Generate access token
    token = create_access_token(data={"sub": credentials.email, "role": user_data.get("role", "citizen")})
    
    return TokenResponse(
        access_token=token,
        profile=UserProfileResponse(**user_data)
    )


# Unified user profile getter/creator (retaining compatibility with original App)
@router.post("/profile", response_model=UserProfileResponse)
async def get_or_create_profile(payload: Dict[str, Any]):
    """Unified profile fetch that registers unknown emails immediately to ease OAuth/Google logins."""
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    db = get_db()
    user_ref = db.collection("users").document(email).get()
    
    if not user_ref.exists:
        # Seed an empty initial profile
        profile_data = {
            "name": payload.get("name", email.split("@")[0]),
            "email": email,
            "role": payload.get("role", "citizen"),
            "points": 10,
            "coins": 0,
            "badges": [],
            "verificationsDone": 0,
            "reportsFiled": 0,
            "gameCompletedCount": 0
        }
        db.collection("users").document(email).set(profile_data)
        return UserProfileResponse(**profile_data)
        
    return UserProfileResponse(**user_ref.to_dict())
