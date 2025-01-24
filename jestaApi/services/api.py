from typing import List, Optional
from ninja import Router
from ninja.errors import HttpError
from .serviceController import ServiceController
from .schemas import (
    ServiceCreateSchema,
    ServiceUpdateSchema,
    ServiceSchema,
    SearchCriteriaSchema,
)

from .models import JobService, Service
from django.shortcuts import get_object_or_404
from json import loads 


router = Router(tags=["Services"])
sc = ServiceController()

#create (publish) a service
@router.post("/create_service", response=ServiceSchema)
def create_service(request, payload: ServiceCreateSchema):
    return sc.create_service(request, payload)

@router.delete("/delete_service/{service_id}", response={200: dict})
def delete_service(request, service_id: int):
    return sc.delete_service(request, service_id)



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
def update_date_time_range(request, service_id: int, new_data: list[str]):
    service = sc.get_service(service_id)
    return sc.update_date_time_range(service, new_data)


@router.post("/update_estimated_duration/{service_id}", response={200: bool})
def update_estimated_duration(request, service_id: int, new_data: str):
    service = sc.get_service(service_id)
    return sc.update_estimated_duration(service, new_data)

@router.post("/update_offered_payment/{service_id}")
def update_offered_payment(request, service_id: int, new_data: float):
    service = JobService.objects.filter(id=service_id).first()
    if not service:
        raise HttpError(400, "Service not found or not a JobService!!")
    return sc.update_offered_payment(service, new_data)


@router.post("/apply_to_service/{service_id}", response={200: dict})
def apply_to_service(request, service_id: int):
    return sc.apply_to_service(request, service_id)

@router.post("/remove_from_service/{service_id}", response={200: dict})
def remove_from_service(request, service_id: int):
    return sc.remove_from_service(request, service_id)


@router.post("/search_needed_services", response=List[ServiceSchema])
def search_needed_services(request, payload: SearchCriteriaSchema):
    return sc.search_needed_services(request, payload.dict())

@router.post("/search_completed_services", response=List[ServiceSchema])
def search_completed_services(request, payload: SearchCriteriaSchema):
    return sc.search_completed_services(request, payload.dict())


@router.post("/mark_service_completed/{service_id}", response={200: dict})
def mark_service_completed(request, service_id: int):
    return sc.mark_service_completed(request, service_id)


@router.post("/get_progress_status_of_service/{service_id}", response={200: dict})
def get_progress_status_of_service(request, service_id: int):
    return sc.get_progress_status_of_service(request, service_id)

@router.post("/get_list_of_applicants_with_their_states/{service_id}", response={200: dict})
def get_list_of_applicants_with_their_states(request, service_id: int):
    return sc.get_list_of_applicants_with_their_states(request, service_id)


@router.post("/get_list_of_all_user_jobs_with_status/{user_id}", response={200: list})
def get_list_of_all_user_jobs_with_status(request, user_id: int):
    return sc.get_list_of_all_user_jobs_with_status(request, user_id)

@router.post("/get_list_of_all_user_free_services_with_status/{user_id}", response={200: list})
def get_list_of_all_user_free_services_with_status(request, user_id: int):
    return sc.get_list_of_all_user_free_services_with_status(request, user_id)

@router.post("/get_list_of_all_user_volunteering_services_with_status/{user_id}", response={200: list})
def get_list_of_all_user_volunteering_services_with_status(request, user_id: int):
    return sc.get_list_of_all_user_volunteering_services_with_status(request, user_id)

@router.post("/get_list_of_all_user_services_with_status/{user_id}", response={200: list})
def get_list_of_all_user_services_with_status(request, user_id: int):
    return sc.get_list_of_all_user_services_with_status(request, user_id)


@router.post("/get_applicant_state/{service_id}", response={200: dict})
def get_applicant_state(request, service_id: int):
    return sc.get_applicant_state(request, service_id)


@router.post("/cancel_service/{service_id}", response={200: dict})
def cancel_service(request, service_id: int):
    return sc.cancel_service(request, service_id)

@router.post("/reject_applicant/{service_id}/{user_id}", response={200: dict})
def reject_applicant(request, service_id: int, user_id: int):
    return sc.reject_applicant(request, service_id, user_id)

@router.post("/accept_applicant/{service_id}/{user_id}", response={200: dict})
def accept_applicant(request, service_id: int, user_id: int):
    return sc.accept_applicant(request, service_id, user_id)


@router.post("/update_service_state/{service_id}", response={200: dict})
def update_service_state(request, service_id: int, new_state: str):
    return sc.update_service_state(request, service_id, new_state)


