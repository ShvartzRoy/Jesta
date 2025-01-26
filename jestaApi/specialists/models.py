from django.db import models
from django.conf import settings
from tags.models import SpecialistTag  # Import the SpecialistTag model

class Specialist(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="specialist_profile"
    )
    
    # Many-to-many relationship with SpecialistTag
    service_tags = models.ManyToManyField(
        SpecialistTag,
        related_name="specialists"
    )
    
    description = models.TextField(blank=True, null=True)
    portfolio_link = models.URLField(blank=True, null=True)
    location_range = models.CharField(max_length=255, blank=True, null=True)
    price_range = models.JSONField(blank=True, null=True)   # for example {"min": 60, "max": 100}
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Display the user's email and the names of their specialist tags
        tag_names = ", ".join([tag.name for tag in self.service_tags.all()])
        return f"{self.user.email} - {tag_names}"