# 部署手册

## 1. 部署前准备

### 1.1 系统要求
- 操作系统：Linux (推荐 Ubuntu 20.04+)、macOS 或 Windows
- 内存：至少 2GB RAM
- 存储空间：至少 1GB 可用磁盘空间
- 网络：稳定的互联网连接

### 1.2 软件依赖
- Deno 运行时环境（推荐 v1.40+）
- Git（用于代码获取）
- 数据库（SQLite 或 MySQL）

### 1.3 服务账号
需要申请以下服务的 API 密钥：
- 微信公众号开发账号
- AI 服务账号（DeepSeek、通义千问、讯飞星火、OpenAI、Jina AI等）
- 数据源服务账号（FireCrawl、Twitter等）
- Bark 通知服务（可选）

## 2. 获取代码

### 2.1 克隆代码仓库
```bash
git clone <repository-url>
cd ai-trend-publish
```

### 2.2 切换到稳定版本（可选）
```bash
git checkout <stable-version-tag>
```

## 3. 环境配置

### 3.1 安装 Deno
```bash
# Linux/macOS
curl -fsSL https://deno.land/x/install/install.sh | sh

# Windows (PowerShell)
iwr https://deno.land/x/install/install.ps1 -useb | iex

# 或者使用包管理器安装
# Ubuntu/Debian
sudo apt install deno

# macOS (Homebrew)
brew install deno
```

### 3.2 配置环境变量
1. 复制示例配置文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 .env 文件，填写相关配置：
   ```bash
   # 数据库配置
   DATABASE_URL=sqlite://./db.sqlite
   
   # 微信公众号配置
   WEIXIN_APP_ID=your_app_id
   WEIXIN_APP_SECRET=your_app_secret
   WEIXIN_TOKEN=your_token
   WEIXIN_AES_KEY=your_aes_key
   
   # AI 服务配置
   DEEPSEEK_API_KEY=your_deepseek_api_key
   QWEN_API_KEY=your_qwen_api_key
   XUNFEI_API_KEY=your_xunfei_api_key
   OPENAI_API_KEY=your_openai_api_key
   JINA_API_KEY=your_jina_api_key
   
   # 数据源配置
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   
   # 通知配置
   BARK_URL=your_bark_url
   ```

## 4. 数据库初始化

### 4.1 SQLite（默认）
使用 SQLite 时，数据库会在首次运行时自动创建和初始化。

### 4.2 MySQL（可选）
如果使用 MySQL，需要先创建数据库：
```sql
CREATE DATABASE ai_trend_publish CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后在 .env 文件中配置：
```
DATABASE_URL=mysql://username:password@host:port/ai_trend_publish
```

## 5. 依赖安装

项目使用 Deno，依赖会自动管理，无需手动安装。

## 6. 启动服务

### 6.1 开发模式启动
```bash
deno task dev
```

### 6.2 生产模式启动
```bash
deno task start
```

### 6.3 后台运行
```bash
# 使用 nohup
nohup deno task start > app.log 2>&1 &

# 或使用 systemd（Linux）
# 创建 systemd 服务文件 /etc/systemd/system/ai-trend-publish.service
```

## 7. systemd 服务配置（Linux）

创建服务文件：
```bash
sudo nano /etc/systemd/system/ai-trend-publish.service
```

添加以下内容：
```ini
[Unit]
Description=AI Trend Publish Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/ai-trend-publish
ExecStart=/path/to/deno task start
Restart=always
RestartSec=10
EnvironmentFile=/path/to/ai-trend-publish/.env

[Install]
WantedBy=multi-user.target
```

启用并启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-trend-publish
sudo systemctl start ai-trend-publish
```

## 8. 反向代理配置（可选）

### 8.1 Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 8.2 Apache 配置
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:8000/
    ProxyPassReverse / http://localhost:8000/
</VirtualHost>
```

## 9. SSL 证书配置（推荐）

使用 Let's Encrypt 获取免费 SSL 证书：
```bash
sudo apt install certbot
sudo certbot --nginx -d your-domain.com
```

## 10. 定时任务配置

### 10.1 使用系统 cron
编辑 crontab：
```bash
crontab -e
```

添加定时任务：
```bash
# 每天上午9点执行微信文章发布工作流
0 9 * * * cd /path/to/ai-trend-publish && deno task cron
```

### 10.2 使用系统任务计划（Windows）
1. 打开任务计划程序
2. 创建基本任务
3. 设置触发器为每天上午9点
4. 设置操作为启动程序，程序脚本为：
   ```
   deno task cron
   ```
   起始于：
   ```
   C:\path\to\ai-trend-publish
   ```

## 11. 监控与日志

### 11.1 日志查看
```bash
# 查看实时日志
tail -f app.log

# 查看 systemd 服务日志
sudo journalctl -u ai-trend-publish -f
```

### 11.2 健康检查
可以通过访问以下端点检查服务状态：
```bash
curl http://localhost:8000/health
```

## 12. 备份与恢复

### 12.1 数据库备份
```bash
# SQLite 备份
cp db.sqlite db.sqlite.backup.$(date +%Y%m%d)

# MySQL 备份
mysqldump -u username -p ai_trend_publish > backup_$(date +%Y%m%d).sql
```

### 12.2 配置文件备份
```bash
cp .env .env.backup.$(date +%Y%m%d)
```

### 12.3 代码备份
使用 Git 进行版本控制，定期推送到远程仓库。

## 13. 升级部署

### 13.1 获取最新代码
```bash
git pull origin main
```

### 13.2 重启服务
```bash
sudo systemctl restart ai-trend-publish
```

### 13.3 验证升级
检查服务日志确认升级成功，测试核心功能是否正常。

## 14. 故障排除

### 14.1 服务无法启动
1. 检查端口是否被占用：
   ```bash
   lsof -i :8000
   ```

2. 检查环境变量是否正确配置

3. 查看服务日志：
   ```bash
   sudo journalctl -u ai-trend-publish
   ```

### 14.2 数据库连接失败
1. 检查数据库服务是否运行

2. 检查数据库连接字符串是否正确

3. 检查数据库用户权限

### 14.3 API 调用失败
1. 检查对应服务的 API 密钥是否正确

2. 检查网络连接是否正常

3. 检查服务提供商是否有访问限制