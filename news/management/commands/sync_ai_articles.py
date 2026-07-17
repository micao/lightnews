import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from news.models import Article, Category
from users.models import User


def translate_text(text):
    """0 Token 谷歌翻译 API"""
    if not text:
        return ""
    try:
        # 谷歌翻译可能限制单次请求长度，切片以防异常
        if len(text) > 1500:
            parts = [text[i:i+1500] for i in range(0, len(text), 1500)]
            return "".join([translate_text(p) for p in parts])

        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode())

        translated = "".join([part[0] for part in res_json[0] if part[0]])
        return translated.strip()
    except Exception:
        return text

def get_optimized_keywords(title, category_name=""):
    title_lower = title.lower()

    # 根据标题内容映射最贴切的无版权 stock photo 关键词
    if any(w in title_lower for w in ['ai', 'artificial intelligence', '人工智能', '智能', '模型', 'gpt', 'llm', 'deepseek', 'neural', 'hugging face', 'machine learning']):
        return "neural,network,artificial,intelligence"
    if any(w in title_lower for w in ['robot', 'hardware', '机器人', '硬件', 'device', 'drone', '具身智能']):
        return "robot,robotic,automation"
    if any(w in title_lower for w in ['chip', 'semiconductor', '光刻', '芯片', '半导体', 'cpu', 'gpu', '算力']):
        return "microchip,silicon,circuit"
    if any(w in title_lower for w in ['funding', 'capital', 'finance', 'ipo', 'valuation', 'invest', '融资', '投资', '估值', '独角兽', 'unicorn', '创业', '初创']):
        return "finance,chart,investment"
    if any(w in title_lower for w in ['security', 'hacker', 'fraud', 'attack', 'leak', '安全', '黑客', '锁屏']):
        return "cyber,security,shield,server"

    return "artificial,intelligence,cyber"

