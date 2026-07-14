# Changelog (更新日志)

本文件记录了 LightNews 项目的所有主要版本迭代、功能改进、缺陷修复和系统配置变更。

---

## [v1.0.0] - 2026-07-14 (PR #3)

*合并了 [PR #3](https://github.com/micao/lightnews/pull/3)：首个完整版本发布及持续集成与部署（CI/CD）管道架设。*

### 🚀 新增功能 (Added)
*   **用户管理与严苛鉴权**:
    *   在前端注册页面 [Login.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/pages/Login.tsx) 中新增了研究员自助注册表单与输入验证（用户名 $\ge 3$ 位，密码 $\ge 6$ 位，支持手机号正则校验）。
    *   在 [AuthContext.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/context/AuthContext.tsx) 中集成了注册服务 API 提交。
    *   重构了后端的 [users/views.py](file:///home/micao/PyCharmMiscProject/lightnews/users/views.py)，对非 Mock 默认账户强制执行严格的密码哈希匹配验证，堵塞了原先登录时的免密空密码漏洞。
*   **关联文章双向自引用推荐**:
    *   在 [news/models.py](file:///home/micao/PyCharmMiscProject/lightnews/news/models.py) 的 `Article` 模型中新增了对称自关联 Many-to-Many 字段 `related_articles`。
    *   为管理员后台新增了创建和更新文章时保存关联引用关系的 API 端点。
    *   在后台管理仪表板 [AdminDashboard.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/pages/AdminDashboard.tsx) 中集成了基于 Mui `Autocomplete` 的异步关键字搜索与标签删除（Chip）展示。
    *   在文章详情页面 [ArticleDetail.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/pages/ArticleDetail.tsx) 底部新增了“关联研究”板块，展示有悬停特效的文章卡片。
*   **CI/CD 与代码质量核查流水线**:
    *   配置了持续集成流水线 [.github/workflows/ci.yml](file:///home/micao/PyCharmMiscProject/lightnews/.github/workflows/ci.yml)，在每次 Push 或 PR 时自动执行 Python Ruff 规范性检测、前端 Oxlint 检查、TypeScript 类型推导安全检验，以及 Django 单元测试。
    *   配置了持续部署流水线 [.github/workflows/deploy.yml](file:///home/micao/PyCharmMiscProject/lightnews/.github/workflows/deploy.yml)，支持在 GitHub 上发布 Release 或手动触发部署。构建前后端 Docker 镜像并推送至 Docker Hub，随后 SSH 热更新目标服务器。
*   **零停机数据库热部署**:
    *   在 CD 重启脚本中引入了 `--no-deps web nginx` 策略，升级部署时只重建应用和网关容器，而让数据库 `db` 容器保持 100% 在线，实现服务更新不中断。

### 🔧 改进与优化 (Changed)
*   **数据库本地持久化**:
    *   重构了 [docker-compose.yaml](file:///home/micao/PyCharmMiscProject/lightnews/docker-compose.yaml)，将数据库、静态资源和媒体资源的 Named Volumes 更改为宿主机目录直连挂载（如 `./postgres_data`），确保在容器销毁重建时，生产数据绝不丢失。
*   **Nginx 生产发布适配**:
    *   更新了 [deploy/nginx/prod.conf](file:///home/micao/PyCharmMiscProject/lightnews/deploy/nginx/prod.conf)，将 `server_name` 绑定为您的域名 `lightinthebrain.com` 与 `www.lightinthebrain.com`。
    *   新增了静态托管前端 SPA 及路由 fallback 逻辑，使 Nginx 能够完美承载 React 单页面路由。
    *   新建了 [deploy/nginx/Dockerfile](file:///home/micao/PyCharmMiscProject/lightnews/deploy/nginx/Dockerfile) 用于将前端打包编译后的 `dist` 构建为独立的、立即可用的 Nginx 镜像。
*   **Makefile 功能命令补齐**:
    *   在 [Makefile](file:///home/micao/PyCharmMiscProject/lightnews/Makefile) 中补充了 `test`、`lint`、`lint-backend` 和 `lint-frontend` 的全局简易入口指令。

### 🐛 缺陷修复 (Fixed)
*   **图片 404 问题修复**:
    *   新编写了 Django 管理指令 `attach_article_images`，能够自动抓取高精度的科技/金融图库图片配图，解决了由于 Nginx 容器内 `/code/mediafiles` 目录缺失静态图造成的页面 404 错误。
*   **前端未使用变量的编译错误修复**:
    *   删除了 [AdminDashboard.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/pages/AdminDashboard.tsx) 中未使用的 `CircularProgress` 库引入，解决了在 strict 模式编译下造成打包失败的问题。
*   **前端 Linter 警告清理**:
    *   修复并处理了包括 [Home.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/pages/Home.tsx)、[ArticleDetail.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/pages/ArticleDetail.tsx) 与 [AdminDashboard.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/pages/AdminDashboard.tsx) 等页面的 4 项 React Hook `exhaustive-deps` 缺失依赖警告。
    *   在 [AuthContext.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/context/AuthContext.tsx) 与 [I18nContext.tsx](file:///home/micao/PyCharmMiscProject/lightnews/frontend/src/context/I18nContext.tsx) 中添加了 ESLint 注释，解决了 2 项关于 Fast Refresh 混杂导出的警告。
    *   本地核查命令 `make lint-frontend` 已实现 **0 警告，0 报错**。
*   **部署阶段数据库连接失败修复**:
    *   移除了 CD 重启阶段的 `--no-deps` 限制。解决了当数据库 `db` 服务本身尚未启动时，直接应用 `--no-deps web nginx` 会导致容器间无法解析 `db` 主机名（Temporary failure in name resolution）的问题。现在 Docker Compose 会智能识别并拉起未启动的 `db` 容器，而对于已在线的 `db` 容器则保持无缝运行。
