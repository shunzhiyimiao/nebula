import { isDatabaseAvailable } from "@/lib/db-available";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/report/overview — 学习总览数据 */
export async function GET(request: NextRequest) {
  if (!isDatabaseAvailable()) return NextResponse.json({ data: [], success: true });
  const userId = new URL(request.url).searchParams.get("userId") || "demo-user";

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // 本周一

    // 总计数据
    const [totalQuestions, totalErrors, totalMastered] = await Promise.all([
      prisma.question.count({ where: { userId } }),
      prisma.question.count({ where: { userId, isInNotebook: true } }),
      prisma.question.count({ where: { userId, isInNotebook: true, masteryLevel: "MASTERED" } }),
    ]);

    // 本周数据
    const weekQuestions = await prisma.question.count({
      where: { userId, createdAt: { gte: weekStart } },
    });
    const weekCorrect = await prisma.question.count({
      where: { userId, createdAt: { gte: weekStart }, isCorrect: true },
    });

    // 今日数据
    const todayQuestions = await prisma.question.count({
      where: { userId, createdAt: { gte: todayStart } },
    });

    // 连续学习天数
    const dailyStats = await prisma.dailyStats.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 60,
      select: { date: true, questionsScanned: true, practiceCompleted: true },
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const stat = dailyStats.find(
        (s) => new Date(s.date).toDateString() === checkDate.toDateString()
      );
      if (stat && (stat.questionsScanned > 0 || stat.practiceCompleted > 0)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // 待复习题目
    const pendingReview = await prisma.question.count({
      where: {
        userId,
        isInNotebook: true,
        masteryLevel: { not: "MASTERED" },
        nextReviewAt: { lte: now },
      },
    });

    // 知识点总数和已掌握数
    const knowledgePoints = await prisma.questionKnowledgePoint.findMany({
      where: { question: { userId } },
      select: { knowledgePointId: true },
      distinct: ["knowledgePointId"],
    });
    const totalKP = knowledgePoints.length;

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        totalErrors,
        totalMastered,
        weekQuestions,
        weekCorrect,
        weekAccuracy: weekQuestions > 0 ? Math.round((weekCorrect / weekQuestions) * 100) : 0,
        todayQuestions,
        streak,
        pendingReview,
        totalKnowledgePoints: totalKP,
      },
    });
  } catch (error) {
    console.error("Report overview error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
