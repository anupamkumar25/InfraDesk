from django.urls import path

from .views import ComplaintTypeListView, ZoneListView


urlpatterns = [
    path("zones/", ZoneListView.as_view(), name="zones"),
    path("complaint-types/", ComplaintTypeListView.as_view(), name="complaint_types"),
]

