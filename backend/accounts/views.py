from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


User = get_user_model()


def is_se(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name="SE").exists()


def staff_groups(user) -> list[str]:
    if not user or not user.is_authenticated:
        return []
    return list(user.groups.values_list("name", flat=True))


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        groups = staff_groups(u)
        return Response(
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
                "groups": groups,
                "is_se": is_se(u),
            }
        )


class StaffDirectoryView(APIView):
    """
    Minimal directory of staff accounts for assignment.
    Only SE (or superuser) can access.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_se(request.user):
            return Response({"detail": "Not allowed."}, status=403)

        qs = (
            User.objects.filter(groups__name__in=["SE", "STAFF"])
            .distinct()
            .order_by("username")
            .values("id", "username", "email", "first_name", "last_name")
        )
        return Response(list(qs))
