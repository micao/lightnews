import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from django.core.management.base import BaseCommand
from market.models import FundingDeal

class Command(BaseCommand):
    help = 'Synchronize latest funding deals from 36Kr and TechCrunch RSS feeds'

    def handle(self, *args, **options):
        self.stdout.write('Starting dual-source RSS funding deals synchronization...')

        # 36Kr 实时快讯 (中文) 和 TechCrunch (英文)
        feeds = [
            {
                'url': 'https://36kr.com/feed-newsflash',
                'parser': self.parse_36kr,
                'name': '36Kr (China)'
            },
            {
                'url': 'https://techcrunch.com/category/startups/feed/',
                'parser': self.parse_techcrunch,
                'name': 'TechCrunch (Global)'
            }
        ]

        total_imported = 0

        for feed in feeds:
            self.stdout.write(f"Fetching from {feed['name']}...")
            try:
                # 设置 10 秒超时防止请求卡死
                req = urllib.request.Request(
                    feed['url'],
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityNews/1.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    xml_data = response.read()
                
                deals = feed['parser'](xml_data)
                
                # 写入数据库 (去重校验：相同创企相同轮次在 24 小时内不重复写入)
                feed_imported = 0
                for deal in deals:
                    exists = FundingDeal.objects.filter(
                        company=deal['company'],
                        round=deal['round']
                    ).exists()
                    
                    if not exists:
                        FundingDeal.objects.create(
                            company=deal['company'],
                            round=deal['round'],
                            amount=deal['amount'],
                            investor=deal['investor'],
                            sector=deal['sector']
                        )
                        feed_imported += 1
                        total_imported += 1
                
                self.stdout.write(self.style.SUCCESS(f"Successfully imported {feed_imported} new deals from {feed['name']}."))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Failed to sync from {feed['name']}: {str(e)}. Skipping..."))

        self.stdout.write(self.style.SUCCESS(f"Sync complete. Total new deals added: {total_imported}"))

    def parse_36kr(self, xml_data):
        """解析 36Kr 快讯 RSS"""
        deals = []
        try:
            root = ET.fromstring(xml_data)
            items = root.findall('.//item')
            for item in items:
                title = item.find('title').text or ''
                description = item.find('description').text or ''
                full_text = title + " " + description

                # 检测是否为投融资事件：标题中含有“获”、“融”以及“投资”或“领投”
                if not ('融资' in title or '获投' in title or '领投' in title or '轮投资' in title or '完成了' in title):
                    continue

                # 1. 提取公司名称 (通常在「」或【】中)
                company_match = re.search(r'「([^」]+)」|【([^】]+)】', title)
                if not company_match:
                    continue
                company = company_match.group(1) or company_match.group(2)

                # 2. 提取融资轮次
                round_match = re.search(
                    r'(种子轮|天使轮|Pre-A\+?轮|A\+?轮|Pre-B\+?轮|B\+?轮|C\+?轮|D\+?轮|E\+?轮|F\+?轮|战略(?:投资|融资)|新一轮)',
                    title
                )
                round_name = round_match.group(1) if round_match else '新一轮'

                # 3. 融资金额 (如数千万人民币、超亿元级等)
                amount_match = re.search(
                    r'([数近]?[0-9]+(?:\.[0-9]+)?[万亿][美人]?[元币]?|亿元级|千万级|百万美元|亿美元)',
                    title
                )
                amount = amount_match.group(1) if amount_match else '数千万元'

                # 4. 投资机构
                investor = '国资与产业资本'
                # 寻找 “由XXX领投”
                lead_match = re.search(r'由([^，、获已完成]+)领投', full_text)
                if lead_match:
                    investor = lead_match.group(1).strip() + '领投'
                else:
                    # 寻找 “获XXX投资”
                    invest_match = re.search(r'获([^，、已完成]+)的?投资', full_text)
                    if invest_match:
                        investor = invest_match.group(1).strip()

                # 限制资方文字长度
                if len(investor) > 40:
                    investor = investor[:38] + '等'

                # 5. 板块分类 (从 category 标签获取，默认硬科技)
                sector = '硬科技'
                category_tags = item.findall('category')
                if category_tags:
                    sector_candidate = category_tags[0].text
                    if sector_candidate and len(sector_candidate) < 15:
                        sector = sector_candidate

                deals.append({
                    'company': company.strip(),
                    'round': round_name,
                    'amount': amount,
                    'investor': investor,
                    'sector': sector
                })
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error parsing 36Kr feed: {e}"))
        return deals

    def parse_techcrunch(self, xml_data):
        """解析 TechCrunch Startups RSS"""
        deals = []
        try:
            root = ET.fromstring(xml_data)
            items = root.findall('.//item')
            for item in items:
                title = item.find('title').text or ''
                
                # TechCrunch 融资新闻常见标题: "AI startup Cohere raises $500M from Nvidia"
                if 'raises' not in title.lower():
                    continue

                # 1. 解析融资金额 (如 $500M, €600M, $1.5B)
                amount_match = re.search(r'([$€£][0-9]+(?:\.[0-9]+)?[MB])', title)
                if not amount_match:
                    continue
                amount = amount_match.group(1)

                # 2. 提取公司名 (在 raises 之前的单词)
                raises_idx = title.lower().find('raises')
                pre_raises = title[:raises_idx].strip()
                # 剔除修饰词，如 "AI startup Cohere" -> 提取最后一个或后两个单词作为公司名
                words = pre_raises.split(' ')
                company = words[-1]
                if len(words) >= 2 and words[-2].lower() in ['startup', 'unicorn', 'maker', 'platform', 'app']:
                    company = words[-1]
                elif len(words) >= 2 and words[-1].lower() in ['technologies', 'ai', 'robotics', 'software']:
                    company = " ".join(words[-2:])

                # 3. 提取轮次
                round_match = re.search(r'(Series [A-G]|Seed round|Angel round|Seed)', title, re.IGNORECASE)
                round_name = round_match.group(1) if round_match else 'Venture'

                # 4. 提取投资机构 (raises XXX from YYY 或 raises XXX led by YYY)
                investor = 'Venture Capital'
                from_idx = title.lower().find('from ')
                led_idx = title.lower().find('led by ')
                
                if led_idx != -1:
                    investor = title[led_idx + 7:].strip()
                elif from_idx != -1:
                    investor = title[from_idx + 5:].strip()

                # 清理资方标点
                investor = re.sub(r'at \$[0-9]+.*', '', investor) # 移除估值后缀如 "at $10B valuation"
                investor = investor.strip().rstrip('.')
                if len(investor) > 40:
                    investor = investor[:38] + '...'

                # 5. 行业分类
                sector = 'Startups'
                category_tags = item.findall('category')
                for cat in category_tags:
                    cat_txt = cat.text
                    if cat_txt and cat_txt.lower() not in ['startups', 'funding', 'tc']:
                        sector = cat_txt
                        break

                deals.append({
                    'company': company.strip(),
                    'round': round_name.title(),
                    'amount': amount,
                    'investor': investor,
                    'sector': sector
                })
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error parsing TechCrunch feed: {e}"))
        return deals
