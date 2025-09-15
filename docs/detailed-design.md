# TrendPublish 详细设计文档

## 1. 核心模块详细设计

### 1.1 工作流引擎设计

#### 1.1.1 工作流基础架构
```typescript
// 工作流事件接口
interface WorkflowEvent<T = any> {
  payload: T;
  id: string;
  timestamp: number;
}

// 工作流环境接口
interface WorkflowEnv<TEnv = any> {
  id: string;
  env: TEnv;
}

// 工作流步骤选项
interface WorkflowStepOptions {
  retries?: {
    limit: number;
    delay: string | number;
    backoff: "linear" | "exponential";
  };
  timeout?: string | number;
}
```

#### 1.1.2 工作流步骤执行机制
```typescript
class WorkflowStep {
  async do<T>(
    name: string,
    optionsOrFn: WorkflowStepOptions | (() => Promise<T>),
    fn?: () => Promise<T>
  ): Promise<T> {
    // 1. 解析参数和选项
    // 2. 设置重试策略
    // 3. 执行超时控制
    // 4. 记录执行指标
    // 5. 错误处理和重试
  }
}
```

**设计要点**：
- **重试机制**：支持线性和指数退避策略
- **超时控制**：防止步骤执行时间过长
- **指标收集**：记录执行时间、重试次数等
- **错误分类**：区分可重试错误和终止错误

#### 1.1.3 工作流执行流程
1. **初始化**：创建工作流实例和指标收集器
2. **步骤执行**：按顺序执行各个步骤
3. **错误处理**：捕获和处理执行异常
4. **指标记录**：记录工作流执行统计信息
5. **通知推送**：发送执行结果通知

### 1.2 内容抓取模块设计

#### 1.2.1 抓取器接口设计
```typescript
interface ContentScraper {
  scrape(sourceId: string, options?: ScraperOptions): Promise<ScrapedContent[]>;
}

interface ScrapedContent {
  id: string;           // 唯一标识
  title: string;        // 内容标题
  content: string;      // 内容正文
  url: string;          // 原始链接
  publishDate: string;  // 发布时间
  media?: Media[];      // 媒体文件
  metadata: Record<string, any>; // 元数据
}
```

#### 1.2.2 FireCrawl 抓取器实现
```typescript
class FireCrawlScraper implements ContentScraper {
  async scrape(sourceId: string): Promise<ScrapedContent[]> {
    // 1. 调用 FireCrawl API 抓取网页
    // 2. 解析返回的结构化数据
    // 3. 提取标题、内容、链接等信息
    // 4. 生成唯一 ID 和元数据
    // 5. 返回标准化的内容数据
  }
}
```

**设计特点**：
- **API 集成**：与 FireCrawl 服务深度集成
- **数据清洗**：自动清理 HTML 标签和格式
- **错误处理**：网络异常和 API 限制处理
- **缓存机制**：避免重复抓取相同内容

#### 1.2.3 Twitter 抓取器实现
```typescript
class TwitterScraper implements ContentScraper {
  async scrape(sourceId: string): Promise<ScrapedContent[]> {
    // 1. 解析 Twitter 用户名或链接
    // 2. 调用 Twitter API 获取推文
    // 3. 处理媒体文件（图片、视频）
    // 4. 处理转发和引用推文
    // 5. 格式化为标准内容结构
  }
}
```

**设计特点**：
- **多媒体支持**：处理图片、视频等媒体内容
- **关系处理**：处理转发、回复、引用关系
- **API 限制**：处理 Twitter API 的频率限制
- **数据丰富**：提取用户信息、互动数据等

### 1.3 AI 内容处理模块设计

#### 1.3.1 LLM 提供者工厂模式
```typescript
class LLMFactory {
  private providers = new Map<string, LLMProvider>();
  
  getProvider(config: LLMConfig): LLMProvider {
    const key = this.getCacheKey(config);
    if (!this.providers.has(key)) {
      this.providers.set(key, this.createProvider(config));
    }
    return this.providers.get(key)!;
  }
  
  private createProvider(config: LLMConfig): LLMProvider {
    switch (config.providerType) {
      case LLMProviderType.DEEPSEEK:
        return new DeepSeekProvider(config);
      case LLMProviderType.QWEN:
        return new QwenProvider(config);
      // ... 其他提供者
    }
  }
}
```

