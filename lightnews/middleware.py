from django.conf import settings
from django.http import HttpResponse


class SimpleCORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'OPTIONS':
            response = HttpResponse()
        else:
            response = self.get_response(request)

        # 动态匹配请求来源 Origin
        origin = request.META.get('HTTP_ORIGIN')

        # 默认允许的本地开发跨域源
        allowed_origins = [
            'http://localhost:5173',
            'http://localhost',
            'http://127.0.0.1:5173',
            'http://127.0.0.1',
        ]

        # 生产环境引入域名白名单
        if not settings.DEBUG:
            allowed_origins.extend([
                'http://lightinthebrain.com',
                'https://lightinthebrain.com',
                'http://www.lightinthebrain.com',
                'https://www.lightinthebrain.com'
            ])

        # 如果请求来源在白名单内，动态设置 Access-Control-Allow-Origin
        if origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
        elif settings.DEBUG:
            # 默认开发模式兜底
            response['Access-Control-Allow-Origin'] = 'http://localhost:5173'

        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response
