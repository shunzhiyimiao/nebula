import { isDatabaseAvailable } from "@/lib/db-available";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/notebook/analysis — 错题分析报告 */
export async function GET(request: NextRequest) {
  if (!isDatabaseAvailable()) return NextResponse.json({ data: [], success: true });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "demo-user";
  const subject = searchParams.get("subject");

  try {
    const where: any = {
      userId,
      isInNotebook: true,
      ...(subject && subject !== "all" ? { subject: subject as any } : {}),
    };

    // 1. 按错误类型统计
    const errorTypeStats = await prisma.question.groupBy({
      by: ["errorType"],
      where: { ...where, errorType: { not: null } },
      _count: true,
      orderBy: { _count: { errorType: "desc" } },
    });

    // 2. 按学科统计
    const subjectStats = await prisma.question.groupBy({
      by: ["subject"],
      where,
      _count: true,
      orderBy: { _count: { subject: "desc" } },
    });

    // 3. 按难度统计
    const difficultyStats = await prisma.question.groupBy({
      by: ["difficulty"],
      where,
      _count: true,
    });

    // 4. 薄弱知识点排行（按错题数量）
    const allErrors = await prisma.question.findMany({
      where,
      include: {
        knowledgePoints: {
          include: { knowledgePoint: { select: { id: true, name: true, subject: true } } },
        },
      },
    });

    // 聚合知识点
    const kpMap = new Map<string, {
      id: string;
      name: string;
      subject: string;
      errorCount: number;
      notMasteredCount: number;
      errorTypes: Record<string, number>;
    }>();

    for (const q of allErrors) {
      for (const qkp of q.knowledgePoints) {
        const kp = qkp.knowledgePoint;
        const existing = kpMap.get(kp.id) || {
          id: kp.id,
          name: kp.name,
          subject: kp.subject,
          errorCount: 0,
          notMasteredCount: 0,
          errorTypes: {},
        };
        existing.errorCount++;
        if (q.masteryLevel === "NOT_MASTERED") existing.notMasteredCount++;
        if (q.errorType) {
          existing.errorTypes[q.errorType] = (existing.errorTypes[q.errorType] || 0) + 1;
        }
        kpMap.set(kp.id, existing);
      }
    }

    const weakPoints = Array.from(kpMap.values())
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 15);

    // 5. 时间趋势（按周统计）
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000);
    const recentErrors = await prisma.question.findMany({
      where: { ...where, createdAt: { gte: fourWeeksAgo } },
      select: { createdAt: true, masteryLevel: true },
      orderBy: { createdAt: "asc" },
    });

    // 按周分组
    const weeklyTrend: { week: string; total: number; mastered: number }[] = [];
    const weekMap = new Map<string, { total: number; mastered: number }>();
    for (const q of recentErrors) {
      const weekStart = getWeekStart(q.createdAt);
      const key = weekStart.toISOString().slice(0, 10);
      const existing = weekMap.get(key) || { total: 0, mastered: 0 };
      existing.total++;
      if (q.masteryLevel === "MASTERED") existing.mastered++;
      weekMap.set(key, existing);
    }
    for (const [week, data] of Array.from(weekMap)) {
      weeklyTrend.push({ week, ...data });
    }

    // 6. 掌握度分布
    const masteryStats = await prisma.question.groupBy({
      by: ["masteryLevel"],
      where,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalErrors: allErrors.length,
        errorTypeStats: errorTypeStats.map((s) => ({
          type: s.errorType,
          count: s._count,
        })),
        subjectStats: subjectStats.map((s) => ({
          subject: s.subject,
          count: s._count,
        })),
        difficultyStats: difficultyStats.map((s) => ({
          difficulty: s.difficulty,
          count: s._count,
        })),
        masteryStats: masteryStats.map((s) => ({
          level: s.masteryLevel,
          count: s._count,
        })),
        weakPoints,
        weeklyTrend,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "分析失败" }, { status: 500 });
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}
