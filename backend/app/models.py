from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

# --- User & Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Minimum 6 characters")
    name: str
    role: str = Field(default="citizen", description="citizen, authority, or admin")
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    email: str
    name: str
    role: str
    department: Optional[str] = None
    points: int = 10
    coins: int = 0
    badges: List[str] = []
    verificationsDone: int = 0
    reportsFiled: int = 0
    gameCompletedCount: int = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    profile: UserProfileResponse


# --- Issue & Reporting Schemas ---
class IssueCreate(BaseModel):
    title: Optional[str] = None
    description: str
    category: Optional[str] = "other"  # pothole, garbage, leakage, streetlight, road_damage, other
    severity: Optional[str] = "medium"  # low, medium, high
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image: Optional[str] = None  # Base64 string or URL
    userEmail: Optional[EmailStr] = None
    userName: Optional[str] = None

class IssueUpdate(BaseModel):
    status: Optional[str] = None  # reported, verified, in_progress, resolved, archived
    resolutionProofUrl: Optional[str] = None
    resolutionProofDescription: Optional[str] = None
    department: Optional[str] = None

class IssueResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    status: str
    severity: str
    department: str
    reporterName: str
    reporterEmail: str
    createdAt: str
    updatedAt: str
    latitude: float
    longitude: float
    address: str
    imageUrl: str
    verificationCount: int = 0
    downvoteCount: int = 0
    verifications: List[str] = []
    aiConfidence: float = 0.50
    aiReasoning: str
    issueDetected: Optional[str] = None
    priorityScore: Optional[int] = None
    estimatedResolutionTime: Optional[str] = None
    resolutionProofUrl: Optional[str] = None
    resolutionProofDescription: Optional[str] = None


# --- verification Schemas ---
class VerifyReport(BaseModel):
    userEmail: EmailStr


# --- Gamification Schemas ---
class GameCompletion(BaseModel):
    userEmail: EmailStr
    score: int = Field(default=100, description="Score scored by user in simulation")


# --- Predictive analytics schemas ---
class Coordinate(BaseModel):
    lat: float
    lng: float

class PredictiveHotspot(BaseModel):
    id: str
    region: str
    category: str
    riskScore: float
    reasoning: str
    coordinates: Coordinate
    predictedTimeline: str


# --- Admin Insights Schemas ---
class DepartmentEfficiency(BaseModel):
    departmentName: str
    rating: str
    issueVolume: int

class AdminInsightsResponse(BaseModel):
    executiveSummary: str
    resourceAllocationAdvice: str
    preventivePolicy: str
    departmentEfficiencyRatings: List[DepartmentEfficiency]
