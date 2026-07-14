import random

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from antispam.models import Captcha


@csrf_exempt
def captcha_view(request):
    """数学计算验证码生成接口"""
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': '仅支持 GET 请求'}, status=405)

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
