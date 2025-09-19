# TrendPublish 用户使用手册

## 1. 快速开始

### 1.1 环境准备

#### 1.1.1 安装 Deno
**Windows (PowerShell)**:
```powershell
irm https://deno.land/install.ps1 | iex
```

**MacOS/Linux**:
```bash
curl -fsSL https://deno.land/install.sh | sh
```

#### 1.1.2 克隆项目
```bash
git clone https://github.com/OpenAISpace/ai-trend-publish
cd ai-trend-publish
```

### 1.2 配置环境变量

#### 1.2.1 复制配置文件
```bash
cp .env.example .env
```

#### 1.2.2 必需配置项

**基础服务配置**
```env
# 服务器 API 密钥
SERVER_API_KEY=your_server_api_key
```

**LLM 服务配置（至少配置一个）**
```env
# DeepSeek AI（推荐）
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="your_deepseek_api_key"
DEEPSEEK_MODEL="deepseek-chat"

# 通义千问
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_API_KEY="your_qwen_api_key"
QWEN_MODEL="qwen-max"
```

**微信公众号配置**
```env
WEIXIN_APP_ID="your_weixin_app_id"
WEIXIN_APP_SECRET="your_weixin_app_secret"
AUTHOR="your_name"
```

**数据抓取配置**
```env
# FireCrawl API
FIRE_CRAWL_API_KEY="your_firecrawl_api_key"

# Twitter API
X_API_BEARER_TOKEN="your_twitter_api_key"
```

### 1.3 启动应用

#### 1.3.1 开发模式
```bash
deno task start
```

#### 1.3.2 测试模式
```bash
deno task test
```

## 2. 功能使用指南

### 2.1 工作流管理

#### 2.1.1 自动定时执行
系统默认每天凌晨 3 点自动执行工作流，按周几执行不同类型的工作流：

```env
# 配置每周的工作流类型
1_of_week_workflow=weixin-article-workflow      # 周一
2_of_week_workflow=weixin-aibench-workflow      # 周二  
3_of_week_workflow=weixin-hellogithub-workflow  # 周三
```

#### 2.1.2 手动触发工作流

**通过 JSON-RPC API 触发**：
```bash
curl -X POST http://localhost:8000/api/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "triggerWorkflow",
    "params": {
      "workflowType": "weixin-article-workflow"
    },
    "id": 1
  }'
```

**支持的工作流类型**：
- `weixin-article-workflow`：综合文章工作流
- `weixin-aibench-workflow`：AI 模型排行榜
- `weixin-hellogithub-workflow`：GitHub 热门项目

### 2.2 数据源配置

#### 2.2.1 本地配置
编辑 `src/data-sources/getDataSources.ts` 文件：

```typescript
export const sourceConfigs: SourceConfig = {
  firecrawl: [
    { identifier: "https://news.ycombinator.com/" },
    { identifier: "https://techcrunch.com/" },
  ],
  twitter: [
    { identifier: "https://x.com/OpenAIDevs" },
    { identifier: "https://x.com/elonmusk" },
  ],
};
```

#### 2.2.2 数据库配置
启用数据库后，可以通过数据库动态管理数据源：

```sql
INSERT INTO data_sources (identifier, platform, enabled) 
VALUES ('https://example.com', 'firecrawl', true);
```

### 2.3 AI 服务配置

#### 2.3.1 选择 LLM 提供者
```env
# 默认 LLM 提供者
DEFAULT_LLM_PROVIDER="DEEPSEEK"

# 为特定模块指定 LLM
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK:deepseek-reasoner"
AI_SUMMARIZER_LLM_PROVIDER="QWEN:qwen-max"
```

#### 2.3.2 支持的 AI 服务
- **DEEPSEEK**：DeepSeek AI 服务
- **QWEN**：阿里通义千问
- **XUNFEI**：讯飞星火
- **OPENAI**：OpenAI GPT 系列
- **CUSTOM**：自定义兼容 OpenAI API 的服务

### 2.4 模板配置

#### 2.4.1 选择文章模板
```env
# 文章模板类型
ARTICLE_TEMPLATE_TYPE="default"  # default | modern | tech | mianpro | random

# HelloGitHub 模板
HELLOGITHUB_TEMPLATE_TYPE="default"  # default | random

# AIBench 模板  
AIBENCH_TEMPLATE_TYPE="default"  # default | random
```

#### 2.4.2 自定义模板
1. 在 `src/modules/render/templates/` 目录下创建新模板
2. 使用 EJS 语法编写模板
3. 在对应的渲染器中注册新模板

### 2.5 通知配置

#### 2.5.1 Bark 通知
```env
ENABLE_BARK=true
BARK_URL="https://api.day.app/your_bark_key"
```

#### 2.5.2 钉钉通知
```env
ENABLE_DINGDING=true
DINGDING_WEBHOOK="https://oapi.dingtalk.com/robot/send?access_token=your_token"
```

#### 2.5.3 飞书通知
```env
ENABLE_FEISHU=true
FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/your_webhook"
```

## 3. 高级功能

### 3.1 内容去重

