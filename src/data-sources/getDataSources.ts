import { ConfigManager } from "@src/utils/config/config-manager.ts";
import db from "@src/db/db.ts";
import { dataSources } from "@src/db/schema.ts";
import { Logger } from "@zilla/logger";
export type NewsPlatform = "firecrawl" | "twitter";

const logger = new Logger("getDataSources");

/**
 * 数据源项接口
 * 定义了单个数据源的基本结构
 */
interface SourceItem {
  /** 数据源标识符 */
  identifier: string;
}

/**
 * 数据源配置类型
 * 定义了按平台分类的数据源配置结构
 */
type SourceConfig = Record<NewsPlatform, SourceItem[]>;

/**
 * 本地源配置
 * 默认的数据源配置，当数据库不可用时使用
 */
export const sourceConfigs: SourceConfig = {
  firecrawl: [
    { identifier: "https://news.ycombinator.com/" },
  ],
  twitter: [
    { identifier: "https://x.com/OpenAIDevs" },
  ],
} as const;

/**
 * 数据库源项接口
 * 定义了数据库中存储的数据源结构
 */
interface DbSource {
  /** 数据源标识符 */
  identifier: string;
  /** 平台类型 */
  platform: NewsPlatform;
}

/**
 * 获取数据源配置
 * 从数据库和本地配置中获取数据源配置，优先使用数据库配置
 * @returns 数据源配置
 */
export const getDataSources = async (): Promise<SourceConfig> => {
  const configManager = ConfigManager.getInstance();
  try {
    const dbEnabled = await configManager.get("ENABLE_DB");
    const mergedSources: SourceConfig = JSON.parse(
      JSON.stringify(sourceConfigs),
    );

    if (dbEnabled) {
      logger.info("开始从数据库获取数据源");
      const dbResults = await db.select({
        identifier: dataSources.identifier,
        platform: dataSources.platform,
      })
        .from(dataSources);

      // 处理数据库结果
      dbResults.forEach((item) => {
        const { platform, identifier } = item;
        if (
          identifier !== null &&
          platform !== null &&
          platform in mergedSources
        ) {
          const exists = mergedSources[platform as NewsPlatform].some(
            (source) => source.identifier === identifier,
          );
          if (!exists) {
            mergedSources[platform as NewsPlatform].push({ identifier });
          }
        }
      });
    }

    return mergedSources;
  } catch (error) {
    console.error("Failed to get data sources from database:", error);
    // 数据库不可用时返回本地配置
    return sourceConfigs;
  }
};