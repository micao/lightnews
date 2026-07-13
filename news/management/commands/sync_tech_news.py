import os
import re
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from django.core.management.base import BaseCommand
from django.utils import timezone
from news.models import LiveNews
from users.models import User

def translate_text(text):
    """使用免费谷歌翻译 API 实现 0 Token 高速翻译"""
    if not text:
        return ""
    try:
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode())
        
        # 拼接分段翻译结果
        translated = "".join([part[0] for part in res_json[0] if part[0]])
        return translated.strip()
    except Exception as e:
        # 降级处理：若翻译失败返回原文
        return text

class Command(BaseCommand):
    help = 'Fetch latest tech news from TechCrunch RSS, translate, and save as pending LiveNews drafts'

    def handle(self, *args, **options):
        self.stdout.write('Fetching tech news from TechCrunch Startups...')
        rss_url = 'https://techcrunch.com/category/startups/feed/'

        try:
            req = urllib.request.Request(
                rss_url,
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                xml_data = response.read()

            root = ET.fromstring(xml_data)
            items = root.findall('.//item')[:3]  # 只处理最新的 3 条以防过度占用连接
            
            author = User.objects.filter(username='admin_editor').first()
            if not author:
                author = User.objects.filter(is_superuser=True).first()
            if not author:
                author = User.objects.first()

            if not author:
                self.stdout.write(self.style.ERROR('No user found to assign as author.'))
                return

            imported_count = 0

            for item in items:
                title = item.find('title').text or ''
                desc = item.find('description').text or ''
                
                # 简单清洗 HTML 标签
                desc_clean = re.sub(r'<[^>]+>', '', desc).strip()
                # 截断描述以防太长
                if len(desc_clean) > 200:
                    desc_clean = desc_clean[:200] + "..."

                # 翻译标题与简介
                translated_title = translate_text(title)
                translated_desc = translate_text(desc_clean)

                # 组合最终快报格式
                content_text = f"【海外编译】{translated_title}。简报：{translated_desc}"
                
                # 限制长度以防正文溢出
                if len(content_text) > 400:
                    content_text = content_text[:397] + "..."

                # 去重校验：通过匹配前 15 个字判定是否已同步过该新闻
                title_sig = translated_title[:15]
                exists = LiveNews.objects.filter(content__contains=title_sig).exists()

                if not exists:
                    LiveNews.objects.create(
                        content=content_text,
                        urgency=LiveNews.Urgency.NORMAL,
                        impact=LiveNews.Impact.NEUTRAL,
                        author=author,
                        is_approved=False # 需要管理员在后台初审后才能前台展示
                    )
                    imported_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Imported pending draft: {translated_title}"))

            self.stdout.write(self.style.SUCCESS(f"Successfully processed TC RSS. Imported {imported_count} new pending drafts."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Sync tech news failed: {e}"))
