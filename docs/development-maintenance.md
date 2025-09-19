# 二次开发和维护说明文档

## 1. 项目结构说明

### 1.1 目录结构
```
ai-trend-publish/
├── src/                  # 源代码目录
│   ├── controllers/      # 控制器层
│   ├── data-sources/     # 数据源配置
│   ├── db/              # 数据库相关
│   ├── modules/         # 功能模块
│   │   ├── interfaces/  # 接口定义
│   │   ├── notify/      # 通知模块
│   │   ├── publishers/  # 发布模块
│   │   ├── render/      # 渲染模块
│   │   ├── scrapers/    # 抓取模块
│   │   ├── summarizer/  # 摘要模块
│   │   └── content-rank/# 排名模块
│   ├── providers/       # 服务提供商
│   │   ├── embedding/   # 向量嵌入服务
│   │   ├── llm/         # 大语言模型服务
│   │   ├── reranker/    # 重排序服务
│   │   └── interfaces/  # 接口定义
│   ├── services/        # 服务层
│   ├── utils/           # 工具类
│   ├── works/           # 工作流
│   ├── index.ts         # 入口文件
│   └── server.ts        # 服务器文件
├── docs/                # 文档目录
├── tests/               # 测试目录
├── deno.json            # 项目配置文件
├── deno.lock            # 锁文件
├── .env.example         # 环境变量示例
└── README.md            # 项目说明
```

### 1.2 核心文件说明

#### 1.2.1 入口文件
- [src/index.ts](../src/index.ts): 项目入口文件，负责初始化配置和启动服务
- [src/server.ts](../src/server.ts): JSON-RPC 服务器实现

#### 1.2.2 控制器文件
- [src/controllers/cron.ts](../src/controllers/cron.ts): 定时任务调度控制器

#### 1.2.3 工作流文件
- [src/works/workflow.ts](../src/works/workflow.ts): 工作流基类
- [src/services/weixin-article.workflow.ts](../src/services/weixin-article.workflow.ts): 微信文章工作流
- [src/services/weixin-aibench.workflow.ts](../src/services/weixin-aibench.workflow.ts): AI 基准测试工作流
- [src/services/weixin-hellogithub.workflow.ts](../src/services/weixin-hellogithub.workflow.ts): HelloGitHub 工作流

## 2. 开发规范

### 2.1 编码规范
- 使用 TypeScript 进行开发
- 遵循 Deno 编码规范
- 使用 ESLint 进行代码检查
- 添加必要的注释和文档

### 2.2 命名规范
- 类名使用 PascalCase
- 方法名和变量名使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 接口名使用 PascalCase 并以 Interface 结尾

### 2.3 注释规范
- 类和接口需要添加详细注释说明功能和用途
- 公共方法需要添加注释说明参数和返回值
- 复杂逻辑需要添加行内注释说明实现思路

### 2.4 提交规范
- 使用 conventional commits 规范提交信息
- 每次提交只包含一个功能或修复
- 提交前运行测试确保代码质量

## 3. 扩展开发指南

### 3.1 添加新的数据源

#### 3.1.1 创建抓取器实现
1. 在 [src/modules/scrapers/](../src/modules/scrapers/) 目录下创建新的抓取器文件
2. 实现 [ContentScraper](../src/modules/interfaces/scraper.interface.ts) 接口
3. 在 [ScraperType](../src/modules/scrapers/scraper-factory.ts) 枚举中添加新的类型
4. 在 [ScraperFactory](../src/modules/scrapers/scraper-factory.ts) 中注册新的抓取器

#### 3.1.2 示例代码
```typescript
// src/modules/scrapers/new-source.scraper.ts
import { ContentScraper, ScraperOptions, ScrapedContent } from "@src/modules/interfaces/scraper.interface.ts";

export class NewSourceScraper implements ContentScraper {
  async initialize(): Promise<void> {
    // 初始化逻辑
  }

  async scrape(source: string, options?: ScraperOptions): Promise<ScrapedContent[]> {
    // 抓取逻辑
    return [];
  }
}
```

### 3.2 添加新的 AI 服务

#### 3.2.1 创建 LLM 实现
1. 在 [src/providers/llm/](../src/providers/llm/) 目录下创建新的 LLM 文件
2. 实现 [LLMProvider](../src/providers/interfaces/llm.interface.ts) 接口
3. 在 [LLMProviderType](../src/providers/llm/llm-factory.ts) 枚举中添加新的类型
4. 在 [LLMFactory](../src/providers/llm/llm-factory.ts) 中注册新的 LLM

