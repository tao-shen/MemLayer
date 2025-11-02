# Deployment Guide

## 目录

1. [部署概述](#部署概述)
2. [环境准备](#环境准备)
3. [Docker 部署](#docker-部署)
4. [Kubernetes 部署](#kubernetes-部署)
5. [云平台部署](#云平台部署)
6. [CDN 配置](#cdn-配置)
7. [监控和日志](#监控和日志)
8. [故障排除](#故障排除)

## 部署概述

### 部署架构

```
┌─────────────┐
│   CDN/LB    │
└──────┬──────┘
       │
┌──────▼──────┐
│   Nginx     │
└──────┬──────┘
       │
┌──────▼──────────────┐
│  Static Files       │
│  (React SPA)        │
└─────────────────────┘
       │
       │ API Proxy
       ▼
┌─────────────────────┐
│  API Gateway        │
└─────────────────────┘
```

### 部署选项

1. **Docker**: 容器化部署，推荐用于开发和小规模生产
2. **Kubernetes**: 大规模生产环境，支持自动扩展
3. **云平台**: AWS、Azure、GCP 等托管服务
4. **静态托管**: Vercel、Netlify 等（需要配置 API 代理）

## 环境准备

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+, CentOS 8+) 或 macOS
- **内存**: 最少 2GB RAM
- **存储**: 最少 10GB 可用空间
- **网络**: 稳定的互联网连接

### 软件依赖

```bash
# Docker
docker --version  # 20.10+

# Docker Compose (可选)
docker-compose --version  # 2.0+

# Kubernetes (可选)
kubectl version  # 1.24+
```

### 环境变量

创建 `.env.production` 文件:

```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Solana Configuration
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Feature Flags
VITE_ENABLE_BLOCKCHAIN=true
VITE_ENABLE_RAG=true

# Analytics
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=your-analytics-id
```

## Docker 部署

### 构建镜像

```bash
# 进入项目目录
cd frontend/chat-interface

# 构建 Docker 镜像
docker build -t chat-interface:latest .

# 验证镜像
docker images | grep chat-interface
```

### 运行容器

```bash
# 运行容器
docker run -d \
  --name chat-interface \
  -p 80:80 \
  --restart unless-stopped \
  chat-interface:latest

# 查看日志
docker logs -f chat-interface

# 检查状态
docker ps | grep chat-interface
```

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  chat-interface:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

启动服务:

```bash
docker-compose up -d
docker-compose logs -f
```

### 多阶段构建优化

Dockerfile 已经使用多阶段构建:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Kubernetes 部署

### 创建 Deployment

`k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-interface
  labels:
    app: chat-interface
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-interface
  template:
    metadata:
      labels:
        app: chat-interface
    spec:
      containers:
      - name: chat-interface
        image: your-registry/chat-interface:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 创建 Service

`k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: chat-interface
spec:
  selector:
    app: chat-interface
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

### 创建 Ingress

`k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-interface
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: chat-interface-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: chat-interface
            port:
              number: 80
```

### 部署到 Kubernetes

```bash
# 应用配置
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 查看状态
kubectl get pods
kubectl get services
kubectl get ingress

# 查看日志
kubectl logs -f deployment/chat-interface

# 扩展副本
kubectl scale deployment chat-interface --replicas=5
```

### 配置 HPA (水平自动扩展)

`k8s/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chat-interface
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chat-interface
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 云平台部署

### AWS (ECS + CloudFront)

#### 1. 推送镜像到 ECR

```bash
# 登录 ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 标记镜像
docker tag chat-interface:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/chat-interface:latest

# 推送镜像
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/chat-interface:latest
```

#### 2. 创建 ECS 任务定义

```json
{
  "family": "chat-interface",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "chat-interface",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/chat-interface:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/chat-interface",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3. 配置 CloudFront

- 创建 CloudFront 分发
- 源: ALB 或 S3
- 启用 HTTPS
- 配置缓存策略
- 设置自定义域名

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

`vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/v1/:path*",
      "destination": "https://api.yourdomain.com/v1/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify 部署

`netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/v1/*"
  to = "https://api.yourdomain.com/v1/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## CDN 配置

### CloudFlare

1. 添加域名到 CloudFlare
2. 配置 DNS 记录
3. 启用 CDN 代理
4. 配置缓存规则:

```
Cache Level: Standard
Browser Cache TTL: 4 hours
Edge Cache TTL: 2 hours
```

5. 配置页面规则:

```
URL: *.js, *.css, *.png, *.jpg
Cache Level: Cache Everything
Edge Cache TTL: 1 month
```

### AWS CloudFront

创建缓存策略:

```json
{
  "Name": "chat-interface-cache-policy",
  "MinTTL": 0,
  "MaxTTL": 31536000,
  "DefaultTTL": 86400,
  "ParametersInCacheKeyAndForwardedToOrigin": {
    "EnableAcceptEncodingGzip": true,
    "EnableAcceptEncodingBrotli": true,
    "HeadersConfig": {
      "HeaderBehavior": "none"
    },
    "CookiesConfig": {
      "CookieBehavior": "none"
    },
    "QueryStringsConfig": {
      "QueryStringBehavior": "none"
    }
  }
}
```

## 监控和日志

### 健康检查

Nginx 配置已包含健康检查端点:

```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

测试:

```bash
curl http://localhost/health
```

### 日志收集

#### Docker 日志

```bash
# 查看实时日志
docker logs -f chat-interface

# 导出日志
docker logs chat-interface > app.log 2>&1
```

#### Kubernetes 日志

```bash
# 查看 Pod 日志
kubectl logs -f deployment/chat-interface

# 导出日志
kubectl logs deployment/chat-interface > app.log
```

### 监控指标

使用 Prometheus + Grafana:

1. 安装 Prometheus
2. 配置 Nginx Exporter
3. 创建 Grafana 仪表板

关键指标:
- 请求速率 (RPS)
- 响应时间 (P50, P95, P99)
- 错误率
- CPU/内存使用率

## 故障排除

### 常见问题

#### 1. 容器无法启动

```bash
# 检查日志
docker logs chat-interface

# 检查配置
docker inspect chat-interface

# 重启容器
docker restart chat-interface
```

#### 2. API 代理失败

检查 nginx.conf 中的代理配置:

```nginx
location /v1/ {
    proxy_pass http://api-gateway:3000;
    # 确保 api-gateway 可访问
}
```

测试连接:

```bash
# 进入容器
docker exec -it chat-interface sh

# 测试 API 连接
wget -O- http://api-gateway:3000/health
```

#### 3. 静态资源 404

检查构建输出:

```bash
# 查看 dist 目录
ls -la dist/

# 检查 nginx 配置
docker exec chat-interface cat /etc/nginx/nginx.conf
```

#### 4. WebSocket 连接失败

确保 nginx 配置支持 WebSocket:

```nginx
location /socket.io/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 性能优化

#### 1. 启用 Gzip 压缩

nginx.conf 已配置 Gzip:

```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

#### 2. 配置缓存

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 3. 使用 CDN

- 配置 CDN 加速静态资源
- 使用地理位置路由
- 启用 HTTP/2

### 安全加固

#### 1. HTTPS 配置

使用 Let's Encrypt:

```bash
# 安装 certbot
apt-get install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d yourdomain.com

# 自动续期
certbot renew --dry-run
```

#### 2. 安全头

nginx.conf 已包含安全头:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

#### 3. 限流

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /v1/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://api-gateway:3000;
}
```

## 回滚策略

### Docker

```bash
# 标记当前版本
docker tag chat-interface:latest chat-interface:v1.0.0

# 回滚到之前版本
docker stop chat-interface
docker rm chat-interface
docker run -d --name chat-interface chat-interface:v0.9.0
```

### Kubernetes

```bash
# 查看部署历史
kubectl rollout history deployment/chat-interface

# 回滚到上一版本
kubectl rollout undo deployment/chat-interface

# 回滚到指定版本
kubectl rollout undo deployment/chat-interface --to-revision=2
```

## 备份和恢复

### 备份镜像

```bash
# 导出镜像
docker save chat-interface:latest > chat-interface-backup.tar

# 导入镜像
docker load < chat-interface-backup.tar
```

### 备份配置

```bash
# 备份 Kubernetes 配置
kubectl get all -n default -o yaml > backup.yaml

# 恢复配置
kubectl apply -f backup.yaml
```

## 参考资源

- [Docker 文档](https://docs.docker.com/)
- [Kubernetes 文档](https://kubernetes.io/docs/)
- [Nginx 文档](https://nginx.org/en/docs/)
- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)
- [Vercel 文档](https://vercel.com/docs)
