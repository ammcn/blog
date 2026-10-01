from adminsortable2.admin import SortableAdminBase, SortableAdminMixin, SortableTabularInline
from django import forms
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from .models import Education, Experience, Proficiency, ProficiencyCategory, Profile, SocialLink

admin.site.site_header = 'Resume admin'
admin.site.site_title = 'Resume admin'
admin.site.index_title = 'Content'


class MarkdownForm(forms.ModelForm):
    class Meta:
        widgets = {'description': forms.Textarea(attrs={'rows': 8, 'style': 'width: 100%; font-family: monospace'})}


class SocialLinkInline(SortableTabularInline):
    model = SocialLink
    fields = ['platform', 'label', 'url']
    extra = 1


@admin.register(Profile)
class ProfileAdmin(SortableAdminBase, admin.ModelAdmin):
    fieldsets = [
        (None, {'fields': ['name', 'title', 'summary']}),
        ('Contact', {'fields': ['email', 'phone', 'location']}),
    ]
    inlines = [SocialLinkInline]

    def has_add_permission(self, request):
        return not Profile.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        """Singleton: skip the list and open the one profile (or the add form)."""
        profile = Profile.objects.first()
        if profile:
            return redirect(reverse('admin:resume_profile_change', args=[profile.pk]))
        return redirect(reverse('admin:resume_profile_add'))


@admin.register(Experience)
class ExperienceAdmin(SortableAdminMixin, admin.ModelAdmin):
    form = MarkdownForm
    list_display = ['role', 'company', 'location', 'start_date', 'end_or_present']
    search_fields = ['role', 'company']
    fieldsets = [
        (None, {'fields': ['role', 'company', 'location']}),
        ('Dates', {'fields': [('start_date', 'end_date')], 'description': 'Leave end date blank for a current role.'}),
        ('Description', {'fields': ['description'], 'description': 'Markdown. One "- " bullet per line.'}),
    ]

    @admin.display(description='End', ordering='end_date')
    def end_or_present(self, obj):
        return obj.end_date or 'Present'


@admin.register(Education)
class EducationAdmin(SortableAdminMixin, admin.ModelAdmin):
    form = MarkdownForm
    list_display = ['degree', 'field_of_study', 'institution', 'start_date', 'end_date']
    search_fields = ['degree', 'institution']
    fieldsets = [
        (None, {'fields': ['institution', 'degree', 'field_of_study']}),
        ('Dates', {'fields': [('start_date', 'end_date')]}),
        ('Description', {'fields': ['description'], 'classes': ['collapse']}),
    ]


class ProficiencyInline(SortableTabularInline):
    model = Proficiency
    fields = ['name', 'level']
    extra = 1


@admin.register(ProficiencyCategory)
class ProficiencyCategoryAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'skills']
    inlines = [ProficiencyInline]

    @admin.display(description='Skills')
    def skills(self, obj):
        return ', '.join(obj.items.values_list('name', flat=True)) or '—'
