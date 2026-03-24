export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
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
    } = body;

    if (!questionText || !subject) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }

    // 如果提供了userAnswer且isCorrect为false，自动标记为错题
    const isInNotebook = userAnswer && isCorrect === false;

    const question = await prisma.question.create({
      data: {
        userId: userId || "demo-user", // TODO: 从 session 获取
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
