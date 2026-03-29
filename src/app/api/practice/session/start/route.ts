export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Subject, PracticeType, QuestionType, Difficulty } from "@prisma/client";

const TYPE_MAP: Record<string, PracticeType> = {
  daily: "DAILY",
  review: "REVIEW",
  targeted: "TARGETED",
};

const QTYPE_MAP: Record<string, QuestionType> = {
  CHOICE: "CHOICE",
  FILL_BLANK: "FILL_BLANK",
  SHORT_ANSWER: "SHORT_ANSWER",
  CALCULATION: "CALCULATION",
};

const DIFF_MAP: Record<string, Difficulty> = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
};

/**
 * POST /api/practice/session/start
 * 题目加载完成后调用，创建 PracticeSession + PracticeQuestion 记录
 *
 * Body: { questions, type, kp? }
 * Returns: { sessionId, questionIds: string[] }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const userId = session.user.id;

  const body = await request.json();
  const { questions, type, kp } = body as {
    questions: {
      questionText: string;
      questionLatex?: string;
      questionType: string;
      options?: string[] | null;
      answer: string;
      explanation: string;
      knowledgePoint?: string;
      difficulty?: string;
    }[];
    type: string;
    kp?: string;
  };

  if (!questions?.length) return NextResponse.json({ error: "题目列表为空" }, { status: 400 });

  // 获取用户学科
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subjects: true },
  });
  const subject: Subject = user?.subjects?.[0] ?? "MATH";

  const practiceType: PracticeType = TYPE_MAP[type] ?? "DAILY";
  const title =
    type === "daily" ? "每日练习" :
    type === "review" ? "错题复习" :
    kp ? `「${kp}」专项练习` : "专项练习";

  // 在事务中创建 session + questions
  const result = await prisma.$transaction(async (tx) => {
    const ps = await tx.practiceSession.create({
      data: {
        userId,
        type: practiceType,
        subject,
        title,
        questionCount: questions.length,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        targetKnowledgePoints: kp ? [kp] : [],
      },
    });

    const pqs = await Promise.all(
      questions.map((q, idx) =>
        tx.practiceQuestion.create({
          data: {
            sessionId: ps.id,
            questionText: q.questionText,
            questionLatex: q.questionLatex ?? null,
            questionType: QTYPE_MAP[q.questionType] ?? "SHORT_ANSWER",
            options: q.options ? q.options : undefined,
            correctAnswer: q.answer,
            solution: { text: q.explanation },
            steps: [],
            difficulty: DIFF_MAP[q.difficulty ?? "MEDIUM"] ?? "MEDIUM",
            knowledgePointIds: q.knowledgePoint ? [q.knowledgePoint] : [],
            sortOrder: idx,
          },
        })
      )
    );

    return { sessionId: ps.id, questionIds: pqs.map((pq) => pq.id) };
  });

  return NextResponse.json({ success: true, ...result });
}