#### 1.3.2 内容摘要器设计
```typescript
class AISummarizer implements ContentSummarizer {
  async summarize(content: string): Promise<Summary> {
    // 1. 获取配置的 LLM 提供者
    // 2. 构建摘要提示词
    // 3. 调用 AI 服务生成摘要
    // 4. 解析返回结果
    // 5. 提取标题、内容、关键词
  }
  
  async generateTitle(content: string): Promise<string> {
    // 专门的标题生成逻辑
  }
}
```

**设计要点**：
- **提示词工程**：精心设计的提示词模板
- **结果解析**：结构化解析 AI 返回结果
- **错误恢复**：AI 服务异常时的降级策略
- **质量控制**：内容质量检查和过滤

#### 1.3.3 内容排序器设计
```typescript
class ContentRanker {
  async rankContents(contents: ScrapedContent[]): Promise<RankResult[]> {
    // 1. 批量处理内容评分
    // 2. 调用 AI 服务进行质量评估
    // 3. 解析评分结果
    // 4. 返回排序后的内容列表
  }
}

interface RankResult {
  id: string;
  score: number;
  reason?: string;
}
```

**评分维度**：
- **内容质量**：原创性、深度、准确性
- **时效性**：发布时间、热度趋势
- **相关性**：与目标受众的匹配度
- **传播价值**：分享和讨论潜力

### 1.4 向量化和去重模块设计

#### 1.4.1 向量服务设计
```typescript
class VectorService {
  async create(item: VectorCreateInput): Promise<VectorItem>;
  async createBatch(items: VectorCreateInput[]): Promise<VectorItem[]>;
  async findSimilar(vector: number[], threshold: number): Promise<VectorItem[]>;
  async getByType(vectorType: string): Promise<VectorItem[]>;
}

interface VectorItem {
  id: number;
  content: string;
  vector: number[];
  vectorDim: number;
  vectorType: string;
  createdAt: Date;
}
```

#### 1.4.2 相似度计算
```typescript
class VectorSimilarityUtil {
  static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    // 余弦相似度计算实现
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

#### 1.4.3 去重流程设计
1. **向量计算**：为新内容生成文本向量
2. **相似度比较**：与已存储向量计算相似度
3. **阈值判断**：超过阈值则判定为重复内容
4. **向量存储**：将新向量存储到数据库
5. **统计记录**：记录去重统计信息

### 1.5 发布模块设计

#### 1.5.1 微信发布器设计
```typescript
class WeixinPublisher implements ContentPublisher {
  async publish(
    content: string,
    title: string,
    digest: string,
    thumbMediaId: string
  ): Promise<PublishResult> {
    // 1. 验证 IP 白名单
    // 2. 获取访问令牌
    // 3. 创建草稿
    // 4. 发布文章
    // 5. 返回发布结果
  }
  
  async uploadImage(imageUrl: string): Promise<string> {
    // 1. 下载网络图片
    // 2. 上传到微信服务器
    // 3. 返回媒体 ID
  }
}
```

#### 1.5.2 模板渲染系统
```typescript
class WeixinArticleTemplateRenderer {
  async render(data: WeixinTemplate[]): Promise<string> {
    // 1. 获取模板配置
    // 2. 选择模板文件
    // 3. 渲染 EJS 模板
    // 4. 处理图片和样式
    // 5. 返回最终 HTML
  }
}
```

**模板特性**：
- **响应式设计**：适配不同屏幕尺寸
- **样式丰富**：多种视觉风格选择
- **内容适配**：自动适配不同类型内容
- **SEO 优化**：良好的搜索引擎优化

## 2. 数据库设计

### 2.1 数据表结构

#### 2.1.1 数据源表 (data_sources)
```sql
CREATE TABLE data_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  identifier VARCHAR(500) NOT NULL,
  platform ENUM('firecrawl', 'twitter') NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2.1.2 向量表 (vectors)
```sql
CREATE TABLE vectors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT,
  vector JSON NOT NULL,
  vector_dim INT NOT NULL,
  vector_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vector_type (vector_type),
  INDEX idx_created_at (created_at)
);
```

### 2.2 数据访问层设计

#### 2.2.1 Drizzle ORM 配置
```typescript
// 数据库连接配置
export const db = drizzle(mysql2, {
  schema: { dataSources, vectors },
  mode: 'default',
});

// 表结构定义
export const dataSources = mysqlTable('data_sources', {
  id: int('id').primaryKey().autoincrement(),
  identifier: varchar('identifier', { length: 500 }).notNull(),
  platform: mysqlEnum('platform', ['firecrawl', 'twitter']).notNull(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
```

## 3. API 设计

### 3.1 JSON-RPC API

#### 3.1.1 API 接口定义
```typescript
interface JSONRPCRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, any>;
  id: string | number;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: JSONRPCError;
  id: string | number;
}
```

