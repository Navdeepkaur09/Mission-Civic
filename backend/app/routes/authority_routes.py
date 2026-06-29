from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from backend.app.models import IssueUpdate, IssueResponse
from backend.app.db import get_db

router = APIRouter(prefix="/issues", tags=["Authority Tools"])

@router.post("/{issue_id}/update", response_model=IssueResponse)
async def update_issue_status(issue_id: str, update_in: IssueUpdate):
    """Update status, assignment, and attach resolution proof for a municipal incident."""
    db = get_db()
    
    doc_ref = db.collection("issues").document(issue_id)
    doc_get = doc_ref.get()
    
    if not doc_get.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with ID '{issue_id}' not found."
        )
        
    issue_data = doc_get.to_dict()
    
    # Apply modifications
    if update_in.status is not None:
        issue_data["status"] = update_in.status
    if update_in.resolutionProofUrl is not None:
        issue_data["resolutionProofUrl"] = update_in.resolutionProofUrl
    if update_in.resolutionProofDescription is not None:
        issue_data["resolutionProofDescription"] = update_in.resolutionProofDescription
    if update_in.department is not None:
        issue_data["department"] = update_in.department
        
    # Commit log timestamp
    issue_data["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    
    doc_ref.set(issue_data)
    return issue_data
