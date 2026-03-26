export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/practice/generate
 * 生成练习题
 *
 * 参数：
 *   type    - "daily" | "review" | "targeted"
 *   kp      - 知识点名称（targeted 模式）
 *   kpId    - 知识点 ID（targeted 模式）
 *   count   - 题目数量（默认 5）
 *   subject - 学科筛选（可选）
 *
 * 返回：
 *   { success: true, questions: PracticeQuestion[] }
 *
 * TODO: 接入 AI 生成逻辑
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "daily";
  const kp = searchParams.get("kp") || "";
  const count = Math.min(parseInt(searchParams.get("count") || "5"), 20);
  const userId = session.user.id;

  try {
    // 获取用户错题（用于 review 和 daily 模式的上下文）
    const notebookQuestions = await prisma.question.findMany({
      where: { userId, isInNotebook: true },
      include: {
        knowledgePoints: {
          include: { knowledgePoint: { select: { name: true, subject: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // TODO: 调用 AI 根据 type / kp / notebookQuestions 生成练习题
    // 目前返回占位数据，等待 AI 生成逻辑接入

    return NextResponse.json({
      success: false,
      error: "练习题生成功能即将上线，敬请期待",
      // 调试用：返回参数信息
      debug: { type, kp, count, notebookCount: notebookQuestions.length },
    });
  } catch (error) {
    console.error("Practice generate error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
