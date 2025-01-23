from ninja import Router
from .badgeController import BadgeController
from .schemas import BadgeSchema, BadgeCreateSchema, BadgeListSchema

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

@router.get("/get_all_badges", response={200: BadgeListSchema})
def get_all_badges(request):
    badges = badge_controller.get_all_badges()
    return {"badges": badges}

@router.get("/get_badge/{badge_id}/", response={200: BadgeSchema, 404: dict})
def get_badge(request, badge_id: int):
    return badge_controller.get_badge(badge_id)

@router.get("/get_badge_by_name/{name}/", response={200: BadgeSchema, 404: dict})
def get_badge_by_name(request, name: str):
    return badge_controller.get_badge_by_name(name)