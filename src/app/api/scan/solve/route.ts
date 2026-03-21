import { NextRequest } from "next/server";
import { solveQuestionStream } from "@/lib/ai/solver";
import type { Subject } from "@/types/question";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionText, questionLatex, questionType, subject, grade, userAnswer, options } = body;

    if (!questionText || !subject) {
      return new Response(
        JSON.stringify({ error: "缺少题目或学科信息" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = solveQuestionStream({
      questionText,
      questionLatex,
      questionType,
      subject: subject as Subject,
      grade,
      userAnswer,
      options,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Solve error:", error);
    return new Response(
      JSON.stringify({ error: "解题失败，请重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
