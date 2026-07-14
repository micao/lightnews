from django.conf import settings
from django.db import models


class Comment(models.Model):
    """统一评论表"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    article = models.ForeignKey('news.Article', on_delete=models.CASCADE, null=True, blank=True)
    live_news = models.ForeignKey('news.LiveNews', on_delete=models.CASCADE, null=True, blank=True)

    content = models.TextField()
    is_approved = models.BooleanField(default=True)
    likes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        indexes = [
            models.Index(fields=['article'], name='idx_cmt_article', condition=models.Q(article__isnull=False)),
            models.Index(fields=['parent'], name='idx_cmt_parent'),
        ]

class Bookmark(models.Model):
    """文章收藏"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    article = models.ForeignKey('news.Article', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'
        unique_together = ('user', 'article')

class Like(models.Model):
    """文章/快讯/评论的点赞"""
    class TargetType(models.TextChoices):
        ARTICLE = 'article', '文章'
        LIVE_NEWS = 'live_news', '快讯'
        COMMENT = 'comment', '评论'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'likes'
        unique_together = ('user', 'target_type', 'target_id')

class Follow(models.Model):
    """关注体系 (关注作者、主题标签、专题栏目)"""
    class TargetType(models.TextChoices):
        AUTHOR = 'author', '分析师'
        TAG = 'tag', '标签'
        TOPIC = 'topic', '专题'

    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follows'
        unique_together = ('follower', 'target_type', 'target_id')

class Watchlist(models.Model):
    """用户自选股清单"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    instrument = models.ForeignKey('market.MarketInstrument', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_watchlists'
        unique_together = ('user', 'instrument')
