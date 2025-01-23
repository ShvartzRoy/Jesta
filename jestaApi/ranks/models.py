from django.db import models
from django.conf import settings
from badges.models import Badge

class Rank(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="rank", #TODO: check if this is correct
        on_delete=models.CASCADE
    )

    xp = models.PositiveIntegerField(default=0)
    badges = models.ManyToManyField(Badge, related_name="ranks")  
    level = models.PositiveSmallIntegerField(default=1)

    def __str__(self):
        return f"Rank of {self.user} - Level {self.level} - XP {self.xp}"
    
    def save(self, force_insert = ..., force_update = ..., using = ..., update_fields = ...):
        return super().save(force_insert, force_update, using, update_fields)

