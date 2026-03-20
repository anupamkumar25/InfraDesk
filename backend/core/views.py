from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import ComplaintType, Zone
from .serializers import ComplaintTypeSerializer, ZoneSerializer


class ZoneListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    pagination_class = None


class ComplaintTypeListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = ComplaintType.objects.all()
    serializer_class = ComplaintTypeSerializer
    pagination_class = None
