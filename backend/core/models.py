from django.db import models


class Zone(models.Model):
    name = models.CharField(max_length=120, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class ComplaintType(models.Model):
    key = models.SlugField(max_length=32, unique=True)
    label = models.CharField(max_length=80)

    class Meta:
        ordering = ["label"]

    def __str__(self) -> str:
        return self.label

from django.db import models

# Create your models here.
