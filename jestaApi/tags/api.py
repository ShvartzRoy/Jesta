from ninja import Router
from .tagController import TagController
from .schemas import TagSchema, TagCreateSchema, TagListSchema

router = Router(tags=["Tags"])
tag_controller = TagController()

@router.post("/add_tag", response={201: TagSchema, 400: dict})
def add_tag(request, payload: TagCreateSchema):
    tag = tag_controller.add_tag(payload.name)
    return 201, tag


@router.delete("/remove_tag/{tag_id}/", response={200: dict, 404: dict})
def remove_tag(request, tag_id: int):
    return tag_controller.remove_tag(tag_id)

@router.put("/edit_tag/{tag_id}/", response={200: TagSchema, 404: dict})
def edit_tag(request, tag_id: int, payload: TagCreateSchema):
    return tag_controller.edit_tag(tag_id, payload.name)

@router.get("/get_all_tags", response={200: TagListSchema})
def get_all_tags(request):
    tags = tag_controller.get_all_tags()
    return {"tags": tags}


@router.get("/get_tag/{tag_id}/", response={200: TagSchema, 404: dict})
def get_tag(request, tag_id: int):
    return tag_controller.get_tag(tag_id)

@router.get("/get_tag_by_name/{name}/", response={200: TagSchema, 404: dict})
def get_tag_by_name(request, name: str):
    return tag_controller.get_tag_by_name(name)





