from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from services.models import Service


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    saved_services = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.email
    
    # def save(self, *args, **kwargs):
    #         if not self.id:
    #             self.set_password(self.password)
    #         super().save(*args, **kwargs)

    def add_service_to_saved(self, service):
            saved_service_data = {"id": service.id, "title": service.title, "state": service.state}
            if saved_service_data not in self.saved_services:
                self.saved_services.append(saved_service_data)
                self.save()
                return True 
            return False  
        
    def remove_service_from_saved(self, service):
            saved_service_data = {"id": service.id, "title": service.title, "state": service.state}
            if saved_service_data in self.saved_services:
                self.saved_services.remove(saved_service_data)
                self.save()
                return True 
            return False
        


    @receiver(post_save, sender=Service)
    def update_saved_services(sender, instance, **kwargs):
        for user in CustomUser.objects.all():
            for saved_service in user.saved_services:
                if saved_service["id"] == instance.id:
                    saved_service["title"] = instance.title
                    saved_service["state"] = instance.state
                    user.save()



class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    resume = models.FileField(upload_to='profile_resumes/', null=True, blank=True)
    facebook = models.URLField(max_length=255, blank=True, null=True)
    linkedin = models.URLField(max_length=255, blank=True, null=True)
    instagram = models.URLField(max_length=255, blank=True, null=True)




