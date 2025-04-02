from django.shortcuts import get_object_or_404
from .models import Badge
from ninja.errors import HttpError
from users.models import CustomUser
from reviews.reviewController import ReviewController
from new_ranks.rankController import RankController
from services.models import Service
from users.models import Profile
class BadgeController:
    
    
    
    def add_badge(self, name: str, description: str = "", image: str = "") -> dict:
        badge, created = Badge.objects.get_or_create(name=name, defaults={
            "description": description,
            "image": image
        })
        if not created:
            raise HttpError(400, f"Badge '{name}' already exists!")
        return {"id": badge.id, "name": badge.name, "description": badge.description, "image": badge.image}

    def edit_badge(self, badge_id: int, name: str, description: str = "", image: str = "") -> dict:
        badge = get_object_or_404(Badge, id=badge_id)
        badge.name = name
        badge.description = description
        badge.image = image
        badge.save()
        return {"id": badge.id, "name": badge.name, "description": badge.description, "image": badge.image}
        
    def remove_badge(self, badge_id: int) -> dict:
        badge = get_object_or_404(Badge, id=badge_id)
        badge.delete()
        return {"message": f"Badge '{badge.name}' deleted successfully!"}
    

    def get_all_badges(self) -> list[dict]:
        badges = Badge.objects.all()
        return [{"id": badge.id, "name": badge.name} for badge in badges]

    def get_badge(self, badge_id: int) -> dict:
        badge = get_object_or_404(Badge, id=badge_id)
        return {"id": badge.id, "name": badge.name}
    
    def get_badge_by_name(self, name: str) -> dict:
        badge = get_object_or_404(Badge, name=name)
        return {"id": badge.id, "name": badge.name}
    
        
    def assign_badge_if_missing(self, user: CustomUser, badge_name: str):
        try:
            badge = Badge.objects.get(name=badge_name)
            profile = Profile.objects.get(user=user)
            if not profile.badges.filter(id=badge.id).exists():
                print(f"Assigning badge '{badge_name}' to user {user.id}")
                print(profile.badges.all())
                profile.badges.add(badge)
                profile.save() 
            else:
                print(f"User {user.id} already has badge '{badge_name}'")
                profile.save()
        except Badge.DoesNotExist:
            print(f"Badge '{badge_name}' does not exist.")



    def check_and_assign_all_badges(self, user: CustomUser):
        from services.models import Service
        from reviews.reviewController import ReviewController
        from new_ranks.rankController import RankController

        rc = ReviewController()
        rank_controller = RankController()

        try:
            level = rank_controller.get_level(user.id)
        except Exception as e:
            print(f"Failed to get level for {user.email}: {e}")
            level = 0

        try:
            avg_rating = rc.calculate_average_rating(user.id)
        except Exception as e:
            print(f"Failed to get average rating for {user.email}: {e}")
            avg_rating = 0.0

        completed_volunteering = Service.objects.filter(
            applicants__contains=[{"user_id": user.id, "applicant_state": "accepted"}],
            state="completed",
            is_volunteering=True
        ).count()

        student_domains = ['@post.bgu.ac.il', '@mail.tau.ac.il', '@technion.ac.il']
        email_is_student = any(user.email.endswith(domain) for domain in student_domains)

        print(f"Checking badges for {user.email}")
        print(f"Level: {level}, Avg Rating: {avg_rating}, Volunteer count: {completed_volunteering}")

        if level >= 5:
            self.assign_badge_if_missing(user, "Experienced")

        if avg_rating >= 4.0:
            self.assign_badge_if_missing(user, "Excellent")

        if completed_volunteering >= 5:
            self.assign_badge_if_missing(user, "Community Contributor")

        if email_is_student:
            self.assign_badge_if_missing(user, "Student")



            # Verified badge logic will be added later
