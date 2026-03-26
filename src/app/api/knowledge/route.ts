export const dynamic = "force-dynamic";
import { isDatabaseAvailable } from "@/lib/db-available";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** GET /api/knowledge — 获取知识点列表（支持按学科/年级筛选） */
export async function GET(request: NextRequest) {
  if (!isDatabaseAvailable()) return NextResponse.json({ data: [], success: true });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const grade = searchParams.get("grade");
  const userId = session.user.id;

  try {
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        ...(subject ? { subject: subject as any } : {}),
        ...(grade ? { gradeLevel: grade as any } : {}),
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        questions: {
          where: { question: { userId, isInNotebook: true } },
          select: { questionId: true, isMainPoint: true },
        },
      },
      orderBy: [{ subject: "asc" }, { chapter: "asc" }, { name: "asc" }],
    });

    // 计算每个知识点的用户统计
    const enriched = knowledgePoints.map((kp) => {
      const errorCount = kp.questions.length;
      return {
        id: kp.id,
        name: kp.name,
        subject: kp.subject,
        gradeLevel: kp.gradeLevel,
        chapter: kp.chapter,
        definition: kp.definition,
        hasFormulas: !!(kp.formulas && (kp.formulas as string[]).length > 0),
        parentId: kp.parentId,
        parent: kp.parent,
        childCount: kp.children.length,
        relatedIds: kp.relatedIds,
        errorCount,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Knowledge list error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
