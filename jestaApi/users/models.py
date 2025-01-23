from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from services.models import Service


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    def __str__(self):
        return self.email



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




