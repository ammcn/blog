from rest_framework import serializers

from .models import Education, Experience, Proficiency, ProficiencyCategory, Profile, SocialLink


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ['platform', 'label', 'url']


class ProfileSerializer(serializers.ModelSerializer):
    socials = SocialLinkSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        exclude = ['id']


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'


class ProficiencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Proficiency
        fields = ['id', 'name', 'level']


class ProficiencyCategorySerializer(serializers.ModelSerializer):
    items = ProficiencySerializer(many=True, read_only=True)

    class Meta:
        model = ProficiencyCategory
        fields = ['id', 'name', 'items']
