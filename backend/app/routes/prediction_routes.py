from fastapi import APIRouter
from typing import List
from backend.app.models import PredictiveHotspot
from backend.app.utils.gemini_service import GeminiService
from backend.app.db import get_db

router = APIRouter(tags=["Predictive Analytics"])

@router.get("/predict-recurring", response_model=List[PredictiveHotspot])
async def get_predictive_hotspots():
    """Analyze current spatial issue patterns and invoke Gemini AI to predict future incident hot-spots."""
    db = get_db()
    
    issues_stream = db.collection("issues").stream()
    issues_list = []
    
    for doc in issues_stream:
        issue = doc.to_dict()
        # Extract minimal fields required for spatial prediction to keep context size low
        issues_list.append({
            "category": issue.get("category"),
            "address": issue.get("address"),
            "latitude": issue.get("latitude"),
            "longitude": issue.get("longitude"),
            "createdAt": issue.get("createdAt")
        })
        
    # Crop to newest 30 issues to manage token bandwidth
    sorted_issues = sorted(issues_list, key=lambda x: x.get("createdAt", ""), reverse=True)[:30]
    
    predictions = await GeminiService.predict_hotspots(sorted_issues)
    return predictions
