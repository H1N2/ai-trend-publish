#!/usr/bin/env -S deno run -A

import { SQLiteManager } from "../src/db/sqlite-manager.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("SQLiteMigrate");

async function migrate() {
  try {
    logger.info("开始 SQLite 数据库迁移...");
    
    // 初始化数据库连接
    await SQLiteManager.initialize();
    
    // 设置一些默认配置
    await SQLiteManager.setConfig("DB_VERSION", "1.0.0", "数据库版本");
    await SQLiteManager.setConfig("MIGRATION_DATE", new Date().toISOString(), "最后迁移时间");
    
    // 创建一些示例模板
    const templateId = await SQLiteManager.createTemplate({
      name: "默认文章模板",
      description: "用于发布文章的默认模板",
      platform: "general",
      style: "markdown",
      content: `# {{title}}

{{#if summary}}
## 摘要
{{summary}}
{{/if}}

{{content}}

{{#if tags}}
## 标签
{{#each tags}}
- {{this}}
{{/each}}
{{/if}}

---
发布时间: {{publishedAt}}
{{#if author}}作者: {{author}}{{/if}}`,
      schema: {
        title: { type: "string", required: true },
        content: { type: "string", required: true },
        summary: { type: "string", required: false },
        tags: { type: "array", required: false },
        author: { type: "string", required: false },
        publishedAt: { type: "string", required: false }
      },
      exampleData: {
        title: "示例文章标题",
        content: "这是文章的主要内容...",
        summary: "这是文章摘要",
        tags: ["技术", "AI", "趋势"],
        author: "作者名称",
        publishedAt: "2024-01-01"
      },
      categories: ["文章", "通用"]
    });
    
    logger.info(`创建默认模板，ID: ${templateId}`);
    
    // 添加一些示例数据源
    await SQLiteManager.addDataSource("github", "trending", {
      url: "https://github.com/trending",
      interval: "daily"
    });
    
    await SQLiteManager.addDataSource("hackernews", "frontpage", {
      url: "https://news.ycombinator.com/",
      interval: "hourly"
    });
    
    logger.info("添加示例数据源完成");
    
    // 显示统计信息
    const stats = await SQLiteManager.getStats();
    logger.info("数据库统计信息:", stats);
    
    logger.info("SQLite 数据库迁移完成！");
    
  } catch (error) {
    logger.error("数据库迁移失败:", error);
    throw error;
  } finally {
    await SQLiteManager.close();
  }
}

if (import.meta.main) {
  migrate().catch((error) => {
    console.error("迁移失败:", error);
    Deno.exit(1);
  });
}