from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from ninja import Schema, ModelSchema
from .models import Service, JobService, FreeService, VolunteeringService


class ServiceSchema(ModelSchema):
    class Meta:
        model = Service
        fields = [
            "id",
            "publisher",
            "title",
            "description",
            "tags",
            "location",
            "date_time_range",
            "estimated_duration",
            "state",
            "applicants",
        ]


class JobServiceSchema(ModelSchema):
    class Meta:
        model = JobService
        fields = ServiceSchema.Meta.fields + ["offered_payment"]


class FreeServiceSchema(ModelSchema):
    class Meta:
        model = FreeService
        fields = ServiceSchema.Meta.fields


class VolunteeringServiceSchema(ModelSchema):
    class Meta:
        model = VolunteeringService
        fields = ServiceSchema.Meta.fields


class ServiceCreateSchema(BaseModel):
    type: str = Field(description="Type of the service- job, free, volunteering")
    title: str
    description: Optional[str]
    tags: List[str]
    location: str
    date_time_range: List[str]
    estimated_duration: str
    offered_payment: Optional[float] = Field(None, description="The offered payment for job services")
    
    class Config:
        orm_mode = True


class ServiceUpdateSchema(BaseModel):
    service_id: int
    field: str = Field(description="Field to update- title, description, tags, location...")
    new_data: str = Field(description="New value for the specified field")
    
    class Config:
        orm_mode = True


class SearchCriteriaSchema(BaseModel):
    location: Optional[str] = Field(None, description="Filter by location")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    duration: Optional[str] = Field(None, description="Filter by maximum duration")
    
    class Config:
        orm_mode = True


class SearchProviderSchema(SearchCriteriaSchema):
    price_range: Optional[List[float]] = Field(None, description="Filter by price range for job services")
    
    class Config:
        orm_mode = True
