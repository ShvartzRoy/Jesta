from django.db import models
from django.conf import settings
from services.models import Service

class Review(models.Model):
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="given_reviews",
        on_delete=models.CASCADE
    )
    reviewed_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="received_reviews",
        on_delete=models.CASCADE
    )
    service = models.ForeignKey(Service, related_name="reviews", on_delete=models.CASCADE, null=True, blank=True) 
    ranking = models.PositiveSmallIntegerField()  # Range 1-5
    info = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ("reviewer", "reviewed_user", "service")

    def __str__(self):
        return f"Review by {self.reviewer} for {self.reviewed_user} - {self.ranking}"
