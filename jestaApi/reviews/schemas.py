from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ninja import Schema, ModelSchema
from .models import Review


# class ReviewSchema(BaseModel):
#     id: int
#     reviewer: int
#     reviewed_user: int
#     ranking: int = Field(ge=1, le=5, description="Ranking must be between 1 and 5")
#     info: Optional[str] = None
#     created_at: datetime

#     class Config:
#         orm_mode = True

class ReviewSchema(ModelSchema):
    class Meta:
        model = Review
        fields = ["id", "reviewer", "reviewed_user", "service", "ranking", "info", "created_at"]  

class ReviewCreateSchema(BaseModel):
    reviewed_user: int
    service: int
    ranking: int = Field(ge=1, le=5, description="Ranking must be between 1 and 5")
    info: Optional[str] = None
