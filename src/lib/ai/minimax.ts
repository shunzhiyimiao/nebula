/**
 * MiniMax API 客户端
 *
 * MiniMax 使用 OpenAI 兼容格式
 * 模型: MiniMax-M2 / MiniMax-M2.5
 *
 * API: https://api.minimax.io/v1/text/chatcompletion_v2
 * 文档: https://platform.minimax.io/docs
 */

const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || "https://api.minimax.io";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || "MiniMax-M2";
const ENDPOINT = `${MINIMAX_BASE_URL}/v1/text/chatcompletion_v2`;

interface MMMessage {
  role: "system" | "user" | "assistant";
  content: string | { type: string; text?: string; image_url?: { url: string } }[];
}

interface MMResponse {
  id: string;
  choices: { index: number; message: { role: string; content: string }; finish_reason: string }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  base_resp?: { status_code: number; status_msg: string };
}

interface MMStreamChunk {
  id: string;
  choices: { index: number; delta: { role?: string; content?: string }; finish_reason: string | null }[];
}

function buildMessages(system: string, msgs: { role: string; content: string }[]): MMMessage[] {
  return [
    { role: "system", content: system },
    ...msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];
}

function checkResp(data: MMResponse) {
  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax error: ${data.base_resp.status_msg}`);
  }
}

export async function callMiniMax(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${MINIMAX_API_KEY}` },
    body: JSON.stringify({ model: MINIMAX_MODEL, messages: buildMessages(params.system, params.messages), max_tokens: params.maxTokens || 4096, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`MiniMax API error: ${res.status} - ${await res.text()}`);
  const data: MMResponse = await res.json();
  checkResp(data);
  const msg = data.choices?.[0]?.message;
  return msg?.content || (msg as any)?.reasoning_content || "";
}

export function callMiniMaxStream(params: {
  system: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${MINIMAX_API_KEY}` },
          body: JSON.stringify({ model: MINIMAX_MODEL, messages: buildMessages(params.system, params.messages), max_tokens: params.maxTokens || 4096, temperature: 0.7, stream: true }),
        });
        if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No body");
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
            if (!t || !t.startsWith("data: ")) continue;
            const d = t.slice(6);
            if (d === "[DONE]") break;
            try {
              const chunk: MMStreamChunk = JSON.parse(d);
              const c = chunk.choices?.[0]?.delta?.content;
              if (c) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: c })}\n\n`));
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

export async function callMiniMaxWithImage(params: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  maxTokens?: number;
}): Promise<string> {
  const messages: MMMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: [
      { type: "image_url", image_url: { url: `data:${params.mediaType};base64,${params.imageBase64}` } },
      { type: "text", text: params.prompt },
    ]},
  ];
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${MINIMAX_API_KEY}` },
    body: JSON.stringify({ model: MINIMAX_MODEL, messages, max_tokens: params.maxTokens || 4096, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`MiniMax Vision error: ${res.status} - ${await res.text()}`);
  const data: MMResponse = await res.json();
  checkResp(data);
  const msg = data.choices?.[0]?.message;
  return msg?.content || (msg as any)?.reasoning_content || "";
}
