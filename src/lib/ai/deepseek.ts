/**
 * DeepSeek API 客户端
 *
 * DeepSeek 使用 OpenAI 兼容 API 格式
 * 文本模型: deepseek-chat (DeepSeek-V3)
 * 视觉模型: deepseek-chat (支持图片输入)
 *
 * API 文档: https://platform.deepseek.com/api-docs
 */

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string | DeepSeekContentPart[];
}

interface DeepSeekContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface DeepSeekResponse {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface DeepSeekStreamChunk {
  id: string;
  choices: {
    index: number;
    delta: { role?: string; content?: string };
    finish_reason: string | null;
  }[];
}

/** 通用 DeepSeek 调用 */
export async function callDeepSeek(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: params.system },
    ...params.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      max_tokens: params.maxTokens || 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${err}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/** 流式 DeepSeek 调用 — 返回 ReadableStream (SSE) */
export function callDeepSeekStream(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  const messages: DeepSeekMessage[] = [
    { role: "system", content: params.system },
    ...params.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL,
            messages,
            max_tokens: params.maxTokens || 4096,
            temperature: 0.7,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") break;

            try {
              const chunk: DeepSeekStreamChunk = JSON.parse(data);
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                const sseChunk = `data: ${JSON.stringify({ text: content })}\n\n`;
                controller.enqueue(encoder.encode(sseChunk));
              }
            } catch {
              // 不完整的 JSON，忽略
            }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const errMsg = `data: ${JSON.stringify({ error: String(err) })}\n\n`;
        controller.enqueue(encoder.encode(errMsg));
        controller.close();
      }
    },
  });
}

/** 带图片的 DeepSeek 调用（OCR） */
export async function callDeepSeekWithImage(params: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  maxTokens?: number;
}): Promise<string> {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: params.system },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${params.mediaType};base64,${params.imageBase64}`,
          },
        },
        {
          type: "text",
          text: params.prompt,
        },
      ],
    },
  ];

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      max_tokens: params.maxTokens || 4096,
      temperature: 0.3, // OCR 用低温度提高准确率
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek Vision API error: ${response.status} - ${err}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
