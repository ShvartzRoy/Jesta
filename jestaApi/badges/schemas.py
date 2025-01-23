from pydantic import BaseModel
from typing import List

class BadgeSchema(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class BadgeCreateSchema(BaseModel):
    name: str

class BadgeListSchema(BaseModel):
    badges: List[BadgeSchema]