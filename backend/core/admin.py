from django.contrib import admin

from .models import ComplaintType, Zone


admin.site.register(Zone)
admin.site.register(ComplaintType)
