export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getProvider, getProviderLabel, supportsVision } from "@/lib/ai/provider";

/** GET /api/ai/provider — 获取当前 AI 提供商信息 */
export async function GET() {
  const provider = getProvider();
  return NextResponse.json({
    provider,
    label: getProviderLabel(provider),
    supportsVision: supportsVision(provider),
    models: {
      claude: {
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
        configured: !!process.env.ANTHROPIC_API_KEY,
      },
      deepseek: {
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        configured: !!process.env.DEEPSEEK_API_KEY,
      },
      minimax: {
        model: process.env.MINIMAX_MODEL || "MiniMax-M2.5",
        configured: !!process.env.MINIMAX_API_KEY,
      },
      qwen: {
        model: process.env.QWEN_MODEL || "qwen-max",
        configured: !!process.env.QWEN_API_KEY,
      },
    },
  });
}
