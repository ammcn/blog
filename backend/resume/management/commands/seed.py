from datetime import date

from django.core.management.base import BaseCommand
from resume.models import Education, Experience, Proficiency, ProficiencyCategory, Profile, SocialLink


class Command(BaseCommand):
    help = 'Load placeholder resume content'

    def handle(self, *args, **options):
        if Profile.objects.exists():
            self.stdout.write('Already seeded.')
            return
        profile = Profile.objects.create(
            name='Your Name', title='Software Engineer', location='Somewhere, USA',
            email='you@example.com',
            summary='One or two sentences about what you do and what you care about.',
        )
        SocialLink.objects.create(profile=profile, platform='github', url='https://github.com/you', order=0)
        SocialLink.objects.create(profile=profile, platform='linkedin', url='https://linkedin.com/in/you', order=1)
        Experience.objects.create(
            company='Acme Corp', role='Senior Engineer', location='Remote',
            start_date=date(2022, 1, 1),
            description='- Led the thing\n- Shipped the other thing\n- Mentored people',
        )
        Experience.objects.create(
            company='Startup Inc', role='Engineer', start_date=date(2019, 6, 1),
            end_date=date(2021, 12, 31), order=1,
            description='- Built the product from zero\n- Owned the backend',
        )
        Education.objects.create(
            institution='State University', degree='B.S.', field_of_study='Computer Science',
            start_date=date(2015, 9, 1), end_date=date(2019, 5, 1),
        )
        for i, (cat, items) in enumerate({
            'Languages': [('Python', 5), ('TypeScript', 4), ('SQL', 4)],
            'Frameworks': [('Django', 5), ('React', 4)],
            'Tools': [('Docker', 4), ('PostgreSQL', 4), ('Git', 5)],
        }.items()):
            c = ProficiencyCategory.objects.create(name=cat, order=i)
            for j, (name, level) in enumerate(items):
                Proficiency.objects.create(category=c, name=name, level=level, order=j)
        self.stdout.write(self.style.SUCCESS('Seeded.'))
