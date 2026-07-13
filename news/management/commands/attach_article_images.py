import os
import urllib.request
import urllib.parse
from django.core.management.base import BaseCommand
from django.conf import settings
from news.models import Article


class Command(BaseCommand):
    help = 'Generate and attach a unique AI image for each article based on its title (via Pollinations.ai)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-generate images even for articles that already have a thumbnail',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        self.stdout.write('Starting AI image generation for articles (Pollinations.ai)...')

        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

        articles = Article.objects.all()
        if not force:
            articles = articles.filter(thumbnail__isnull=True) | articles.filter(thumbnail='')
        
        total = articles.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('All articles already have thumbnails. Use --force to regenerate.'))
            return

        success_count = 0

        for idx, art in enumerate(articles):
            # 用文章标题构造英文 prompt，让 AI 生成与内容匹配的插画
            prompt = f"modern digital illustration for news article: {art.title}, clean minimal style, vibrant colors, dark background"
            encoded_prompt = urllib.parse.quote(prompt)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=450&nologo=true&seed={art.id}"

            filename = f"article_{art.id}.jpg"
            filepath = os.path.join(settings.MEDIA_ROOT, filename)

            self.stdout.write(f"[{idx+1}/{total}] Generating AI image for: '{art.title[:50]}'")
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                req = urllib.request.Request(image_url, headers=headers)
                with urllib.request.urlopen(req, timeout=60) as response:
                    data = response.read()
                    if len(data) < 1000:
                        raise ValueError(f"Response too small ({len(data)} bytes), likely not an image")
                    with open(filepath, 'wb') as f:
                        f.write(data)

                art.thumbnail = f"/media/{filename}"
                art.save()
                success_count += 1
                self.stdout.write(self.style.SUCCESS(f"    OK -> {filename}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"    FAILED: {e}"))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Generated unique AI images for {success_count}/{total} articles."
        ))
