from ninja import Router
from .tagController import TagController
from .schemas import TagSchema, TagCreateSchema, TagListSchema

router = Router(tags=["Tags"])
tag_controller = TagController()

@router.post("/add", response={201: TagSchema, 400: dict})
def add_tag(request, payload: TagCreateSchema):
    return tag_controller.add_tag(payload.name)

@router.delete("/remove/{tag_id}/", response={200: dict, 404: dict})
def remove_tag(request, tag_id: int):
    return tag_controller.remove_tag(tag_id)

@router.get("/get/{tag_id}/", response={200: TagSchema, 404: dict})
def get_tag(request, tag_id: int):
    return tag_controller.get_tag(tag_id)

@router.get("/all", response={200: TagListSchema})
def get_all_tags(request):
    tags = tag_controller.get_all_tags()
    return {"tags": tags}
