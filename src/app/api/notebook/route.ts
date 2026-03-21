import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/notebook — 错题列表（支持分页/筛选） */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "demo-user";
  const subject = searchParams.get("subject");
  const mastery = searchParams.get("mastery");
  const knowledgePoint = searchParams.get("kp");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const where: any = {
      userId,
      isInNotebook: true,
      ...(subject && subject !== "all" ? { subject: subject as any } : {}),
      ...(mastery && mastery !== "all" ? { masteryLevel: mastery as any } : {}),
      ...(knowledgePoint ? {
        knowledgePoints: { some: { knowledgePoint: { name: knowledgePoint } } }
      } : {}),
      ...(search ? {
        OR: [
          { questionText: { contains: search, mode: "insensitive" } },
          { errorReason: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const [errors, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          knowledgePoints: {
            include: { knowledgePoint: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);

    // 统计数据
    const stats = await prisma.question.groupBy({
      by: ["masteryLevel"],
      where: { userId, isInNotebook: true },
      _count: true,
    });

    const statsMap = {
      total,
      NOT_MASTERED: 0,
      PARTIAL: 0,
      MASTERED: 0,
    };
    for (const s of stats) {
      statsMap[s.masteryLevel as keyof typeof statsMap] = s._count;
    }

    return NextResponse.json({
      success: true,
      data: errors,
      stats: statsMap,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Notebook list error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
