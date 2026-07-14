from django.contrib import admin

from news.models import Article, Category, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'sort_order')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'status', 'publish_at', 'created_at')
    list_filter = ('status', 'category', 'is_vip_only')
    search_fields = ('title', 'summary', 'content')
    prepopulated_fields = {'slug': ('title',)}
