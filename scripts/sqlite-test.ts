#!/usr/bin/env -S deno run -A

import { SQLiteManager } from "../src/db/sqlite-manager.ts";
import { ConfigManager } from "../src/utils/config/config-manager.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("SQLiteTest");

async function testSQLite() {
  try {
    logger.info("开始 SQLite 功能测试...");
    
    // 初始化配置管理器
    const configManager = ConfigManager.getInstance();
    await configManager.initDefaultConfigSources();
    
    // 初始化数据库
    await SQLiteManager.initialize();
    
    // 测试配置管理
    logger.info("测试配置管理...");
    await SQLiteManager.setConfig("test_key", "test_value", "测试配置");
    const configValue = await SQLiteManager.getConfig("test_key");
    console.assert(configValue === "test_value", "配置读写测试失败");
    logger.info("✓ 配置管理测试通过");
    
    // 测试数据源管理
    logger.info("测试数据源管理...");
    const dataSourceId = await SQLiteManager.addDataSource("test_platform", "test_identifier", {
      url: "https://example.com",
      interval: "daily"
    });
    const dataSources = await SQLiteManager.getDataSources("test_platform");
    console.assert(dataSources.length > 0, "数据源添加测试失败");
    logger.info(`✓ 数据源管理测试通过，ID: ${dataSourceId}`);
    
    // 测试模板管理
    logger.info("测试模板管理...");
    const templateId = await SQLiteManager.createTemplate({
      name: "测试模板",
      description: "这是一个测试模板",
      platform: "test",
      style: "markdown",
      content: "# {{title}}\n\n{{content}}",
      schema: {
        title: { type: "string", required: true },
        content: { type: "string", required: true }
      },
      exampleData: {
        title: "示例标题",
        content: "示例内容"
      },
      categories: ["测试", "示例"]
    });
    const templates = await SQLiteManager.getTemplates("test");
    console.assert(templates.length > 0, "模板创建测试失败");
    logger.info(`✓ 模板管理测试通过，ID: ${templateId}`);
    
    // 测试内容管理
    logger.info("测试内容管理...");
    const contentId = await SQLiteManager.saveContent({
      title: "测试文章",
      content: "这是测试文章的内容",
      summary: "测试摘要",
      url: "https://example.com/test-article",
      platform: "test",
      author: "测试作者",
      publishedAt: new Date().toISOString(),
      tags: ["测试", "示例"],
      metadata: { source: "test" }
    });
    const contents = await SQLiteManager.getContents({ platform: "test", limit: 10 });
    console.assert(contents.length > 0, "内容保存测试失败");
    logger.info(`✓ 内容管理测试通过，ID: ${contentId}`);
    
    // 测试向量管理
    logger.info("测试向量管理...");
    const vectorId = await SQLiteManager.saveVector({
      content: "这是测试向量内容",
      vector: [0.1, 0.2, 0.3, 0.4, 0.5],
      vectorDim: 5,
      vectorType: "test",
      metadata: { source: "test" },
      sourceId: "test_source_1",
      sourceType: "test"
    });
    const vectors = await SQLiteManager.searchVectors({ vectorType: "test", limit: 10 });
    console.assert(vectors.length > 0, "向量保存测试失败");
    logger.info(`✓ 向量管理测试通过，ID: ${vectorId}`);
    
    // 测试发布记录管理
    logger.info("测试发布记录管理...");
    const publishRecordId = await SQLiteManager.savePublishRecord({
      contentId: contentId,
      templateId: templateId,
      platform: "test",
      publishedContent: "发布的内容",
      publishedUrl: "https://example.com/published",
      status: "success",
      publishedAt: new Date().toISOString()
    });
    const publishRecords = await SQLiteManager.getPublishRecords({ platform: "test", limit: 10 });
    console.assert(publishRecords.length > 0, "发布记录保存测试失败");
    logger.info(`✓ 发布记录管理测试通过，ID: ${publishRecordId}`);
    
    // 测试统计信息
    logger.info("测试统计信息...");
    const stats = await SQLiteManager.getStats();
    logger.info("数据库统计信息:", stats);
    console.assert(stats.totalContents > 0, "统计信息测试失败");
    logger.info("✓ 统计信息测试通过");
    
    // 测试数据库维护
    logger.info("测试数据库维护...");
    await SQLiteManager.analyze();
    logger.info("✓ 数据库维护测试通过");
    
    logger.info("🎉 所有 SQLite 功能测试通过！");
    
  } catch (error) {
    logger.error("SQLite 测试失败:", error);
    throw error;
  } finally {
    await SQLiteManager.close();
  }
}

if (import.meta.main) {
  testSQLite().catch((error) => {
    console.error("测试失败:", error);
    Deno.exit(1);
  });
}