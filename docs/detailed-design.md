# TrendPublish 详细设计文档

## 1. 引言

### 1.1 目的
本文档详细描述 AI Trend Publish 系统各模块的设计和实现细节，为开发人员提供具体的实现指导。

### 1.2 范围
本文档覆盖系统各核心模块的详细设计，包括：
- 工作流引擎设计
- 数据源模块设计
- 内容处理模块设计
- 内容发布模块设计
- 通知模块设计
- 数据库设计
- 配置管理设计

## 2. 工作流引擎设计

### 2.1 Workflow 基类设计
Workflow 基类定义了工作流的通用接口和基础实现。

#### 2.1.1 核心属性
- `name`: 工作流名称
- `config`: 配置管理器实例
- `db`: 数据库实例
- `vectorService`: 向量服务实例

#### 2.1.2 核心方法
- `initialize()`: 初始化工作流
- `execute()`: 执行工作流
- `scrapeData()`: 抓取数据
- `processContent()`: 处理内容
- `publishContent()`: 发布内容
- `sendNotification()`: 发送通知

### 2.2 具体工作流实现

#### 2.2.1 WeixinArticleWorkflow
微信文章工作流，负责抓取、处理和发布微信文章。

##### 主要功能：
1. 从配置中获取数据源列表
2. 并发抓取各数据源内容
3. 使用 AI 技术处理内容（摘要、去重、排名）
4. 渲染文章模板
5. 发布到微信公众号
6. 发送通知

#### 2.2.2 WeixinAIBenchWorkflow
AI 基准测试工作流，用于测试不同 AI 模型的性能。

#### 2.2.3 WeixinHelloGitHubWorkflow
HelloGitHub 工作流，专门处理 HelloGitHub 数据源。

## 3. 数据源模块设计

### 3.1 Scraper 接口设计
定义了内容抓取器的通用接口。

#### 3.1.1 核心方法
- `scrape(source: string, options?: ScraperOptions)`: 抓取内容
- `initialize()`: 初始化抓取器

### 3.2 具体抓取器实现

#### 3.2.1 JinaScraper
使用 Jina Reader API 抓取网页内容。

##### 核心功能：
- 构造 Jina Reader API URL
- 发送 HTTP 请求获取内容
- 解析返回的 JSON 数据
- 提取标题、内容、链接等信息

#### 3.2.2 FireCrawlScraper
使用 FireCrawl API 抓取网页内容。

##### 核心功能：
- 构造 FireCrawl API 请求
- 发送 HTTP 请求获取内容
- 解析返回的数据
- 提取所需字段

#### 3.2.3 RsshubScraper
使用 RSSHub 获取 RSS 订阅内容。

##### 核心功能：
- 构造 RSSHub URL
- 获取 RSS 数据
- 解析 RSS 内容
- 转换为统一格式

#### 3.2.4 其他抓取器
- HellogithubScraper: 抓取 HelloGitHub 内容
- TwitterScraper: 抓取 Twitter 内容

### 3.3 ScraperFactory 设计
负责创建和管理各种抓取器实例。

#### 3.3.1 核心功能：
- 单例模式管理
- 根据类型创建抓取器实例
- 缓存已创建的实例

## 4. 内容处理模块设计

### 4.1 AI 摘要器设计

#### 4.1.1 AISummarizer 接口
定义了内容摘要器的通用接口。

#### 4.1.2 具体实现
- DeepSeekSummarizer: 使用 DeepSeek 模型生成摘要
- QwenSummarizer: 使用通义千问模型生成摘要
- XunfeiSummarizer: 使用讯飞星火模型生成摘要

#### 4.1.3 SummarizerFactory 设计
负责创建和管理各种摘要器实例。

### 4.2 内容排名器设计

#### 4.2.1 ContentRanker 接口
定义了内容排名器的通用接口。

#### 4.2.2 具体实现
- AIContentRanker: 使用 AI 模型对内容进行排名

### 4.3 向量服务设计

#### 4.3.1 核心功能
- 生成文本向量表示
- 计算向量相似度
- 内容去重处理

#### 4.3.2 主要方法
- `generateEmbedding(text: string)`: 生成文本向量
- `calculateSimilarity(vec1: number[], vec2: number[])`: 计算向量相似度
- `isDuplicate(content: string, threshold: number)`: 判断内容是否重复

## 5. 内容发布模块设计

### 5.1 Publisher 接口设计
定义了内容发布器的通用接口。

#### 5.1.1 核心方法
- `publish(content: PublishContent, options?: PublisherOptions)`: 发布内容
- `initialize()`: 初始化发布器

### 5.2 微信公众号发布器实现

