from django.db import models
from django.conf import settings
from tags.models import Tag  


class Service(models.Model):
    publisher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="published_services",
        on_delete=models.CASCADE
    )
    
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    tags = models.ManyToManyField(Tag, related_name="services")  
    location = models.CharField(max_length=255)
    date_time_range = models.JSONField()
    estimated_duration = models.DurationField()

    
    applicants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="applied_services",
        blank=True
    )
    
    state = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("accepted", "Accepted"), ("inProgress", "In Progress"), ("completed", "Completed")],
        default="pending"
    )

    def __str__(self):
        return f"{self.title} ({self.publisher})"


class JobService(Service):
    offered_payment = models.DecimalField(max_digits=10, decimal_places=2)


class FreeService(Service):
    pass


class VolunteeringService(Service):
    pass
