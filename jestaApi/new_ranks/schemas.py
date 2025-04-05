from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ninja import Schema, ModelSchema
from reviews.models import Review

from new_badges.schemas import BadgeSchema
from new_ranks.models import Rank  

class RankSchema(ModelSchema):
    badges: list[BadgeSchema]  

    class Meta:
        model = Rank
        fields = ["user", "xp", "level", "badges"]
    
    

    
class RankCreateSchema(BaseModel):
    user_id: int
    xp: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    badges: list[int] = []
    