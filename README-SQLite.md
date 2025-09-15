# SQLite3 数据库支持

本项目已添加完整的 SQLite3 数据库支持，提供了高性能的本地数据存储解决方案。

## 功能特性

- ✅ 完整的 SQLite3 数据库支持
- ✅ 使用 Drizzle ORM 进行类型安全的数据库操作
- ✅ 自动表结构初始化和索引优化
- ✅ 数据库迁移和备份工具
- ✅ 丰富的数据管理 API
- ✅ 性能优化配置（WAL 模式、缓存等）

## 数据库结构

### 核心表

1. **config** - 配置管理
2. **data_sources** - 数据源管理
3. **templates** - 模板管理
4. **template_categories** - 模板分类
5. **template_versions** - 模板版本
6. **contents** - 内容存储
7. **publish_records** - 发布记录
8. **vector_items** - 向量数据

### 关系设计

- 模板与分类：一对多关系
- 模板与版本：一对多关系
- 内容与发布记录：一对多关系
- 完整的外键约束和级联删除

## 快速开始

### 1. 环境配置

在环境变量或配置文件中设置：

```bash
DB_TYPE=sqlite
SQLITE_DB_PATH=./data/trendfinder.db
```

### 2. 数据库初始化

```bash
# 运行数据库迁移
deno task db:migrate

# 测试数据库功能
deno task db:test
```

### 3. 基本使用

```typescript
import { SQLiteManager } from "./src/db/sqlite-manager.ts";

// 初始化数据库
await SQLiteManager.initialize();

// 配置管理
await SQLiteManager.setConfig("app_name", "TrendFinder");
const appName = await SQLiteManager.getConfig("app_name");

// 创建模板
const templateId = await SQLiteManager.createTemplate({
  name: "文章模板",
  platform: "blog",
  style: "markdown",
  content: "# {{title}}\n\n{{content}}",
  categories: ["文章", "博客"]
});

// 保存内容
const contentId = await SQLiteManager.saveContent({
  title: "AI 趋势分析",
  content: "人工智能的最新发展...",
  platform: "blog",
  author: "作者名称",
  tags: ["AI", "技术", "趋势"]
});

// 关闭连接
await SQLiteManager.close();
```

## 可用命令

### 数据库管理

```bash
# 数据库迁移（初始化表结构和示例数据）
deno task db:migrate

# 数据库备份
deno task db:backup

# 功能测试
deno task db:test

# 生成 Drizzle 迁移文件
deno task drizzle:generate

# 执行 Drizzle 迁移
deno task drizzle:migrate
```

## API 参考

### SQLiteManager 类

#### 配置管理
- `getConfig(key: string)` - 获取配置
- `setConfig(key: string, value: string, description?: string)` - 设置配置

#### 数据源管理
- `addDataSource(platform: string, identifier: string, config?: any)` - 添加数据源
- `getDataSources(platform?: string)` - 获取数据源列表

#### 模板管理
- `createTemplate(template: TemplateData)` - 创建模板
- `getTemplates(platform?: string, category?: string)` - 获取模板列表

#### 内容管理
- `saveContent(content: ContentData)` - 保存内容
- `getContents(options: ContentOptions)` - 获取内容列表

#### 向量管理
- `saveVector(vector: VectorData)` - 保存向量
- `searchVectors(options: VectorOptions)` - 搜索向量

#### 发布记录管理
- `savePublishRecord(record: PublishRecordData)` - 保存发布记录
- `getPublishRecords(options: PublishRecordOptions)` - 获取发布记录

#### 统计和维护
- `getStats()` - 获取数据库统计信息
- `vacuum()` - 数据库压缩
- `analyze()` - 数据库分析优化
- `close()` - 关闭数据库连接

## 性能优化

### 数据库配置

SQLite 数据库已启用以下性能优化：

```sql
PRAGMA journal_mode = WAL;     -- 启用 WAL 模式提高并发性能
PRAGMA synchronous = NORMAL;   -- 平衡性能和安全性
PRAGMA cache_size = 1000000;   -- 设置缓存大小
PRAGMA foreign_keys = ON;      -- 启用外键约束
PRAGMA temp_store = MEMORY;    -- 临时数据存储在内存中
```

### 索引优化

所有表都已创建适当的索引：
- 主键自动索引
- 外键索引
- 查询频繁字段的复合索引
- 唯一约束索引

## 备份和恢复

### 自动备份

```bash
# 手动备份
deno task db:backup
```

备份功能特性：
- 使用 `VACUUM INTO` 创建压缩备份
- 自动生成时间戳文件名
- 自动清理超过 7 天的旧备份
- 显示备份文件大小信息

### 恢复数据

```bash
# 将备份文件复制为主数据库文件
cp data/trendfinder_backup_2024-01-01T12-00-00-000Z.db data/trendfinder.db
```

## 故障排除

### 常见问题

1. **数据库文件权限问题**
   ```bash
   # 确保数据目录存在且有写权限
   mkdir -p data
   chmod 755 data
   ```

2. **依赖包问题**
   ```bash
   # 清理并重新安装依赖
   rm -rf node_modules
   deno cache --reload src/db/sqlite-schema.ts
   ```

3. **数据库锁定问题**
   ```bash
   # 检查是否有其他进程在使用数据库
   lsof data/trendfinder.db
   ```

### 调试模式

设置环境变量启用详细日志：

```bash
export LOG_LEVEL=debug
deno task db:test
```

## 迁移指南

### 从其他数据库迁移

如果你之前使用 MySQL，可以通过以下步骤迁移：

1. 设置数据库类型为 SQLite
2. 运行迁移脚本初始化表结构
3. 编写数据迁移脚本转换现有数据
4. 验证数据完整性

### 版本升级

数据库结构变更时：

1. 备份现有数据库
2. 更新代码到新版本
3. 运行迁移脚本
4. 验证功能正常

## 贡献

欢迎提交 Issue 和 Pull Request 来改进 SQLite 支持功能。

## 许可证

本项目采用 MIT 许可证。