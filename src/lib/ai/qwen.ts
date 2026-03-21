/**
 * Qwen (通义千问) API 客户端
 *
 * 通过阿里云 DashScope 提供，使用 OpenAI 兼容 API 格式
 * 文本模型: qwen-max, qwen-plus, qwen-turbo
 * 视觉模型: qwen-vl-plus, qwen-vl-max (支持图片OCR)
 *
 * API 文档: https://www.alibabacloud.com/help/en/model-studio
 * Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
 *           (国际版: https://dashscope-intl.aliyuncs.com/compatible-mode/v1)
 */

const QWEN_BASE_URL = process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const QWEN_API_KEY = process.env.QWEN_API_KEY || "";
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-max";
const QWEN_VL_MODEL = process.env.QWEN_VL_MODEL || "qwen-vl-plus";

interface QwenMessage {
  role: "system" | "user" | "assistant";
  content: string | QwenContentPart[];
}

interface QwenContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface QwenResponse {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface QwenStreamChunk {
  id: string;
  choices: {
    index: number;
    delta: { role?: string; content?: string };
    finish_reason: string | null;
  }[];
}

/** 通用 Qwen 调用 */
export async function callQwen(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const messages: QwenMessage[] = [
    { role: "system", content: params.system },
    ...params.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages,
      max_tokens: params.maxTokens || 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qwen API error: ${response.status} - ${err}`);
  }

  const data: QwenResponse = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/** 流式 Qwen 调用 — 返回 ReadableStream (SSE) */
export function callQwenStream(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  const messages: QwenMessage[] = [
    { role: "system", content: params.system },
    ...params.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${QWEN_API_KEY}`,
          },
          body: JSON.stringify({
            model: QWEN_MODEL,
            messages,
            max_tokens: params.maxTokens || 4096,
            temperature: 0.7,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Qwen API error: ${response.status}`);
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
              const chunk: QwenStreamChunk = JSON.parse(data);
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                const sseChunk = `data: ${JSON.stringify({ text: content })}\n\n`;
                controller.enqueue(encoder.encode(sseChunk));
              }
            } catch {
              // 忽略
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

/** 带图片的 Qwen 调用（OCR）— 使用 qwen-vl 视觉模型 */
export async function callQwenWithImage(params: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  maxTokens?: number;
}): Promise<string> {
  const messages: QwenMessage[] = [
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

  // OCR 使用视觉模型
  const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: QWEN_VL_MODEL,
      messages,
      max_tokens: params.maxTokens || 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qwen VL API error: ${response.status} - ${err}`);
  }

  const data: QwenResponse = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
