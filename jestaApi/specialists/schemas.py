from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class SpecialistSchema(BaseModel):
    id: int
    user: int = Field(..., description="The user ID of the specialist")
    service_tags: List[str] = Field(..., description="The names of the service tags")
    description: Optional[str]
    portfolio_link: Optional[str]
    location_range: Optional[str]
    price_range: Optional[Any]
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
        
    @classmethod
    def from_model(cls, specialist):
        return cls(
            id=specialist.id,
            user=specialist.user.id,  
            service_tags=[tag.name for tag in specialist.service_tags.all()],  # Get all tag names
            description=specialist.description,
            portfolio_link=specialist.portfolio_link,
            location_range=specialist.location_range,
            price_range=specialist.price_range,
            created_at=specialist.created_at
        )


class SpecialistCreateSchema(BaseModel):
    service_tags: List[str]  # List of tag names
    description: Optional[str]
    portfolio_link: Optional[str]
    location_range: Optional[str]
    price_range: Optional[dict]

class SpecialistUpdateSchema(BaseModel):
    description: Optional[str]
    portfolio_link: Optional[str]
    location_range: Optional[str]
    price_range: Optional[Dict[str, int]]  # Price range as a dictionary (min, max)