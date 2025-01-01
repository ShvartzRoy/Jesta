from django.apps import AppConfig
from django.db.models.signals import post_migrate



class ServicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services'
    
    
    def ready(self):
        from .models import Tag, BUILT_IN_TAGS

        def create_built_in_tags(sender, **kwargs):
            for tag_name in BUILT_IN_TAGS:
                Tag.objects.get_or_create(name=tag_name)

        post_migrate.connect(create_built_in_tags, sender=self)
    
    

