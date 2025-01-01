from django.test import TestCase
from django.contrib.auth import get_user_model
from services.models import JobService, FreeService, VolunteeringService, Tag

"""
User = get_user_model()

class ServiceControllerTests(TestCase):
    def setUp(self):
        self.publisher = User.objects.create_user(username="publisher", password="testpass")
        self.applicant = User.objects.create_user(username="applicant", password="testpass")

        self.client.force_login(self.publisher)

    def test_create_job_service(self):
        tags = ["babysitting", "tutoring"]
        payload = {
            "type": "job",
            "title": "Babysitting Service",
            "description": "Need someone to babysit my kids.",
            "tags": tags,
            "location": "City Center",
            "date_time_range": ["2023-12-01T08:00", "2023-12-01T16:00"],
            "estimated_duration": "8:00:00",
            "offered_payment": 50.0,
        }

        response = self.client.post("/api/services/create_service/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 201)

        job_service = JobService.objects.first()
        self.assertIsNotNone(job_service)
        self.assertEqual(job_service.title, "Babysitting Service")
        self.assertEqual(job_service.publisher, self.publisher)
        self.assertEqual(list(job_service.tags.values_list("name", flat=True)), tags)

    def test_apply_to_service(self):
        job_service = JobService.objects.create(
            publisher=self.publisher,
            title="Babysitting",
            description="Looking for babysitting service",
            location="City Center",
            date_time_range=["2023-12-01T08:00", "2023-12-01T16:00"],
            estimated_duration="8:00:00",
            offered_payment=50.0,
        )

        self.client.force_login(self.applicant)

        response = self.client.post(f"/api/services/apply_to_service/{job_service.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(self.applicant, job_service.applicants.all())

    def test_remove_from_service(self):
        job_service = JobService.objects.create(
            publisher=self.publisher,
            title="Babysitting",
            description="Looking for babysitting service",
            location="City Center",
            date_time_range=["2023-12-01T08:00", "2023-12-01T16:00"],
            estimated_duration="8:00:00",
            offered_payment=50.0,
        )
        job_service.applicants.add(self.applicant)

        self.client.force_login(self.applicant)

        response = self.client.post(f"/api/services/remove_from_service/{job_service.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(self.applicant, job_service.applicants.all())

    def test_get_applicants(self):
        job_service = JobService.objects.create(
            publisher=self.publisher,
            title="Babysitting",
            description="Looking for babysitting service",
            location="City Center",
            date_time_range=["2023-12-01T08:00", "2023-12-01T16:00"],
            estimated_duration="8:00:00",
            offered_payment=50.0,
        )
        job_service.applicants.add(self.applicant)

        response = self.client.get(f"/api/services/get_applicants/{job_service.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_delete_service(self):
        job_service = JobService.objects.create(
            publisher=self.publisher,
            title="Babysitting",
            description="Looking for babysitting service",
            location="City Center",
            date_time_range=["2023-12-01T08:00", "2023-12-01T16:00"],
            estimated_duration="8:00:00",
            offered_payment=50.0,
        )

        response = self.client.delete(f"/api/services/delete_service/{job_service.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(JobService.objects.count(), 0)
"""