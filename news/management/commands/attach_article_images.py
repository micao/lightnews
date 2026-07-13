import os
import urllib.request
import urllib.parse
from django.core.management.base import BaseCommand
from django.conf import settings
from news.models import Article


def get_optimized_keywords(title, category_name=""):
    title_lower = title.lower()
    
    # 返回主关键词以及备用单关键词
    if any(w in title_lower for w in ['ai', 'artificial intelligence', '人工智能', '智能', '模型', 'gpt', 'llm', 'deepseek', 'neural', 'hugging face']):
        return "neural,network,ai", "technology"
    if any(w in title_lower for w in ['robot', 'hardware', '机器人', '硬件', 'device', 'drone', '具身智能']):
        return "robot,automation", "technology"
    if any(w in title_lower for w in ['chip', 'semiconductor', '光刻', '芯片', '半导体', 'cpu', 'gpu', '算力']):
        return "microchip,silicon", "technology"
    if any(w in title_lower for w in ['funding', 'capital', 'finance', 'ipo', 'valuation', 'invest', '融资', '投资', '估值', '独角兽', 'unicorn', '创业', '初创']):
        return "finance,chart", "finance"
    if any(w in title_lower for w in ['security', 'hacker', 'cookie stuffing', 'fraud', 'attack', 'leak', '安全', '黑客', '欺诈', '作弊', '窃取']):
        return "cyber,security", "technology"
    if any(w in title_lower for w in ['space', 'rocket', 'satellite', '航天', '火箭', '卫星', '太空']):
        return "rocket,space", "technology"
    if any(w in title_lower for w in ['code', 'compiler', 'programming', 'zig', 'rust', 'python', 'php', '代码', '编译器', '程序员', '开发']):
        return "code,programming", "technology"
    
    if "前沿科技" in category_name:
        return "technology", "technology"
    elif "独角兽" in category_name:
        return "startup", "technology"
    return "business", "business"


class Command(BaseCommand):
    help = 'Generate and attach a unique relevant image for each article based on its title'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-generate images even for articles that already have a thumbnail',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        self.stdout.write('Starting unique image generation for articles...')

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
            category_name = art.category.name if art.category else ""
            keywords, fallback_kw = get_optimized_keywords(art.title, category_name)
            
            filename = f"article_{art.id}.jpg"
            filepath = os.path.join(settings.MEDIA_ROOT, filename)

            self.stdout.write(f"[{idx+1}/{total}] Keywords: '{keywords}' for Title: '{art.title[:30]}'")
            
            downloaded = False
            # 尝试主要关键词
            for kw in [keywords, fallback_kw, "technology"]:
                image_url = f"https://loremflickr.com/800/450/{kw}?lock={art.id}"
                try:
                    headers = {'User-Agent': 'Mozilla/5.0'}
                    req = urllib.request.Request(image_url, headers=headers)
                    with urllib.request.urlopen(req, timeout=10) as response:
                        data = response.read()
                        if len(data) < 1000:
                            raise ValueError("Response too small")
                        with open(filepath, 'wb') as f:
                            f.write(data)
                    downloaded = True
                    break
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"    Failed with '{kw}': {e}. Trying fallback..."))

            if downloaded:
                art.thumbnail = f"/media/{filename}"
                art.save()
                success_count += 1
                self.stdout.write(self.style.SUCCESS(f"    OK -> {filename}"))
            else:
                self.stdout.write(self.style.ERROR(f"    All download attempts failed for article {art.id}"))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Attached unique relevant images to {success_count}/{total} articles."
        ))
