from typing import List
from ninja import Router
from .models import Notification
from .schemas import NotificationSchema
from django.shortcuts import get_object_or_404

router = Router(tags=["Notifications"])


@router.get("/get_user_notifications", response=List[NotificationSchema])
def get_user_notifications(request):
    user = request.user
    return Notification.objects.filter(user=user).order_by("-created_at")[:20]

@router.get("/get_unread", response=List[NotificationSchema])
def get_unread_notifications(request):
    return Notification.objects.filter(user=request.user, read=False).order_by("-created_at")[:20]

@router.post("/mark_as_read/{notification_id}")
def mark_as_read(request, notification_id: int):
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.read = True
    notification.save()
    return {"message": "Notification marked as read"}



@router.get("/get_latest")
def get_latest_notifications(request):
    user = request.user
    notifications = Notification.objects.filter(user=user).order_by("-created_at")[:20]
    return {"notifications": [n.to_dict() for n in notifications]} 


@router.post("/mark_all_as_read")
def mark_all_as_read(request):
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return {"message": "All notifications marked as read"}
 

