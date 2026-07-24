from django.http import HttpResponse, JsonResponse


def get_openapi_spec(request):
    try:
        scheme = request.scheme
        host = request.get_host()
        server_url = f"{scheme}://{host}"
    except Exception:
        server_url = ""

    spec = {

        "openapi": "3.0.3",
        "info": {
            "title": "LightNews API",
            "description": "LightNews 前沿科技创投新闻平台 API 接口文档。所有 GET 接口访问均需要在 Header 中附加 `Authorization: Bearer <token>` 凭证。",
            "version": "1.0.0"
        },
        "servers": [
            {
                "url": server_url,
                "description": "Current Server"
            }
        ],
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "UUID",
                    "description": "请输入在 `/api/auth/login/` 接口获取的 Auth Token。格式: `c0326442fd5548ceb934789df6eb142b`"
                }
            }
        },
        "security": [
            {
                "BearerAuth": []
            }
        ],
        "tags": [
            {"name": "Auth", "description": "用户鉴权与 Token 管理接口"},
            {"name": "Articles", "description": "新闻文章与深度报道接口"},
            {"name": "Categories", "description": "文章分类接口"},
            {"name": "LiveNews", "description": "即时创投快讯接口"},
            {"name": "Market", "description": "创投投融资与行情数据接口"},
            {"name": "Interactions", "description": "文章评论与点赞互动接口"},
            {"name": "Antispam", "description": "防垃圾人机验证接口"},
            {"name": "Admin", "description": "系统管理员专用接口"}
        ],
        "paths": {
            "/api/auth/login/": {
                "post": {
                    "tags": ["Auth"],
                    "summary": "用户登录换取 Auth Token",
                    "description": "公开端点。提交用户名和密码换取有效的 Auth Token。在 DEBUG 模式下支持无密码快捷登录（模拟用户: `guest_user` 或 `admin_editor`）。",
                    "security": [],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "username": {"type": "string", "example": "guest_user"},
                                        "password": {"type": "string", "example": "default_pass_123"},
                                        "roleType": {"type": "string", "example": "user", "enum": ["user", "admin"]}
                                    },
                                    "required": ["username"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "登录成功，返回 Token 及用户信息",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "token": {"type": "string", "example": "c0326442fd5548ceb934789df6eb142b"},
                                            "user": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        },
                        "400": {"description": "用户名或密码错误"}
                    }
                }
            },
            "/api/auth/profile/": {
                "get": {
                    "tags": ["Auth"],
                    "summary": "获取当前已登录用户的个人资料",
                    "description": "需要有效 Bearer Token 凭证。",
                    "responses": {
                        "200": {
                            "description": "成功获取个人资料",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "user": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"}
                    }
                }
            },
            "/api/antispam/captcha/": {
                "get": {
                    "tags": ["Antispam"],
                    "summary": "生成人机验证数学计算题目",
                    "description": "获取算术验证码 ID 和题目文本。",
                    "responses": {
                        "200": {
                            "description": "成功生成验证码",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "captcha_id": {"type": "string"},
                                            "question": {"type": "string", "example": "7 + 3 = ?"}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"}
                    }
                }
            },
            "/api/articles/": {
                "get": {
                    "tags": ["Articles"],
                    "summary": "获取新闻文章列表 (支持分页与分类筛选)",
                    "description": "获取文章列表。普通用户仅可见 published 状态文章。",
                    "parameters": [
                        {"name": "page", "in": "query", "description": "页码", "schema": {"type": "integer", "default": 1}},
                        {"name": "limit", "in": "query", "description": "每页条数", "schema": {"type": "integer", "default": 5}},
                        {"name": "category", "in": "query", "description": "分类名称筛选", "schema": {"type": "string"}},
                        {"name": "status", "in": "query", "description": "文章状态 (published / draft)", "schema": {"type": "string", "default": "published"}},
                        {"name": "q", "in": "query", "description": "搜索关键词", "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "成功返回文章列表",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "total": {"type": "integer"},
                                            "page": {"type": "integer"},
                                            "limit": {"type": "integer"},
                                            "has_more": {"type": "boolean"},
                                            "articles": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"}
                    }
                }
            },
            "/api/articles/{slug}/": {
                "get": {
                    "tags": ["Articles"],
                    "summary": "获取单篇文章详情",
                    "description": "根据 slug 获取文章全文及相关推荐。VIP 专享文章对未登录或非 VIP 用户截断显示。",
                    "parameters": [
                        {"name": "slug", "in": "path", "required": True, "description": "文章唯一 Slug 标识", "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "成功获取文章详情",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "article": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"},
                        "404": {"description": "文章不存在"}
                    }
                }
            },
            "/api/categories/": {
                "get": {
                    "tags": ["Categories"],
                    "summary": "获取所有文章分类",
                    "description": "获取全站分类列表信息。",
                    "responses": {
                        "200": {
                            "description": "成功返回分类列表",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "categories": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"}
                    }
                }
            },
            "/api/livenews/": {
                "get": {
                    "tags": ["LiveNews"],
                    "summary": "获取即时创投快讯列表",
                    "description": "获取最新审核通过的 10 条快讯。",
                    "responses": {
                        "200": {
                            "description": "成功返回快讯列表",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "news": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"}
                    }
                }
            },
            "/api/market/ticker/": {
                "get": {
                    "tags": ["Market"],
                    "summary": "获取最新投融资项目数据滚动条",
                    "description": "获取最新 10 条创投投融资成交事件。",
                    "responses": {
                        "200": {
                            "description": "成功返回投融资项目列表",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "deals": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"}
                    }
                }
            },
            "/api/interactions/comment/": {
                "get": {
                    "tags": ["Interactions"],
                    "summary": "获取指定文章的评论树",
                    "description": "获取文章下已通过审核的评论及回复树。",
                    "parameters": [
                        {"name": "article_slug", "in": "query", "required": True, "description": "文章 Slug 标识", "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "成功返回评论树",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "comments": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "400": {"description": "缺少参数 article_slug"},
                        "401": {"description": "未授权或 Token 已过期"},
                        "404": {"description": "文章未找到"}
                    }
                }
            },
            "/api/seed/": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "一键填充开发测试创投种子数据",
                    "description": "生成默认分类、专栏作者、创投文章及快讯数据。",
                    "responses": {
                        "200": {"description": "成功填充种子数据"},
                        "401": {"description": "未授权或 Token 已过期"}
                    }
                }
            },
            "/api/admin/users/pending/": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "[管理员] 查看待审核的写作者/专栏作者申请",
                    "description": "需要具有管理员权限的 Bearer Token。",
                    "responses": {
                        "200": {
                            "description": "成功返回待审核作者列表",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "pending_users": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"},
                        "403": {"description": "无管理员权限"}
                    }
                }
            },
            "/api/admin/comments/": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "[管理员] 查看所有待审核的评论列表",
                    "description": "需要具有管理员权限的 Bearer Token。",
                    "responses": {
                        "200": {
                            "description": "成功返回待审核评论",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "comments": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"},
                        "403": {"description": "无管理员权限"}
                    }
                }
            },
            "/api/admin/livenews/": {
                "get": {
                    "tags": ["Admin"],
                    "summary": "[管理员] 查看所有快讯（含待审核及草稿）",
                    "description": "需要具有管理员权限的 Bearer Token。",
                    "responses": {
                        "200": {
                            "description": "成功返回快讯列表",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": {"type": "boolean", "example": True},
                                            "news": {"type": "array", "items": {"type": "object"}}
                                        }
                                    }
                                }
                            }
                        },
                        "401": {"description": "未授权或 Token 已过期"},
                        "403": {"description": "无管理员权限"}
                    }
                }
            }
        }
    }
    return JsonResponse(spec)


def swagger_schema_view(request):
    return get_openapi_spec(request)


def swagger_ui_view(request):
    html_content = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>LightNews API Documentation - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #3b82f6; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .topbar-wrapper img { content: url('https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png'); }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "/api/schema/",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout",
                persistAuthorization: true,
                displayRequestDuration: true,
                docExpansion: "list",
                filter: true
            });
            window.ui = ui;
        };
    </script>
</body>
</html>
"""
    return HttpResponse(html_content, content_type="text/html")
