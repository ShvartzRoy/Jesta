from django.shortcuts import get_object_or_404
from .models import Tag, SpecialistTag, Category
from ninja.errors import HttpError

class TagController:
    def add_tag(self, name: str, category_id: int) -> dict:
        tag, created = Tag.objects.get_or_create(name=name)
        category = get_object_or_404(Category, id=category_id)
        category.tags.add(tag)

        message = f"Tag '{name}' added to category '{category.name}' successfully!"
        if not created:
            raise HttpError(400, f"Tag '{name}' already exists! {message}")
        
        return {"id": tag.id, "name": tag.name, "message": message}

    # Updated remove_tag to also remove the tag from all categories
    def remove_tag(self, tag_id: int) -> dict:
        tag = get_object_or_404(Tag, id=tag_id)
        # Remove the tag from all categories it is associated with
        categories = Category.objects.filter(tags=tag)
        for category in categories:
            category.tags.remove(tag)
        tag.delete()
        return {"message": f"Tag '{tag.name}' deleted successfully and removed from all categories!"}

    
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
    
    def add_specialist_tag(self, name: str, category_id: int) -> dict:
        specialist_tag, created = SpecialistTag.objects.get_or_create(name=name)
        category = get_object_or_404(Category, id=category_id)
        category.specialist_tags.add(specialist_tag)

        message = f"SpecialistTag '{name}' added to category '{category.name}' successfully!"
        if not created:
            raise HttpError(400, f"SpecialistTag '{name}' already exists! {message}")
        
        return {"id": specialist_tag.id, "name": specialist_tag.name, "message": message}


    def remove_specialist_tag(self, specialist_tag_id: int) -> dict:
        specialist_tag = get_object_or_404(SpecialistTag, id=specialist_tag_id)
        # Remove the specialist tag from all categories it is associated with
        categories = Category.objects.filter(specialist_tags=specialist_tag)
        for category in categories:
            category.specialist_tags.remove(specialist_tag)
        specialist_tag.delete()
        return {"message": f"SpecialistTag '{specialist_tag.name}' deleted successfully and removed from all categories!"}

    # Category operations
    def add_category(self, name: str) -> dict:
        category, created = Category.objects.get_or_create(name=name)
        if not created:
            raise HttpError(400, f"Category '{name}' already exists!")
        
        # Return the full structure expected by the schema
        return {
            "id": category.id,
            "name": category.name,
            "tags": [],  # Empty list since it's a new category
            "specialist_tags": []  # Empty list since it's a new category
        }


    def add_tag_to_category(self, category_id: int, tag_id: int) -> dict:
        category = get_object_or_404(Category, id=category_id)
        tag = get_object_or_404(Tag, id=tag_id)
        category.tags.add(tag)
        return {"message": f"Tag '{tag.name}' added to category '{category.name}' successfully!"}

    def remove_tag_from_category(self, category_id: int, tag_id: int) -> dict:
        category = get_object_or_404(Category, id=category_id)
        tag = get_object_or_404(Tag, id=tag_id)
        category.tags.remove(tag)
        return {"message": f"Tag '{tag.name}' removed from category '{category.name}' successfully!"}

    def add_specialist_tag_to_category(self, category_id: int, specialist_tag_id: int) -> dict:
        category = get_object_or_404(Category, id=category_id)
        specialist_tag = get_object_or_404(SpecialistTag, id=specialist_tag_id)
        category.specialist_tags.add(specialist_tag)
        return {"message": f"SpecialistTag '{specialist_tag.name}' added to category '{category.name}' successfully!"}

    def remove_specialist_tag_from_category(self, category_id: int, specialist_tag_id: int) -> dict:
        category = get_object_or_404(Category, id=category_id)
        specialist_tag = get_object_or_404(SpecialistTag, id=specialist_tag_id)
        category.specialist_tags.remove(specialist_tag)
        return {"message": f"SpecialistTag '{specialist_tag.name}' removed from category '{category.name}' successfully!"}
    
    def get_categories(self) -> list[dict]:
        categories = Category.objects.all()
        return [
            {
                "id": category.id,
                "name": category.name,
                "tags": [{"id": tag.id, "name": tag.name} for tag in category.tags.all()],
                "specialist_tags": [
                    {"id": specialist_tag.id, "name": specialist_tag.name}
                    for specialist_tag in category.specialist_tags.all()
                ],
            }
            for category in categories
        ]
    
    def get_category_by_tag_id(self, tag_id: int) -> list[dict]:
        """Get all categories associated with a given tag ID."""
        tag = get_object_or_404(Tag, id=tag_id)
        categories = Category.objects.filter(tags=tag)
        return [
            {
                "id": category.id,
                "name": category.name,
                "tags": [{"id": t.id, "name": t.name} for t in category.tags.all()],
                "specialist_tags": [
                    {"id": st.id, "name": st.name}
                    for st in category.specialist_tags.all()
                ],
            }
            for category in categories
        ]

    def get_category_by_specialist_tag_id(self, specialist_tag_id: int) -> list[dict]:
        """Get all categories associated with a given specialist tag ID."""
        specialist_tag = get_object_or_404(SpecialistTag, id=specialist_tag_id)
        categories = Category.objects.filter(specialist_tags=specialist_tag)
        return [
            {
                "id": category.id,
                "name": category.name,
                "tags": [{"id": t.id, "name": t.name} for t in category.tags.all()],
                "specialist_tags": [
                    {"id": st.id, "name": st.name}
                    for st in category.specialist_tags.all()
                ],
            }
            for category in categories
        ]

