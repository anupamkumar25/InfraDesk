from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.serializers import ComplaintTypeSerializer, ZoneSerializer
from .models import Ticket, TicketUpdate


User = get_user_model()


class UserSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class TicketUpdateSerializer(serializers.ModelSerializer):
    actor = UserSlimSerializer(read_only=True)

    class Meta:
        model = TicketUpdate
        fields = ["id", "type", "message", "from_status", "to_status", "created_at", "actor"]


class TicketSerializer(serializers.ModelSerializer):
    zone = ZoneSerializer(read_only=True)
    complaint_type = ComplaintTypeSerializer(read_only=True)
    created_by = UserSlimSerializer(read_only=True)
    assigned_to = UserSlimSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_no",
            "created_at",
            "updated_at",
            "zone",
            "complaint_type",
            "subject",
            "description",
            "location_text",
            "asset_id_text",
            "priority",
            "status",
            "created_by",
            "assigned_to",
        ]


class TicketCreateSerializer(serializers.ModelSerializer):
    zone_id = serializers.IntegerField(write_only=True)
    complaint_type_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Ticket
        fields = [
            "zone_id",
            "complaint_type_id",
            "subject",
            "description",
            "location_text",
            "asset_id_text",
            "priority",
        ]


class PublicTicketCreateSerializer(serializers.Serializer):
    zone_id = serializers.IntegerField()
    complaint_type_id = serializers.IntegerField()
    subject = serializers.CharField(max_length=200)
    description = serializers.CharField(max_length=10000)
    location_text = serializers.CharField(max_length=200)
    asset_id_text = serializers.CharField(required=False, allow_blank=True, max_length=80)
    priority = serializers.ChoiceField(choices=Ticket.Priority.choices, default=Ticket.Priority.MEDIUM)
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)


class PublicTicketTrackSerializer(serializers.Serializer):
    ticket_no = serializers.CharField(max_length=32)
    email = serializers.EmailField()


class TicketStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Ticket.Status.choices)
    message = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class TicketAssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

