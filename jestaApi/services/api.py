from ninja import Router
from .serviceController import ServiceController
from .schemas import ServiceCreateSchema, ServiceSchema

router = Router(tags=["Services"])
sc = ServiceController()


@router.post("/create_service", response={201: dict})
def create_service(request, payload: ServiceCreateSchema):
    service = sc.create_service(request, payload)
    return {"id": service.id, "type": payload.type, "title": service.title}


@router.post("/apply_to_service/{service_id}/", response={200: dict})
def apply_to_service(request, service_id: int):
    return sc.apply_to_service(request, service_id)


@router.post("/remove_from_service/{service_id}/", response={200: dict})
def remove_from_service(request, service_id: int):
    return sc.remove_from_service(request, service_id)


@router.get("/get_applicants/{service_id}/", response={200: list})
def get_applicants(request, service_id: int):
    return sc.get_applicants(request, service_id)
