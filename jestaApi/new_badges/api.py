from typing import List, Dict
from ninja import Router
from .badgeController import BadgeController
from .schemas import BadgeSchema, BadgeCreateSchema

from django.contrib.auth import get_user_model
from new_badges import badgeController
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from users.models import CustomUser, Profile


badgeRouter = Router()
User = get_user_model()
badge_controller = BadgeController()




router = Router(tags=["Badges"])
badge_controller = BadgeController()

@router.post("/add_badge", response={201: BadgeSchema, 400: dict})
def add_badge(request, payload: BadgeCreateSchema):
    badge = badge_controller.add_badge(payload.name)
    return 201, badge

@router.delete("/remove_badge/{badge_id}/", response={200: dict, 404: dict})
def remove_badge(request, badge_id: int):
    return badge_controller.remove_badge(badge_id)

@router.put("/edit_badge/{badge_id}/", response={200: BadgeSchema, 404: dict})
def edit_badge(request, badge_id: int, payload: BadgeCreateSchema):
    return badge_controller.edit_badge(badge_id, payload.name)

@router.get("/get_all_badges", response=List[BadgeSchema])
def get_all_badges(request):
    return badge_controller.get_all_badges()

@router.get("/get_badge/{badge_id}/", response={200: BadgeSchema, 404: dict})
def get_badge(request, badge_id: int):
    return badge_controller.get_badge(badge_id)

@router.get("/get_badge_by_name/{name}/", response={200: BadgeSchema, 404: dict})
def get_badge_by_name(request, name: str):
    return badge_controller.get_badge_by_name(name)



@badgeRouter.post("/assign_badge/")
def assign_badge(request, user_id: int, badge_name: str) -> Dict:
    if not request.auth or not request.auth.is_authenticated:
        raise HttpError(401, "Unauthorized")

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    badge_controller.assign_badge_if_missing(user, badge_name)
    return {"message": f"Badge '{badge_name}' assigned to user {user_id} if not already present."}


# @router.get("/get_badges/{user_id}/")
# def get_badges(request, user_id: int):
#     profile = get_object_or_404(Profile, user__id=user_id)
#     return [{"name": badge.name} for badge in profile.badges.all()]


@router.get("/get_badges/{user_id}/", response=list[BadgeSchema])
def get_badges(request, user_id: int):
    profile = get_object_or_404(Profile, user__id=user_id)
    return profile.badges.all()