from pydantic import BaseModel, Field
from typing import Optional, Dict


class SpecialistSchema(BaseModel):
    user_id: int
    service_tag: str
    description: Optional[str]
    portfolio_link: Optional[str]
    location_range: Optional[str]
    price_range: Optional[Dict[str, float]]
    created_at: Optional[str]

    class Config:
        orm_mode = True


class SpecialistCreateSchema(BaseModel):
    service_tag: str
    description: Optional[str]
    portfolio_link: Optional[str]
    location_range: Optional[str]
    price_range: Optional[Dict[str, float]]

    class Config:
        orm_mode = True
