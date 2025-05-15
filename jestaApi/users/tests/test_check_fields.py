import pytest
from ninja.errors import HttpError
from users.check_fields import (
    password_check,
    check_email,
    check_name,
    check_age,
    check_image,
    check_resume,
)
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile


class TestCheckFields:
    def test_password_valid(self):
        assert password_check("validpass123")

    @pytest.mark.parametrize("password", ["123", "a"*21])
    def test_password_invalid_length(self, password):
        with pytest.raises(HttpError):
            password_check(password)

    @pytest.mark.parametrize("email", ["test@example.com", "a@b.co"])
    def test_email_valid(self, email):
        assert check_email(email)

    @pytest.mark.parametrize("email", ["invalidemail", "missing@dot", ""])
    def test_email_invalid(self, email):
        with pytest.raises(HttpError):
            check_email(email)

    def test_check_name_valid(self):
        assert check_name("John Doe")

    @pytest.mark.parametrize("name", ["Jo", "A"*51, "Invalid123"])
    def test_check_name_invalid(self, name):
        with pytest.raises(HttpError):
            check_name(name)

    @pytest.mark.parametrize("age", [None, 2, 10, 200])
    def test_check_age_invalid(self, age):
        with pytest.raises(HttpError):
            check_age(age)

    def test_check_age_valid(self):
        assert check_age(25)

    def test_check_image_valid(self):
        file = SimpleUploadedFile("test.jpg", b"12345", content_type="image/jpeg")
        file.size = 1000000
        assert check_image(file)

    @pytest.mark.parametrize("filename", ["image.txt", "image.gif"])
    def test_check_image_invalid_format(self, filename):
        file = SimpleUploadedFile(filename, b"12345", content_type="text/plain")
        file.size = 1000000
        with pytest.raises(HttpError):
            check_image(file)

    def test_check_image_too_large(self):
        file = SimpleUploadedFile("test.jpg", b"1" * 5000000, content_type="image/jpeg")
        file.size = 5000000
        with pytest.raises(HttpError):
            check_image(file)

    def test_check_resume_valid(self):
        file = SimpleUploadedFile("resume.pdf", b"12345", content_type="application/pdf")
        file.size = 1000000
        assert check_resume(file)

    def test_check_resume_invalid_format(self):
        file = SimpleUploadedFile("resume.docx", b"12345", content_type="application/msword")
        file.size = 1000000
        with pytest.raises(HttpError):
            check_resume(file)

    def test_check_resume_too_large(self):
        file = SimpleUploadedFile("resume.pdf", b"1" * 5000000, content_type="application/pdf")
        file.size = 5000000
        with pytest.raises(HttpError):
            check_resume(file)