#### 3.1.1 启用去重功能
```env
ENABLE_DEDUPLICATION=true
DASHSCOPE_EMBEDDING_API_KEY="your_embedding_api_key"
DASHSCOPE_EMBEDDING_MODEL="text-embedding-v3"
```

#### 3.1.2 去重原理
- 使用文本向量化技术
- 计算内容相似度
- 默认相似度阈值：0.85
- 自动过滤重复内容

### 3.2 数据库配置

#### 3.2.1 启用数据库
```env
ENABLE_DB=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=trendfinder
```

#### 3.2.2 数据库迁移
```bash
# 运行数据库迁移
deno run -A --allow-env drizzle-kit migrate
```

### 3.3 图片生成

#### 3.3.1 封面图片自动生成
系统会自动为文章生成封面图片，支持多种图片生成服务：

- 阿里万相图片生成
- 自定义图片模板
- 动态文字渲染

## 4. 部署指南

### 4.1 直接部署

#### 4.1.1 生产环境运行
```bash
# 直接运行
deno task start

# 使用 PM2 管理进程
npm install -g pm2
pm2 start --interpreter="deno" --interpreter-args="run --allow-all" src/index.ts --name="trendpublish"
```

#### 4.1.2 设置开机自启
```bash
pm2 startup
pm2 save
```

### 4.2 Docker 部署

#### 4.2.1 构建镜像
```bash
docker build -t trendpublish .
```

#### 4.2.2 运行容器
```bash
# 使用环境变量文件
docker run -d --env-file .env --name trendpublish-container trendpublish

# 直接指定环境变量
docker run -d \
  -e DEEPSEEK_API_KEY=your_key \
  -e WEIXIN_APP_ID=your_app_id \
  --name trendpublish-container \
  trendpublish
```

### 4.3 编译可执行文件

#### 4.3.1 编译不同平台版本
```bash
# Windows 版本
deno task build:win

# Mac 版本
deno task build:mac-x64    # Intel 芯片
deno task build:mac-arm64  # M 系列芯片

# Linux 版本  
deno task build:linux-x64
deno task build:linux-arm64

# 编译所有平台
deno task build:all
```

## 5. 故障排除

### 5.1 常见问题

