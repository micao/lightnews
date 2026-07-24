from django.test import Client, TestCase
from django.urls import reverse

from antispam.models import Captcha
from antispam.utils import verify_and_burn_captcha


class AntispamAPITests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_captcha_view_generation(self):
        """测试验证码生成接口，正确返回题目与 captcha_id，并写入数据库"""
        response = self.client.get(reverse('captcha_view'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('captcha_id', data)
        self.assertIn('question', data)

        captcha = Captcha.objects.filter(id=data['captcha_id']).first()
        self.assertIsNotNone(captcha)

    def test_verify_and_burn_captcha_success(self):
        """测试验证码校验成功后自动销毁 (Burn)"""
        captcha = Captcha.objects.create(answer='15')

        # 正确校验
        is_valid = verify_and_burn_captcha(str(captcha.id), '15')
        self.assertTrue(is_valid)

        # 校验后数据记录应已被从数据库销毁
        self.assertFalse(Captcha.objects.filter(id=captcha.id).exists())

    def test_verify_and_burn_captcha_incorrect_answer(self):
        """测试错误答案校验失败"""
        captcha = Captcha.objects.create(answer='20')

        is_valid = verify_and_burn_captcha(str(captcha.id), '99')
        self.assertFalse(is_valid)

    def test_verify_and_burn_captcha_non_existent(self):
        """测试不存在的 captcha_id 校验失败"""
        is_valid = verify_and_burn_captcha('non-existent-uuid', '10')
        self.assertFalse(is_valid)
