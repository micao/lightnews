FROM nginx:1.25-alpine

# 1. 复制前端打包后的静态资源到 Nginx 默认静态文件目录
COPY frontend/dist /usr/share/nginx/html

# 2. 复制自定义 Nginx 配置文件覆盖默认配置
COPY deploy/nginx/prod.conf /etc/nginx/conf.d/default.conf

# 3. 暴露 80 端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
