import os
import json
import urllib.request
from django.core.management.base import BaseCommand
from django.utils import timezone
from news.models import LiveNews
from users.models import User

class Command(BaseCommand):
    help = 'Fetch latest stock, crypto, and currency prices from Yahoo Finance and publish a LiveNews report'

    def handle(self, *args, **options):
        self.stdout.write('Fetching global financial indices...')

        symbols = {
            '^GSPC': {'name': '标普500', 'suffix': '点'},
            '^IXIC': {'name': '纳指', 'suffix': '点'},
            'BTC-USD': {'name': '比特币 (BTC)', 'suffix': '美元'},
            'EURCNY=X': {'name': '欧元/人民币', 'suffix': ''}
        }

        results = []
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

        for symbol, info in symbols.items():
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = json.loads(response.read().decode())
                
                meta = data['chart']['result'][0]['meta']
                price = meta['regularMarketPrice']
                prev_close = meta['previousClose']
                
                change = price - prev_close
                change_pct = (change / prev_close) * 100
                sign = '+' if change_pct >= 0 else ''
                
                results.append(
                    f"{info['name']}: {price:,.2f}{info['suffix']} ({sign}{change_pct:.2f}%)"
                )
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Failed to fetch {symbol}: {e}"))

        if not results:
            self.stdout.write(self.style.ERROR('No financial data was retrieved. Skipping creation.'))
            return

        # 组装快报正文
        content_text = "【实时快报】全球科技与行情动态：" + "；".join(results) + "。"

        # 获取管理员用户作为发布者
        author = User.objects.filter(username='admin_editor').first()
        if not author:
            author = User.objects.filter(is_superuser=True).first()
        if not author:
            author = User.objects.first()

        if not author:
            self.stdout.write(self.style.ERROR('No user exists in database to publish.'))
            return

        # 去重与覆盖：如果在 6 小时内已经发布过科技行情简报，直接更新原内容及发布时间，防止刷屏
        from datetime import timedelta
        six_hours_ago = timezone.now() - timedelta(hours=6)

        existing_news = LiveNews.objects.filter(
            author=author,
            content__startswith="【实时快报】全球科技与行情动态",
            created_at__gte=six_hours_ago
        ).first()

        if existing_news:
            existing_news.content = content_text
            existing_news.publish_time = timezone.now()
            existing_news.save()
            self.stdout.write(self.style.SUCCESS(f"Updated existing financial live news: {content_text}"))
        else:
            LiveNews.objects.create(
                content=content_text,
                urgency=LiveNews.Urgency.NORMAL,
                impact=LiveNews.Impact.NEUTRAL,
                author=author,
                is_approved=True # 金融快报官方直接过审
            )
            self.stdout.write(self.style.SUCCESS(f"Published new financial live news: {content_text}"))
