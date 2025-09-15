import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { drizzle } from "drizzle-orm/better-sqlite3";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import { Logger } from "@zilla/logger";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { sql } from "drizzle-orm";
import * as mysqlSchema from "./schema.ts";
import { sqliteSchema } from "./sqlite-schema.ts";

const logger = new Logger("DatabaseFactory");

export type DatabaseType = "mysql" | "sqlite";

export interface DatabaseConfig {
  type: DatabaseType;
  mysql?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  sqlite?: {
    filename: string;
  };
}

export class DatabaseFactory {
  private static instance: any;
  private static dbType: DatabaseType;

  static async createDatabase() {
    if (this.instance) {
      return this.instance;
    }

    const configManager = ConfigManager.getInstance();
    
    // 检查数据库类型配置
    const dbType = await configManager.get<DatabaseType>("DB_TYPE") || "sqlite";
    this.dbType = dbType;

    logger.info(`初始化数据库类型: ${dbType}`);

    if (dbType === "mysql") {
      return this.createMysqlDatabase();
    } else {
      return this.createSqliteDatabase();
    }
  }

  private static async createMysqlDatabase() {
    const configManager = ConfigManager.getInstance();
    
    const host = await configManager.get<string>("DB_HOST") || "localhost";
    const port = await configManager.get<number>("DB_PORT") || 3306;
    const user = await configManager.get<string>("DB_USER") || "root";
    const password = await configManager.get<string>("DB_PASSWORD") || "";
    const database = await configManager.get<string>("DB_DATABASE") || "trendfinder";

    logger.info("连接 MySQL 数据库", { host, port, user, database });

    try {
      const poolConnection = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      this.instance = drizzleMysql(poolConnection, {
        mode: "default",
        schema: mysqlSchema,
      });

      logger.info("MySQL 数据库连接成功");
      return this.instance;
    } catch (error) {
      logger.error("MySQL 数据库连接失败:", error);
      throw error;
    }
  }

  private static async createSqliteDatabase() {
    const configManager = ConfigManager.getInstance();
    
    const filename = await configManager.get<string>("SQLITE_DB_PATH") || "./data/trendfinder.db";
    
    logger.info("连接 SQLite 数据库", { filename });

    try {
      // 确保数据目录存在
      const dir = filename.substring(0, filename.lastIndexOf('/'));
      if (dir) {
        try {
          await Deno.mkdir(dir, { recursive: true });
        } catch (error) {
          // 目录可能已存在，忽略错误
        }
      }

      const sqlite = new Database(filename);
      
      // 启用 WAL 模式以提高并发性能
      sqlite.pragma('journal_mode = WAL');
      sqlite.pragma('synchronous = NORMAL');
      sqlite.pragma('cache_size = 1000000');
      sqlite.pragma('foreign_keys = ON');
      sqlite.pragma('temp_store = MEMORY');

      this.instance = drizzle(sqlite, {
        schema: sqliteSchema,
      });

      // 使用 Drizzle 的 migrate 功能或手动初始化表结构
      await this.initializeSqliteTables();

      logger.info("SQLite 数据库连接成功");
      return this.instance;
    } catch (error) {
      logger.error("SQLite 数据库连接失败:", error);
      throw error;
    }
  }

  private static async initializeSqliteTables() {
    try {
      const db = this.instance;
      
      // 创建配置表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          value TEXT,
          description TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建数据源表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS data_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          platform TEXT NOT NULL,
          identifier TEXT NOT NULL,
          name TEXT,
          description TEXT,
          config TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(platform, identifier)
        )
      `);

      // 创建模板表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          platform TEXT NOT NULL,
          style TEXT NOT NULL,
          content TEXT NOT NULL,
          schema TEXT,
          example_data TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER
        )
      `);