#### 5.1.1 IP 白名单问题
**问题**：微信公众号发布失败，提示 IP 不在白名单
**解决**：
1. 访问 [IP 查询工具](https://tool.lu/ip/) 获取服务器 IP
2. 登录微信公众平台，在开发者工具中添加 IP 白名单

#### 5.1.2 API 密钥问题
**问题**：AI 服务调用失败
**解决**：
1. 检查 API 密钥是否正确配置
2. 确认 API 密钥是否有足够的额度
3. 检查网络连接是否正常

#### 5.1.3 数据库连接问题
**问题**：数据库连接失败
**解决**：
1. 检查数据库配置参数
2. 确认数据库服务是否启动
3. 检查网络连接和防火墙设置

### 5.2 日志查看

#### 5.2.1 应用日志
系统会输出详细的执行日志，包括：
- 工作流执行状态
- 各步骤执行时间
- 错误信息和堆栈
- 性能统计数据

#### 5.2.2 调试模式
设置环境变量启用调试模式：
```env
LOG_LEVEL=DEBUG
```

### 5.3 性能优化

#### 5.3.1 并发配置
```env
# 控制文章数量
ARTICLE_NUM=10

# 启用并行处理
ENABLE_PARALLEL_PROCESSING=true
```

#### 5.3.2 缓存配置
- 访问令牌自动缓存
- 模板编译结果缓存
- 配置信息缓存

## 6. API 参考

### 6.1 JSON-RPC API

#### 6.1.1 触发工作流
```json
{
  "jsonrpc": "2.0",
  "method": "triggerWorkflow",
  "params": {
    "workflowType": "weixin-article-workflow",
    "maxArticles": 10,
    "forcePublish": false
  },
  "id": 1
}
```

#### 6.1.2 查询工作流状态
```json
{
  "jsonrpc": "2.0", 
  "method": "getWorkflowStatus",
  "params": {
    "workflowId": "weixin-article-workflow",
    "eventId": "event-123"
  },
  "id": 2
}
```

### 6.2 配置 API

#### 6.2.1 获取配置
```bash
GET /api/config/{key}
```

#### 6.2.2 更新配置
```bash
PUT /api/config/{key}
Content-Type: application/json

{
  "value": "new_value"
}
```

## 7. 最佳实践

### 7.1 配置建议
- 使用环境变量管理敏感信息
- 定期备份数据库和配置
- 监控 API 使用额度
- 设置合理的文章数量限制

### 7.2 运维建议
- 定期检查日志文件
- 监控系统资源使用情况
- 设置告警通知
- 定期更新依赖版本

### 7.3 安全建议
- 不要在代码中硬编码密钥
- 定期轮换 API 密钥
- 使用 HTTPS 传输数据
- 限制网络访问权限

# 用户使用说明文档

## 1. 系统概述

AI Trend Publish 是一个自动化内容聚合、处理和发布系统，旨在帮助用户自动抓取、分析、总结和发布 AI 领域的最新动态和趋势内容到微信公众号等平台。

## 2. 系统功能

### 2.1 核心功能
- 自动抓取多个数据源的 AI 相关内容
- 使用 AI 技术对内容进行分析、去重和排名
- 自动生成高质量的内容摘要和文章
- 支持多平台内容发布（目前支持微信公众号）
- 提供定时任务和手动触发机制

### 2.2 支持的数据源
- FireCrawl 网页抓取
- RSSHub RSS 订阅
- HelloGitHub 项目推荐
- Twitter 社交媒体内容
- Jina Reader 网页解析
- Jina DeepSearch 深度搜索

## 3. 系统安装与配置

### 3.1 环境要求
- Deno 运行时环境（推荐 v1.40+）
- 网络连接
- 各服务提供商的 API 密钥

### 3.2 安装步骤
1. 克隆项目代码：
   ```
   git clone <repository-url>
   cd ai-trend-publish
   ```

2. 安装 Deno（如果尚未安装）：
   请参考 [Deno 官方安装指南](https://deno.com/manual/getting_started/installation)

3. 配置环境变量：
   复制 [.env.example](../.env.example) 文件为 .env，并根据需要填写相关配置：
   ```
   cp .env.example .env
   ```

### 3.3 环境变量配置说明

#### 3.3.1 数据库配置
- `DATABASE_URL`: 数据库连接字符串（如：sqlite://./db.sqlite 或 mysql://user:password@host:port/database）

#### 3.3.2 微信公众号配置
- `WEIXIN_APP_ID`: 微信公众号 AppID
- `WEIXIN_APP_SECRET`: 微信公众号 AppSecret
- `WEIXIN_TOKEN`: 微信公众号 Token
- `WEIXIN_AES_KEY`: 微信公众号 EncodingAESKey（可选）

#### 3.3.3 AI 服务配置
- `DEEPSEEK_API_KEY`: DeepSeek API 密钥
- `QWEN_API_KEY`: 通义千问 API 密钥
- `XUNFEI_API_KEY`: 讯飞星火 API 密钥
- `OPENAI_API_KEY`: OpenAI API 密钥
- `JINA_API_KEY`: Jina AI API 密钥

#### 3.3.4 数据源配置
- `FIRECRAWL_API_KEY`: FireCrawl API 密钥
- `TWITTER_BEARER_TOKEN`: Twitter API Bearer Token

#### 3.3.5 通知配置
- `BARK_URL`: Bark 通知服务 URL

## 4. 系统启动

### 4.1 启动开发服务器
```
deno task dev
```

### 4.2 启动生产服务器
```
deno task start
```

### 4.3 运行定时任务
```
deno task cron
```

## 5. 使用方法

### 5.1 手动触发工作流
系统启动后会监听 8000 端口，可以通过 JSON-RPC 接口手动触发工作流：

```bash
# 触发微信文章发布工作流
curl -X POST http://localhost:8000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "weixinArticleWorkflow", "params": {}, "id": 1}'

# 触发 AI 基准测试工作流
curl -X POST http://localhost:8000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "weixinAIBenchWorkflow", "params": {}, "id": 2}'

# 触发 HelloGitHub 工作流
curl -X POST http://localhost:8000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "weixinHelloGitHubWorkflow", "params": {}, "id": 3}'
```

### 5.2 配置数据源
数据源配置在 [src/data-sources/getDataSources.ts](../src/data-sources/getDataSources.ts) 文件中定义。可以根据需要添加或修改数据源。

### 5.3 配置 AI 模型
AI 模型配置在各工作流文件中定义，可以根据需要切换不同的 AI 模型。

## 6. 监控与日志

### 6.1 系统日志
系统运行时会输出日志信息到控制台，包含：
- 系统启动信息
- 工作流执行状态
- 错误信息
- 调试信息

### 6.2 通知推送
系统集成了 Bark 通知服务，关键事件会通过 Bark 推送通知。

## 7. 故障排除

### 7.1 常见问题

#### 7.1.1 无法启动服务
- 检查 Deno 是否正确安装
- 检查环境变量是否正确配置
- 检查端口是否被占用

#### 7.1.2 数据源抓取失败
- 检查对应服务的 API 密钥是否正确配置
- 检查网络连接是否正常
- 检查数据源 URL 是否正确

#### 7.1.3 AI 处理失败
- 检查对应 AI 服务的 API 密钥是否正确配置
- 检查 AI 服务是否正常运行
- 检查请求参数是否符合要求

#### 7.1.4 发布失败
- 检查微信公众号配置是否正确
- 检查微信公众号权限是否足够
- 检查网络连接是否正常

### 7.2 日志分析
通过查看系统日志可以定位大部分问题，重点关注 ERROR 级别的日志信息。

## 8. 最佳实践

### 8.1 性能优化
- 合理配置定时任务执行时间，避免高峰期
- 根据实际需求调整并发处理数量
- 定期清理历史数据

### 8.2 安全建议
- 妥善保管各服务的 API 密钥
- 定期更换密钥
- 限制服务器访问权限

### 8.3 维护建议
- 定期备份数据库
- 监控系统运行状态
- 及时更新依赖库版本
