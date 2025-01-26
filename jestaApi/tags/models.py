from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class SpecialistTag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    tags = models.ManyToManyField(Tag, related_name="categories")
    specialist_tags = models.ManyToManyField(SpecialistTag, related_name="categories")

    def __str__(self):
        return self.name
