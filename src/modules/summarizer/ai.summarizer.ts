import {
  ContentSummarizer,
  Summary,
} from "@src/modules/interfaces/summarizer.interface.ts";
import {
  getSummarizerSystemPrompt,
  getSummarizerUserPrompt,
  getTitleSystemPrompt,
  getTitleUserPrompt,
} from "@src/prompts/summarizer.prompt.ts";
import { LLMFactory } from "@src/providers/llm/llm-factory.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { RetryUtil } from "@src/utils/retry.util.ts";
import { Logger } from "@zilla/logger";

/**
 * 摘要器配置枚举
 * 定义了摘要器相关的配置键
 */
enum SummarizarSetting {
  /** AI摘要器使用的LLM提供商配置键 */
  AI_SUMMARIZER_LLM_PROVIDER = "AI_SUMMARIZER_LLM_PROVIDER",
}

const logger = new Logger("ai-summarizer");

/**
 * AI摘要器类
 * 使用大语言模型对内容进行摘要和标题生成
 */
export class AISummarizer implements ContentSummarizer {
  /** LLM工厂实例 */
  private llmFactory: LLMFactory;
  /** 配置管理器实例 */
  private configInstance: ConfigManager;

  /**
   * 构造函数
   * 初始化LLM工厂和配置管理器，并记录当前使用的LLM模型
   */
  constructor() {
    this.llmFactory = LLMFactory.getInstance();
    this.configInstance = ConfigManager.getInstance();
    this.configInstance.get(SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER).then(
      (provider) => {
        logger.info(`Summarizer当前使用的LLM模型: ${provider}`);
      },
    );
  }

  /**
   * 对内容进行摘要
   * @param content 待摘要的内容
   * @param options 摘要选项（可选）
   * @returns 摘要结果
   */
  async summarize(
    content: string,
    options?: Record<string, any>,
  ): Promise<Summary> {
    if (!content) {
      throw new Error("Content is required for summarization");
    }

    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getSummarizerSystemPrompt(),
        },
        {
          role: "user",
          content: getSummarizerUserPrompt({
            content,
            language: options?.language,
            minLength: options?.minLength,
            maxLength: options?.maxLength,
          }),
        },
      ], {
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error("未获取到有效的摘要结果");
      }

      try {
        const summary = JSON.parse(completion) as Summary;
        if (
          !summary.title ||
          !summary.content
        ) {
          throw new Error("摘要结果格式不正确");
        }
        return summary;
      } catch (error) {
        throw new Error(
          `解析摘要结果失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
        );
      }
    });
  }

  /**
   * 生成内容标题
   * @param content 待生成标题的内容
   * @param options 标题生成选项（可选）
   * @returns 生成的标题
   */
  async generateTitle(
    content: string,
    options?: Record<string, any>,
  ): Promise<string> {
    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getTitleSystemPrompt(),
        },
        {
          role: "user",
          content: getTitleUserPrompt({
            content,
            language: options?.language,
          }),
        },
      ], {
        temperature: 0.7,
        max_tokens: 100,
      });

      const title = response.choices[0]?.message?.content;
      if (!title) {
        throw new Error("未获取到有效的标题");
      }
      return title;
    });
  }
}