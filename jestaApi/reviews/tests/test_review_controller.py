import pytest
from django.test import TestCase, RequestFactory
from users.models import CustomUser
from services.models import Service
from reviews.models import Review
from reviews.reviewController import ReviewController
from reviews.schemas import ReviewCreateSchema
from datetime import timedelta
from ninja.errors import HttpError

class TestReviewController(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.controller = ReviewController()
        self.reviewer = CustomUser.objects.create_user(username="reviewer", email="reviewer@test.com", password="test1234")
        self.reviewed = CustomUser.objects.create_user(username="reviewed", email="reviewed@test.com", password="test1234")
        self.service = Service.objects.create(
            user=self.reviewed,
            title="Test Service",
            description="Service description",
            location="Test Location",
            date_time_range=["2025-01-01T10:00:00", "2025-01-01T12:00:00"],
            estimated_duration=timedelta(hours=2),
        )
        self.request = self.factory.post("/")
        self.request.user = self.reviewer

    # def test_add_review_success(self):
    #     payload = ReviewCreateSchema(
    #         reviewed_user=self.reviewed.id,
    #         service=self.service.id,
    #         ranking=5,
    #         info="Excellent work"
    #     )
    #     result = self.controller.add_review(self.request, payload)
    #     assert result.reviewed_user == self.reviewed
    #     assert result.ranking == 5

    def test_add_review_self_review(self):
        self.request.user = self.reviewed
        payload = ReviewCreateSchema(
            reviewed_user=self.reviewed.id,
            service=self.service.id,
            ranking=5,
            info="Self review"
        )
        with pytest.raises(HttpError):
            self.controller.add_review(self.request, payload)

    # def test_add_review_duplicate(self):
    #     payload = ReviewCreateSchema(
    #         reviewed_user=self.reviewed.id,
    #         service=self.service.id,
    #         ranking=4,
    #         info="Nice"
    #     )
    #     self.controller.add_review(self.request, payload)
    #     payload.ranking = 3
    #     payload.info = "Updated"
    #     updated_review = self.controller.add_review(self.request, payload)
    #     assert updated_review.ranking == 3
    #     assert updated_review.info == "Updated"

    def test_get_reviews(self):
        Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=4,
            info="Good job"
        )
        reviews = self.controller.get_reviews(self.request, self.reviewed.id)
        assert len(reviews) == 1
        assert reviews[0]["ranking"] == 4

    def test_delete_review(self):
        review = Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=4,
            info="Decent"
        )
        response = self.controller.delete_review(self.request, review.id)
        assert response["message"] == "Review deleted"

    def test_average_rating(self):
        Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=4,
            info="Nice"
        )
        rating = self.controller.calculate_average_rating(self.reviewed.id)
        assert rating == 4.0

    def test_check_if_review_exists(self):
        Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=4,
            info="Nice"
        )
        result = self.controller.check_if_review_exists(self.request, self.reviewed.id, self.service.id)
        assert result["already_reviewed"] is True

    def test_get_reviews_written_by_user(self):
        Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=3,
            info="Ok"
        )
        reviews = self.controller.get_reviews_written_by_user(self.request, self.reviewer.id)
        assert len(reviews) == 1

    def test_get_review_for_user_and_service_success(self):
        Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=5,
            info="Top"
        )
        review = self.controller.get_review_for_user_and_service(self.request, self.reviewed.id, self.service.id)
        assert review.ranking == 5

    def test_get_review_for_user_and_service_not_found(self):
        with pytest.raises(HttpError):
            self.controller.get_review_for_user_and_service(self.request, self.reviewed.id, self.service.id)
