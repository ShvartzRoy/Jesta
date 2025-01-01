from ninja import Router
from .serviceController import ServiceController
from .schemas import (
    ServiceCreateSchema,
    ServiceUpdateSchema,
    ServiceSchema,
    SearchCriteriaSchema,
    SearchProviderSchema
)

from .models import Service
from serviceController import ServiceController
from django.shortcuts import get_object_or_404


router = Router(tags=["Services"])
sc = ServiceController()

#create (publish) a service
@router.post("/create_service", response=ServiceSchema)
def create_service(request, payload: ServiceCreateSchema):
    return sc.create_service(request, payload)

@router.delete("/delete_service/{service_id}", response={200: dict})
def delete_service(request, service_id: int):
    return sc.delete_service(request, service_id)

@router.post("/offer_as_provider", response=ServiceSchema)
def offer_as_provider(request, payload: ServiceCreateSchema):
    return sc.offer_as_provider(request, payload)

@router.get("/get_service/{service_id}", response=ServiceSchema)
def get_service(request, service_id: int):
    return sc.get_service(service_id)

@router.get("/get_applied_services/{user_id}", response=list)
def get_applied_services(request, user_id: int):
    return sc.get_applied_service_by_user_id(user_id)

@router.get("/get_saved_services/{user_id}", response=list)
def get_saved_services(request, user_id: int):
    return sc.get_saved_service_by_user_id(user_id)

@router.get("/get_published_services/{user_id}", response=list)
def get_published_services(request, user_id: int):
    return sc.get_published_service_by_user_id(user_id)

@router.post("/update_name/{service_id}", response={200: bool})
def update_name(request, service_id: int, new_data: str):
    service = sc.get_service(service_id)
    return sc.update_name(service, new_data)

@router.post("/update_description/{service_id}", response={200: bool})
def update_description(request, service_id: int, new_data: str):
    service = sc.get_service(service_id)
    return sc.update_description(service, new_data)

@router.post("/update_tags/{service_id}", response={200: bool})
def update_tags(request, service_id: int, new_data: list[str]):
    service = sc.get_service(service_id)
    return sc.update_tags(service, new_data)

@router.post("/update_location/{service_id}", response={200: bool})
def update_location(request, service_id: int, new_data: str):
    service = sc.get_service(service_id)
    return sc.update_location(service, new_data)

@router.post("/update_date_time_range/{service_id}", response={200: bool})
def update_date_time_range(request, service_id: int, new_data: dict):
    service = sc.get_service(service_id)
    return sc.update_date_time_range(service, new_data)

@router.post("/update_estimated_duration/{service_id}", response={200: bool})
def update_estimated_duration(request, service_id: int, new_data: str):
    service = sc.get_service(service_id)
    return sc.update_estimated_duration(service, new_data)

@router.post("/update_offered_payment/{service_id}", response={200: bool})
def update_offered_payment(request, service_id: int, new_data: float):
    service = sc.get_service(service_id)
    return sc.update_offered_payment(service, new_data)

@router.post("/apply_to_service/{service_id}", response={200: dict})
def apply_to_service(request, service_id: int):
    return sc.apply_to_service(request, service_id)

@router.post("/remove_from_service/{service_id}", response={200: dict})
def remove_from_service(request, service_id: int):
    return sc.remove_from_service(request, service_id)

@router.get("/get_applicants/{service_id}", response=list)
def get_applicants(request, service_id: int):
    return sc.get_applicants(request, service_id)

@router.post("/search_needed_services", response=list)
def search_needed_services(request, payload: SearchCriteriaSchema):
    return sc.search_needed_services(request, payload.dict())

@router.post("/search_providers", response=list)
def search_providers(request, payload: SearchProviderSchema):
    return sc.search_providers(request, payload.dict())
