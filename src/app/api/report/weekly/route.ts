import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/report/weekly — 每周详细数据 */
export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get("userId") || "demo-user";
  const weeksBack = parseInt(new URL(request.url).searchParams.get("weeks") || "4");

  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeksBack * 7);

    // 获取每日统计
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    // 获取期间所有题目
    const questions = await prisma.question.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        isCorrect: true,
        isInNotebook: true,
        subject: true,
        masteryLevel: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 按天分组
    const dayMap = new Map<string, {
      date: string;
      questions: number;
      correct: number;
      wrong: number;
      studyMinutes: number;
    }>();

    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { date: key, questions: 0, correct: 0, wrong: 0, studyMinutes: 0 });
    }

    for (const q of questions) {
      const key = q.createdAt.toISOString().slice(0, 10);
      const day = dayMap.get(key);
      if (day) {
        day.questions++;
        if (q.isCorrect === true) day.correct++;
        if (q.isCorrect === false) day.wrong++;
      }
    }

    for (const stat of dailyStats) {
      const key = new Date(stat.date).toISOString().slice(0, 10);
      const day = dayMap.get(key);
      if (day) {
        day.studyMinutes = stat.studyMinutes;
      }
    }

    // 按学科统计
    const subjectMap = new Map<string, { total: number; correct: number }>();
    for (const q of questions) {
      const s = subjectMap.get(q.subject) || { total: 0, correct: 0 };
      s.total++;
      if (q.isCorrect === true) s.correct++;
      subjectMap.set(q.subject, s);
    }

    const subjectStats = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      total: data.total,
      correct: data.correct,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        daily: Array.from(dayMap.values()),
        subjectStats,
        summary: {
          totalQuestions: questions.length,
          totalCorrect: questions.filter((q) => q.isCorrect === true).length,
          totalWrong: questions.filter((q) => q.isCorrect === false).length,
          newErrors: questions.filter((q) => q.isInNotebook).length,
          accuracy: questions.length > 0
            ? Math.round((questions.filter((q) => q.isCorrect === true).length / questions.length) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error("Report weekly error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
