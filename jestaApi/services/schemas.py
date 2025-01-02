from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from ninja import Schema, ModelSchema
from .models import Service, JobService, FreeService, VolunteeringService
from datetime import timedelta



class ServiceSchema(BaseModel):
    publisher_id: int  
    tags: List[str]  
    applicants: List[int] 
    service_type: str
    
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
            "service_type",
        ]
        
    @classmethod
    def from_model(cls, instance):
        serialized_data = {
            "publisher_id": instance.publisher.id,
            "id": instance.id,
            "title": instance.title,
            "description": instance.description,
            "tags": [tag.name for tag in instance.tags.all()],
            "location": instance.location,
            "date_time_range": instance.date_time_range,
            "estimated_duration": instance.estimated_duration,
            "state": instance.state,
            "applicants": [user.id for user in instance.applicants.all()],
            "service_type": instance.service_type,
        }
        return cls(**serialized_data)


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
    estimated_duration: timedelta #format is ISO8601, example: PT50M=50 minutes
    offered_payment: Optional[float] = Field(None, description="The offered payment for job services")
    service_type: Optional[str] = Field("publisher", description="Service type: publisher or provider")
    
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
        
        
class UpdateServiceStateSchema(BaseModel):
    service_id: int
    new_state: str = Field(description="New state for the service")

class RejectApplicantSchema(BaseModel):
    service_id: int
    user_id: int
