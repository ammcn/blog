from rest_framework import serializers

from .models import Post


class TagsField(serializers.ListField):
    child = serializers.CharField(max_length=50)

    def to_internal_value(self, data):
        return sorted({t.strip().lower() for t in super().to_internal_value(data) if t.strip()})


class PostListSerializer(serializers.ModelSerializer):
    tags = TagsField(required=False)

    class Meta:
        model = Post
        fields = ['slug', 'title', 'date', 'excerpt', 'tags', 'draft', 'updated_at']
        read_only_fields = ['draft', 'updated_at']
        extra_kwargs = {'slug': {'required': False, 'allow_blank': True}}

    def validate_slug(self, slug):
        # Likes and shared links key on the slug, so it freezes once published.
        if self.instance and not self.instance.draft and slug != self.instance.slug:
            raise serializers.ValidationError('A published post keeps its slug.')
        return slug


class PostSerializer(PostListSerializer):
    has_pending = serializers.SerializerMethodField()

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['body', 'has_pending']

    def get_has_pending(self, post):
        return post.pending is not None

    def to_representation(self, post):
        data = super().to_representation(post)
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            data.pop('has_pending')
        elif 'draft' in request.query_params and post.pending:
            data.update(post.pending)
        return data

    def draftable(self, values):
        """`values` as JSON, limited to the fields a pending draft holds."""
        return {k: self.fields[k].to_representation(v) for k, v in values.items() if k in Post.DRAFTABLE}
