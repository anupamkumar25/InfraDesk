import hashlib
import secrets
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import Ticket, TicketPublicAccess, TicketUpdate


@transaction.atomic
def generate_ticket_no() -> str:
    # Simple monotonic sequence per year using row count.
    # For production you may replace with a dedicated sequence table.
    year = timezone.now().year
    prefix = f"TKT-{year}-"
    last = (
        Ticket.objects.filter(ticket_no__startswith=prefix)
        .order_by("-created_at")
        .values_list("ticket_no", flat=True)
        .first()
    )
    if not last:
        n = 1
    else:
        try:
            n = int(last.split("-")[-1]) + 1
        except Exception:
            n = Ticket.objects.filter(ticket_no__startswith=prefix).count() + 1
    return f"{prefix}{n:06d}"


def add_update(*, ticket: Ticket, actor, type: str, message: str = "", from_status: str = "", to_status: str = ""):
    TicketUpdate.objects.create(
        ticket=ticket,
        actor=actor,
        type=type,
        message=message or "",
        from_status=from_status or "",
        to_status=to_status or "",
    )


def mint_public_tracking_token() -> str:
    # URL-safe token; returned once to the public user
    return secrets.token_urlsafe(32)


def hash_tracking_token(ticket_no: str, token: str) -> str:
    # Bind token to ticket_no + SECRET_KEY so it cannot be swapped between tickets.
    payload = f"{ticket_no}:{token}:{settings.SECRET_KEY}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


@transaction.atomic
def attach_public_access(ticket: Ticket) -> str:
    token = mint_public_tracking_token()
    token_hash = hash_tracking_token(ticket.ticket_no, token)
    TicketPublicAccess.objects.create(ticket=ticket, token_hash=token_hash)
    return token


def _staff_portal_url(ticket: Ticket | None = None) -> str:
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
    if ticket:
        return f"{base}/staff/tickets/{ticket.id}"
    return f"{base}/staff/tickets"


def _public_track_url(ticket: Ticket) -> str:
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
    return f"{base}/public/track?ticket_no={ticket.ticket_no}"


def notify_se_new_ticket(ticket: Ticket) -> None:
    """
    Email all SE users when a new ticket is created (public or staff).
    """
    User = get_user_model()
    se_group = Group.objects.filter(name="SE").first()
    if not se_group:
        return
    recipients = list(
        User.objects.filter(groups=se_group)
        .exclude(email="")
        .values_list("email", flat=True)
    )
    if not recipients:
        return

    subject = f"[InfraDesk] New ticket {ticket.ticket_no}"
    body = (
        f"A new ticket has been created.\n\n"
        f"Ticket: {ticket.ticket_no}\n"
        f"Subject: {ticket.subject}\n"
        f"Zone: {ticket.zone.name}\n"
        f"Type: {ticket.complaint_type.label}\n\n"
        f"Open in staff portal: {_staff_portal_url(ticket)}\n"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, recipients)


def notify_assigned_staff(ticket: Ticket) -> None:
    """
    Email the assignee when SE assigns a ticket.
    """
    if not ticket.assigned_to or not ticket.assigned_to.email:
        return
    subject = f"[InfraDesk] Ticket assigned to you ({ticket.ticket_no})"
    body = (
        f"A ticket has been assigned to you.\n\n"
        f"Ticket: {ticket.ticket_no}\n"
        f"Subject: {ticket.subject}\n"
        f"Zone: {ticket.zone.name}\n"
        f"Type: {ticket.complaint_type.label}\n\n"
        f"Open in staff portal: {_staff_portal_url(ticket)}\n"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [ticket.assigned_to.email])


def notify_public_status_change(ticket: Ticket, old_status: str, new_status: str, message: str = "") -> None:
    """
    Email the public reporter when ticket status changes, if email was provided.
    """
    if not ticket.created_by_email:
        return
    subject = f"[InfraDesk] Ticket {ticket.ticket_no} status updated"
    extra = f"\nNote from staff: {message}\n" if message else ""
    body = (
        f"Your ticket status has changed.\n\n"
        f"Ticket: {ticket.ticket_no}\n"
        f"Subject: {ticket.subject}\n"
        f"Old status: {old_status}\n"
        f"New status: {new_status}\n"
        f"{extra}\n"
        f"You can view limited details here: {_public_track_url(ticket)}\n"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [ticket.created_by_email])

