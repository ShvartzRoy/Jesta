from typing import List, Optional
from ninja import Router
from ninja.errors import HttpError
from .rankController import RankController
from django.shortcuts import get_object_or_404
from .models import Rank
from .schemas import RankCreateSchema, RankSchema, BadgeSchema



router = Router(tags=["Ranks"]) 
rc = RankController()

@router.post("/create_rank", response={201: dict})
def create_rank(request, payload):
    return rc.create_rank(request, payload)

@router.get("/get_rank/{user_id}/", response={200: dict})
def get_rank(request, user_id: int):
    return rc.get_rank(request, user_id)

@router.post("/add_xp/{user_id}/", response={200: dict})
def add_xp(request, user_id: int, xp: int):
    return rc.add_xp(user_id, xp)

@router.get("/update_level/{user_id}/", response={200: dict})
def update_level(request, user_id: int):
    return rc.update_level(user_id)


@router.get("/get_badges/{user_id}/", response=List[BadgeSchema])
def get_badges(request, user_id: int):
    return rc.get_badges(user_id)



@router.get("/get_xp/{user_id}/", response=int)
def get_xp(request, user_id: int):
    return rc.get_xp(user_id)

@router.get("/get_level/{user_id}/", response=int)
def get_level(request, user_id: int):
    return rc.get_level(user_id)