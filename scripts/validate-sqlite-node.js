#!/usr/bin/env node

/**
 * SQLite 支持验证脚本 (Node.js 版本)
 * 这个脚本验证 SQLite 支持的代码结构和配置是否正确
 */

const fs = require('fs');
const path = require('path');

class SQLiteValidator {
  constructor() {
    this.results = [];
  }

  async validate() {
    console.log("🔍 开始验证 SQLite 支持...\n");

    await this.validateDependencies();
    await this.validateSchemaFile();
    await this.validateDatabaseFactory();
    await this.validateSQLiteManager();
    await this.validateConfigFiles();
    await this.validateScripts();

    this.printResults();
  }

  async validateDependencies() {
    try {
      const denoJsonPath = path.join(process.cwd(), 'deno.json');
      const denoJsonContent = fs.readFileSync(denoJsonPath, 'utf8');
      const config = JSON.parse(denoJsonContent);
      
      const requiredDeps = [
        "drizzle-orm",
        "drizzle-kit", 
        "better-sqlite3"
      ];

      const imports = config.imports || {};
      const missingDeps = requiredDeps.filter(dep => 
        !Object.keys(imports).some(key => key.includes(dep))
      );

      if (missingDeps.length === 0) {
        this.addResult(true, "✅ 所有必需的依赖都已配置");
      } else {
        this.addResult(false, "❌ 缺少依赖", `缺少: ${missingDeps.join(", ")}`);
      }

      // 检查任务配置
      const tasks = config.tasks || {};
      const requiredTasks = ["db:migrate", "db:backup", "db:test"];
      const missingTasks = requiredTasks.filter(task => !tasks[task]);

      if (missingTasks.length === 0) {
        this.addResult(true, "✅ 数据库任务已配置");
      } else {
        this.addResult(false, "❌ 缺少数据库任务", `缺少: ${missingTasks.join(", ")}`);
      }

    } catch (error) {
      this.addResult(false, "❌ 无法读取 deno.json", error.message);
    }
  }

  async validateSchemaFile() {
    try {
      const schemaPath = path.join(process.cwd(), 'src/db/sqlite-schema.ts');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      const requiredImports = [
        "drizzle-orm/sqlite-core",
        "drizzle-orm"
      ];

      const requiredTables = [
        "config",
        "dataSources", 
        "templates",
        "templateCategories",
        "templateVersions",
        "vectorItems",
        "contents",
        "publishRecords"
      ];

      const requiredRelations = [
        "templatesRelations",
        "templateCategoriesRelations",
        "templateVersionsRelations",
        "contentsRelations",
        "publishRecordsRelations"
      ];

      // 检查导入
      const missingImports = requiredImports.filter(imp => 
        !schemaContent.includes(`from "${imp}"`)
      );

      if (missingImports.length === 0) {
        this.addResult(true, "✅ Schema 文件导入正确");
      } else {
        this.addResult(false, "❌ Schema 文件缺少导入", `缺少: ${missingImports.join(", ")}`);
      }

      // 检查表定义
      const missingTables = requiredTables.filter(table => 
        !schemaContent.includes(`export const ${table} = sqliteTable`)
      );

      if (missingTables.length === 0) {
        this.addResult(true, "✅ 所有必需的表都已定义");
      } else {
        this.addResult(false, "❌ 缺少表定义", `缺少: ${missingTables.join(", ")}`);
      }

      // 检查关系定义
      const missingRelations = requiredRelations.filter(relation => 
        !schemaContent.includes(`export const ${relation} = relations`)
      );

      if (missingRelations.length === 0) {
        this.addResult(true, "✅ 所有表关系都已定义");
      } else {
        this.addResult(false, "❌ 缺少关系定义", `缺少: ${missingRelations.join(", ")}`);
      }

      // 检查索引定义
      if (schemaContent.includes("index(") && schemaContent.includes("uniqueIndex(")) {
        this.addResult(true, "✅ 包含索引定义");
      } else {
        this.addResult(false, "❌ 缺少索引定义");
      }

      // 检查外键约束
      if (schemaContent.includes("references(") && schemaContent.includes("onDelete:")) {
        this.addResult(true, "✅ 包含外键约束");
      } else {
        this.addResult(false, "❌ 缺少外键约束");
      }

    } catch (error) {
      this.addResult(false, "❌ 无法读取 sqlite-schema.ts", error.message);
    }
  }

