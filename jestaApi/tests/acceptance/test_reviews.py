import pytest
from django.contrib.auth import get_user_model
from users.models import Profile
from reviews.models import Review
from services.models import Service
from datetime import timedelta
from django.utils import timezone
import json

User = get_user_model()

def get_error_detail(resp):
    try:
        data = resp.json()
    except Exception:
        return str(resp.content)
    for k in ("detail", "msg", "message"):
        if k in data:
            return data[k]
    return str(data)

@pytest.mark.django_db
class TestReviewRoutes:
    def setup_method(self):
        self.user1 = User.objects.create_user(username="reviewer", email="reviewer@example.com", password="testpw")
        self.user2 = User.objects.create_user(username="reviewed", email="reviewed@example.com", password="testpw")
        Profile.objects.create(user=self.user1, name="Reviewer Name")
        Profile.objects.create(user=self.user2, name="Reviewed Name")
        self.service = Service.objects.create(
            title="Test Service",
            user=self.user2,
            location="Test Location",
            date_time_range=[
                timezone.now().isoformat(),
                (timezone.now() + timedelta(hours=2)).isoformat()
            ],
            estimated_duration=timedelta(hours=2),
        )

    def test_add_review_success(self, client):
        """
        Authenticated user can successfully submit a review.
        """
        
        client.force_login(self.user1)
        payload = {
            "reviewed_user": self.user2.id,
            "service": self.service.id,
            "ranking": 5,
            "info": "Excellent service!"
        }
        res = client.post("/api/reviews/add_review", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 201
        data = res.json()
        assert data["reviewer"] == self.user1.id
        assert data["reviewed_user"] == self.user2.id
        assert data["ranking"] == 5

    def test_add_review_unauthenticated(self, client):
        """
        Unauthenticated users cannot submit reviews.
        """
        
        payload = {
            "reviewed_user": self.user2.id,
            "service": self.service.id,
            "ranking": 5,
            "info": "Good"
        }
        res = client.post("/api/reviews/add_review", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 500

    def test_add_review_self_review_error(self, client):
        """
        Users cannot review themselves.
        """
        
        client.force_login(self.user1)
        payload = {
            "reviewed_user": self.user1.id,
            "service": self.service.id,
            "ranking": 4,
            "info": "Self review attempt"
        }
        res = client.post("/api/reviews/add_review", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400
        assert "cannot review yourself" in get_error_detail(res).lower()

    def test_add_review_too_long_info_error(self, client):
        """
        Review content should be limited in length.
        """
        
        client.force_login(self.user1)
        payload = {
            "reviewed_user": self.user2.id,
            "service": self.service.id,
            "ranking": 4,
            "info": "a" * 201
        }
        res = client.post("/api/reviews/add_review", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400
        assert "too long" in get_error_detail(res).lower()

    def test_get_reviews_for_user(self, client):
        """
        Anyone can fetch reviews for a specific user.
        """
        
        Review.objects.create(reviewer=self.user1, reviewed_user=self.user2, service=self.service, ranking=4)
        res = client.get(f"/api/reviews/get_reviews/{self.user2.id}/")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["reviewed_user"] == self.user2.id

    def test_delete_review_success(self, client):
        """
        Reviewer can delete their review.
        """
        
        review = Review.objects.create(reviewer=self.user1, reviewed_user=self.user2, service=self.service, ranking=3)
        client.force_login(self.user1)
        res = client.delete(f"/api/reviews/delete_review/{review.id}/")
        assert res.status_code == 200
        assert not Review.objects.filter(id=review.id).exists()

    def test_delete_review_forbidden(self, client):
        """
        Only the reviewer can delete the review.
        """
        
        review = Review.objects.create(reviewer=self.user1, reviewed_user=self.user2, service=self.service, ranking=3)
        client.force_login(self.user2)
        res = client.delete(f"/api/reviews/delete_review/{review.id}/")
        assert res.status_code == 403
        assert "cannot delete" in get_error_detail(res).lower()

    def test_get_average_rating(self, client):
        """
        Computes average rating for a user.
        """
        
        Review.objects.create(reviewer=self.user1, reviewed_user=self.user2, service=self.service, ranking=5)
        user3 = User.objects.create_user(username="u3", email="u3@example.com", password="pw")
        Review.objects.create(reviewer=user3, reviewed_user=self.user2, service=self.service, ranking=3)
        res = client.get(f"/api/reviews/get_average_rating/{self.user2.id}/")
        assert res.status_code == 200
        assert res.json()["average_rating"] == 4.0

    def test_check_review_exists_true(self, client):
        """
        Should return True if user has reviewed.
        """
        
        Review.objects.create(reviewer=self.user1, reviewed_user=self.user2, service=self.service, ranking=4)
        client.force_login(self.user1)
        res = client.get(f"/api/reviews/check_review_exists?reviewed_user_id={self.user2.id}&service_id={self.service.id}")
        assert res.status_code == 200
        assert res.json()["already_reviewed"] is True

    def test_check_review_exists_false(self, client):
        """
        Should return False if review not submitted yet.
        """
        
        client.force_login(self.user1)
        res = client.get(f"/api/reviews/check_review_exists?reviewed_user_id={self.user2.id}&service_id={self.service.id}")
        assert res.status_code == 200
        assert res.json()["already_reviewed"] is False

    def test_get_written_reviews(self, client):
        """
        Get all reviews written by a specific user.
        """
        
        Review.objects.create(reviewer=self.user1, reviewed_user=self.user2, service=self.service, ranking=4)
        res = client.get(f"/api/reviews/get_written_reviews/{self.user1.id}/")
        assert res.status_code == 200
        data = res.json()
        assert data[0]["reviewer"] == self.user1.id

    def test_get_review_for_user_service_success(self, client):
        """
        Review should be found when queried by user and service.
        """
        
        Review.objects.create(reviewer=self.user1, reviewed_user=self.user2, service=self.service, ranking=4)
        client.force_login(self.user1)
        res = client.get(f"/api/reviews/get_review_for_user_service?reviewed_user_id={self.user2.id}&service_id={self.service.id}")
        assert res.status_code == 200
        assert res.json()["reviewer"] == self.user1.id

    def test_get_review_for_user_service_not_found(self, client):
        """
        If no review exists, return 404.
        """
        
        client.force_login(self.user1)
        res = client.get(f"/api/reviews/get_review_for_user_service?reviewed_user_id={self.user2.id}&service_id={self.service.id}")
        assert res.status_code == 404
        assert "review not found" in get_error_detail(res).lower()

    def test_get_review_for_user_service_unauthorized(self, client):
        """
        Anonymous user can't fetch user-service review.
        """
        
        res = client.get(f"/api/reviews/get_review_for_user_service?reviewed_user_id={self.user2.id}&service_id={self.service.id}")
        assert res.status_code == 500
