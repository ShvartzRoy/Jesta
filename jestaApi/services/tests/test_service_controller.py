import pytest
from django.test import TestCase, RequestFactory
from users.models import CustomUser
from services.models import JobService, FreeService, VolunteeringService, Service
from services.serviceController import ServiceController
from tags.models import Tag
from services.schemas import ServiceCreateSchema
from datetime import timedelta
from django.utils.timezone import now


class TestServiceController(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = CustomUser.objects.create_user(username='testuser', email='test@example.com', password='password')
        self.controller = ServiceController()

    def simulate_request(self, method='get', data=None, headers=None):
        req = getattr(self.factory, method)("/")
        req.user = self.user
        if headers:
            for k, v in headers.items():
                req.META[k] = v
        return req

    def test_create_volunteering_service(self):
        payload = ServiceCreateSchema(
            title="Volunteer Task",
            description="Help someone move",
            location="City Center",
            date_time_range=[str(now()), str(now() + timedelta(hours=1))],
            estimated_duration="PT1H",
            tags=["help"],
            offered_payment=0,
            is_volunteering=True,
            service_from="publisher"
        )
        request = self.simulate_request()
        result = self.controller.create_service(request, payload)
        assert result["title"] == "Volunteer Task"
        assert VolunteeringService.objects.count() == 1

    def test_delete_service(self):
        service = JobService.objects.create(
            user=self.user,
            title="Test Job",
            description="A job",
            location="Home",
            date_time_range=[str(now()), str(now() + timedelta(hours=2))],
            estimated_duration=timedelta(hours=2),
            offered_payment=100,
            state="pending"
        )
        request = self.simulate_request()
        response = self.controller.delete_service(request, service.id)
        assert response["message"].startswith("Service deleted")

    def test_update_title(self):
        service = JobService.objects.create(
            user=self.user,
            title="Old Title",
            description="desc",
            location="loc",
            date_time_range=[str(now()), str(now() + timedelta(hours=1))],
            estimated_duration=timedelta(hours=1),
            offered_payment=50,
            state="pending"
        )
        self.controller.update_name(service, "New Title")
        service.refresh_from_db()
        assert service.title == "New Title"

    def test_search_services_by_tag(self):
        tag = Tag.objects.create(name="cleaning")
        service = FreeService.objects.create(
            user=self.user,
            title="Clean House",
            description="Vacuuming",
            location="Suburb",
            date_time_range=[str(now()), str(now() + timedelta(hours=1))],
            estimated_duration=timedelta(hours=1),
            state="pending"
        )
        service.tags.add(tag)
        services = self.controller.get_services_by_tag("cleaning")
        assert len(services) == 1
        assert services[0].title == "Clean House"
