from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import timedelta
from pydantic import validator
import re

from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import timedelta
from pydantic import validator
import re


class NotificationPayload(BaseModel):
    user_id: int
    title: str
    body: str
    data: dict = {}
    
    
class ApplicantSchema(BaseModel):
    user_id: int
    applicant_state: str

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
    applicants: List[ApplicantSchema] 
    service_from: str
    offered_payment: float 
    is_job: bool
    is_volunteering: bool

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
            applicants=[
                ApplicantSchema(**applicant) for applicant in instance.applicants
            ],
            state=instance.state,
            offered_payment=float(instance.offered_payment),
            service_from=instance.service_from,
            is_job=instance.is_job,
            is_volunteering=instance.is_volunteering
        )
        
    class Config:
        orm_mode = True
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
    is_volunteering: Optional[bool] = Field(False, description="True if the service is a volunteering service")


class ServiceUpdateSchema(BaseModel):
    service_id: int
    field: str = Field(description="Field to update: title, description, tags, location, etc.")
    new_data: str = Field(description="New value for the specified field")
    
def parse_iso8601_duration(duration_str: str) -> timedelta:
    pattern = (
        r"^P(?:(?P<days>\d+)D)?"
        r"(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?$"
    )
    match = re.match(pattern, duration_str)

    if not match:
        raise ValueError("Invalid duration format! Use ISO 8601 format (e.g., P3D, PT5H)!")

    days = int(match.group("days") or 0)
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes") or 0)
    seconds = int(match.group("seconds") or 0)

    return timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)



class SearchCriteriaSchema(BaseModel):
    location: Optional[str] = Field(None, description="Filter by location")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    duration: Optional[str] = Field(None, description="Filter by maximum duration")
    price_range: Optional[List[float]] = Field(None, description="Filter by price range [min_price, max_price]")

    @validator("duration")
    def validate_duration(cls, value):
        if value:
            try:
                #validate ISO 8601 duration format
                parse_iso8601_duration(value)
                return value
            except ValueError as e:
                raise ValueError(str(e))
        return value

    @validator("price_range")
    def validate_price_range(cls, value):
        if value and len(value) == 2 and value[0] <= value[1]:
            return value
        raise ValueError("Price range must be a list of two values [min_price, max_price] where min_price <= max_price!")
    
    
class UpdateServiceStateSchema(BaseModel):
    service_id: int
    new_state: str = Field(description="New state for the service")


class RejectApplicantSchema(BaseModel):
    service_id: int
    user_id: int


class ApplicantSchema(BaseModel):
    user_id: int
    applicant_state: str

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
    applicants: List[ApplicantSchema] 
    service_from: str
    offered_payment: float 
    is_job: bool
    is_volunteering: bool

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
            applicants=[
                ApplicantSchema(**applicant) for applicant in instance.applicants
            ],
            state=instance.state,
            offered_payment=float(instance.offered_payment),
            service_from=instance.service_from,
            is_job=instance.is_job,
            is_volunteering=instance.is_volunteering
        )
        
    class Config:
        orm_mode = True
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
    is_volunteering: Optional[bool] = Field(False, description="True if the service is a volunteering service")


class ServiceUpdateSchema(BaseModel):
    service_id: int
    field: str = Field(description="Field to update: title, description, tags, location, etc.")
    new_data: str = Field(description="New value for the specified field")
    
def parse_iso8601_duration(duration_str: str) -> timedelta:
    pattern = (
        r"^P(?:(?P<days>\d+)D)?"
        r"(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?$"
    )
    match = re.match(pattern, duration_str)

    if not match:
        raise ValueError("Invalid duration format! Use ISO 8601 format (e.g., P3D, PT5H)!")

    days = int(match.group("days") or 0)
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes") or 0)
    seconds = int(match.group("seconds") or 0)

    return timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)



class SearchCriteriaSchema(BaseModel):
    location: Optional[str] = Field(None, description="Filter by location")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    duration: Optional[str] = Field(None, description="Filter by maximum duration")
    price_range: Optional[List[float]] = Field(None, description="Filter by price range [min_price, max_price]")

    @validator("duration")
    def validate_duration(cls, value):
        if value:
            try:
                #validate ISO 8601 duration format
                parse_iso8601_duration(value)
                return value
            except ValueError as e:
                raise ValueError(str(e))
        return value

    @validator("price_range")
    def validate_price_range(cls, value):
        if value and len(value) == 2 and value[0] <= value[1]:
            return value
        raise ValueError("Price range must be a list of two values [min_price, max_price] where min_price <= max_price!")
    
    
class UpdateServiceStateSchema(BaseModel):
    service_id: int
    new_state: str = Field(description="New state for the service")


class RejectApplicantSchema(BaseModel):
    service_id: int
    user_id: int
