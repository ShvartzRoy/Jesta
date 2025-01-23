from django.shortcuts import get_object_or_404
from .models import Badge
from ninja.errors import HttpError

class BadgeController:
    def add_badge(self, name: str, description: str, image: str) -> dict:
        badge, created = Badge.objects.get_or_create(name=name)
        if not created:
            raise HttpError(400, f"Badge '{name}' already exists!")
        return {"id": badge.id, "name": badge.name}
    
    def remove_badge(self, badge_id: int) -> dict:
        badge = get_object_or_404(Badge, id=badge_id)
        badge.delete()
        return {"message": f"Badge '{badge.name}' deleted successfully!"}
    
    def edit_badge(self, badge_id: int, name: str) -> dict:
        badge = get_object_or_404(Badge, id=badge_id)
        badge.name = name
        badge.save()
        return {"id": badge.id, "name": badge.name}
    
    def get_all_badges(self) -> list[dict]:
        badges = Badge.objects.all()
        return [{"id": badge.id, "name": badge.name} for badge in badges]

    def get_badge(self, badge_id: int) -> dict:
        badge = get_object_or_404(Badge, id=badge_id)
        return {"id": badge.id, "name": badge.name}
    
    def get_badge_by_name(self, name: str) -> dict:
        badge = get_object_or_404(Badge, name=name)
        return {"id": badge.id, "name": badge.name}