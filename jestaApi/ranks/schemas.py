from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ninja import Schema, ModelSchema
from .models import Review


class RankSchema(BaseModel):
    id: int # needed? 
    user_id: int
    xp: int
    badges: list[str]
    level: int

class RankCreateSchema(BaseModel):
    user_id: int
    xp: int
    badges: list[str]
    level: int
    





