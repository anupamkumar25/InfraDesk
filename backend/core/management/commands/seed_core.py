from django.core.management.base import BaseCommand

from core.models import ComplaintType, Zone


class Command(BaseCommand):
    help = "Seed zones and complaint types."

    def handle(self, *args, **options):
        zones = [
            "Academic & Auditorium",
            "Hospital",
            "Residential",
            "Guest House & Night Shelter",
            "Hostel",
            "Other",
        ]
        types = [
            ("civil", "Civil"),
            ("elec", "Electrical"),
            ("hvac", "HVAC"),
            ("it", "IT / Networking"),
            ("street", "Street Lighting"),
            ("land", "Landscaping"),
            ("parking", "Parking"),
            ("water", "Water Supply"),
        ]

        zc = 0
        for z in zones:
            _, created = Zone.objects.get_or_create(name=z)
            zc += 1 if created else 0

        tc = 0
        for key, label in types:
            _, created = ComplaintType.objects.get_or_create(key=key, defaults={"label": label})
            if not created:
                ComplaintType.objects.filter(key=key).update(label=label)
            tc += 1 if created else 0

        self.stdout.write(self.style.SUCCESS(f"Zones created: {zc}, complaint types created: {tc}"))

