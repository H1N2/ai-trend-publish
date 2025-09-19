import { IConfigSource } from "./interfaces/config-source.interface.ts";
import { DbConfigSource } from "./sources/db-config.source.ts";
import { EnvConfigSource } from "./sources/env-config.source.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("ConfigManager");

/**
 * 配置错误类
 * 当配置获取失败时抛出的错误
 */
export class ConfigurationError extends Error {
  /**
   * 构造函数
   * @param message 错误信息
   */
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * 重试选项接口
 * 定义了配置获取时的重试策略
 */
interface RetryOptions {
  /** 最大尝试次数 */
  maxAttempts: number;
  /** 重试延迟时间（毫秒） */
  delayMs: number;
}

/**
 * 配置管理器类
 * 负责管理系统的所有配置，支持多种配置源（环境变量、数据库等）
 * 配置源具有优先级，数字越小优先级越高
 */
export class ConfigManager {
  /** 配置管理器单例实例 */
  private static instance: ConfigManager;
  /** 配置源列表 */
  private configSources: IConfigSource[] = [];
  /** 默认重试选项 */
  private defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
  };

  /**
   * 私有构造函数
   * 防止直接实例化，使用getInstance()方法获取实例
   */
  private constructor() {}

  /**
   * 获取配置管理器单例实例
   * @returns 配置管理器实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 添加配置源
   * @param source 配置源实例
   */
  public addSource(source: IConfigSource): void {
    this.configSources.push(source);
    // 按优先级排序（升序，数字越小优先级越高）
    this.configSources.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 延迟函数
   * @param ms 延迟时间（毫秒）
   * @returns Promise
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 带重试机制的配置获取
   * @template T 配置值类型
   * @param source 配置源
   * @param key 配置键
   * @param options 重试选项
   * @returns 配置值或null
   */
  private async getWithRetry<T>(
    source: IConfigSource,
    key: string,
    options: RetryOptions,
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        const value = await source.get<T>(key);
        return value;
      } catch (error) {
        lastError = error as Error;
        if (attempt < options.maxAttempts) {
          await this.delay(options.delayMs);
        }
      }
    }

    console.warn(
      `Failed to get config "${key}" after ${options.maxAttempts} attempts. Last error: ${lastError?.message}`,
    );
    return null;
  }

  /**
   * 初始化默认配置源
   * 添加环境变量配置源，如果启用了数据库则也添加数据库配置源
   */
  public async initDefaultConfigSources(): Promise<void> {
    // 环境变量
    this.addSource(new EnvConfigSource());
    // Database
    if (await this.get<boolean>("ENABLE_DB")) {
      logger.info("DB enabled");
      this.addSource(new DbConfigSource());
    }
  }

  /**
   * 获取配置值
   * 按优先级顺序从各个配置源获取配置值，返回第一个获取到的值
   * @template T 配置值类型
   * @param key 配置键
   * @param retryOptions 重试选项，可选
   * @returns 配置值
   * @throws {ConfigurationError} 当所有配置源都无法获取值时抛出
   */
  public async get<T>(
    key: string,
    retryOptions?: Partial<RetryOptions>,
  ): Promise<T> {
    const options = { ...this.defaultRetryOptions, ...retryOptions };

    for (const source of this.configSources) {
      const value = await this.getWithRetry<T>(source, key, options);
      if (value !== null) {
        return value;
      }
    }

    throw new ConfigurationError(
      `Configuration key "${key}" not found in any source after ${options.maxAttempts} attempts`,
    );
  }

  /**
   * 获取所有已注册的配置源
   * @returns 配置源列表
   */
  public getSources(): IConfigSource[] {
    return [...this.configSources];
  }

  /**
   * 清除所有配置源
   */
  public clearSources(): void {
    this.configSources = [];
  }
}