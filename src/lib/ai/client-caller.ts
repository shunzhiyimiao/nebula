/**
 * 客户端直接调用 AI API（不经过服务器）
 * Key 从 localStorage 读取
 * 在 Capacitor 原生环境下使用 CapacitorHttp 绕过 CORS
 */

import { getClientProvider, getApiKey, PROVIDER_CONFIG } from "./key-store";

// 检测是否在 Capacitor 原生环境
function isNative(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

// 原生 HTTP POST（绕过 CORS）
async function nativePost(url: string, headers: Record<string, string>, data: unknown): Promise<unknown> {
  const { CapacitorHttp } = await import("@capacitor/core");
  const response = await CapacitorHttp.post({ url, headers, data: data as any });
  if (response.status >= 400) {
    throw new Error(`API 错误 ${response.status}: ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

/** 普通文本调用 */
export async function clientCallAI(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const provider = getClientProvider();
  const key = getApiKey(provider);
  if (!key) throw new Error("请先在设置中填写 API Key");

  const config = PROVIDER_CONFIG[provider];
  const url = `${config.baseUrl}/chat/completions`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  const body = {
    model: config.model,
    messages: [{ role: "system", content: params.system }, ...params.messages],
    max_tokens: params.maxTokens || 4096,
    temperature: 0.7,
  };

  if (isNative()) {
    const data = await nativePost(url, headers, body) as any;
    return data.choices?.[0]?.message?.content || "";
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API 错误 ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

/** 流式调用，返回 ReadableStream（原生环境自动降级为非流式） */
export function clientCallAIStream(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const provider = getClientProvider();
        const key = getApiKey(provider);
        if (!key) throw new Error("请先在设置中填写 API Key");

        const config = PROVIDER_CONFIG[provider];
        const url = `${config.baseUrl}/chat/completions`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        };
        const messages = [{ role: "system", content: params.system }, ...params.messages];

        // 原生环境：非流式调用
        if (isNative()) {
          const body = { model: config.model, messages, max_tokens: params.maxTokens || 4096, temperature: 0.7 };
          const data = await nativePost(url, headers, body) as any;
          const content = data.choices?.[0]?.message?.content || "";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // Web 环境：流式调用
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ model: config.model, messages, max_tokens: params.maxTokens || 4096, temperature: 0.7, stream: true }),
        });

        if (!res.ok) throw new Error(`API 错误 ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("无响应体");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data: ")) continue;
            const d = t.slice(6);
            if (d === "[DONE]") continue;
            try {
              const chunk = JSON.parse(d);
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
              }
            } catch {}
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

/** 带图片的调用（OCR） */
export async function clientCallAIWithImage(params: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: string;
  maxTokens?: number;
}): Promise<string> {
  const provider = getClientProvider();
  const key = getApiKey(provider);
  if (!key) throw new Error("请先在设置中填写 API Key");

  const config = PROVIDER_CONFIG[provider];
  if (!config.supportsVision) throw new Error(`${config.name} 不支持图片识别，请切换到通义千问或 Claude`);

  const vlModel = config.vlModel || config.model;
  const url = `${config.baseUrl}/chat/completions`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  const body = {
    model: vlModel,
    messages: [
      { role: "system", content: params.system },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${params.mediaType};base64,${params.imageBase64}` } },
          { type: "text", text: params.prompt },
        ],
      },
    ],
    max_tokens: params.maxTokens || 8192,
    temperature: 0.3,
  };

  if (isNative()) {
    const data = await nativePost(url, headers, body) as any;
    return data.choices?.[0]?.message?.content || "";
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`OCR 错误 ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
