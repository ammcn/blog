from django.db import migrations


def forwards(apps, schema_editor):
    Profile = apps.get_model('resume', 'Profile')
    SocialLink = apps.get_model('resume', 'SocialLink')
    for profile in Profile.objects.all():
        order = 0
        for platform in ('website', 'github', 'linkedin'):
            url = getattr(profile, platform)
            if url:
                SocialLink.objects.create(profile=profile, platform=platform, url=url, order=order)
                order += 1


def backwards(apps, schema_editor):
    Profile = apps.get_model('resume', 'Profile')
    for profile in Profile.objects.all():
        for link in profile.socials.filter(platform__in=['website', 'github', 'linkedin']):
            setattr(profile, link.platform, link.url)
        profile.save()


class Migration(migrations.Migration):
    dependencies = [('resume', '0002_sociallink')]
    operations = [migrations.RunPython(forwards, backwards)]
