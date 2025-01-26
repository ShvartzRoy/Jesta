from pydantic import BaseModel
from typing import List
from ninja import Schema

class TagSchema(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class TagCreateSchema(BaseModel):
    name: str
    category_id: int

class TagListSchema(BaseModel):
    tags: List[TagSchema]

class SpecialistTagCreateSchema(Schema):
    name: str
    category_id: int

class SpecialistTagSchema(Schema):
    id: int
    name: str

class CategoryCreateSchema(Schema):
    name: str

class CategorySchema(Schema):
    id: int
    name: str
    tags: List[TagSchema]
    specialist_tags: List[SpecialistTagSchema]


class CategorySchema(Schema):
    id: int
    name: str
    tags: List[TagSchema]
    specialist_tags: List[SpecialistTagSchema]

class CategoryListSchema(Schema):
    categories: List[CategorySchema]