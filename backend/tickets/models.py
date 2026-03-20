import uuid
from django.conf import settings
from django.db import models

from core.models import ComplaintType, Zone


class Ticket(models.Model):
    class Priority(models.TextChoices):
        CRITICAL = "CRITICAL", "Critical"
        HIGH = "HIGH", "High"
        MEDIUM = "MEDIUM", "Medium"
        LOW = "LOW", "Low"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"
        REOPENED = "REOPENED", "Reopened"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_no = models.CharField(max_length=32, unique=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    zone = models.ForeignKey(Zone, on_delete=models.PROTECT, related_name="tickets")
    complaint_type = models.ForeignKey(ComplaintType, on_delete=models.PROTECT, related_name="tickets")

    subject = models.CharField(max_length=200)
    description = models.TextField()
    location_text = models.CharField(max_length=200)
    asset_id_text = models.CharField(max_length=80, blank=True, default="")

    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tickets_created",
        null=True,
        blank=True,
    )
    created_by_name = models.CharField(max_length=120, blank=True, default="")
    created_by_email = models.EmailField(blank=True, default="")
    created_by_phone = models.CharField(max_length=32, blank=True, default="")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tickets_assigned",
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.ticket_no


class TicketUpdate(models.Model):
    class Type(models.TextChoices):
        STATUS_CHANGE = "STATUS_CHANGE", "Status change"
        COMMENT = "COMMENT", "Comment"
        REASSIGN = "REASSIGN", "Reassign"

    id = models.BigAutoField(primary_key=True)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="updates")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    type = models.CharField(max_length=24, choices=Type.choices)
    message = models.TextField(blank=True, default="")

    from_status = models.CharField(max_length=16, blank=True, default="")
    to_status = models.CharField(max_length=16, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class TicketPublicAccess(models.Model):
    """
    Internet-safe tracking:
    - We store a hash of the token (never the raw token).
    - Public users can track using (ticket_no + token).
    """

    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name="public_access")
    token_hash = models.CharField(max_length=128, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