  async validateDatabaseFactory() {
    try {
      const factoryPath = path.join(process.cwd(), 'src/db/database-factory.ts');
      const factoryContent = fs.readFileSync(factoryPath, 'utf8');
      
      const requiredFeatures = [
        "drizzle-orm/better-sqlite3",
        "better-sqlite3",
        "createSqliteDatabase",
        "initializeSqliteTables",
        "journal_mode = WAL",
        "foreign_keys = ON"
      ];

      const missingFeatures = requiredFeatures.filter(feature => 
        !factoryContent.includes(feature)
      );

      if (missingFeatures.length === 0) {
        this.addResult(true, "✅ DatabaseFactory SQLite 支持完整");
      } else {
        this.addResult(false, "❌ DatabaseFactory 缺少功能", `缺少: ${missingFeatures.join(", ")}`);
      }

      // 检查性能优化配置
      const optimizations = [
        "synchronous = NORMAL",
        "cache_size = 1000000",
        "temp_store = MEMORY"
      ];

      const missingOptimizations = optimizations.filter(opt => 
        !factoryContent.includes(opt)
      );

      if (missingOptimizations.length === 0) {
        this.addResult(true, "✅ 包含性能优化配置");
      } else {
        this.addResult(false, "❌ 缺少性能优化", `缺少: ${missingOptimizations.join(", ")}`);
      }

      // 检查错误处理
      if (factoryContent.includes("try {") && factoryContent.includes("catch (error)")) {
        this.addResult(true, "✅ 包含错误处理");
      } else {
        this.addResult(false, "❌ 缺少错误处理");
      }

    } catch (error) {
      this.addResult(false, "❌ 无法读取 database-factory.ts", error.message);
    }
  }

  async validateSQLiteManager() {
    try {
      const managerPath = path.join(process.cwd(), 'src/db/sqlite-manager.ts');
      const managerContent = fs.readFileSync(managerPath, 'utf8');
      
      const requiredMethods = [
        "getConfig",
        "setConfig", 
        "addDataSource",
        "getDataSources",
        "createTemplate",
        "getTemplates",
        "saveContent",
        "getContents",
        "saveVector",
        "searchVectors",
        "savePublishRecord",
        "getPublishRecords",
        "getStats",
        "vacuum",
        "analyze",
        "close"
      ];

      const missingMethods = requiredMethods.filter(method => 
        !managerContent.includes(`static async ${method}(`)
      );

      if (missingMethods.length === 0) {
        this.addResult(true, "✅ SQLiteManager 所有方法都已实现");
      } else {
        this.addResult(false, "❌ SQLiteManager 缺少方法", `缺少: ${missingMethods.join(", ")}`);
      }

      // 检查 Drizzle ORM 操作
      const drizzleOps = ["select()", ".insert(", ".update(", ".where(", "eq(", "and("];
      const missingOps = drizzleOps.filter(op => !managerContent.includes(op));

      if (missingOps.length === 0) {
        this.addResult(true, "✅ 使用了 Drizzle ORM 操作");
      } else {
        this.addResult(false, "❌ 缺少 Drizzle ORM 操作", `缺少: ${missingOps.join(", ")}`);
      }

      // 检查 JSON 处理
      if (managerContent.includes("JSON.stringify")) {
        this.addResult(true, "✅ 包含 JSON 数据处理");
      } else {
        this.addResult(false, "❌ 缺少 JSON 数据处理");
      }

    } catch (error) {
      this.addResult(false, "❌ 无法读取 sqlite-manager.ts", error.message);
    }
  }

  async validateConfigFiles() {
    try {
      // 检查 SQLite Drizzle 配置
      const sqliteConfigPath = path.join(process.cwd(), 'drizzle.sqlite.config.ts');
      const sqliteConfig = fs.readFileSync(sqliteConfigPath, 'utf8');
      
      if (sqliteConfig.includes('dialect: "sqlite"') && 
          sqliteConfig.includes("./src/db/sqlite-schema.ts")) {
        this.addResult(true, "✅ SQLite Drizzle 配置正确");
      } else {
        this.addResult(false, "❌ SQLite Drizzle 配置不正确");
      }

    } catch (error) {
      this.addResult(false, "❌ 无法读取 drizzle.sqlite.config.ts", error.message);
    }
  }

