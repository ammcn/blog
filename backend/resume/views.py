from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Education, Experience, ProficiencyCategory, Profile
from .serializers import EducationSerializer, ExperienceSerializer, ProficiencyCategorySerializer, ProfileSerializer

EMPTY_PROFILE = {'name': '', 'title': '', 'summary': '', 'email': '', 'phone': '', 'location': '', 'socials': []}


class ResumeView(APIView):
    """Everything the resume page needs in one request."""

    def get(self, request):
        profile = Profile.objects.prefetch_related('socials').first()
        return Response({
            'profile': ProfileSerializer(profile).data if profile else EMPTY_PROFILE,
            'experience': ExperienceSerializer(Experience.objects.all(), many=True).data,
            'education': EducationSerializer(Education.objects.all(), many=True).data,
            'proficiencies': ProficiencyCategorySerializer(ProficiencyCategory.objects.prefetch_related('items'), many=True).data,
        })
