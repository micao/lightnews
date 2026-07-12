from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """自定义用户模型，支持手机号/邮箱快捷登录"""
    phone_number = models.CharField(_("手机号码"), max_length=20, unique=True, blank=True, null=True)
    roles = models.JSONField(_("用户角色"), default=list)
    
    class Meta:
        db_table = 'users'

class UserProfile(models.Model):
    """用户详情及分析师认证"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='profile')
    nickname = models.CharField(max_length=100, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_analyst = models.BooleanField(default=False) # 是否是认证分析师/专栏作者
    analyst_credentials = models.CharField(max_length=255, blank=True, null=True) # 职业资格证号
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

class Membership(models.Model):
    """用户 VIP 会员等级与订阅记录"""
    class VIPTier(models.TextChoices):
        FREE = 'free', _('普通用户')
        MONTHLY_VIP = 'monthly_vip', _('月度会员')
        ANNUAL_VIP = 'annual_vip', _('年度黄金会员')
        PREMIUM = 'premium_partner', _('至尊核心合伙人')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    tier = models.CharField(max_length=30, choices=VIPTier.choices, default=VIPTier.FREE)
    starts_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    auto_renew = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'memberships'
        indexes = [
            models.Index(fields=['user', 'tier'], name='idx_mbr_user_tier')
        ]

class UserToken(models.Model):
    """用户鉴权 Token 表"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_tokens'
