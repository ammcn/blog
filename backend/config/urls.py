from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('resume.urls')),
    path('api/', include('likes.urls')),
    path('api/', include('accounts.urls')),
]
