from django.db import models


class Profile(models.Model):
    """Singleton: the name, title, and contact info at the top of the resume."""
    name = models.CharField(max_length=100)
    title = models.CharField(max_length=150, blank=True)
    summary = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)


class SocialLink(models.Model):
    PLATFORMS = [
        ('website', 'Website'),
        ('github', 'GitHub'),
        ('linkedin', 'LinkedIn'),
        ('x', 'X'),
        ('bluesky', 'Bluesky'),
        ('mastodon', 'Mastodon'),
        ('instagram', 'Instagram'),
        ('youtube', 'YouTube'),
        ('other', 'Other'),
    ]
    profile = models.ForeignKey(Profile, related_name='socials', on_delete=models.CASCADE)
    platform = models.CharField(max_length=20, choices=PLATFORMS, default='website')
    label = models.CharField(max_length=100, blank=True, help_text='Shown instead of the URL')
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.label or self.url


class Experience(models.Model):
    company = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    location = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text='Blank = present')
    description = models.TextField(blank=True, help_text='Markdown; use a bullet list.')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-start_date']

    def __str__(self):
        return f'{self.role} @ {self.company}'


class Education(models.Model):
    institution = models.CharField(max_length=150)
    degree = models.CharField(max_length=150)
    field_of_study = models.CharField(max_length=150, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-end_date']

    def __str__(self):
        return f'{self.degree}, {self.institution}'


class ProficiencyCategory(models.Model):
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'proficiency categories'

    def __str__(self):
        return self.name


class Proficiency(models.Model):
    category = models.ForeignKey(ProficiencyCategory, related_name='items', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    level = models.PositiveSmallIntegerField(default=3, help_text='1-5')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'proficiencies'

    def __str__(self):
        return self.name
