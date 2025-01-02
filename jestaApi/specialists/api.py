from ninja import Router
from .schemas import SpecialistSchema, SpecialistCreateSchema
from .specialistsController import SpecialistController

router = Router(tags=["Specialists"])
sc = SpecialistController()


@router.post("/create_specialist", response={201: SpecialistSchema})
def create_specialist(request, payload: SpecialistCreateSchema):
    return sc.create_specialist(request, payload)


@router.get("/get_specialist/{user_id}/", response={200: SpecialistSchema})
def get_specialist(request, user_id: int):
    return sc.get_specialist(user_id)


@router.put("/update_specialist", response={200: SpecialistSchema})
def update_specialist(request, payload: SpecialistCreateSchema):
    return sc.update_specialist(request, payload)


@router.delete("/delete_specialist", response={200: dict})
def delete_specialist(request):
    return sc.delete_specialist(request)


@router.get("/get_all_specialists", response={200: list[SpecialistSchema]})
def get_all_specialists(request):
    return sc.get_all_specialists(request)
