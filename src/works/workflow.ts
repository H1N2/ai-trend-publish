import { Logger } from "@zilla/logger";
import { MetricsCollector } from "@src/works/metrics.ts";
import { RetryOptions, RetryUtil } from "@src/utils/retry.util.ts";
import { WorkflowStepError, WorkflowTerminateError } from "./workflow-error.ts";

const logger = new Logger("workflow");

/**
 * 工作流事件接口
 * 定义了工作流事件的基本结构，包含事件载荷、ID和时间戳
 * @template T 事件载荷的类型
 */
export interface WorkflowEvent<T = any> {
  /** 事件载荷数据 */
  payload: T;
  /** 事件唯一标识符 */
  id: string;
  /** 事件时间戳 */
  timestamp: number;
}

/**
 * 工作流步骤选项接口
 * 定义了工作流步骤的配置选项，包括重试和超时设置
 */
export interface WorkflowStepOptions {
  /** 重试配置 */
  retries?: {
    /** 最大重试次数 */
    limit: number;
    /** 重试延迟时间 */
    delay: string | number;
    /** 退避策略 */
    backoff: "linear" | "exponential";
  };
  /** 超时时间 */
  timeout?: string | number;
}

/**
 * 工作流步骤类
 * 负责执行工作流中的单个步骤，提供重试、超时和指标收集功能
 */
export class WorkflowStep {
  /** 步骤ID */
  private stepId: string;
  /** 步骤开始时间 */
  private startTime: number;
  /** 指标收集器 */
  private metricsCollector?: MetricsCollector;
  /** 工作流ID */
  private workflowId?: string;
  /** 事件ID */
  private eventId?: string;

  /**
   * 构造函数
   * @param stepId 步骤ID
   * @param metricsCollector 指标收集器实例
   * @param workflowId 工作流ID
   * @param eventId 事件ID
   */
  constructor(
    stepId: string,
    metricsCollector?: MetricsCollector,
    workflowId?: string,
    eventId?: string,
  ) {
    this.stepId = stepId;
    this.startTime = Date.now();
    this.metricsCollector = metricsCollector;
    this.workflowId = workflowId;
    this.eventId = eventId;
  }

