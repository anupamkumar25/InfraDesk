from django.urls import path

from .views import (
    PublicCreateTicketView,
    PublicTrackTicketView,
  TicketAssignView,
    TicketDetailView,
    TicketListCreateView,
    TicketStatusView,
    TicketUpdatesView,
)


urlpatterns = [
    path("tickets/", TicketListCreateView.as_view(), name="tickets_list_create"),
    path("tickets/<uuid:pk>/", TicketDetailView.as_view(), name="ticket_detail"),
    path("tickets/<uuid:pk>/updates/", TicketUpdatesView.as_view(), name="ticket_updates"),
    path("tickets/<uuid:pk>/status/", TicketStatusView.as_view(), name="ticket_status"),
    path("tickets/<uuid:pk>/assign/", TicketAssignView.as_view(), name="ticket_assign"),
    path("public/tickets/", PublicCreateTicketView.as_view(), name="public_ticket_create"),
    path("public/tickets/track/", PublicTrackTicketView.as_view(), name="public_ticket_track"),
]

