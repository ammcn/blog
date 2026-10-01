from django.contrib import admin

from .models import Like


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['slug', 'client_id', 'created_at']
    list_filter = ['slug']
