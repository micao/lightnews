import uuid

from django.db import models


class Captcha(models.Model):
    """通用验证码校验表"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    answer = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'antispam_captchas'
