# TrendPublish 核心流程图和模块说明

## 1. 系统整体流程图

```mermaid
graph TD
    A[系统启动] --> B[初始化配置管理器]
    B --> C[启动定时任务调度器]
    C --> D[启动 JSON-RPC 服务器]
    D --> E[系统就绪]
    
    E --> F{定时触发 or 手动触发}
    F -->|定时触发| G[每日凌晨3点执行]
    F -->|手动触发| H[JSON-RPC API 调用]
    
    G --> I[根据星期几选择工作流]
    H --> I
    
    I --> J{工作流类型}
    J -->|微信文章| K[WeixinArticleWorkflow]
    J -->|AI排行榜| L[WeixinAIBenchWorkflow]
    J -->|GitHub热门| M[WeixinHelloGithubWorkflow]
    
    K --> N[执行工作流步骤]
    L --> N
    M --> N
    
    N --> O[发送通知]
    O --> P[记录执行指标]
    P --> Q[工作流完成]
```

## 2. 微信文章工作流详细流程

```mermaid
graph TD
    A[开始执行微信文章工作流] --> B[验证IP白名单]
    B --> C{IP验证通过?}
    C -->|否| D[发送告警通知]
    C -->|是| E[获取数据源配置]
    
    D --> Z[工作流终止]
    
    E --> F[并行抓取内容]
    F --> G[FireCrawl抓取]
    F --> H[Twitter抓取]
    
    G --> I[收集所有抓取结果]
    H --> I
    
    I --> J{启用去重?}
    J -->|是| K[计算内容向量]
    J -->|否| N[内容排序评分]
    
    K --> L[相似度计算]
    L --> M[过滤重复内容]
    M --> N
    
    N --> O[AI内容排序]
    O --> P[选择Top N文章]
    P --> Q[内容摘要优化]
    
    Q --> R[生成文章标题]
    R --> S[生成封面图片]
    S --> T[渲染文章模板]
    
    T --> U[发布到微信公众号]
    U --> V[发送成功通知]
    V --> W[记录执行统计]
    W --> X[工作流完成]
```

## 3. 内容抓取模块流程

```mermaid
graph TD
    A[开始内容抓取] --> B[获取数据源列表]
    B --> C[创建抓取进度条]
    
    C --> D[并行执行抓取器]
    D --> E[FireCrawl抓取器]
    D --> F[Twitter抓取器]
    
    E --> G[调用FireCrawl API]
    G --> H[解析网页结构]
    H --> I[提取标题和内容]
    I --> J[生成唯一ID]
    
    F --> K[调用Twitter API]
    K --> L[获取推文数据]
    L --> M[处理媒体文件]
    M --> N[处理转发关系]
    
    J --> O[标准化内容格式]
    N --> O
    
    O --> P[更新进度条]
    P --> Q{所有源抓取完成?}
    Q -->|否| D
    Q -->|是| R[返回抓取结果]
    
    R --> S[统计抓取数量]
    S --> T[记录成功/失败数]
    T --> U[抓取完成]
```

## 4. AI内容处理流程

```mermaid
graph TD
    A[开始AI内容处理] --> B[获取LLM提供者配置]
    B --> C{处理类型}
    
    C -->|内容摘要| D[AISummarizer]
    C -->|内容排序| E[ContentRanker]
    C -->|标题生成| F[TitleGenerator]
    
    D --> G[构建摘要提示词]
    G --> H[调用AI服务]
    H --> I[解析摘要结果]
    I --> J[提取标题、内容、关键词]
    
    E --> K[批量内容评分]
    K --> L[调用AI排序服务]
    L --> M[解析评分结果]
    M --> N[按分数排序]
    
    F --> O[构建标题提示词]
    O --> P[调用AI服务]
    P --> Q[生成优化标题]
    
    J --> R[内容处理完成]
    N --> R
    Q --> R
    
    R --> S{处理成功?}
    S -->|是| T[返回处理结果]
    S -->|否| U[使用原始内容]
    
    T --> V[记录处理统计]
    U --> V
    V --> W[AI处理完成]
```

## 5. 向量化去重流程

```mermaid
graph TD
    A[开始内容去重] --> B{启用去重功能?}
    B -->|否| C[跳过去重]
    B -->|是| D[初始化Embedding模型]
    
    D --> E[获取已存在向量]
    E --> F[批量计算新内容向量]
    
    F --> G[创建向量计算进度条]
    G --> H[并行计算Embedding]
    H --> I[收集所有向量结果]
    
    I --> J[开始相似度比较]
    J --> K[遍历新内容]
    K --> L[计算与已存在向量的相似度]
    
    L --> M{相似度 >= 0.85?}
    M -->|是| N[标记为重复内容]
    M -->|否| O[保留内容]
    
    N --> P[更新重复统计]
    O --> Q[添加到结果集]
    
    P --> R{还有内容?}
    Q --> R
    R -->|是| K
    R -->|否| S[批量保存新向量]
    
    S --> T[记录去重统计]
    T --> U[返回去重结果]
    
    C --> U
    U --> V[去重完成]
```

## 6. 微信发布流程

```mermaid
graph TD
    A[开始微信发布] --> B[验证IP白名单]
    B --> C{IP验证通过?}
    C -->|否| D[返回IP错误]
    C -->|是| E[获取访问令牌]
    
    E --> F{令牌有效?}
    F -->|否| G[刷新访问令牌]
    F -->|是| H[准备发布内容]
    
    G --> H
    
    H --> I[上传封面图片]
    I --> J[获取媒体ID]
    J --> K[创建文章草稿]
    
    K --> L[设置文章参数]
    L --> M[标题、摘要、内容]
    M --> N[评论设置]
    N --> O[作者信息]
    
    O --> P[提交发布请求]
    P --> Q{发布成功?}
    
    Q -->|是| R[返回发布结果]
    Q -->|否| S[记录错误信息]
    
    R --> T[发送成功通知]
    S --> U[发送失败通知]
    
    T --> V[发布完成]
    U --> V
    
    D --> W[发布失败]
```

