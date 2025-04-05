from pydantic import BaseModel
from ninja import ModelSchema
from .models import Badge  

class BadgeCreateSchema(BaseModel):
    name: str
    description: str = ""
    image: str = ""


class BadgeSchema(ModelSchema):
    class Meta:
        model = Badge
        fields = ["id", "name", "description", "image"]