      // 创建模板分类表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS template_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
          UNIQUE(template_id, category)
        )
      `);

      // 创建模板版本表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS template_versions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id INTEGER NOT NULL,
          version TEXT NOT NULL,
          content TEXT NOT NULL,
          schema TEXT,
          changes TEXT,
          is_active INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER,
          FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
          UNIQUE(template_id, version)
        )
      `);

      // 创建向量表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS vector_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          vector TEXT,
          vector_dim INTEGER,
          vector_type TEXT,
          metadata TEXT,
          source_id TEXT,
          source_type TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建内容表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS contents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          summary TEXT,
          url TEXT UNIQUE,
          platform TEXT NOT NULL,
          author TEXT,
          published_at TEXT,
          tags TEXT,
          metadata TEXT,
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建发布记录表
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS publish_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content_id INTEGER,
          template_id INTEGER,
          platform TEXT NOT NULL,
          published_content TEXT NOT NULL,
          published_url TEXT,
          status TEXT DEFAULT 'pending',
          error_message TEXT,
          published_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
          FOREIGN KEY (template_id) REFERENCES templates(id)
        )
      `);

      // 创建索引
      const indexes = [
        `CREATE INDEX IF NOT EXISTS config_key_idx ON config(key)`,
        `CREATE INDEX IF NOT EXISTS data_sources_platform_idx ON data_sources(platform)`,
        `CREATE INDEX IF NOT EXISTS data_sources_identifier_idx ON data_sources(identifier)`,
        `CREATE INDEX IF NOT EXISTS templates_name_idx ON templates(name)`,
        `CREATE INDEX IF NOT EXISTS templates_platform_idx ON templates(platform)`,
        `CREATE INDEX IF NOT EXISTS templates_is_active_idx ON templates(is_active)`,
        `CREATE INDEX IF NOT EXISTS template_categories_template_id_idx ON template_categories(template_id)`,
        `CREATE INDEX IF NOT EXISTS template_categories_category_idx ON template_categories(category)`,
        `CREATE INDEX IF NOT EXISTS template_versions_template_id_idx ON template_versions(template_id)`,
        `CREATE INDEX IF NOT EXISTS template_versions_version_idx ON template_versions(version)`,
        `CREATE INDEX IF NOT EXISTS vector_items_vector_type_idx ON vector_items(vector_type)`,
        `CREATE INDEX IF NOT EXISTS vector_items_source_id_idx ON vector_items(source_id)`,
        `CREATE INDEX IF NOT EXISTS vector_items_source_type_idx ON vector_items(source_type)`,
        `CREATE INDEX IF NOT EXISTS contents_title_idx ON contents(title)`,
        `CREATE INDEX IF NOT EXISTS contents_platform_idx ON contents(platform)`,
        `CREATE INDEX IF NOT EXISTS contents_author_idx ON contents(author)`,
        `CREATE INDEX IF NOT EXISTS contents_published_at_idx ON contents(published_at)`,
        `CREATE INDEX IF NOT EXISTS contents_status_idx ON contents(status)`,
        `CREATE INDEX IF NOT EXISTS publish_records_content_id_idx ON publish_records(content_id)`,
        `CREATE INDEX IF NOT EXISTS publish_records_template_id_idx ON publish_records(template_id)`,
        `CREATE INDEX IF NOT EXISTS publish_records_platform_idx ON publish_records(platform)`,
        `CREATE INDEX IF NOT EXISTS publish_records_status_idx ON publish_records(status)`,
      ];

      for (const indexSql of indexes) {
        await db.run(sql.raw(indexSql));
      }

      logger.info("SQLite 表结构初始化完成");
    } catch (error) {
      logger.error("SQLite 表结构初始化失败:", error);
      throw error;
    }
  }

  static getDbType(): DatabaseType {
    return this.dbType;
  }

  static async closeConnection() {
    if (this.instance && this.dbType === "sqlite") {
      // SQLite 连接关闭
      this.instance.close?.();
    }
    this.instance = null;
  }
}