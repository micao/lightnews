from django.contrib import admin
from django.urls import path
from users.views import register_view, login_view, profile_view
from news.views import article_list_view, article_detail_view, live_news_list_view, seed_data_view
from market.views import funding_deals_list_view
from interactions.views import (
    comment_list_view,
    comment_create_view,
    like_toggle_view,
    admin_comments_view,
    admin_comment_approve_view
)

from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def comment_dispatch(request):
    if request.method == 'POST':
        return comment_create_view(request)
    return comment_list_view(request)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 鉴权
    path('api/auth/register/', register_view),
    path('api/auth/login/', login_view),
    path('api/auth/profile/', profile_view),
    
    # 新闻与快讯
    path('api/articles/', article_list_view),
    path('api/articles/<slug:slug>/', article_detail_view),
    path('api/livenews/', live_news_list_view),
    path('api/seed/', seed_data_view),
    
    # 市场行情投融资滚动条
    path('api/market/ticker/', funding_deals_list_view),
    
    # 社交互动
    path('api/interactions/comment/', comment_dispatch),
    path('api/interactions/like/', like_toggle_view),
    
    # 管理员后台
    path('api/admin/comments/', admin_comments_view),
    path('api/admin/comments/approve/', admin_comment_approve_view),
]
