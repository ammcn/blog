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
        read_only_fields = ['updated_at']
        extra_kwargs = {'slug': {'required': False, 'allow_blank': True}}


class PostSerializer(PostListSerializer):
    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['body']
