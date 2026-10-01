from django.db import models


class Like(models.Model):
    slug = models.SlugField(db_index=True)
    client_id = models.CharField(max_length=36)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('slug', 'client_id')]

    def __str__(self):
        return f'{self.slug} ♥ {self.client_id}'