#### 5.2.1 核心功能
- 构造微信公众号 API 请求
- 处理文章模板渲染
- 发送文章到微信公众号
- 处理返回结果

#### 5.2.2 主要流程
1. 获取访问令牌
2. 上传文章中的图片素材
3. 构造文章数据
4. 调用微信公众号发布接口
5. 处理发布结果

### 5.3 PublisherFactory 设计
负责创建和管理各种发布器实例。

## 6. 通知模块设计

### 6.1 Notify 接口设计
定义了通知服务的通用接口。

#### 6.1.1 核心方法
- `send(message: string, options?: NotifyOptions)`: 发送通知
- `initialize()`: 初始化通知服务

### 6.2 Bark 通知实现

#### 6.2.1 核心功能
- 构造 Bark 通知请求
- 发送通知到 Bark 服务
- 处理返回结果

### 6.3 NotifyFactory 设计
负责创建和管理各种通知服务实例。

## 7. 数据库设计

### 7.1 数据库工厂设计
DatabaseFactory 负责创建和管理数据库连接。

#### 7.1.1 支持的数据库类型
- SQLite
- MySQL

#### 7.1.2 核心功能
- 根据配置创建数据库连接
- 管理数据库连接池
- 提供统一的数据库操作接口

### 7.2 SQLite 管理器设计
SQLiteManager 提供 SQLite 数据库的具体操作实现。

#### 7.2.1 核心功能
- 初始化数据库和表结构
- 提供 CRUD 操作方法
- 处理事务

### 7.3 表结构设计

#### 7.3.1 articles 表
存储抓取的文章信息：
- id: 主键
- title: 文章标题
- content: 文章内容
- url: 原文链接
- source: 数据源
- created_at: 创建时间
- processed: 是否已处理
- published: 是否已发布

#### 7.3.2 processed_articles 表
存储已处理的文章信息：
- id: 主键
- article_id: 关联的文章 ID
- summary: 文章摘要
- embedding: 向量表示
- rank_score: 排名分数
- created_at: 创建时间

#### 7.3.3 published_articles 表
存储已发布的文章信息：
- id: 主键
- article_id: 关联的文章 ID
- platform: 发布平台
- publish_id: 平台发布的 ID
- published_at: 发布时间

## 8. 配置管理设计

### 8.1 ConfigManager 设计
配置管理器负责管理系统的所有配置信息。

#### 8.1.1 核心功能
- 从环境变量读取配置
- 提供配置获取接口
- 支持配置热更新（未来扩展）

#### 8.1.2 配置项分类
- 数据库配置
- AI 服务配置
- 数据源配置
- 发布配置
- 通知配置

## 9. 工具模块设计

### 9.1 HTTP 客户端设计
HttpClient 提供统一的 HTTP 请求接口。

#### 9.1.1 核心功能
- 发送 GET/POST/PUT/DELETE 请求
- 处理请求头和请求体
- 统一错误处理
- 支持重试机制

### 9.2 重试工具设计
RetryUtil 提供通用的重试机制。

#### 9.2.1 核心功能
- 指数退避重试
- 自定义重试条件
- 重试次数限制
- 重试日志记录

### 9.3 向量相似度工具设计
VectorSimilarityUtil 提供向量相似度计算功能。

#### 9.3.1 核心功能
- 余弦相似度计算
- 向量归一化
- 批量相似度计算

## 10. 模板渲染模块设计

### 10.1 渲染器接口设计
定义了模板渲染器的通用接口。

### 10.2 微信文章渲染器实现
WeixinArticleRenderer 负责将处理后的内容渲染为微信文章格式。

#### 10.2.1 核心功能
- Markdown 转微信文章格式
- 图片处理和上传
- 样式适配
- 模板变量替换

## 11. AI 服务模块设计

### 11.1 LLM 工厂设计
LLMFactory 负责创建和管理各种大语言模型实例。

#### 11.1.1 支持的模型类型
- DeepSeek
- 通义千问
- 讯飞星火
- OpenAI 兼容模型

#### 11.1.2 核心功能
- 根据配置创建模型实例
- 缓存已创建的实例
- 统一的模型调用接口

### 11.2 Embedding 工厂设计
EmbeddingFactory 负责创建和管理各种向量嵌入服务实例。

#### 11.2.1 支持的服务类型
- Jina Embedding

#### 11.2.2 核心功能
- 根据配置创建服务实例
- 缓存已创建的实例
- 统一的向量生成接口

### 11.3 Reranker 工厂设计
RerankerFactory 负责创建和管理各种重排序服务实例。

#### 11.3.1 支持的服务类型
- Jina Reranker

#### 11.3.2 核心功能
- 根据配置创建服务实例
- 缓存已创建的实例
- 统一的内容重排序接口
