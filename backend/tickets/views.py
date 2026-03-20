from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import ComplaintType, Zone
from .models import Ticket, TicketPublicAccess
from .serializers import (
    PublicTicketCreateSerializer,
    PublicTicketTrackSerializer,
    TicketAssignSerializer,
    TicketCreateSerializer,
    TicketSerializer,
    TicketStatusUpdateSerializer,
    TicketUpdateSerializer,
)
from .services import (
    add_update,
    attach_public_access,
    generate_ticket_no,
    hash_tracking_token,
    notify_assigned_staff,
    notify_public_status_change,
    notify_se_new_ticket,
)


def is_se(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name="SE").exists()


def is_staff_member(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name__in=["SE", "STAFF"]).exists()


def visible_tickets_qs_for(user, base_qs):
    """
    Enforcement:
    - SE (or superuser): all tickets
    - everyone else: ONLY tickets assigned to them
    """
    if is_se(user):
        return base_qs
    return base_qs.filter(assigned_to=user)


class TicketListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Ticket.objects.select_related("zone", "complaint_type", "created_by", "assigned_to").all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TicketCreateSerializer
        return TicketSerializer

    def get_queryset(self):
        qs = visible_tickets_qs_for(self.request.user, super().get_queryset())
        q = self.request.query_params.get("q")
        status_q = self.request.query_params.get("status")
        if status_q:
            qs = qs.filter(status=status_q)
        if q:
            qs = qs.filter(Q(ticket_no__icontains=q) | Q(subject__icontains=q))
        return qs

    def create(self, request, *args, **kwargs):
        ser = TicketCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        zone = Zone.objects.get(id=ser.validated_data["zone_id"])
        ctype = ComplaintType.objects.get(id=ser.validated_data["complaint_type_id"])
        ticket = Ticket.objects.create(
            ticket_no=generate_ticket_no(),
            zone=zone,
            complaint_type=ctype,
            subject=ser.validated_data["subject"],
            description=ser.validated_data["description"],
            location_text=ser.validated_data["location_text"],
            asset_id_text=ser.validated_data.get("asset_id_text", "") or "",
            priority=ser.validated_data.get("priority", Ticket.Priority.MEDIUM),
            created_by=request.user,
        )
        add_update(ticket=ticket, actor=request.user, type="COMMENT", message="Ticket created")
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class TicketDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Ticket.objects.select_related("zone", "complaint_type", "created_by", "assigned_to").all()
    serializer_class = TicketSerializer

    def get_queryset(self):
        return visible_tickets_qs_for(self.request.user, super().get_queryset())


class TicketUpdatesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        ticket_id = self.kwargs["pk"]
        tqs = visible_tickets_qs_for(self.request.user, Ticket.objects.all())
        ticket = tqs.get(pk=ticket_id)
        return ticket.updates.select_related("actor").all()

    serializer_class = TicketUpdateSerializer


class TicketStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ticket = visible_tickets_qs_for(request.user, Ticket.objects.all()).get(pk=pk)
        ser = TicketStatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        old = ticket.status
        new = ser.validated_data["status"]
        ticket.status = new
        ticket.save(update_fields=["status", "updated_at"])
        msg = ser.validated_data.get("message", "")
        add_update(
            ticket=ticket,
            actor=request.user,
            type="STATUS_CHANGE",
            message=msg,
            from_status=old,
            to_status=new,
        )
        notify_public_status_change(ticket, old_status=old, new_status=new, message=msg)
        return Response(TicketSerializer(ticket).data)


class TicketAssignView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_se(request.user):
            return Response({"detail": "Not allowed."}, status=403)

        ticket = Ticket.objects.select_related("assigned_to").get(pk=pk)
        ser = TicketAssignSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        assigned_to_id = ser.validated_data.get("assigned_to_id", None)
        old_user = ticket.assigned_to
        if assigned_to_id is None:
            ticket.assigned_to = None
        else:
            # allow assigning to any staff member account; validation is minimal by design
            from django.contrib.auth import get_user_model

            User = get_user_model()
            assignee = User.objects.get(id=assigned_to_id)
            if not assignee.is_superuser and not assignee.groups.filter(name__in=["SE", "STAFF"]).exists():
                return Response({"detail": "Assignee must be staff."}, status=400)
            ticket.assigned_to = assignee

        ticket.save(update_fields=["assigned_to", "updated_at"])

        old_name = old_user.username if old_user else "Unassigned"
        new_name = ticket.assigned_to.username if ticket.assigned_to else "Unassigned"
        add_update(
            ticket=ticket,
            actor=request.user,
            type="REASSIGN",
            message=f"{old_name} → {new_name}",
        )
        notify_assigned_staff(ticket)
        return Response(TicketSerializer(ticket).data)


class PublicCreateTicketView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PublicTicketCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        zone = Zone.objects.get(id=ser.validated_data["zone_id"])
        ctype = ComplaintType.objects.get(id=ser.validated_data["complaint_type_id"])

        ticket = Ticket.objects.create(
            ticket_no=generate_ticket_no(),
            zone=zone,
            complaint_type=ctype,
            subject=ser.validated_data["subject"],
            description=ser.validated_data["description"],
            location_text=ser.validated_data["location_text"],
            asset_id_text=ser.validated_data.get("asset_id_text", "") or "",
            priority=ser.validated_data.get("priority", Ticket.Priority.MEDIUM),
            created_by=None,
            created_by_name=ser.validated_data["name"],
            created_by_email=ser.validated_data["email"],
            created_by_phone=ser.validated_data.get("phone", "") or "",
        )

        # Tracking is done via (ticket_no + email)
        notify_se_new_ticket(ticket)
        return Response({"ticket_no": ticket.ticket_no}, status=status.HTTP_201_CREATED)


class PublicTrackTicketView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PublicTicketTrackSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ticket_no = ser.validated_data["ticket_no"].strip().upper()
        email = ser.validated_data["email"].strip().lower()

        t = (
            Ticket.objects.select_related("zone", "complaint_type")
            .filter(ticket_no=ticket_no, created_by_email__iexact=email)
            .first()
        )
        if not t:
            return Response({"detail": "Invalid ticket or email."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "ticket_no": t.ticket_no,
                "created_at": t.created_at,
                "zone": {"id": t.zone_id, "name": t.zone.name},
                "complaint_type": {
                    "id": t.complaint_type_id,
                    "key": t.complaint_type.key,
                    "label": t.complaint_type.label,
                },
                "subject": t.subject,
                "priority": t.priority,
                "status": t.status,
                "location_text": t.location_text,
            }
        )
