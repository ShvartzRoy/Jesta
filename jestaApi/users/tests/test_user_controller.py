import pytest
from django.test import RequestFactory, TestCase
from django.contrib.auth import get_user_model
from django.contrib.sessions.middleware import SessionMiddleware
from unittest.mock import Mock
from users.userController import userController
from users.schemas import LogInSchema, RegisterSchema
from ninja.errors import HttpError

User = get_user_model()


class TestUserController(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.controller = userController()
        self.password = "testpass123"
        self.user = User.objects.create_user(
            username="test@example.com",
            email="test@example.com",
            password=self.password
        )

    def simulate_request(self, method="get", data=None, headers=None):
        request = getattr(self.factory, method)("/")
        
        # Add session manually
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(request)
        request.session.save()

        # Assign user
        request.user = self.user

        # Add headers via request.META
        if headers:
            for k, v in headers.items():
                request.META[f"HTTP_{k.upper().replace('-', '_')}"] = v

        return request

    def test_user_returns_authenticated_user(self):
        request = self.simulate_request()
        result = self.controller.user(request)
        assert result == self.user

    def test_login_success(self):
        payload = LogInSchema(email=self.user.email, password=self.password)
        request = self.simulate_request()
        result = self.controller.login(request, payload)
        assert result == self.user

    def test_login_fail(self):
        from ninja.errors import AuthenticationError
        payload = LogInSchema(email=self.user.email, password="wrongpass")
        request = self.simulate_request()
        with pytest.raises(AuthenticationError) as e:
            self.controller.login(request, payload)
        assert str(e.value) == "Invalid credentials"


    def test_logout_removes_push_token(self):
        token_data = [{"token": "test-token", "device": "dev123"}]
        self.user.expo_push_tokens = token_data
        self.user.save()

        request = self.simulate_request(headers={
            "Expo-Push-Token": "test-token",
            "Device-Id": "dev123"
        })

        response = self.controller.logout(request)
        assert response["msg"] == "Logged out"
        assert self.user.expo_push_tokens == []

    def test_register_creates_user(self):
        payload = RegisterSchema(
            email="newuser@example.com",
            password="newpass123",
            referral_code=None
        )
        request = self.simulate_request()
        result = self.controller.register(request, payload)

        assert result.email == "newuser@example.com"
        assert User.objects.filter(email="newuser@example.com").exists()

    def test_get_saved_services_authenticated(self):
        self.user.saved_services = [{"id": 1, "title": "A", "state": "open"}]
        self.user.save()
        request = self.simulate_request()
        result = self.controller.get_saved_services(request)
        assert isinstance(result, list)

    def test_get_saved_services_unauthenticated(self):
        request = self.simulate_request()
        request.user = Mock(is_authenticated=False)
        with pytest.raises(HttpError) as e:
            self.controller.get_saved_services(request)
        assert e.value.status_code == 401
