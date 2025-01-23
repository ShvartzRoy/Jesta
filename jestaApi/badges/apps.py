from django.apps import AppConfig
from django.db.models.signals import post_migrate

class BadgesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'badges'

    def ready(self):
        from .models import Badge  

        def create_built_in_badges(sender, **kwargs):
            built_in_badges = [
                "Verified", # For verifying identity 
                "Student", # For verifying student email
                "Experienced", # For reaching level 5+  
                "Community Contributor", # For completing 5 volunteer tasks
                "Excellent" # For having a 4.0+ rating
            ]
            
            for badge_name in built_in_badges:
                Badge.objects.get_or_create(name=badge_name)

        post_migrate.connect(create_built_in_badges, sender=self)