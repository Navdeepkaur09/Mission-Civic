import logging
import uvicorn
from fastapi import FastAPI, Dict, Any, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.db import get_db
from backend.app.models import UserProfileResponse
from backend.app.routes import (
    auth_routes,
    issue_routes,
    verify_routes,
    authority_routes,
    gamification_routes,
    dashboard_routes,
    prediction_routes,
    pipeline_routes,
)

# Logger initialization
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A high-performance FastAPI server integrating Cloud Firestore and Gemini AI for issue classification and predictions.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits rapid developer workspace mapping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup Event ---
@app.on_event("startup")
def startup_db_client():
    logger.info("Verifying database connectivity on startup...")
    get_db()

# --- Health Check Endpoint ---
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": settings.VERSION}

# --- Mounting Modular Routers ---
# Note: All routers are mapped under /api prefix in alignment with the full-stack routing schema
app.include_router(auth_routes.router, prefix="/api")
app.include_router(issue_routes.router, prefix="/api")
app.include_router(verify_routes.router, prefix="/api")
app.include_router(authority_routes.router, prefix="/api")
app.include_router(gamification_routes.router, prefix="/api")
app.include_router(dashboard_routes.router, prefix="/api")
app.include_router(prediction_routes.router, prefix="/api")
app.include_router(pipeline_routes.router, prefix="/api")


# --- Direct compatibility handler for existing frontend fetches ---
# The frontend queries POST /api/user/profile directly rather than POST /api/auth/profile
@app.post("/api/user/profile", response_model=UserProfileResponse, tags=["Compatibility Endpoints"])
async def direct_profile_fetch(payload: dict):
    """Fallback profile handler supporting the legacy /api/user/profile query path directly."""
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    db = get_db()
    user_ref = db.collection("users").document(email).get()
    
    if not user_ref.exists:
        # Auto-register this account to offer frictionless onboarding
        profile_data = {
            "name": payload.get("name", email.split("@")[0]),
            "email": email,
            "role": payload.get("role", "citizen"),
            "points": 10,
            "badges": [],
            "verificationsDone": 0,
            "reportsFiled": 0,
            "gameCompletedCount": 0
        }
        db.collection("users").document(email).set(profile_data)
        return UserProfileResponse(**profile_data)
        
    return UserProfileResponse(**user_ref.to_dict())


if __name__ == "__main__":
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
