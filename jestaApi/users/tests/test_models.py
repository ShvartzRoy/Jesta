import tempfile
from django.test import TestCase, RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import CustomUser, Profile
from users.profileController import profileController
from django.http import QueryDict
from new_ranks.models import Rank


class TestProfileController(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = CustomUser.objects.create_user(
            username="profileuser",
            email="profiletest@example.com",
            password="securepass123"
        )
        self.controller = profileController()

    def simulate_request(self, method="get", data=None):
        request = getattr(self.factory, method)("/")
        request.user = self.user
        if data:
            request.POST = data
        return request

    def test_edit_profile_basic_info(self):
        data = {
            "name": "Test User",
            "bio": "Just testing.",
            "age": 25,
            "facebook": "https://fb.com/test",
            "linkedin": "https://linkedin.com/in/test",
            "instagram": "https://instagram.com/test",
            "city": "Test City",
            "phone_number": "1234567890"
        }
        request = self.simulate_request("post")
        profile = self.controller.edit_profile(request, data)
        self.assertEqual(profile.name, "Test User")
        self.assertEqual(profile.age, 25)
        self.assertEqual(profile.city, "Test City")

    def test_edit_profile_with_files(self):
        img = SimpleUploadedFile("test.jpg", b"file_content", content_type="image/jpeg")
        pdf = SimpleUploadedFile("resume.pdf", b"file_content", content_type="application/pdf")
        data = {
            "name": "Updated User",
            "bio": "Updated bio",
            "age": 30
        }
        request = self.simulate_request("post")
        profile = self.controller.edit_profile(request, data, image=img, resume=pdf)
        self.assertEqual(profile.name, "Updated User")
        self.assertIsNotNone(profile.image)
        self.assertIsNotNone(profile.resume)

    def test_edit_profile_invalid_json(self):
        qdict = QueryDict(mutable=True)
        qdict.update({"payload": "not-a-json"})
        request = self.simulate_request("post", data=qdict)
        with self.assertRaises(Exception):
            self.controller.edit_profile(request, qdict)

    def test_get_profile_success(self):
        request = self.simulate_request()
        result = self.controller.get_profile(request, user_id=self.user.id)
        self.assertIn("name", result)
        self.assertEqual(result["referral_code"], self.user.referral_code)

    def test_get_profile_user_not_found(self):
        request = self.simulate_request()
        with self.assertRaises(Exception):
            self.controller.get_profile(request, user_id=9999)