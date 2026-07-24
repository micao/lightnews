import random

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from antispam.models import Captcha


@csrf_exempt
@require_GET
def captcha_view(request):


    """数学计算验证码生成接口"""

    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    operator = random.choice(['+', '-'])

    if operator == '+':
        question = f"{num1} + {num2} = ?"
        answer = str(num1 + num2)
    else:
        if num1 < num2:
            num1, num2 = num2, num1
        question = f"{num1} - {num2} = ?"
        answer = str(num1 - num2)

    captcha = Captcha.objects.create(answer=answer)
    return JsonResponse({
        'success': True,
        'captcha_id': str(captcha.id),
        'question': question
    })
