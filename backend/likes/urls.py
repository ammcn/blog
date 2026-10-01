from django.urls import path

from .views import LikeListView, LikeToggleView

urlpatterns = [
    path('likes/', LikeListView.as_view()),
    path('likes/<slug:slug>/toggle/', LikeToggleView.as_view()),
]
