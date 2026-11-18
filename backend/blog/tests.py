from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Post


class PendingDraftTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('me', password='pw')
        self.post = Post.objects.create(title='Live', slug='live', body='old', draft=False)
        self.url = '/api/blog/posts/live/'

    def test_edits_to_published_post_stay_pending(self):
        self.client.force_login(self.user)
        r = self.client.patch(self.url + '?draft', {'title': 'New', 'body': 'new'}, format='json')
        self.assertEqual(r.data['body'], 'new')
        self.assertTrue(r.data['has_pending'])
        self.post.refresh_from_db()
        self.assertEqual(self.post.body, 'old')

        self.assertEqual(self.client.get(self.url).data['body'], 'old')
        self.client.logout()
        public = self.client.get(self.url + '?draft').data
        self.assertEqual(public['body'], 'old')
        self.assertNotIn('has_pending', public)

    def test_publish_applies_pending(self):
        self.client.force_login(self.user)
        self.client.patch(self.url, {'body': 'new'}, format='json')
        r = self.client.post(self.url + 'publish/')
        self.assertEqual(r.data['body'], 'new')
        self.assertFalse(r.data['has_pending'])

    def test_discard_and_revert_clear_pending(self):
        self.client.force_login(self.user)
        self.client.patch(self.url, {'body': 'new'}, format='json')
        self.assertFalse(self.client.post(self.url + 'discard/').data['has_pending'])
        self.client.patch(self.url, {'body': 'new'}, format='json')
        self.assertFalse(self.client.patch(self.url, {'body': 'old'}, format='json').data['has_pending'])

    def test_unpublished_post_saves_in_place_and_publishes(self):
        self.client.force_login(self.user)
        r = self.client.post('/api/blog/posts/', {'title': 'Fresh', 'draft': False}, format='json')
        self.assertTrue(r.data['draft'])
        self.client.patch('/api/blog/posts/fresh/', {'body': 'text', 'slug': 'renamed'}, format='json')
        self.assertEqual(Post.objects.get(slug='renamed').body, 'text')
        self.assertFalse(self.client.post('/api/blog/posts/renamed/publish/').data['draft'])

    def test_published_slug_is_frozen(self):
        self.client.force_login(self.user)
        r = self.client.patch(self.url, {'slug': 'other'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_unpublish_keeps_pending_edits(self):
        self.client.force_login(self.user)
        self.client.patch(self.url, {'body': 'new'}, format='json')
        self.client.post(self.url + 'unpublish/')
        self.post.refresh_from_db()
        self.assertEqual((self.post.draft, self.post.body, self.post.pending), (True, 'new', None))
