from django.apps import AppConfig
from django.db.models.signals import post_migrate


class TagsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tags'

    def ready(self):
        from .models import Tag
        from django.conf import settings

        def create_built_in_tags(sender, **kwargs):
            built_in_tags = [
                "Babysitter",
                "Photographer",
                "Private tutor",
                "Hitchhike",
                "Handyman",
                "Dogwalker",
                "Dogsitter",
                "Mover",
            ]
            for tag_name in built_in_tags:
                Tag.objects.get_or_create(name=tag_name)

        post_migrate.connect(create_built_in_tags, sender=self)
