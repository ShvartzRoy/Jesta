from django.db import models
from users.models import CustomUser

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)  

    def __str__(self):
        return f"To {self.user.email} - {self.title}"
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "data": self.data,
            "created_at": self.created_at.isoformat(),
            "read": self.read,
        }
