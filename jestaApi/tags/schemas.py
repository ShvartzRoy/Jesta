from pydantic import BaseModel
from typing import List

class TagSchema(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class TagCreateSchema(BaseModel):
    name: str

class TagListSchema(BaseModel):
    tags: List[TagSchema]
