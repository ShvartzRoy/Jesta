from ninja import Router

router = Router()

@router.get("/")
def get_user(request):
    return {"test": "success"}