#### 3.1.2 工作流触发接口
```typescript
// 请求示例
{
  "jsonrpc": "2.0",
  "method": "triggerWorkflow",
  "params": {
    "workflowType": "weixin-article-workflow"
  },
  "id": 1
}

// 响应示例
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "工作流已启动"
  },
  "id": 1
}
```

### 3.2 RESTful API 设计

#### 3.2.1 工作流状态查询
```
GET /api/workflow/{workflowId}/status
GET /api/workflow/{workflowId}/metrics
GET /api/workflow/{workflowId}/logs
```

#### 3.2.2 配置管理接口
```
GET /api/config/datasources
POST /api/config/datasources
PUT /api/config/datasources/{id}
DELETE /api/config/datasources/{id}
```

## 4. 配置管理设计

### 4.1 配置层次结构
```
环境变量 > 数据库配置 > 默认配置
```

### 4.2 配置管理器设计
```typescript
class ConfigManager {
  private static instance: ConfigManager;
  private configSources: ConfigSource[] = [];
  
  async get<T>(key: string): Promise<T | undefined> {
    // 按优先级顺序查找配置值
    for (const source of this.configSources) {
      const value = await source.get(key);
      if (value !== undefined) return value;
    }
    return undefined;
  }
  
  async initDefaultConfigSources(): Promise<void> {
    // 初始化默认配置源
    this.configSources = [
      new EnvironmentConfigSource(),
      new DatabaseConfigSource(),
      new DefaultConfigSource()
    ];
  }
}
```

## 5. 错误处理和日志设计

### 5.1 错误分类体系
```typescript
// 工作流终止错误（不可重试）
class WorkflowTerminateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowTerminateError';
  }
}

// 工作流步骤错误（可重试）
class WorkflowStepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowStepError';
  }
}
```

### 5.2 日志设计
```typescript
// 结构化日志格式
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  logger: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

// 日志使用示例
const logger = new Logger("workflow");
logger.info("工作流开始执行", { workflowId, eventId });
logger.error("步骤执行失败", { stepName, error });
```

## 6. 性能优化设计

### 6.1 并发处理
- **并行抓取**：多个数据源同时抓取
- **批量处理**：AI 服务批量调用
- **异步执行**：非阻塞的异步操作

### 6.2 缓存策略
- **访问令牌缓存**：微信 API 令牌缓存
- **配置缓存**：减少数据库查询
- **模板缓存**：编译后的模板缓存

### 6.3 资源管理
- **连接池**：数据库连接池管理
- **内存控制**：大文件流式处理
- **超时控制**：防止资源泄露

## 7. 安全设计

### 7.1 API 安全
```typescript
// API 密钥验证中间件
class APIKeyValidator {
  validate(request: Request): boolean {
    const apiKey = request.headers.get('X-API-Key');
    return apiKey === process.env.SERVER_API_KEY;
  }
}
```

### 7.2 数据安全
- **敏感信息加密**：API 密钥等敏感信息加密存储
- **访问控制**：基于角色的访问控制
- **审计日志**：关键操作审计记录

### 7.3 网络安全
- **HTTPS 传输**：所有 API 调用使用 HTTPS
- **IP 白名单**：限制访问来源 IP
- **请求限流**：防止 API 滥用

## 8. 监控和指标设计

### 8.1 业务指标
```typescript
interface BusinessMetrics {
  totalArticlesProcessed: number;
  successfulPublications: number;
  failedPublications: number;
  averageProcessingTime: number;
  duplicateContentFiltered: number;
}
```

### 8.2 技术指标
```typescript
interface TechnicalMetrics {
  apiResponseTime: number;
  databaseQueryTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
}
```

### 8.3 告警机制
- **阈值告警**：关键指标超过阈值时告警
- **异常告警**：系统异常时立即告警
- **趋势告警**：指标趋势异常时告警

## 9. 扩展性设计

### 9.1 插件化架构
```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(): Promise<void>;
  execute(context: PluginContext): Promise<any>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }
  
  async executePlugin(name: string, context: PluginContext): Promise<any> {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    return await plugin.execute(context);
  }
}
```

### 9.2 微服务化准备
- **服务拆分**：按功能模块拆分服务
- **API 网关**：统一 API 入口
- **服务发现**：动态服务注册和发现
- **配置中心**：集中配置管理

### 9.3 水平扩展
- **无状态设计**：服务无状态化
- **负载均衡**：请求负载均衡
- **数据分片**：数据库水平分片
- **缓存集群**：分布式缓存