#### 3.2.2 创建 Embedding 实现
1. 在 [src/providers/embedding/](../src/providers/embedding/) 目录下创建新的 Embedding 文件
2. 实现 [EmbeddingProvider](../src/providers/interfaces/embedding.interface.ts) 接口
3. 在 [EmbeddingProviderType](../src/providers/embedding/embedding-factory.ts) 枚举中添加新的类型
4. 在 [EmbeddingFactory](../src/providers/embedding/embedding-factory.ts) 中注册新的 Embedding 服务

### 3.3 添加新的发布平台

#### 3.3.1 创建发布器实现
1. 在 [src/modules/publishers/](../src/modules/publishers/) 目录下创建新的发布器文件
2. 实现 [Publisher](../src/modules/interfaces/publisher.interface.ts) 接口
3. 在 [PublisherType](../src/modules/publishers/publisher-factory.ts) 枚举中添加新的类型
4. 在 [PublisherFactory](../src/modules/publishers/publisher-factory.ts) 中注册新的发布器

### 3.4 添加新的通知方式

#### 3.4.1 创建通知服务实现
1. 在 [src/modules/notify/](../src/modules/notify/) 目录下创建新的通知服务文件
2. 实现 [Notify](../src/modules/interfaces/notify.interface.ts) 接口
3. 在 [NotifyType](../src/modules/notify/notify-factory.ts) 枚举中添加新的类型
4. 在 [NotifyFactory](../src/modules/notify/notify-factory.ts) 中注册新的通知服务

## 4. 测试指南

### 4.1 单元测试
项目使用 Deno 内置的测试框架进行单元测试。

#### 4.1.1 运行测试
```bash
deno test
```

#### 4.1.2 编写测试
在 [tests/](../tests/) 目录下创建测试文件，文件名以 `.test.ts` 结尾。

```typescript
// tests/example.test.ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("example test", () => {
  assertEquals(1 + 1, 2);
});
```

### 4.2 集成测试
集成测试用于测试模块间的协作。

### 4.3 端到端测试
端到端测试用于测试整个系统的功能。

## 5. 维护指南

### 5.1 日常维护任务

#### 5.1.1 数据库维护
- 定期备份数据库
- 清理过期数据
- 优化数据库性能

#### 5.1.2 日志管理
- 定期轮转日志文件
- 分析日志发现潜在问题
- 设置日志告警

#### 5.1.3 性能监控
- 监控系统资源使用情况
- 监控 API 响应时间
- 监控任务执行情况

### 5.2 故障处理

#### 5.2.1 常见故障及处理方法
1. 服务无法启动
   - 检查端口占用情况
   - 检查环境变量配置
   - 查看启动日志

2. 数据库连接失败
   - 检查数据库服务状态
   - 检查数据库连接配置
   - 检查网络连接

3. API 调用失败
   - 检查 API 密钥配置
   - 检查网络连接
   - 查看 API 服务状态

#### 5.2.2 应急预案
1. 准备备用服务器
2. 定期备份数据
3. 准备回滚方案

### 5.3 版本升级

#### 5.3.1 升级前准备
- 备份当前版本代码和数据
- 阅读更新日志了解变更内容
- 准备回滚方案

#### 5.3.2 升级步骤
1. 停止当前服务
2. 获取最新代码
3. 更新依赖
4. 运行数据库迁移脚本（如果有）
5. 启动服务
6. 验证功能

#### 5.3.3 升级后验证
- 检查服务是否正常启动
- 验证核心功能是否正常
- 监控系统日志

## 6. 性能优化建议

### 6.1 代码优化
- 避免重复计算
- 使用缓存减少重复请求
- 优化数据库查询

### 6.2 数据库优化
- 添加合适的索引
- 优化查询语句
- 定期分析和优化表结构

### 6.3 网络优化
- 使用连接池减少连接开销
- 合理设置超时时间
- 使用 CDN 加速静态资源

## 7. 安全建议

### 7.1 数据安全
- 敏感信息加密存储
- 定期更换 API 密钥
- 限制数据库访问权限

### 7.2 网络安全
- 使用 HTTPS 加密通信
- 设置防火墙规则
- 定期更新系统和依赖

### 7.3 应用安全
- 验证输入参数
- 防止 SQL 注入
- 防止 XSS 攻击

## 8. 监控和告警

### 8.1 监控指标
- 系统资源使用率（CPU、内存、磁盘）
- API 响应时间
- 错误率
- 任务执行成功率

### 8.2 告警设置
- 设置合理的告警阈值
- 配置多种告警通知方式
- 定期检查和优化告警规则

## 9. 文档维护

### 9.1 文档更新
- 功能变更时同步更新文档
- 定期检查文档准确性
- 收集用户反馈优化文档

### 9.2 文档版本管理
- 重要版本更新时保留历史文档
- 标记文档的适用版本
- 提供文档更新日志