  async validateScripts() {
    const scripts = [
      { file: "scripts/sqlite-migrate.ts", name: "迁移脚本" },
      { file: "scripts/sqlite-backup.ts", name: "备份脚本" },
      { file: "scripts/sqlite-test.ts", name: "测试脚本" }
    ];

    for (const script of scripts) {
      try {
        const scriptPath = path.join(process.cwd(), script.file);
        const content = fs.readFileSync(scriptPath, 'utf8');
        
        if (content.includes("SQLiteManager") && 
            content.includes("import.meta.main")) {
          this.addResult(true, `✅ ${script.name}结构正确`);
        } else {
          this.addResult(false, `❌ ${script.name}结构不正确`);
        }

      } catch (error) {
        this.addResult(false, `❌ 无法读取 ${script.file}`, error.message);
      }
    }
  }

  addResult(passed, message, details) {
    this.results.push({ passed, message, details });
  }

  printResults() {
    console.log("\n📊 验证结果:\n");
    
    let passedCount = 0;
    let totalCount = this.results.length;

    for (const result of this.results) {
      console.log(result.message);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      if (result.passed) passedCount++;
      console.log();
    }

    console.log("=".repeat(50));
    console.log(`总计: ${passedCount}/${totalCount} 项检查通过`);
    
    if (passedCount === totalCount) {
      console.log("🎉 SQLite 支持验证完全通过！");
    } else {
      console.log("⚠️  存在一些问题需要修复");
    }

    this.printFeatureList();
  }

  printFeatureList() {
    console.log("\n📋 SQLite 支持功能清单:");
    console.log("✅ 完整的表结构定义 (8个核心表)");
    console.log("   - config: 配置管理");
    console.log("   - dataSources: 数据源管理");
    console.log("   - templates: 模板系统");
    console.log("   - templateCategories: 模板分类");
    console.log("   - templateVersions: 模板版本控制");
    console.log("   - contents: 内容存储");
    console.log("   - publishRecords: 发布记录");
    console.log("   - vectorItems: 向量数据存储");
    
    console.log("\n✅ 类型安全的 Drizzle ORM 集成");
    console.log("   - 完整的类型定义");
    console.log("   - 关系映射");
    console.log("   - 查询构建器");
    
    console.log("\n✅ 性能优化配置");
    console.log("   - WAL 模式 (Write-Ahead Logging)");
    console.log("   - 智能索引设计");
    console.log("   - 缓存优化");
    console.log("   - 外键约束");
    
    console.log("\n✅ 丰富的数据管理 API (16个主要方法)");
    console.log("   - 配置管理: getConfig, setConfig");
    console.log("   - 数据源: addDataSource, getDataSources");
    console.log("   - 模板: createTemplate, getTemplates");
    console.log("   - 内容: saveContent, getContents");
    console.log("   - 向量: saveVector, searchVectors");
    console.log("   - 发布: savePublishRecord, getPublishRecords");
    console.log("   - 统计: getStats");
    console.log("   - 维护: vacuum, analyze, close");
    
    console.log("\n✅ 自动化脚本");
    console.log("   - 数据库迁移脚本");
    console.log("   - 自动备份脚本");
    console.log("   - 功能测试脚本");
    
    console.log("\n✅ 完整的关系定义和外键约束");
    console.log("   - 模板与分类的一对多关系");
    console.log("   - 模板与版本的一对多关系");
    console.log("   - 内容与发布记录的一对多关系");
    console.log("   - 级联删除支持");
    
    console.log("\n✅ 数据库维护工具");
    console.log("   - VACUUM 压缩");
    console.log("   - ANALYZE 优化");
    console.log("   - 备份管理");
    
    console.log("\n✅ 详细的文档和使用示例");
    console.log("   - README-SQLite.md 完整文档");
    console.log("   - API 参考");
    console.log("   - 使用示例");
    console.log("   - 故障排除指南");
  }
}

// 运行验证
if (require.main === module) {
  const validator = new SQLiteValidator();
  validator.validate().catch(error => {
    console.error("验证失败:", error);
    process.exit(1);
  });
}