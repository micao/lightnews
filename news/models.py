from django.db import models
from django.conf import settings

class Category(models.Model):
    """文章分类"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        ordering = ['sort_order', 'id']

class Tag(models.Model):
    """标签体系 (关联特定金融市场主题)"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tags'

class Article(models.Model):
    """深度报道新闻主表"""
    class Status(models.TextChoices):
        DRAFT = 'draft', '草稿'
        UNDER_REVIEW = 'under_review', '待审核'
        SCHEDULED = 'scheduled', '定时发布'
        PUBLISHED = 'published', '已发布'
        ARCHIVED = 'archived', '已存档'

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    summary = models.TextField(blank=True, null=True)
    content = models.TextField()
    thumbnail = models.CharField(max_length=255, blank=True, null=True)
    source_url = models.URLField(max_length=500, blank=True, null=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='articles')
    category = models.ForeignKey(Category, on_delete=models.RESTRICT, related_name='articles')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    importance = models.IntegerField(default=1)  # 1-5级重要星级
    is_vip_only = models.BooleanField(default=False) # 是否为付费深度阅读
    views_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    publish_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tags = models.ManyToManyField(Tag, through='ArticleTagRelation')
    instruments = models.ManyToManyField('market.MarketInstrument', through='ArticleInstrumentRelation')

    class Meta:
        db_table = 'articles'
        indexes = [
            models.Index(fields=['status', 'publish_at'], name='idx_art_status_pub'),
            models.Index(fields=['importance'], name='idx_art_importance'),
        ]

class ArticleRevision(models.Model):
    """历史修订记录"""
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='revisions')
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    content = models.TextField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    version = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'article_revisions'
        unique_together = ('article', 'version')

class SpecialTopic(models.Model):
    """专题分类"""
    title = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    banner_url = models.URLField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    articles = models.ManyToManyField(Article, through='ArticleTopicRelation')

    class Meta:
        db_table = 'special_topics'

class ArticleTopicRelation(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    topic = models.ForeignKey(SpecialTopic, on_delete=models.CASCADE)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'article_topic_relations'
        unique_together = ('article', 'topic')

class ArticleTagRelation(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = 'article_tag_relations'
        unique_together = ('article', 'tag')

class ArticleInstrumentRelation(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    instrument = models.ForeignKey('market.MarketInstrument', on_delete=models.CASCADE)

    class Meta:
        db_table = 'article_instrument_relations'
        unique_together = ('article', 'instrument')


class LiveNews(models.Model):
    """实时财经快讯表。"""
    class Urgency(models.TextChoices):
        NORMAL = 'normal', '普通'
        WARN = 'warn', '警告 (黄框)'
        CRITICAL = 'critical', '特急突发 (红框)'

    class Impact(models.TextChoices):
        BULLISH = 'bullish', '利多 (红)'
        BEARISH = 'bearish', '利空 (绿)'
        NEUTRAL = 'neutral', '中性'

    content = models.TextField()
    urgency = models.CharField(max_length=20, choices=Urgency.choices, default=Urgency.NORMAL)
    impact = models.CharField(max_length=20, choices=Impact.choices, default=Impact.NEUTRAL)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT)
    publish_time = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True)
    source_url = models.URLField(max_length=500, blank=True, null=True)

    instruments = models.ManyToManyField('market.MarketInstrument', through='LiveNewsInstrumentRelation')

    class Meta:
        db_table = 'live_news'
        unique_together = (('id', 'publish_time'),)

class LiveNewsInstrumentRelation(models.Model):
    live_news = models.ForeignKey(LiveNews, on_delete=models.CASCADE)
    instrument = models.ForeignKey('market.MarketInstrument', on_delete=models.CASCADE)

    class Meta:
        db_table = 'livenews_instrument_relations'