@router.post("/validate_users_worked_together", response={200: dict})
def validate_users_worked_together(request, user_id: int, participant_id: int):
    validated = sc.validate_users_worked_together(user_id, participant_id)
    return {"worked_together": validated}


@router.get("/get_service/{service_id}", response={200: ServiceSchema})
def get_service(request, service_id: int):
    service = sc.get_service(service_id)
    return ServiceSchema.from_model(service)


@router.get("/get_requested_user_services", response={200: list[ServiceSchema]})
def get_requested_user_services(request):
    services = sc.get_requested_user_services(request)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_requested_other_user_services", response={200: list[ServiceSchema]})
def get_requested_other_user_services(request):
    services = sc.get_requested_other_user_services(request)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_offered_user_services", response={200: list[ServiceSchema]})
def get_offered_user_services(request):
    services = sc.get_offered_user_services(request)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_offered_other_user_services", response={200: list[ServiceSchema]})
def get_offered_other_user_services(request):
    services = sc.get_offered_other_user_services(request)
    return [ServiceSchema.from_model(service) for service in services]


@router.get("/save_service/{service_id}", response={200: dict})
def save_service(request, service_id: int):
    return sc.save_service(request, service_id)

@router.get("/unsave_service/{service_id}", response={200: dict})
def unsave_service(request, service_id: int):
    return sc.unsave_service(request, service_id)


@router.get("/get_published_services/{user_id}", response={200: list[ServiceSchema]})
def get_published_services(request, user_id: int):
    services = sc.get_published_service_by_user_id(user_id)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_applicants/{service_id}", response=list)
def get_applicants(request, service_id: int):
    return sc.get_applicants(request, service_id)


@router.get("/get_all_services", response={200: list[ServiceSchema]})
def get_all_services(request):
    services = sc.get_all_services()
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_services_by_tag/{tag_name}", response={200: list[ServiceSchema]})
def get_services_by_tag(request, tag_name: str):
    services = sc.get_services_by_tag(tag_name)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_services_by_title/{name}", response={200: list[ServiceSchema]})
def get_services_by_title(request, name: str):
    services = sc.get_services_by_title(name)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_services_by_location/{location}", response={200: list[ServiceSchema]})
def get_services_by_location(request, location: str):
    services = sc.get_services_by_location(location)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_services_by_duration/{duration}", response={200: list[ServiceSchema]})
def get_services_by_duration(request, duration: str):
    services = sc.get_services_by_duration(duration)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_services_by_state/{state}", response={200: list[ServiceSchema]})
def get_services_by_state(request, state: str):
    services = sc.get_services_by_state(state)
    return [ServiceSchema.from_model(service) for service in services]



@router.get("/get_services_by_provider/{provider_id}", response={200: list[ServiceSchema]})
def get_services_by_provider(request, provider_id: int):
    services = sc.get_services_by_provider(provider_id)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_services_by_applicant/{applicant_id}", response={200: list[ServiceSchema]})
def get_services_by_applicant(request, applicant_id: int):
    services = sc.get_services_by_applicant(applicant_id)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_services_by_date_time_range/{date_time_range}")
def get_services_by_date_time_range(request, date_time_range: str):
    try:
        date_range = eval(date_time_range)  
        if len(date_range) != 2:
            raise ValueError("Invalid date_time_range format! Provide a start and end date.")

        start_date = date_range[0]
        end_date = date_range[1]

        services = Service.objects.filter(
            date_time_range__contains=[start_date, end_date]
        )
        return [ServiceSchema.from_model(service) for service in services]
    except Exception as e:
        return {"error": str(e)}
    
    
@router.get("/get_all_job_services", response={200: list[ServiceSchema]})
def get_all_job_services(request):
    services = JobService.objects.all()
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_all_free_services", response={200: list[ServiceSchema]})
def get_all_free_services(request):
    services = Service.objects.filter(offered_payment=0)
    return [ServiceSchema.from_model(service) for service in services]

@router.get("/get_all_volunteering_services", response={200: list[ServiceSchema]})
def get_all_volunteering_services(request):
    services = Service.objects.filter(is_volunteering=True)
    return [ServiceSchema.from_model(service) for service in services]





@router.get("/get_completed_services_of_user", response={200: list[ServiceSchema]})
def get_completed_services(request, user_id: Optional[int] = None):
    services = sc.get_completed_services_of_user(user_id)
    return [ServiceSchema.from_model(service) for service in services]
