import re

from django.db.models import Count
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import Like

SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
CLIENT_ID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')


def client_id(request):
    cid = request.headers.get('X-Client-Id', '')
    return cid if CLIENT_ID.match(cid) else None


class LikeListView(APIView):
    """GET ?slugs=a,b → {slug: {count, liked}} for each requested slug."""

    def get(self, request):
        slugs = [s for s in request.query_params.get('slugs', '').split(',') if SLUG.match(s)]
        counts = dict(Like.objects.filter(slug__in=slugs).values_list('slug').annotate(n=Count('id')))
        cid = client_id(request)
        liked = set(Like.objects.filter(slug__in=slugs, client_id=cid).values_list('slug', flat=True)) if cid else set()
        return Response({s: {'count': counts.get(s, 0), 'liked': s in liked} for s in slugs})


class ToggleThrottle(AnonRateThrottle):
    rate = '30/min'


class LikeToggleView(APIView):
    """POST → toggles this client's heart on the slug; returns {count, liked}."""

    authentication_classes = []
    throttle_classes = [ToggleThrottle]

    def post(self, request, slug):
        cid = client_id(request)
        if not SLUG.match(slug) or not cid:
            raise ValidationError('bad slug or client id')
        like, created = Like.objects.get_or_create(slug=slug, client_id=cid)
        if not created:
            like.delete()
        return Response({'count': Like.objects.filter(slug=slug).count(), 'liked': created})
