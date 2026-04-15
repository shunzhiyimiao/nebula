export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/practice/session/complete
 * 练习结束时调用，保存答案、更新 session 状态和 DailyStats
 *
 * Body: { sessionId, answers: { questionId, userAnswer, isCorrect }[] }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const userId = session.user.id;

  const body = await request.json();
  const { sessionId, answers } = body as {
    sessionId: string;
    answers: { questionId: string; userAnswer: string; isCorrect: boolean }[];
  };

  if (!sessionId || !answers?.length) {
    return NextResponse.json({ error: "参数缺失" }, { status: 400 });
  }

  // 校验 sessionId 属于当前用户
  const practiceSession = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, status: true },
  });
  if (!practiceSession || practiceSession.userId !== userId) {
    return NextResponse.json({ error: "无权操作该练习" }, { status: 403 });
  }
  if (practiceSession.status === "COMPLETED") {
    return NextResponse.json({ error: "该练习已完成" }, { status: 400 });
  }

  // 校验所有 questionId 属于该 session
  const questionIds = answers.map((a) => a.questionId);
  const validQuestions = await prisma.practiceQuestion.findMany({
    where: { id: { in: questionIds }, sessionId },
    select: { id: true },
  });
  const validIds = new Set(validQuestions.map((q) => q.id));
  const invalidIds = questionIds.filter((id) => !validIds.has(id));
  if (invalidIds.length > 0) {
    return NextResponse.json({ error: "存在无效的题目ID" }, { status: 400 });
  }

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = correctCount / answers.length;

  await prisma.$transaction(async (tx) => {
    // 保存每道题的答案
    await Promise.all(
      answers.map((a) =>
        tx.practiceAnswer.create({
          data: {
            userId,
            sessionId,
            practiceQuestionId: a.questionId,
            userAnswer: a.userAnswer,
            isCorrect: a.isCorrect,
          },
        })
      )
    );

    // 更新 session 状态
    await tx.practiceSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        score: correctCount,
        totalScore: answers.length,
        accuracy,
      },
    });

    // 更新当日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await tx.dailyStats.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        practiceCompleted: { increment: 1 },
        practiceAccuracy: accuracy,
      },
      create: {
        userId,
        date: today,
        practiceCompleted: 1,
        practiceAccuracy: accuracy,
      },
    });
  });

  return NextResponse.json({ success: true });
}
