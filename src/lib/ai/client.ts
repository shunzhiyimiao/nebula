/**
 * 统一 AI 客户端
 *
 * 根据 AI_PROVIDER 环境变量自动路由到:
 * - claude   → Anthropic Claude API
 * - deepseek → DeepSeek API (OpenAI 兼容)
 * - minimax  → MiniMax API (OpenAI 兼容)
 */

import { getProvider } from "./provider";
import { callDeepSeek, callDeepSeekStream, callDeepSeekWithImage } from "./deepseek";
import { callMiniMax, callMiniMaxStream, callMiniMaxWithImage } from "./minimax";
import { callQwen, callQwenStream, callQwenWithImage } from "./qwen";
import Anthropic from "@anthropic-ai/sdk";

// ==================== Claude 实现 ====================

let _anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

function getClaudeModel(): string {
  return process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
}

async function callClaude(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: params.maxTokens || 4096,
    system: params.system,
    messages: params.messages.map((m: any) => ({ role: m.role, content: m.content })),
  });
  const textBlock = response.content.find((b: any) => b.type === "text");
  return textBlock?.text || "";
}

function callClaudeStream(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        const client = getAnthropicClient();
        const stream = client.messages.stream({
          model: getClaudeModel(),
          max_tokens: params.maxTokens || 4096,
          system: params.system,
          messages: params.messages.map((m: any) => ({ role: m.role, content: m.content })),
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
        controller.close();
      }
    },
  });
}

async function callClaudeWithImage(params: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  maxTokens?: number;
}): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: params.maxTokens || 4096,
    system: params.system,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: params.mediaType, data: params.imageBase64 } },
        { type: "text", text: params.prompt },
      ],
    }],
  });
  const textBlock = response.content.find((b: any) => b.type === "text");
  return textBlock?.text || "";
}

// ==================== 统一接口 ====================

/** 通用 AI 文本调用 */
export async function callAI(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const provider = getProvider();
  switch (provider) {
    case "claude":   return callClaude(params);
    case "minimax":  return callMiniMax(params);
    case "qwen":     return callQwen(params);
    case "deepseek":
    default:         return callDeepSeek(params);
  }
}

/** 流式 AI 调用 — 返回 SSE ReadableStream */
export function callAIStream(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const provider = getProvider();
  switch (provider) {
    case "claude":   return callClaudeStream(params);
    case "minimax":  return callMiniMaxStream(params);
    case "qwen":     return callQwenStream(params);
    case "deepseek":
    default:         return callDeepSeekStream(params);
  }
}

/** 带图片的 AI 调用（OCR） */
export async function callAIWithImage(params: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  maxTokens?: number;
}): Promise<string> {
  const provider = getProvider();
  switch (provider) {
    case "claude":   return callClaudeWithImage(params);
    case "minimax":  return callMiniMaxWithImage(params);
    case "qwen":     return callQwenWithImage(params);
    case "deepseek":
    default:         return callDeepSeekWithImage(params);
  }
}

export { getProvider, getProviderLabel } from "./provider";
