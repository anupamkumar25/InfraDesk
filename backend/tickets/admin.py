from django.contrib import admin

from .models import Ticket, TicketUpdate


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("ticket_no", "status", "priority", "zone", "complaint_type", "created_at", "assigned_to")
    search_fields = ("ticket_no", "subject", "location_text", "created_by__email")
    list_filter = ("status", "priority", "zone", "complaint_type")


@admin.register(TicketUpdate)
class TicketUpdateAdmin(admin.ModelAdmin):
    list_display = ("ticket", "type", "actor", "created_at")
    search_fields = ("ticket__ticket_no", "message", "actor__email")