  /**
   * 执行工作流步骤
   * @template T 返回值类型
   * @param name 步骤名称
   * @param optionsOrFn 步骤选项或执行函数
   * @param fn 执行函数（当optionsOrFn为选项时使用）
   * @returns 执行结果
   */
  async do<T>(
    name: string,
    optionsOrFn: WorkflowStepOptions | (() => Promise<T>),
    fn?: () => Promise<T>,
  ): Promise<T> {
    const options: WorkflowStepOptions = typeof optionsOrFn === "function"
      ? {}
      : optionsOrFn;
    const execFn = typeof optionsOrFn === "function" ? optionsOrFn : fn!;
    const stepStartTime = Date.now();

    try {
      // 转换为RetryUtil的选项格式
      const retryOptions: RetryOptions = {
        maxRetries: options.retries?.limit || 3,
        baseDelay: this.parseDelay(options.retries?.delay || "1 second"),
        useExponentialBackoff: options.retries?.backoff === "exponential",
      };

      // 包装执行函数，添加超时控制
      const timeoutMs = this.parseDelay(options.timeout || "30 minutes");
      const operationWithTimeout = async () => {
        try {
          return await this.executeWithTimeout(execFn, timeoutMs);
        } catch (error) {
          // 如果是终止错误，直接抛出，不进行重试
          if (error instanceof WorkflowTerminateError) {
            throw error;
          }
          // 其他错误包装为 WorkflowStepError
          throw new WorkflowStepError(
            error instanceof Error ? error.message : String(error),
          );
        }
      };

      // 使用RetryUtil执行操作并获取详细信息
      const retryResult = await RetryUtil.retryOperationWithStats(
        operationWithTimeout,
        retryOptions,
      );

      if (this.metricsCollector && this.workflowId && this.eventId) {
        this.metricsCollector.recordStep(this.workflowId, this.eventId, {
          stepId: this.stepId,
          name,
          startTime: stepStartTime,
          endTime: Date.now(),
          status: retryResult.success ? "success" : "failure",
          attempts: retryResult.attempts,
          error: retryResult.error?.message,
        });
      }

      if (!retryResult.success) {
        throw retryResult.error;
      }

      logger.info(
        `Step ${name} completed successfully after ${retryResult.attempts} attempts, time: ${
          Date.now() - stepStartTime
        }ms`,
      );
      return retryResult.result;
    } catch (error: any) {
      // 如果是终止错误，记录日志后直接抛出
      if (error instanceof WorkflowTerminateError) {
        logger.error(`Step ${name} terminated: ${error.message}`);
        if (this.metricsCollector && this.workflowId && this.eventId) {
          this.metricsCollector.recordStep(this.workflowId, this.eventId, {
            stepId: this.stepId,
            name,
            startTime: stepStartTime,
            endTime: Date.now(),
            status: "failure",
            attempts: 1,
            error: `Terminated: ${error.message}`,
          });
        }
        throw error;
      }

      logger.error(`Step ${name} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 暂停执行
   * @param reason 暂停原因
   * @param duration 暂停时长
   */
  async sleep(reason: string, duration: string | number): Promise<void> {
    const ms = this.parseDelay(duration);
    logger.info(`Sleeping for ${ms}ms: ${reason}`);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 带超时执行函数
   * @template T 返回值类型
   * @param fn 执行函数
   * @param timeout 超时时间（毫秒）
   * @returns 执行结果
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error("Step timeout")), timeout);
      }),
    ]);
  }

  /**
   * 解析延迟时间字符串
   * @param delay 延迟时间（字符串或数字）
   * @returns 毫秒数
   */
  private parseDelay(delay: string | number): number {
    if (typeof delay === "number") return delay;
    if (delay === "0") return 0;

    const units: Record<string, number> = {
      second: 1000,
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
    };

    const match = delay.match(/^(\d+)\s+(second|minute|hour|day)s?$/);
    if (!match) {
      logger.warn(`Invalid delay format: ${delay}, using 0 as default`);
      return 0;
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
}

/**
 * 工作流环境接口
 * 定义了工作流运行环境的结构
 * @template TEnv 环境变量类型
 */
export interface WorkflowEnv<TEnv = any> {
  /** 环境ID */
  id: string;
  /** 环境变量 */
  env: TEnv;
}

/**
 * 工作流入口点基类
 * 所有工作流的基类，提供统一的执行入口和指标收集功能
 * @template TEnv 环境变量类型
 * @template TParams 参数类型
 */
export abstract class WorkflowEntrypoint<TEnv = any, TParams = any> {
  /** 工作流环境 */
  protected env: WorkflowEnv<TEnv>;
  /** 指标收集器 */
  protected metricsCollector: MetricsCollector;

  /**
   * 构造函数
   * @param env 工作流环境
   */
  constructor(env: WorkflowEnv<TEnv>) {
    this.env = env;
    this.metricsCollector = new MetricsCollector();
  }

  /**
   * 执行工作流
   * @param event 工作流事件
   */
  async execute(event: WorkflowEvent<TParams>): Promise<void> {
    this.metricsCollector.startWorkflow(this.env.id, event.id);
    const step = new WorkflowStep(
      "local-step-execution",
      this.metricsCollector,
      this.env.id,
      event.id,
    );

    try {
      await this.run(event, step);
      this.metricsCollector.endWorkflow(this.env.id, event.id);
    } catch (error: any) {
      // 区分终止错误和其他错误
      const isTerminated = error instanceof WorkflowTerminateError;
      this.metricsCollector.endWorkflow(this.env.id, event.id, error);

      if (isTerminated) {
        logger.warn(`Workflow terminated: ${error.message}`);
      } else {
        logger.error(`Workflow failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * 工作流运行抽象方法
   * 子类必须实现此方法来定义具体的工作流逻辑
   * @param event 工作流事件
   * @param step 工作流步骤实例
   */
  abstract run(
    event: WorkflowEvent<TParams>,
    step: WorkflowStep,
  ): Promise<void>;
}