from django.utils import timezone

from antispam.models import Captcha


def verify_and_burn_captcha(captcha_id, answer):
    """
    通用验证码校验逻辑，校验完即焚以防止重放攻击。
    返回 (is_valid, error_message) 元组。
    """
    if not captcha_id or not answer:
        return False, "验证码和计算结果不能为空"
    try:
        captcha = Captcha.objects.get(id=captcha_id)
        # 5 分钟超时
        if (timezone.now() - captcha.created_at).total_seconds() > 300:
            captcha.delete()
            return False, "验证码已过期，请点击重试"

        if captcha.answer != str(answer).strip():
            captcha.delete()
            return False, "验证码错误，请重新输入"

        captcha.delete()
        return True, "验证成功"
    except (Captcha.DoesNotExist, ValueError):
        return False, "验证码无效，请重新加载"
