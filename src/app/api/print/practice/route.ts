export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePracticeHTML, type PracticePrintData } from "@/lib/print/pdf-generator";

/** POST /api/print/practice — 生成练习册打印HTML */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      includeAnswers = true,
      studentName,
      timeLimit,
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "缺少练习ID" }, { status: 400 });
    }

    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "练习不存在" }, { status: 404 });
    }

    const printData: PracticePrintData = {
      title: session.title,
      subtitle: `共${session.questionCount}题`,
      studentName,
      date: new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
      timeLimit,
      includeAnswers,
      questions: session.questions.map((q, i) => ({
        index: i + 1,
        questionText: q.questionText,
        questionLatex: q.questionLatex || undefined,
        questionType: q.questionType,
        options: q.options as string[] || undefined,
        points: q.questionType === "CHOICE" ? 3 : q.questionType === "FILL_BLANK" ? 4 : 8,
        correctAnswer: q.correctAnswer,
        solution: (q.solution as any)?.solution || undefined,
        steps: q.steps as any[] || undefined,
      })),
    };

    const html = generatePracticeHTML(printData);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Print practice error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
