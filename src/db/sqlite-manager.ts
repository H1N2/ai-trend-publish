import { DatabaseFactory } from "./database-factory.ts";
import { Logger } from "@zilla/logger";
import { sqliteSchema } from "./sqlite-schema.ts";
import { eq, and, or, desc, asc, count, sql } from "drizzle-orm";

const logger = new Logger("SQLiteManager");

export class SQLiteManager {
  private static db: any;

  static async initialize() {
    if (!this.db) {
      this.db = await DatabaseFactory.createDatabase();
    }
    return this.db;
  }

  // 配置管理
  static async getConfig(key: string): Promise<string | null> {
    const db = await this.initialize();
    const result = await db.select()
      .from(sqliteSchema.config)
      .where(eq(sqliteSchema.config.key, key))
      .limit(1);
    
    return result[0]?.value || null;
  }

  static async setConfig(key: string, value: string, description?: string): Promise<void> {
    const db = await this.initialize();
    
    const existing = await db.select()
      .from(sqliteSchema.config)
      .where(eq(sqliteSchema.config.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db.update(sqliteSchema.config)
        .set({ 
          value, 
          description,
          updatedAt: new Date().toISOString()
        })
        .where(eq(sqliteSchema.config.key, key));
    } else {
      await db.insert(sqliteSchema.config)
        .values({ key, value, description });
    }
  }

  // 数据源管理
  static async addDataSource(platform: string, identifier: string, config?: any): Promise<number> {
    const db = await this.initialize();
    
    const result = await db.insert(sqliteSchema.dataSources)
      .values({
        platform,
        identifier,
        config: config ? JSON.stringify(config) : null,
      })
      .returning({ id: sqliteSchema.dataSources.id });

    return result[0].id;
  }

  static async getDataSources(platform?: string): Promise<any[]> {
    const db = await this.initialize();
    
    let query = db.select().from(sqliteSchema.dataSources);
    
    if (platform) {
      query = query.where(eq(sqliteSchema.dataSources.platform, platform));
    }
    
    return await query;
  }

  // 模板管理
  static async createTemplate(template: {
    name: string;
    description?: string;
    platform: string;
    style: string;
    content: string;
    schema?: any;
    exampleData?: any;
    categories?: string[];
  }): Promise<number> {
    const db = await this.initialize();
    
    const result = await db.insert(sqliteSchema.templates)
      .values({
        name: template.name,
        description: template.description,
        platform: template.platform,
        style: template.style,
        content: template.content,
        schema: template.schema ? JSON.stringify(template.schema) : null,
        exampleData: template.exampleData ? JSON.stringify(template.exampleData) : null,
      })
      .returning({ id: sqliteSchema.templates.id });

    const templateId = result[0].id;

    // 添加分类
    if (template.categories && template.categories.length > 0) {
      await db.insert(sqliteSchema.templateCategories)
        .values(
          template.categories.map(category => ({
            templateId,
            category,
          }))
        );
    }

    return templateId;
  }

  static async getTemplates(platform?: string, category?: string): Promise<any[]> {
    const db = await this.initialize();
    
    let query = db.select({
      id: sqliteSchema.templates.id,
      name: sqliteSchema.templates.name,
      description: sqliteSchema.templates.description,
      platform: sqliteSchema.templates.platform,
      style: sqliteSchema.templates.style,
      content: sqliteSchema.templates.content,
      schema: sqliteSchema.templates.schema,
      exampleData: sqliteSchema.templates.exampleData,
      isActive: sqliteSchema.templates.isActive,
      createdAt: sqliteSchema.templates.createdAt,
      updatedAt: sqliteSchema.templates.updatedAt,
    }).from(sqliteSchema.templates);

    if (platform) {
      query = query.where(eq(sqliteSchema.templates.platform, platform));
    }

    if (category) {
      query = query.innerJoin(
        sqliteSchema.templateCategories,
        eq(sqliteSchema.templates.id, sqliteSchema.templateCategories.templateId)
      ).where(eq(sqliteSchema.templateCategories.category, category));
    }

    return await query;
  }

  // 内容管理
  static async saveContent(content: {
    title: string;
    content: string;
    summary?: string;
    url?: string;
    platform: string;
    author?: string;
    publishedAt?: string;
    tags?: string[];
    metadata?: any;
  }): Promise<number> {
    const db = await this.initialize();
    
    const result = await db.insert(sqliteSchema.contents)
      .values({
        title: content.title,
        content: content.content,
        summary: content.summary,
        url: content.url,
        platform: content.platform,
        author: content.author,
        publishedAt: content.publishedAt,
        tags: content.tags ? JSON.stringify(content.tags) : null,
        metadata: content.metadata ? JSON.stringify(content.metadata) : null,
      })
      .returning({ id: sqliteSchema.contents.id });

    return result[0].id;
  }

  static async getContents(options: {
    platform?: string;
    author?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const db = await this.initialize();
    
    let query = db.select().from(sqliteSchema.contents);
    
    const conditions = [];
    if (options.platform) {
      conditions.push(eq(sqliteSchema.contents.platform, options.platform));
    }
    if (options.author) {
      conditions.push(eq(sqliteSchema.contents.author, options.author));
    }
    if (options.status) {
      conditions.push(eq(sqliteSchema.contents.status, options.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(sqliteSchema.contents.createdAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  // 向量管理
  static async saveVector(vector: {
    content: string;
    vector?: number[];
    vectorDim?: number;
    vectorType?: string;
    metadata?: any;
    sourceId?: string;
    sourceType?: string;
  }): Promise<number> {
    const db = await this.initialize();
    
    const result = await db.insert(sqliteSchema.vectorItems)
      .values({
        content: vector.content,
        vector: vector.vector ? JSON.stringify(vector.vector) : null,
        vectorDim: vector.vectorDim,
        vectorType: vector.vectorType,
        metadata: vector.metadata ? JSON.stringify(vector.metadata) : null,
        sourceId: vector.sourceId,
        sourceType: vector.sourceType,
      })
      .returning({ id: sqliteSchema.vectorItems.id });

    return result[0].id;
  }

  static async searchVectors(options: {
    vectorType?: string;
    sourceType?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const db = await this.initialize();
    
    let query = db.select().from(sqliteSchema.vectorItems);
    
    const conditions = [];
    if (options.vectorType) {
      conditions.push(eq(sqliteSchema.vectorItems.vectorType, options.vectorType));
    }
    if (options.sourceType) {
      conditions.push(eq(sqliteSchema.vectorItems.sourceType, options.sourceType));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(sqliteSchema.vectorItems.createdAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  // 发布记录管理
  static async savePublishRecord(record: {
    contentId?: number;
    templateId?: number;
    platform: string;
    publishedContent: string;
    publishedUrl?: string;
    status?: string;
    errorMessage?: string;
    publishedAt?: string;
  }): Promise<number> {
    const db = await this.initialize();
    
    const result = await db.insert(sqliteSchema.publishRecords)
      .values({
        contentId: record.contentId,
        templateId: record.templateId,
        platform: record.platform,
        publishedContent: record.publishedContent,
        publishedUrl: record.publishedUrl,
        status: record.status || 'pending',
        errorMessage: record.errorMessage,
        publishedAt: record.publishedAt,
      })
      .returning({ id: sqliteSchema.publishRecords.id });

    return result[0].id;
  }

  static async getPublishRecords(options: {
    platform?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const db = await this.initialize();
    
    let query = db.select().from(sqliteSchema.publishRecords);
    
    const conditions = [];
    if (options.platform) {
      conditions.push(eq(sqliteSchema.publishRecords.platform, options.platform));
    }
    if (options.status) {
      conditions.push(eq(sqliteSchema.publishRecords.status, options.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(sqliteSchema.publishRecords.createdAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  // 统计信息
  static async getStats(): Promise<{
    totalContents: number;
    totalTemplates: number;
    totalPublishRecords: number;
    totalVectors: number;
  }> {
    const db = await this.initialize();
    
    const [contentsCount] = await db.select({ count: count() }).from(sqliteSchema.contents);
    const [templatesCount] = await db.select({ count: count() }).from(sqliteSchema.templates);
    const [publishRecordsCount] = await db.select({ count: count() }).from(sqliteSchema.publishRecords);
    const [vectorsCount] = await db.select({ count: count() }).from(sqliteSchema.vectorItems);
    
    return {
      totalContents: contentsCount.count,
      totalTemplates: templatesCount.count,
      totalPublishRecords: publishRecordsCount.count,
      totalVectors: vectorsCount.count,
    };
  }

  // 数据库维护
  static async vacuum(): Promise<void> {
    const db = await this.initialize();
    await db.run(sql`VACUUM`);
    logger.info("数据库 VACUUM 操作完成");
  }

  static async analyze(): Promise<void> {
    const db = await this.initialize();
    await db.run(sql`ANALYZE`);
    logger.info("数据库 ANALYZE 操作完成");
  }

  static async close(): Promise<void> {
    await DatabaseFactory.closeConnection();
    this.db = null;
    logger.info("SQLite 数据库连接已关闭");
  }
}