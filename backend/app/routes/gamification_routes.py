from fastapi import APIRouter, HTTPException, status
from backend.app.models import GameCompletion, UserProfileResponse
from backend.app.db import get_db

router = APIRouter(prefix="/user", tags=["Gamification"])

@router.post("/game-complete", response_model=UserProfileResponse)
async def complete_civic_game(game_in: GameCompletion):
    """Log completion of interactive training simulations, granting points and potential achievement badges."""
    db = get_db()
    
    user_ref = db.collection("users").document(game_in.userEmail)
    user_get = user_ref.get()
    
    if not user_get.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not registered."
        )
        
    user_data = user_get.to_dict()
    
    # Increment completed simulation tally
    game_count = user_data.get("gameCompletedCount", 0) + 1
    
    # Points allocation based on simulation performance (e.g. half of the score is rewarded as XP points)
    score_earned = game_in.score
    points_rewarded = round(score_earned / 2)
    new_points = user_data.get("points", 10) + points_rewarded
    
    # Coins allocation based on performance
    coins_rewarded = round(score_earned * 0.8)
    new_coins = user_data.get("coins", 0) + coins_rewarded
    
    badges = user_data.get("badges", [])
    
    # Milestone: Safety Champion (Excellent performance in civic guidelines)
    if score_earned >= 100 and "safety_champion" not in badges:
        badges.append("safety_champion")
        new_points += 150  # Bonus badge bounty XP
        new_coins += 100   # Bonus badge coins bounty
        
    # Commit changes
    updates = {
        "gameCompletedCount": game_count,
        "points": new_points,
        "coins": new_coins,
        "badges": badges
    }
    
    user_ref.update(updates)
    user_data.update(updates)
    
    return UserProfileResponse(**user_data)


from pydantic import BaseModel, EmailStr

class RedeemRequest(BaseModel):
    userEmail: EmailStr
    cost: int

@router.post("/redeem", response_model=UserProfileResponse)
async def redeem_user_coins(payload: RedeemRequest):
    """Spend accumulated gold coins on community reward store items, updating profile balance."""
    db = get_db()
    user_ref = db.collection("users").document(payload.userEmail)
    user_get = user_ref.get()
    
    if not user_get.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not registered."
        )
        
    user_data = user_get.to_dict()
    current_coins = user_data.get("coins", 0)
    
    if current_coins < payload.cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient coins for this redemption."
        )
        
    new_coins = current_coins - payload.cost
    
    updates = {
        "coins": new_coins
    }
    
    user_ref.update(updates)
    user_data.update(updates)
    
    return UserProfileResponse(**user_data)
