# LightNews 创投科技快报 & 深度分析平台

本文件包含 LightNews 项目的系统架构、本地开发配置、构建测试命令、CI/CD 流程及线上自动化发布配置的完整指南。采用高结构化设计，旨在为人类开发者与 AI 大语言模型（LLM）提供清晰的指引。

---

## 🗺️ 项目技术栈 (Tech Stack)

### 后端 (Backend)
*   **语言**: Python 3.12+
*   **框架**: Django 6.x (DRF / MVC 混合架构)
*   **数据库**: PostgreSQL 15-alpine (生产环境) / SQLite (CI 测试环境)
*   **服务网关**: Nginx + Gunicorn (WSGI)

### 前端 (Frontend)
*   **框架**: React 18+ (Vite 构建工具)
*   **语言**: TypeScript (严格模式 `"noUnusedLocals": true`)
*   **组件库**: Material UI (MUI) v5
*   **状态管理**: Context API (AuthContext)

### 代码质量检查 (Code Quality & Linters)
*   **后端**: Ruff (集成 Lint & Formatter，规则配置见 [pyproject.toml](file:///home/micao/PyCharmMiscProject/lightnews/pyproject.toml))
*   **前端**: Oxlint (超快速 JS/TS Linter，规则见 [.oxlintrc.json](file:///home/micao/PyCharmMiscProject/lightnews/frontend/.oxlintrc.json)) + TypeScript Compiler (`tsc --noEmit`)

---

## 🏗️ 核心应用模块 (Application Modules)

1.  **`users`**: 用户认证与管理。提供注册、严苛密码校验（长度 $\ge 6$、账号 $\ge 3$、手机号验证）、个人档案查询及 Guest/Editor 等角色权限鉴定。
2.  **`news`**: 核心新闻与文章。
    *   `Article`: 支持双向自关联 Many-to-Many 友情推荐（`related_articles`），支持按标题模糊检索。
    *   `LiveNews`: 滚动快报，具备利多/利空分析、主编手动发布及管理员审核机制。
    *   自动同步工具（管理命令）：抓取英文科技快报、全文高保真翻译及图像自动匹配配图（`attach_article_images`）。
3.  **`interactions`**: 互动社交。支持多级树状评论结构、点赞切换及管理员评论审核/驳回。
4.  **`market`**: 创投金融市场行情。同步中外双源大额投融资动态，并提供前端滚动条的 API 接口。

---

## ⚙️ 配置文件定义

项目支持 **开发 (Development)** 与 **生产 (Production)** 两套配置：

### 1. 开发环境 (`.env.dev`)
```ini
DEBUG=True
SECRET_KEY='django-insecure-...'
ALLOWED_HOSTS=localhost 127.0.0.1 [::1]
DB_NAME=my_dev_db
DB_USER=dev_user
DB_PASSWORD=dev_password
DB_PORT_EXPOSE=5432
WEB_PORT_EXPOSE=80
NGINX_CONFIG=dev.conf
NGINX_IMAGE=nginx:1.25-alpine
```

### 2. 生产环境 (`.env.prod`)
```ini
DEBUG=False
SECRET_KEY=RTZHa7DI... # 生产环境安全密钥
ALLOWED_HOSTS=lightinthebrain.com 54.36.176.31
DB_NAME=my_prod_db
DB_USER=prod_user
DB_PASSWORD=... # 强密码
DB_PORT_EXPOSE=15432 # 不对外暴露默认端口
WEB_PORT_EXPOSE=80
NGINX_CONFIG=prod.conf
NGINX_IMAGE=your-dockerhub-username/lightnews-frontend:latest
```

---

## 💻 本地开发环境搭建 (Local Development Setup)

### 前置要求 (Prerequisites)
*   Docker & Docker Compose
*   Node.js 20+

### 安装与运行步骤
1.  **拷贝环境变量**:
    ```bash
    cp .env.dev.example .env.dev  # 若不存在
    ```
2.  **启动后端和数据库容器**:
    ```bash
    make dev
    ```
    此命令会拉起 PostgreSQL (`db`)、Django App (`web`) 及开发环境 Nginx (`nginx`)。
3.  **初始化数据库及种子数据**:
    新开终端，运行以下命令完成表迁移与开发数据填充：
    ```bash
    make migrate
    make seed
    ```
4.  **在宿主机启动前端开发服务器**:
    ```bash
    make dev-frontend
    ```
    前端将在浏览器中通过 `http://localhost` (Nginx 代理) 或直接访问 Vite `http://localhost:5173` 载入。
5.  **导入外部 Drupal 数据 (可选)**:
    ```bash
    # 将 light-2025_04_29.sql 数据库备份解析导入当前开发环境
    docker compose --env-file .env.dev exec web python manage.py import_drupal_articles
    ```

---

## 🛠️ Makefile 命令速查表 (Makefile Reference)

| 命令 | 描述 | 目标执行路径 |
| :--- | :--- | :--- |
| `make dev` | 启动后端及 Nginx Docker 开发环境容器 | Docker Compose |
| `make destroy` | 停止并彻底销毁所有容器、镜像与卷数据 | Docker Compose |
| `make dev-frontend` | 在宿主机本地以开发模式启动 Vite | `frontend/` |
| `make dev-frontend-docker` | 在 Docker 容器内运行前端开发服务器 | Docker Container |
| `make makemigrations` | 为数据库字段变更生成迁移脚本 | Django `web` |
| `make migrate` | 在数据库执行挂起的迁移操作 | Django `web` |
| `make seed` | 快速填充开发环境的分类、文章与快讯种子数据 | Django `web` |
| `make sync-deals` | 同步最新中外大额投融资动态 | Django `web` |
| `make sync-financial` | 自动抓取金融市场数据并生成快报 | Django `web` |
| `make sync-tech` | 自动抓取翻译外文科技快报草稿 | Django `web` |
| `make sync-articles` | 同步高保真外文科技文章并自动配图 | Django `web` |
| `make test` | 一键运行后端 Django 的 26 个单元/功能测试用例 | Django `web` |
| `make lint-backend` | 运行 Python Ruff Linter 核查后端代码规范 | Django `web` |
| `make lint-frontend` | 运行 Oxlint 并在前端执行严格的 TypeScript 类型安全检查 | 本地 `frontend/` |
| `make lint` | 一键执行全栈（前后端）代码质量核查 | 本地 / Docker |

---

## 🔄 CI/CD 持续集成与部署架构

项目在 GitHub 上配置了两个 Action 工作流：

### 1. 持续集成 CI ([.github/workflows/ci.yml](file:///home/micao/PyCharmMiscProject/lightnews/.github/workflows/ci.yml))
*   **触发时机**: 任何向 `main` 分支提交的 Push，或针对 `main` 分支提起的 Pull Request。
*   **执行任务**:
    *   **后端任务 (backend-ci)**: 检出代码 -> 设置 Python 3.12 -> 安装依赖 -> 运行 **Ruff 检查** -> 执行 Django 测试套件（测试环境自动将 `DB_ENGINE` 切换为内存 SQLite 以加速 CI）。
    *   **前端任务 (frontend-ci)**: 检出代码 -> 设置 Node.js 20 -> 安装依赖 -> 运行 **Oxlint 静态分析** -> 运行 **TypeScript 类型检查 (`tsc --noEmit`)** -> 尝试执行 `npm run build` 确保无编译错误。

### 2. 持续部署 CD ([.github/workflows/deploy.yml](file:///home/micao/PyCharmMiscProject/lightnews/.github/workflows/deploy.yml))
*   **触发时机**:
    1.  手动触发 (Workflow Dispatch)：在 Actions 页面点击 **"Run workflow"**。
    2.  正式发布触发：在 GitHub 仓库发布了新的 Release (状态为 `published`) 时触发。
*   **执行逻辑 (双阶段)**:
    1.  **云端打包与推仓 (build-and-push)**:
        *   在 Actions Runner 节点拉取代码。
        *   编译前端 React 并生成静态 HTML/JS 包。
        *   将编译好的前端文件打包进自定义前端 Nginx 镜像中 (`deploy/nginx/Dockerfile`)，并推送到 Docker Hub。
        *   根据 `deploy/app/Dockerfile` 构建 Django 后端镜像并推送至 Docker Hub。
    2.  **VPS 热更新部署 (deploy-to-vps)**:
        *   通过 SSH 免密安全连入您的 VPS 服务器。
        *   在项目部署目录执行 `git pull origin main` 同步最新配置文件。
        *   拉取 Docker Hub 上的最新镜像：`docker compose pull`。
        *   **零中断热重启**：执行 `docker compose up -d --remove-orphans --no-deps web nginx`。仅重启 Web 容器和 Nginx 容器，**数据库 (db) 容器不关停、不重启，保持 100% 在线**。
        *   执行 Django 迁移命令并清理服务器过期悬空镜像以释放空间。

---

## 🚀 线上发布操作指南 (Production Release Steps)

在您的开发分支 `develop` 研发完成并通过测试后：

1.  **PR & Code Review**:
    *   将代码发起 Pull Request 合并到 `main` 分支。
    *   GitHub Actions CI 自动运行，验证全栈代码通过 Lint 与编译测试。
    *   合并 PR。
2.  **配置 Secrets（仅需一次）**:
    *   在 GitHub 仓库设置 `Settings` -> `Secrets and variables` -> `Actions` 下添加：
        *   `DOCKERHUB_USERNAME`: 您的 Docker Hub 账户。
        *   `DOCKERHUB_TOKEN`: Docker Hub Access Token。
        *   `VPS_HOST`: 您的 VPS 生产服务器 IP。
        *   `VPS_USER`: 服务器登录用户名（如 `root`）。
        *   `VPS_SSH_KEY`: 服务器登录 SSH 私钥内容。
3.  **触发发布**:
    *   **常规发布**: 访问 GitHub 仓库的 **Releases** 栏目 -> 点击 **"Draft a new release"** -> 创建并发布类似 `v1.0.0` 的 Tag 标签 -> 点击 **Publish release**，CD 流程将全自动运行部署到 `lightinthebrain.com`。
    *   **手动一键部署**: 在仓库 **Actions** 标签页选中 **Continuous Deployment (CD)** 工作流，点击 **"Run workflow"** 运行。
