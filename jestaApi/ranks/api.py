from ninja import Router
from .models import Rank
from users.models import CustomUser
from .schemas import RankSchema, AddXPRequest
from django.shortcuts import get_object_or_404

router = Router(tags=["Rank"])

@router.get("/get_rank/{user_id}", response=RankSchema)
def get_rank(request, user_id: int):
    rank = get_object_or_404(Rank, user_id=user_id)
    return rank

@router.post("/add_xp/", response={200: dict, 400: dict})
def add_xp(request, payload: AddXPRequest):
    rank = get_object_or_404(Rank, user_id=payload.user_id)
    rank.add_xp(payload.amount)
    return {"message": "XP added successfully", "new_xp": rank.xp, "new_level": rank.level}

@router.post("/add_badge/", response={200: dict, 400: dict})
def add_badge(request, payload: AddXPRequest):
    rank = get_object_or_404(Rank, user_id=payload.user_id)
    rank.add_badge(payload.badge)
    return {"message": "Badge added successfully", "badges": rank.badges}
