from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Post
from .serializers import PostListSerializer, PostSerializer


class PostViewSet(viewsets.ModelViewSet):
    """Anyone can read published posts; a signed-in session can see drafts and write.

    Edits to a published post collect in `pending` until published; `?draft` overlays them on reads.
    """

    lookup_field = 'slug'
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        qs = Post.objects.all()
        return qs if self.request.user.is_authenticated else qs.filter(draft=False)

    def get_serializer_class(self):
        return PostListSerializer if self.action == 'list' else PostSerializer

    def perform_update(self, serializer):
        post = serializer.instance
        if post.draft:
            serializer.save()
            return
        live = serializer.draftable({k: getattr(post, k) for k in Post.DRAFTABLE})
        pending = {**live, **(post.pending or {}), **serializer.draftable(serializer.validated_data)}
        post.pending = None if pending == live else pending
        post.save(update_fields=['pending', 'updated_at'])

    def _set_draft(self, draft):
        """Applies any pending edits and sets whether the post is a draft."""
        post = self.get_object()
        serializer = self.get_serializer(post, data=post.pending or {}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(pending=None, draft=draft)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def publish(self, request, slug=None):
        return self._set_draft(False)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, slug=None):
        return self._set_draft(True)

    @action(detail=True, methods=['post'])
    def discard(self, request, slug=None):
        post = self.get_object()
        post.pending = None
        post.save(update_fields=['pending', 'updated_at'])
        return Response(self.get_serializer(post).data)
