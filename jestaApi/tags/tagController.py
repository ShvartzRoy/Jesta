from django.shortcuts import get_object_or_404
from .models import Tag
from ninja.errors import HttpError

class TagController:
    def add_tag(self, name: str) -> dict:
        tag, created = Tag.objects.get_or_create(name=name)
        if not created:
            raise HttpError(400, f"Tag '{name}' already exists!")
        return {"id": tag.id, "name": tag.name}

    def remove_tag(self, tag_id: int) -> dict:
        tag = get_object_or_404(Tag, id=tag_id)
        tag.delete()
        return {"message": f"Tag '{tag.name}' deleted successfully!"}
    
    def edit_tag(self, tag_id: int, name: str) -> dict:
        tag = get_object_or_404(Tag, id=tag_id)
        tag.name = name
        tag.save()
        return {"id": tag.id, "name": tag.name}

    def get_all_tags(self) -> list[dict]:
        tags = Tag.objects.all()
        return [{"id": tag.id, "name": tag.name} for tag in tags]

    def get_tag(self, tag_id: int) -> dict:
        tag = get_object_or_404(Tag, id=tag_id)
        return {"id": tag.id, "name": tag.name}
    
    
    def get_tag_by_name(self, name: str) -> dict:
        tag = get_object_or_404(Tag, name=name)
        return {"id": tag.id, "name": tag.name}
    
