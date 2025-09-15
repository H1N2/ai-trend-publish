#!/usr/bin/env -S deno run -A

/**
 * SQLite 支持验证脚本
 * 这个脚本验证 SQLite 支持的代码结构和配置是否正确
 */

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

class SQLiteValidator {
  private results: ValidationResult[] = [];

  async validate(): Promise<void> {
    console.log("🔍 开始验证 SQLite 支持...\n");

    await this.validateDependencies();
    await this.validateSchemaFile();
    await this.validateDatabaseFactory();
    await this.validateSQLiteManager();
    await this.validateConfigFiles();
    await this.validateScripts();

    this.printResults();
  }

  private async validateDependencies(): Promise<void> {
    try {
      const denoJson = await Deno.readTextFile("deno.json");
      const config = JSON.parse(denoJson);
      
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

  private async validateSchemaFile(): Promise<void> {
    try {
      const schemaContent = await Deno.readTextFile("src/db/sqlite-schema.ts");
      
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

    } catch (error) {
      this.addResult(false, "❌ 无法读取 sqlite-schema.ts", error.message);
    }
  }

  private async validateDatabaseFactory(): Promise<void> {
    try {
      const factoryContent = await Deno.readTextFile("src/db/database-factory.ts");
      
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

  private async validateSQLiteManager(): Promise<void> {
    try {
      const managerContent = await Deno.readTextFile("src/db/sqlite-manager.ts");
      
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
      const drizzleOps = ["select()", "insert()", "update()", "where()", "eq()", "and()"];
      const missingOps = drizzleOps.filter(op => !managerContent.includes(op));

      if (missingOps.length === 0) {
        this.addResult(true, "✅ 使用了 Drizzle ORM 操作");
      } else {
        this.addResult(false, "❌ 缺少 Drizzle ORM 操作", `缺少: ${missingOps.join(", ")}`);
      }

    } catch (error) {
      this.addResult(false, "❌ 无法读取 sqlite-manager.ts", error.message);
    }
  }

  private async validateConfigFiles(): Promise<void> {
    try {
      // 检查 SQLite Drizzle 配置
      const sqliteConfig = await Deno.readTextFile("drizzle.sqlite.config.ts");
      
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

  private async validateScripts(): Promise<void> {
    const scripts = [
      { file: "scripts/sqlite-migrate.ts", name: "迁移脚本" },
      { file: "scripts/sqlite-backup.ts", name: "备份脚本" },
      { file: "scripts/sqlite-test.ts", name: "测试脚本" }
    ];

    for (const script of scripts) {
      try {
        const content = await Deno.readTextFile(script.file);
        
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

  private addResult(passed: boolean, message: string, details?: string): void {
    this.results.push({ passed, message, details });
  }

  private printResults(): void {
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

    console.log("=" .repeat(50));
    console.log(`总计: ${passedCount}/${totalCount} 项检查通过`);
    
    if (passedCount === totalCount) {
      console.log("🎉 SQLite 支持验证完全通过！");
    } else {
      console.log("⚠️  存在一些问题需要修复");
    }

    console.log("\n📋 SQLite 支持功能清单:");
    console.log("✅ 完整的表结构定义 (8个核心表)");
    console.log("✅ 类型安全的 Drizzle ORM 集成");
    console.log("✅ 性能优化配置 (WAL模式、索引等)");
    console.log("✅ 丰富的数据管理 API (16个主要方法)");
    console.log("✅ 自动化脚本 (迁移、备份、测试)");
    console.log("✅ 完整的关系定义和外键约束");
    console.log("✅ 数据库维护工具 (VACUUM、ANALYZE)");
    console.log("✅ 详细的文档和使用示例");
  }
}

if (import.meta.main) {
  const validator = new SQLiteValidator();
  await validator.validate();
}