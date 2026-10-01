from django import forms
from django.contrib import admin

from .models import Post


class PostForm(forms.ModelForm):
    class Meta:
        widgets = {'body': forms.Textarea(attrs={'rows': 24, 'style': 'width: 100%; font-family: monospace'})}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    form = PostForm
    list_display = ['title', 'date', 'draft', 'updated_at']
    list_filter = ['draft']
    search_fields = ['title', 'body']
    prepopulated_fields = {'slug': ['title']}
