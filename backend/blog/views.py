from rest_framework import permissions, viewsets

from .models import Post
from .serializers import PostListSerializer, PostSerializer


class PostViewSet(viewsets.ModelViewSet):
    """Anyone can read published posts; a signed-in session can see drafts and write."""

    lookup_field = 'slug'
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        qs = Post.objects.all()
        return qs if self.request.user.is_authenticated else qs.filter(draft=False)

    def get_serializer_class(self):
        return PostListSerializer if self.action == 'list' else PostSerializer
