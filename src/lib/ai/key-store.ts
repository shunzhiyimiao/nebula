/**
 * 用户 API Key 本地存储
 * 存在 localStorage，不经过服务器
 */

const PREFIX = "nebula_";

export type ClientProvider = "qwen" | "deepseek" | "minimax" | "claude";

export function getClientProvider(): ClientProvider {
  if (typeof window === "undefined") return "qwen";
  return (localStorage.getItem(`${PREFIX}provider`) as ClientProvider) || "qwen";
}

export function setClientProvider(provider: ClientProvider) {
  localStorage.setItem(`${PREFIX}provider`, provider);
}

export function getApiKey(provider: ClientProvider): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(`${PREFIX}${provider}_key`) || "";
}

export function setApiKey(provider: ClientProvider, key: string) {
  localStorage.setItem(`${PREFIX}${provider}_key`, key);
}

export function isConfigured(provider: ClientProvider): boolean {
  return getApiKey(provider).length > 0;
}

// 各 provider 的 API 端点配置
export const PROVIDER_CONFIG: Record<ClientProvider, {
  name: string;
  icon: string;
  baseUrl: string;
  model: string;
  vlModel?: string;
  placeholder: string;
  supportsVision: boolean;
}> = {
  qwen: {
    name: "通义千问",
    icon: "🔷",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-max",
    vlModel: "qwen-vl-plus",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    supportsVision: true,
  },
  deepseek: {
    name: "DeepSeek",
    icon: "🔮",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    placeholder: "sk-xxxxxxxxxxxxxxxx",
    supportsVision: false,
  },
  minimax: {
    name: "MiniMax",
    icon: "⚡",
    baseUrl: "https://api.minimax.chat",
    model: "MiniMax-M2",
    placeholder: "sk-api-xxxxxxxxxxxxxxxx",
    supportsVision: false,
  },
  claude: {
    name: "Claude",
    icon: "🤖",
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-20250514",
    placeholder: "sk-ant-xxxxxxxxxxxxxxxx",
    supportsVision: true,
  },
};