def extract_article_body(url):
    """流式下载 HTML 并解析出正文段落与头图"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')

        # 1. 提取首张大图
        img_url = None
        img_matches = re.findall(r'<img[^>]+src=["\'](https?://[^"\']+\.(?:jpg|jpeg|png))["\']', html)
        for img in img_matches:
            if 'avatar' not in img.lower() and 'logo' not in img.lower() and 'icon' not in img.lower() and 'ad' not in img.lower():
                img_url = img
                break

        # 2. 过滤垃圾 HTML 块
        html_clean = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        html_clean = re.sub(r'<style[^>]*>.*?</style>', '', html_clean, flags=re.DOTALL)
        html_clean = re.sub(r'<nav[^>]*>.*?</nav>', '', html_clean, flags=re.DOTALL)
        html_clean = re.sub(r'<header[^>]*>.*?</header>', '', html_clean, flags=re.DOTALL)
        html_clean = re.sub(r'<footer[^>]*>.*?</footer>', '', html_clean, flags=re.DOTALL)

        # 3. 提取所有 <p> 标签文字段落
        p_matches = re.findall(r'<p[^>]*>(.*?)</p>', html_clean, flags=re.DOTALL)
        paragraphs = []
        for p in p_matches:
            txt = re.sub(r'<[^>]+>', '', p).strip()
            # 过滤掉较短的修饰性语句
            if len(txt) > 50 and 'javascript' not in txt.lower():
                paragraphs.append(txt)

        return paragraphs, img_url
    except Exception:
        return [], None

def download_image(url, slug_str):
    """安全下载图片保存到本地 mediafiles"""
    if not url or not url.startswith('http'):
        return None
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)

        safe_slug = re.sub(r'[^a-zA-Z0-9_-]', '', slug_str)
        filename = f"scraped_{safe_slug[:40]}.png"
        filepath = os.path.join(settings.MEDIA_ROOT, filename)

        with urllib.request.urlopen(req, timeout=10) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())

        return f"/media/{filename}"
    except Exception:
        return None


class Command(BaseCommand):
    help = 'Fetch full articles from AI RSS feeds, translate and summarize, and save as pending drafts under Artificial Intelligence category'

    def handle(self, *args, **options):
        self.stdout.write('Initializing full-text AI articles synchronization scraper...')

        feeds = [
            {
                'url': 'https://techcrunch.com/category/artificial-intelligence/feed/',
                'name': 'TechCrunch Artificial Intelligence'
            },
            {
                'url': 'https://venturebeat.com/category/ai/feed/',
                'name': 'VentureBeat AI'
            }
        ]

        # 获取默认作者
        author = User.objects.filter(username='admin_editor').first()
        if not author:
            author = User.objects.filter(is_superuser=True).first()
        if not author:
            author = User.objects.first()

        if not author:
            self.stdout.write(self.style.ERROR('No author found in database.'))
            return

        total_scraped = 0

        # 获取/创建 category
        category_obj, _ = Category.objects.get_or_create(
            name='Artificial Intelligence',
            defaults={'slug': 'artificial-intelligence'}
        )

        for feed in feeds:
            self.stdout.write(f"Scraping RSS feed: {feed['name']}...")
            try:
                req = urllib.request.Request(
                    feed['url'],
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    xml_data = response.read()

                root = ET.fromstring(xml_data)
                # 检查最新的 15 篇，但每个源最多只新增抓取 3 篇，避免过载
                items = root.findall('.//item')[:15]
                scraped_in_feed = 0

                for item in items:
                    if scraped_in_feed >= 3:
                        break
                    title = item.find('title').text or ''
                    link = item.find('link').text or ''

                    if not link:
                        continue

                    # 判定文章是否已抓取过 (根据标题模糊去重)
                    title_clean = re.sub(r'[^a-zA-Z0-9]', '', title).lower()[:30]
                    temp_slug = slugify(title[:100])
                    exists = Article.objects.filter(slug__icontains=temp_slug[:20]).exists()
                    if exists:
                        continue

                    self.stdout.write(f" -> Fetching full text from: {link}")
                    paragraphs, img_url = extract_article_body(link)

                    if not paragraphs:
                        self.stdout.write(self.style.WARNING("    No article body paragraphs extracted. Skipping..."))
                        continue

                    # 1. 全文翻译
                    translated_paragraphs = []
                    for idx, para in enumerate(paragraphs[:10]):  # 最多翻译前 10 段，限制篇幅
                        self.stdout.write(f"    Translating paragraph {idx+1}/{min(len(paragraphs), 10)}...")
                        translated_para = translate_text(para)
                        translated_paragraphs.append(translated_para)

                    # 2. 翻译标题
                    translated_title = translate_text(title)

                    # 3. 生成核心摘要 (取前两段中文翻译的切片，控制在 150 字内)
                    abstract_paragraphs = [p for p in translated_paragraphs if p]
                    summary_text = "，".join(abstract_paragraphs[:2])
                    if len(summary_text) > 180:
                        summary_text = summary_text[:177] + "..."

                    # 4. 头图配图下载
                    thumbnail_path = download_image(img_url, temp_slug)

                    # 降级备用：如果文章内无图，用 loremflickr 下载匹配的高清科技感图片
                    if not thumbnail_path:
                        combined_title = f"{title} {translated_title}"
                        keywords = get_optimized_keywords(combined_title)
                        import time
                        lock_id = int(time.time() * 1000) % 999999
                        fallback_url = f"https://loremflickr.com/800/450/{keywords}?lock={lock_id}"
                        thumbnail_path = download_image(fallback_url, temp_slug)

                    # 5. 拼装成符合富文本排版要求的 HTML 内容
                    content_html = "".join([f"<p>{p}</p>" for p in translated_paragraphs])

                    # 6. 保存为待审核草稿 (status = DRAFT)
                    Article.objects.create(
                        title=translated_title,
                        slug=f"scraped-ai-{temp_slug[:150]}-{timezone.now().strftime('%s')}",
                        summary=summary_text,
                        content=content_html,
                        thumbnail=thumbnail_path,
                        source_url=link,
                        author=author,
                        category=category_obj,
                        status=Article.Status.DRAFT, # 强制设为草稿，等待管理员发布
                        importance=3
                    )
                    total_scraped += 1
                    scraped_in_feed += 1
                    self.stdout.write(self.style.SUCCESS(f"    Successfully imported AI draft: {translated_title}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error scraping {feed['name']}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"AI Scraper run complete. Scraped {total_scraped} new AI articles as drafts."))
