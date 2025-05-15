import tempfile
from io import BytesIO
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import Profile
from users.profileController import profileController
from users.schemas import GetProfileSchema

User = get_user_model()

class TestProfileController(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username='profileuser',  # required by create_user
            email='profiletest@example.com',
            password='securepass123'
        )
        self.controller = profileController()


    def simulate_request(self):
        request = self.factory.get("/")
        request.user = self.user
        return request

    def test_get_profile_success(self):
        request = self.simulate_request()
        response = self.controller.get_profile(request, user_id=self.user.id)
        self.assertEqual(response["referral_code"], self.user.referral_code)
        self.assertIn("level", response)
        self.assertIn("badges", response)

    def test_get_profile_user_not_found(self):
        request = self.simulate_request()
        with self.assertRaises(Exception):
            self.controller.get_profile(request, user_id=9999)

    def test_edit_profile_basic_info(self):
        request = self.simulate_request()
        payload = {
            "name": "Test User",
            "bio": "Updated bio",
            "age": 25,
            "facebook": "fb.com/test",
            "linkedin": "linkedin.com/in/test",
            "instagram": "instagram.com/test",
            "city": "Testville",
            "phone_number": "1234567890"
        }
        response = self.controller.edit_profile(request, data=payload)
        profile = Profile.objects.get(user=self.user)
        self.assertEqual(profile.name, "Test User")
        self.assertEqual(profile.bio, "Updated bio")
        self.assertEqual(profile.age, 25)
        self.assertEqual(profile.city, "Testville")
        self.assertEqual(response.name, "Test User")

    def test_edit_profile_with_files(self):
        request = self.simulate_request()
        image_content = BytesIO(b"fake-image-data")
        image_file = SimpleUploadedFile("profile.jpg", image_content.getvalue(), content_type="image/jpeg")
        resume_content = BytesIO(b"fake-pdf-data")
        resume_file = SimpleUploadedFile("resume.pdf", resume_content.getvalue(), content_type="application/pdf")

        payload = {
            "name": "File Tester",
            "bio": "Testing files",
            "age": 30,
        }

        response = self.controller.edit_profile(request, data=payload, image=image_file, resume=resume_file)
        profile = Profile.objects.get(user=self.user)
        self.assertEqual(profile.name, "File Tester")
        self.assertTrue(profile.image.name.endswith(".jpg"))
        self.assertTrue(profile.resume.name.endswith(".pdf"))

    def test_edit_profile_invalid_json(self):
        request = self.simulate_request()
        from django.http import QueryDict
        bad_data = QueryDict("payload=notjson")
        with self.assertRaises(Exception):
            self.controller.edit_profile(request, data=bad_data)
