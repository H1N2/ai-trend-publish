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