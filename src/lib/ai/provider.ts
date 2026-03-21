/**
 * AI Provider 抽象层
 * 支持: deepseek | minimax | qwen | claude
 * 通过环境变量 AI_PROVIDER 切换
 */

export type AIProvider = "claude" | "deepseek" | "minimax" | "qwen";

const VALID_PROVIDERS: AIProvider[] = ["claude", "deepseek", "minimax", "qwen"];

export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "deepseek";
  if (VALID_PROVIDERS.includes(provider as AIProvider)) return provider as AIProvider;
  return "deepseek";
}

export function getProviderLabel(provider?: AIProvider): string {
  const p = provider || getProvider();
  switch (p) {
    case "claude": return "Claude (Anthropic)";
    case "deepseek": return "DeepSeek";
    case "minimax": return "MiniMax";
    case "qwen": return "通义千问 (Qwen)";
    default: return p;
  }
}

export function supportsVision(provider?: AIProvider): boolean {
  return true; // 四家都支持图片输入
}
