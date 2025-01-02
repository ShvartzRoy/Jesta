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
    
    #format ISO 8601 examples for date_time_range:
    #"2025-01-02T10:00:00", "2025-01-02T14:00:00"
    #"2025-01-02","2025-01-03"
    #"PT0H"= Start immediately, "PT4H"=End after 4 hours
    date_time_range = models.JSONField()
    
    #format ISO 8601 examples for estimated_duration:
    #P1Y2M3DT4H5M6S= 1 year, 2 months, 3 days, 4 hours, 5 minutes, and 6 seconds
    #P3DT12H= 3 days and 12 hours
    #PT30M= 30 minutes
    #PT2H45M= 2 hours and 45 minutes
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
    
    service_type = models.CharField(
        max_length=20,
        choices=[("provider", "Provider"), ("publisher", "Publisher")],
        default="publisher"
    )

    def __str__(self):
        return f"{self.title} ({self.publisher})"


class JobService(Service):
    offered_payment = models.DecimalField(max_digits=10, decimal_places=2)


class FreeService(Service):
    pass


class VolunteeringService(Service):
    pass
