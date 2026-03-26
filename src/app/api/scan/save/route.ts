export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      subject,
      gradeLevel,
      questionType,
      originalImage,
      questionText,
      questionLatex,
      solution,
      solutionText,
      steps,
      keyFormulas,
      userAnswer,
      isCorrect,
      errorReason,
      errorType,
      difficulty,
      knowledgePoints, // { name: string; isMain: boolean }[]
      isInNotebook: isInNotebookBody,
    } = body;

    if (!questionText || !subject) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }

    // 前端明确传了 isInNotebook 时优先使用，否则根据答案自动判断
    const isInNotebook = isInNotebookBody ?? (userAnswer && isCorrect === false);

    const question = await prisma.question.create({
      data: {
        userId: session.user.id,
        subject,
        gradeLevel,
        questionType: questionType || "OTHER",
        originalImage,
        questionText,
        questionLatex,
        solution: solution || {},
        solutionText: solutionText || "",
        steps: steps || [],
        keyFormulas: keyFormulas || [],
        userAnswer,
        isCorrect,
        isInNotebook: !!isInNotebook,
        errorReason,
        errorType,
        difficulty: difficulty || "MEDIUM",
        // 如果是错题，设置明天复习
        nextReviewAt: isInNotebook ? new Date(Date.now() + 86400000) : null,
        knowledgePoints: knowledgePoints
          ? {
              create: await Promise.all(
                knowledgePoints.map(async (kp: { name: string; isMain: boolean }) => {
                  // 查找或创建知识点
                  const point = await prisma.knowledgePoint.upsert({
                    where: {
                      name_subject: { name: kp.name, subject },
                    },
                    create: {
                      name: kp.name,
                      subject,
                      definition: "", // 后续由AI填充
                    },
                    update: {},
                  });
                  return {
                    knowledgePointId: point.id,
                    isMainPoint: kp.isMain,
                  };
                })
              ),
            }
          : undefined,
      },
      include: {
        knowledgePoints: {
          include: { knowledgePoint: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { error: "保存失败", detail: String(error) },
      { status: 500 }
    );
  }
}
