from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from backend.app.models import VerifyReport, IssueResponse
from backend.app.db import get_db

router = APIRouter(prefix="/issues", tags=["Verifications"])

@router.post("/{issue_id}/verify", response_model=IssueResponse)
async def verify_issue(issue_id: str, verify_in: VerifyReport):
    """Verify or endorse a reported community issue. Toggles verification status for the user and handles gamification rewards."""
    db = get_db()
    
    # Retrieve issue
    issue_doc = db.collection("issues").document(issue_id).get()
    if not issue_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found."
        )
        
    issue_data = issue_doc.to_dict()
    email = verify_in.userEmail
    
    # Retrieve user profile
    user_doc = db.collection("users").document(email).get()
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Valid user profile required to verify reports."
        )
        
    user_data = user_doc.to_dict()
    verifications = issue_data.get("verifications", [])
    verification_count = issue_data.get("verificationCount", 0)
    
    user_points = user_data.get("points", 10)
    user_verifications = user_data.get("verificationsDone", 0)
    user_badges = user_data.get("badges", [])
    
    if email in verifications:
        # Toggle OFF (Un-verify)
        verifications.remove(email)
        verification_count = max(0, verification_count - 1)
        
        # Revoke user achievements
        user_points = max(0, user_points - 10)
        user_verifications = max(0, user_verifications - 1)
    else:
        # Toggle ON (Verify)
        verifications.append(email)
        verification_count += 1
        
        # If threshold crossed, escalate status
        if issue_data.get("status") == "reported" and verification_count >= 3:
            issue_data["status"] = "verified"
            
        # Reward user achievements
        user_points += 10
        user_verifications += 1
        
        # Milestone: Community Guardian Badge (5 verifications)
        if user_verifications >= 5 and "community_guardian" not in user_badges:
            user_badges.append("community_guardian")
            user_points += 100
            
    # Update documents
    issue_data["verifications"] = verifications
    issue_data["verificationCount"] = verification_count
    issue_data["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    
    db.collection("issues").document(issue_id).set(issue_data)
    
    db.collection("users").document(email).update({
        "points": user_points,
        "verificationsDone": user_verifications,
        "badges": user_badges
    })
    
    return issue_data
