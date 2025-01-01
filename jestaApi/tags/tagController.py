from django.shortcuts import get_object_or_404
from .models import Tag
from ninja.errors import HttpError

class TagController:
    def add_tag(self, name: str) -> Tag:
        tag, created = Tag.objects.get_or_create(name=name)
        if not created:
            raise HttpError(400, f"Tag '{name}' already exists!")
        return tag

    def remove_tag(self, tag_id: int) -> dict:
        tag = get_object_or_404(Tag, id=tag_id)
        tag.delete()
        return {"message": f"Tag '{tag.name}' deleted successfully!"}

    def get_all_tags(self) -> list[Tag]:
        return Tag.objects.all()

    def get_tag(self, tag_id: int) -> Tag:
        return get_object_or_404(Tag, id=tag_id)
