import pytest
from django.contrib.auth import get_user_model
from services.models import Service, JobService, FreeService, VolunteeringService
from tags.models import Tag
from datetime import timedelta


@pytest.mark.django_db
class TestServiceModels:

    def setup_method(self):
        self.User = get_user_model()
        self.user = self.User.objects.create_user(
            username='tester',
            email='tester@example.com',
            password='securepass123'
        )
        self.tag = Tag.objects.create(name="help")

    def test_service_creation(self):
        service = Service.objects.create(
            user=self.user,
            title="Test Service",
            description="A basic test service",
            location="Testville",
            date_time_range=["2025-01-01T10:00:00", "2025-01-01T12:00:00"],
            estimated_duration=timedelta(hours=2),
            offered_payment=0,
        )
        service.tags.add(self.tag)
        assert service.title == "Test Service"
        assert service.user == self.user
        assert service.estimated_duration == timedelta(hours=2)
        assert service.is_job is False
        assert service.tags.count() == 1

    def test_job_service_auto_flag(self):
        job_service = JobService.objects.create(
            user=self.user,
            title="Paid Job",
            description="Job with payment",
            location="City",
            date_time_range=["2025-01-02", "2025-01-03"],
            estimated_duration=timedelta(hours=1),
            offered_payment=100,
        )
        assert job_service.is_job is True
        assert job_service.offered_payment > 0

    def test_free_service_flags(self):
        free_service = FreeService.objects.create(
            user=self.user,
            title="Free Help",
            description="Free service",
            location="Park",
            date_time_range=["2025-01-05", "2025-01-06"],
            estimated_duration=timedelta(minutes=30),
        )
        assert free_service.offered_payment == 0
        assert free_service.is_job is False

    def test_volunteering_service_flags(self):
        volunteer_service = VolunteeringService.objects.create(
            user=self.user,
            title="Volunteer Event",
            description="No pay",
            location="Community Center",
            date_time_range=["2025-01-07", "2025-01-08"],
            estimated_duration=timedelta(hours=3),
        )
        assert volunteer_service.is_volunteering is True
