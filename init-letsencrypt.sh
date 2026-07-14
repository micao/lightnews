#!/bin/bash
set -e

# 配置域名和邮箱（请确保域名已解析到服务器的公网 IP）
domains=("lightinthebrain.com" "www.lightinthebrain.com")
rsa_key_size=4096
data_path="./certbot"
email="caomingfei@gmail.com" # 接收证书到期通知的邮箱
staging=0 # 如果只是测试，设置为 1 以免触发 Let's Encrypt 限流；正式申请设置为 0

if [ -d "$data_path/conf/live/${domains[0]}" ]; then
  read -p "检测到 ${domains[0]} 的已有证书文件夹已存在。是否要重新申请并覆盖现有证书？(y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    echo "申请已取消，保留现有证书。"
    exit 0
  fi
fi

# 1. 自动检测系统上可用的 Docker Compose 命令（支持 docker compose 和旧版 docker-compose）
if docker compose version >/dev/null 2>&1; then
  docker_compose_cmd="docker compose"
elif docker-compose version >/dev/null 2>&1; then
  docker_compose_cmd="docker-compose"
else
  echo "错误：未检测到 docker compose 命令，请先安装 Docker Compose。"
  exit 1
fi

echo "### 1. 准备本地目录..."
mkdir -p "$data_path/conf"
mkdir -p "$data_path/www"

echo "### 2. 生成临时自签名证书（启动 Nginx 必需，防止因找不到证书文件而启动报错）..."
path="/etc/letsencrypt/live/${domains[0]}"

# 让 Alpine 容器在挂载卷内创建目录并生成证书，完全避开宿主机非 root 用户的写入权限限制
docker run --rm -v "$(pwd)/$data_path/conf:/etc/letsencrypt" \
  alpine sh -c "mkdir -p '$path' && apk add --no-cache openssl && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'"

echo "### 3. 临时拉起 Nginx 容器（监听 80 端口以承载验证请求）..."
$docker_compose_cmd --env-file .env.prod up --no-deps -d nginx

echo "### 4. 删除临时自签名证书..."
# 因为临时证书是用 Docker 容器创建的，拥有者是 root。为避免 host 权限问题，我们同样在容器中将其删除。
docker run --rm -v "$(pwd)/$data_path/conf:/etc/letsencrypt" alpine rm -rf "/etc/letsencrypt/live/${domains[0]}"

echo "### 5. 调用 Certbot 容器正式面向 Let's Encrypt 申请 SSL 证书..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# 确定是否为测试环境
test_cert_arg=""
if [ $staging -ne 0 ]; then
  test_cert_arg="--test-cert"
fi

$docker_compose_cmd --env-file .env.prod run --rm --entrypoint \
  "certbot certonly --webroot -w /var/www/certbot \
    $test_cert_arg \
    $domain_args \
    --email $email \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

echo "### 6. 重新加载 Nginx 配置以挂载正式证书..."
$docker_compose_cmd --env-file .env.prod exec -T nginx nginx -s reload

echo "🎉 证书申请成功！您的网站现在已启用 HTTPS 服务。"
echo "您可以访问：https://${domains[0]} 验证。"
