from fastapi import APIRouter
from typing import Dict, Any, List
from backend.app.models import AdminInsightsResponse
from backend.app.utils.gemini_service import GeminiService
from backend.app.db import get_db

router = APIRouter(tags=["Insights & Analytics"])

@router.get("/ai-insights", response_model=AdminInsightsResponse)
async def get_admin_ai_insights():
    """Aggregate City issue metrics and invoke Gemini AI to generate insights for the municipal chief officer."""
    db = get_db()
    
    issues_stream = db.collection("issues").stream()
    issues_list = [doc.to_dict() for doc in issues_stream]
    
    # Compute aggregates
    active_count = sum(1 for i in issues_list if i.get("status") != "resolved")
    resolved_count = sum(1 for i in issues_list if i.get("status") == "resolved")
    
    counts_by_cat = {
        "pothole": 0,
        "garbage": 0,
        "streetlight": 0,
        "leakage": 0,
        "road_damage": 0,
        "other": 0
    }
    
    raw_records_summary = []
    
    for i in issues_list:
        cat = i.get("category", "other")
        if cat in counts_by_cat:
            counts_by_cat[cat] += 1
        else:
            counts_by_cat["other"] += 1
            
        raw_records_summary.append({
            "id": i.get("id"),
            "cat": cat,
            "sev": i.get("severity", "medium"),
            "stat": i.get("status", "reported")
        })
        
    # Take an excerpt to avoid inflating context window size
    excerpt_summary = raw_records_summary[:20]
    
    # Request analysis from Gemini Service
    insights = await GeminiService.generate_admin_insights(
        active_count=active_count,
        resolved_count=resolved_count,
        counts_by_cat=counts_by_cat,
        raw_records_summary=excerpt_summary
    )
    
    return insights