## 7. 通知系统流程

```mermaid
graph TD
    A[触发通知] --> B{通知类型}
    
    B -->|成功| C[SuccessNotification]
    B -->|警告| D[WarningNotification]
    B -->|错误| E[ErrorNotification]
    B -->|信息| F[InfoNotification]
    
    C --> G[构建成功消息]
    D --> H[构建警告消息]
    E --> I[构建错误消息]
    F --> J[构建信息消息]
    
    G --> K{启用的通知渠道}
    H --> K
    I --> K
    J --> K
    
    K -->|Bark| L[发送Bark通知]
    K -->|钉钉| M[发送钉钉通知]
    K -->|飞书| N[发送飞书通知]
    
    L --> O[调用Bark API]
    M --> P[调用钉钉Webhook]
    N --> Q[调用飞书Webhook]
    
    O --> R{发送成功?}
    P --> R
    Q --> R
    
    R -->|是| S[记录发送成功]
    R -->|否| T[记录发送失败]
    
    S --> U[通知完成]
    T --> U
```

## 8. 核心模块说明

### 8.1 工作流引擎 (Workflow Engine)

**职责**：
- 工作流生命周期管理
- 步骤执行和重试控制
- 错误处理和恢复
- 执行指标收集

**核心类**：
- `WorkflowEntrypoint`：工作流基类
- `WorkflowStep`：步骤执行器
- `MetricsCollector`：指标收集器

**特性**：
- 支持步骤重试和超时控制
- 区分可重试错误和终止错误
- 详细的执行指标统计
- 灵活的错误处理机制

### 8.2 内容抓取模块 (Content Scraper)

**职责**：
- 多数据源内容抓取
- 数据标准化处理
- 错误处理和重试
- 抓取进度跟踪

**核心类**：
- `FireCrawlScraper`：网页内容抓取
- `TwitterScraper`：社交媒体抓取
- `HelloGithubScraper`：开源项目抓取
- `ScraperFactory`：抓取器工厂

**特性**：
- 统一的抓取接口
- 并行抓取支持
- 自动错误恢复
- 实时进度显示

### 8.3 AI内容处理模块 (AI Content Processor)

**职责**：
- 内容智能摘要
- 质量评分排序
- 标题优化生成
- 关键词提取

**核心类**：
- `AISummarizer`：内容摘要器
- `ContentRanker`：内容排序器
- `LLMFactory`：AI服务工厂
- `EmbeddingProvider`：向量化服务

**特性**：
- 多AI服务支持
- 批量处理优化
- 智能提示词工程
- 结果质量控制

### 8.4 向量化去重模块 (Vector Deduplication)

**职责**：
- 文本向量化
- 相似度计算
- 重复内容检测
- 向量数据管理

**核心类**：
- `VectorService`：向量数据服务
- `EmbeddingFactory`：嵌入模型工厂
- `VectorSimilarityUtil`：相似度计算工具

**特性**：
- 高效的向量计算
- 可配置相似度阈值
- 批量向量处理
- 内存优化算法

### 8.5 内容发布模块 (Content Publisher)

**职责**：
- 多平台内容发布
- 媒体文件管理
- 发布状态跟踪
- 权限验证

**核心类**：
- `WeixinPublisher`：微信公众号发布器
- `WeixinArticleTemplateRenderer`：模板渲染器
- `ImageGenerator`：图片生成器

**特性**：
- 自动访问令牌管理
- 多模板支持
- 图片自动上传
- 发布前验证

### 8.6 通知系统模块 (Notification System)

**职责**：
- 多渠道消息推送
- 任务状态通知
- 错误告警
- 通知模板管理

**核心类**：
- `BarkNotifier`：Bark通知器
- `DingDingNotifier`：钉钉通知器
- `FeishuNotifier`：飞书通知器

**特性**：
- 多通知渠道支持
- 消息模板化
- 异步发送
- 发送状态跟踪

### 8.7 配置管理模块 (Configuration Manager)

**职责**：
- 多层级配置管理
- 动态配置更新
- 配置验证
- 默认值处理

**核心类**：
- `ConfigManager`：配置管理器
- `EnvironmentConfigSource`：环境变量配置源
- `DatabaseConfigSource`：数据库配置源

**特性**：
- 配置优先级管理
- 运行时配置更新
- 配置缓存机制
- 类型安全的配置访问

## 9. 数据流向图

```mermaid
graph LR
    A[数据源] --> B[抓取器]
    B --> C[原始内容]
    C --> D[AI处理器]
    D --> E[处理后内容]
    E --> F[向量化器]
    F --> G[去重后内容]
    G --> H[排序器]
    H --> I[排序后内容]
    I --> J[模板渲染器]
    J --> K[最终文章]
    K --> L[发布器]
    L --> M[发布平台]
    
    N[配置管理器] --> B
    N --> D
    N --> F
    N --> J
    N --> L
    
    O[通知系统] --> P[用户]
    L --> O
    D --> O
    B --> O
```

这个流程图和模块说明文档详细描述了 TrendPublish 系统的核心工作流程、各个模块的职责和相互关系，为开发者和用户提供了清晰的系统理解框架。