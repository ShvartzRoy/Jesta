from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import timedelta


class ServiceSchema(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    tags: List[str]
    location: str
    date_time_range: List[str]
    estimated_duration: timedelta
    state: str
    applicants: List[int]
    service_from: str
    offered_payment: float 
    is_job: bool

    @classmethod
    def from_model(cls, instance):
        return cls(
            id=instance.id,
            user_id=instance.user.id,
            title=instance.title,
            description=instance.description,
            tags=[tag.name for tag in instance.tags.all()],
            location=instance.location,
            date_time_range=instance.date_time_range,
            estimated_duration=instance.estimated_duration,
            applicants=[user.id for user in instance.applicants.all()],
            state=instance.state,
            offered_payment=float(instance.offered_payment),
            service_from=instance.service_from,
            is_job=instance.is_job,
        )
        
    class Config:
        from_attributes = True


class JobServiceSchema(ServiceSchema):
    pass

class FreeServiceSchema(ServiceSchema):
    pass


class VolunteeringServiceSchema(ServiceSchema):
    pass


class ServiceCreateSchema(BaseModel):
    #type: str = Field(description="Type of the service: job, free, or volunteering")
    title: str
    description: Optional[str]
    tags: List[str]
    location: str
    date_time_range: List[str]
    estimated_duration: timedelta  #format is ISO8601, example: PT50M = 50 minutes
    offered_payment: Optional[float] = Field(None, description="The offered payment for job services")
    service_from: Optional[str] = Field("publisher", description="Service type: publisher or provider")


class ServiceUpdateSchema(BaseModel):
    service_id: int
    field: str = Field(description="Field to update: title, description, tags, location, etc.")
    new_data: str = Field(description="New value for the specified field")


class SearchCriteriaSchema(BaseModel):
    location: Optional[str] = Field(None, description="Filter by location")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    duration: Optional[str] = Field(None, description="Filter by maximum duration")


class SearchProviderSchema(SearchCriteriaSchema):
    price_range: Optional[List[float]] = Field(None, description="Filter by price range for job services")


class UpdateServiceStateSchema(BaseModel):
    service_id: int
    new_state: str = Field(description="New state for the service")


class RejectApplicantSchema(BaseModel):
    service_id: int
    user_id: int
