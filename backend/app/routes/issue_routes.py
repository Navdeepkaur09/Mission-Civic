import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from backend.app.models import IssueCreate, IssueResponse, IssueUpdate
from backend.app.utils.gemini_service import GeminiService
from backend.app.db import get_db

router = APIRouter(prefix="/issues", tags=["Issues"])

@router.get("", response_model=List[IssueResponse])
async def get_all_issues():
    """Retrieve all reported issues from Firestore, ordered by creation date (newest first)."""
    db = get_db()
    issues_stream = db.collection("issues").stream()
    
    issues = []
    for doc in issues_stream:
        issues.append(doc.to_dict())
        
    # Sort descending by createdAt
    issues.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return issues


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str):
    """Retrieve details of a single community issue."""
    db = get_db()
    doc_ref = db.collection("issues").document(issue_id).get()
    
    if not doc_ref.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID '{issue_id}' not found."
        )
        
    return doc_ref.to_dict()


@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def report_issue(issue_in: IssueCreate):
    """File a new community issue report. Optionally processes image via Gemini AI for categorization."""
    db = get_db()
    
    issue_id = f"issue-{int(time.time() * 1000)}"
    now_str = datetime.utcnow().isoformat() + "Z"
    
    # 1. Trigger Gemini Analysis for classification / severity / layout
    description_text = issue_in.description or "No detailed description provided."
    ai_analysis = await GeminiService.analyze_issue(
        description=description_text,
        category=issue_in.category,
        severity=issue_in.severity,
        image_base64=issue_in.image
    )
    
    default_image = issue_in.image or "https://images.unsplash.com/photo-1599740831464-5aefe11fca9a?auto=format&fit=crop&q=80&w=600"
    
    # 2. Map coordinates and address
    lat = issue_in.latitude if issue_in.latitude is not None else 47.6062
    lng = issue_in.longitude if issue_in.longitude is not None else -122.3321
    addr = issue_in.address if issue_in.address else "Metro Center Way, Seattle, WA"
    
    new_issue_data = {
        "id": issue_id,
        "title": ai_analysis["title"],
        "description": description_text,
        "category": ai_analysis["category"],
        "status": "reported",
        "severity": ai_analysis["severity"],
        "department": ai_analysis["department"],
        "reporterName": issue_in.userName or "Anonymous Citizen",
        "reporterEmail": issue_in.userEmail or "anonymous@city.org",
        "createdAt": now_str,
        "updatedAt": now_str,
        "latitude": lat,
        "longitude": lng,
        "address": addr,
        "imageUrl": default_image,
        "verificationCount": 0,
        "downvoteCount": 0,
        "verifications": [],
        "aiConfidence": round(ai_analysis["confidence"], 2),
        "aiReasoning": ai_analysis["reasoning"],
        "issueDetected": ai_analysis["issueDetected"],
        "priorityScore": ai_analysis["priorityScore"],
        "estimatedResolutionTime": ai_analysis["estimatedResolutionTime"]
    }
    
    # Save report to Firestore
    db.collection("issues").document(issue_id).set(new_issue_data)
    
    # 3. Update reporter gamification statistics if they are logged in
    email = issue_in.userEmail
    if email:
        user_ref = db.collection("users").document(email).get()
        if user_ref.exists:
            user_data = user_ref.to_dict()
            
            # Increment core parameters
            reports_filed = user_data.get("reportsFiled", 0) + 1
            points = user_data.get("points", 10) + 30  # +30 points for filing
            badges = user_data.get("badges", [])
            
            # Milestone: First Report Badge
            if "first_report" not in badges:
                badges.append("first_report")
                
            # Compute category volumes for special badges
            # Query existing reports by this user
            all_user_reports = [
                d.to_dict() for d in db.collection("issues").stream() 
                if d.to_dict().get("reporterEmail") == email
            ]
            
            # Milestone: Pothole Patrol
            pothole_count = sum(1 for r in all_user_reports if r.get("category") == "pothole")
            if pothole_count >= 3 and "pothole_patrol" not in badges:
                badges.append("pothole_patrol")
                points += 50
                
            # Milestone: Eco Warrior
            garbage_count = sum(1 for r in all_user_reports if r.get("category") == "garbage")
            if garbage_count >= 3 and "eco_warrior" not in badges:
                badges.append("eco_warrior")
                points += 50
                
            # Update user profile document in Firestore
            db.collection("users").document(email).update({
                "reportsFiled": reports_filed,
                "points": points,
                "badges": badges
            })
            
    return new_issue_data


@router.delete("/{issue_id}", status_code=status.HTTP_200_OK)
async def delete_issue(issue_id: str):
    """Delete an issue (Admin utility)."""
    db = get_db()
    doc_ref = db.collection("issues").document(issue_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    doc_ref.delete()
    return {"message": f"Issue '{issue_id}' successfully removed from Firestore."}
