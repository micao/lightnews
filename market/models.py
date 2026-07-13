from django.db import models

class MarketInstrument(models.Model):
    """行情资产标的信息注册表"""
    class ClassType(models.TextChoices):
        STOCK = 'stock', '股票'
        BOND = 'bond', '债券'
        FOREX = 'forex', '外汇'
        COMMODITY = 'commodity', '大宗商品'
        CRYPTO = 'crypto', '加密货币'
        INDEX = 'index', '指数'

    symbol = models.CharField(max_length=50, unique=True) # 标的唯一代码，例如 'USD/CNY', 'TSLA.US'
    name = models.CharField(max_length=100)               # 通用名
    class_type = models.CharField(max_length=30, choices=ClassType.choices, db_column='class')
    exchange = models.CharField(max_length=50, blank=True, null=True) # 交易所代码
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'market_instruments'
        indexes = [
            models.Index(fields=['class_type'], name='idx_inst_class')
        ]

class FundingDeal(models.Model):
    """大额创投投融资交易记录"""
    company = models.CharField(max_length=100)      # 创企/公司名称 (如：月之暗面)
    round = models.CharField(max_length=50)         # 融资轮次 (如：B轮)
    amount = models.CharField(max_length=100)       # 融资金额 (如：10亿美元)
    investor = models.CharField(max_length=255)     # 投资人/机构 (如：阿里领投)
    sector = models.CharField(max_length=100)       # 细分板块 (如：大语言模型)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'funding_deals'
        ordering = ['-id']

