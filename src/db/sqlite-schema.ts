import { sqliteTable, text, integer, real, blob, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// SQLite 版本的配置表
export const config = sqliteTable("config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  keyIdx: uniqueIndex("config_key_idx").on(table.key),
}));

// SQLite 版本的数据源表
export const dataSources = sqliteTable("data_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  identifier: text("identifier").notNull(),
  name: text("name"),
  description: text("description"),
  config: text("config"), // JSON 配置
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  platformIdx: index("data_sources_platform_idx").on(table.platform),
  identifierIdx: index("data_sources_identifier_idx").on(table.identifier),
  platformIdentifierIdx: uniqueIndex("data_sources_platform_identifier_idx").on(table.platform, table.identifier),
}));

// SQLite 版本的模板表
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull(),
  style: text("style").notNull(),
  content: text("content").notNull(),
  schema: text("schema"), // SQLite 中使用 TEXT 存储 JSON
  exampleData: text("example_data"), // SQLite 中使用 TEXT 存储 JSON
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer("created_by"),
}, (table) => ({
  nameIdx: index("templates_name_idx").on(table.name),
  platformIdx: index("templates_platform_idx").on(table.platform),
  isActiveIdx: index("templates_is_active_idx").on(table.isActive),
  createdAtIdx: index("templates_created_at_idx").on(table.createdAt),
}));

// SQLite 版本的模板分类表
export const templateCategories = sqliteTable("template_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  templateIdIdx: index("template_categories_template_id_idx").on(table.templateId),
  categoryIdx: index("template_categories_category_idx").on(table.category),
  templateCategoryIdx: uniqueIndex("template_categories_template_category_idx").on(table.templateId, table.category),
}));

// SQLite 版本的模板版本表
export const templateVersions = sqliteTable("template_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  content: text("content").notNull(),
  schema: text("schema"), // SQLite 中使用 TEXT 存储 JSON
  changes: text("changes"),
  isActive: integer("is_active").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer("created_by"),
}, (table) => ({
  templateIdIdx: index("template_versions_template_id_idx").on(table.templateId),
  versionIdx: index("template_versions_version_idx").on(table.version),
  templateVersionIdx: uniqueIndex("template_versions_template_version_idx").on(table.templateId, table.version),
  createdAtIdx: index("template_versions_created_at_idx").on(table.createdAt),
}));

// SQLite 版本的向量表
export const vectorItems = sqliteTable("vector_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  vector: text("vector"), // SQLite 中使用 TEXT 存储 JSON
  vectorDim: integer("vector_dim"),
  vectorType: text("vector_type"),
  metadata: text("metadata"), // 额外的元数据，JSON 格式
  sourceId: text("source_id"), // 来源标识
  sourceType: text("source_type"), // 来源类型
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  vectorTypeIdx: index("vector_items_vector_type_idx").on(table.vectorType),
  sourceIdIdx: index("vector_items_source_id_idx").on(table.sourceId),
  sourceTypeIdx: index("vector_items_source_type_idx").on(table.sourceType),
  createdAtIdx: index("vector_items_created_at_idx").on(table.createdAt),
}));

// SQLite 版本的内容表（用于存储抓取的内容）
export const contents = sqliteTable("contents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  url: text("url"),
  platform: text("platform").notNull(),
  author: text("author"),
  publishedAt: text("published_at"),
  tags: text("tags"), // JSON 数组
  metadata: text("metadata"), // JSON 对象
  status: text("status").default("active"), // active, archived, deleted
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  titleIdx: index("contents_title_idx").on(table.title),
  platformIdx: index("contents_platform_idx").on(table.platform),
  authorIdx: index("contents_author_idx").on(table.author),
  publishedAtIdx: index("contents_published_at_idx").on(table.publishedAt),
  statusIdx: index("contents_status_idx").on(table.status),
  createdAtIdx: index("contents_created_at_idx").on(table.createdAt),
  urlIdx: uniqueIndex("contents_url_idx").on(table.url),
}));

// SQLite 版本的发布记录表
export const publishRecords = sqliteTable("publish_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").references(() => contents.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => templates.id),
  platform: text("platform").notNull(),
  publishedContent: text("published_content").notNull(),
  publishedUrl: text("published_url"),
  status: text("status").default("pending"), // pending, success, failed
  errorMessage: text("error_message"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  contentIdIdx: index("publish_records_content_id_idx").on(table.contentId),
  templateIdIdx: index("publish_records_template_id_idx").on(table.templateId),
  platformIdx: index("publish_records_platform_idx").on(table.platform),
  statusIdx: index("publish_records_status_idx").on(table.status),
  publishedAtIdx: index("publish_records_published_at_idx").on(table.publishedAt),
  createdAtIdx: index("publish_records_created_at_idx").on(table.createdAt),
}));

// 定义关系
export const templatesRelations = relations(templates, ({ many }) => ({
  categories: many(templateCategories),
  versions: many(templateVersions),
  publishRecords: many(publishRecords),
}));

export const templateCategoriesRelations = relations(templateCategories, ({ one }) => ({
  template: one(templates, {
    fields: [templateCategories.templateId],
    references: [templates.id],
  }),
}));

export const templateVersionsRelations = relations(templateVersions, ({ one }) => ({
  template: one(templates, {
    fields: [templateVersions.templateId],
    references: [templates.id],
  }),
}));

export const contentsRelations = relations(contents, ({ many }) => ({
  publishRecords: many(publishRecords),
}));

export const publishRecordsRelations = relations(publishRecords, ({ one }) => ({
  content: one(contents, {
    fields: [publishRecords.contentId],
    references: [contents.id],
  }),
  template: one(templates, {
    fields: [publishRecords.templateId],
    references: [templates.id],
  }),
}));

// 导出所有表和关系
export const sqliteSchema = {
  config,
  dataSources,
  templates,
  templateCategories,
  templateVersions,
  vectorItems,
  contents,
  publishRecords,
  templatesRelations,
  templateCategoriesRelations,
  templateVersionsRelations,
  contentsRelations,
  publishRecordsRelations,
};