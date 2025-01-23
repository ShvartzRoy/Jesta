from django.db import models
from django.conf import settings

class Rank(models.Model):
    xp = models.PositiveIntegerField(default=0)