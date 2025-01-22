from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class SpecialistSchema(BaseModel):
    id: int
    user: int = Field(..., description="the user id of the specialist")
    service_tag: str = Field(..., description="The name of the service tag")
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
            service_tag=specialist.service_tag.name, 
            description=specialist.description,
            portfolio_link=specialist.portfolio_link,
            location_range=specialist.location_range,
            price_range=specialist.price_range,
            created_at=specialist.created_at
        )


class SpecialistCreateSchema(BaseModel):
    service_tag: str
    description: Optional[str]
    portfolio_link: Optional[str]
    location_range: Optional[str]
    price_range: Optional[dict]  
