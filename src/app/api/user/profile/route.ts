export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Grade, Subject } from "@prisma/client";

const VALID_GRADES: Grade[] = [
  "PRIMARY_1","PRIMARY_2","PRIMARY_3","PRIMARY_4","PRIMARY_5","PRIMARY_6",
  "JUNIOR_1","JUNIOR_2","JUNIOR_3",
  "SENIOR_1","SENIOR_2","SENIOR_3",
];

const VALID_SUBJECTS: Subject[] = [
  "MATH","CHINESE","ENGLISH","PHYSICS","CHEMISTRY","BIOLOGY","HISTORY","GEOGRAPHY","POLITICS",
];

/** GET /api/user/profile — 获取当前用户档案（含 AI 配置） */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { grade: true, subjects: true, name: true, aiProvider: true, aiKeys: true },
  });

  return NextResponse.json({ success: true, data: user });
}

/** PATCH /api/user/profile — 更新年级和学科 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();
  const { grade, subjects, aiProvider, aiKeys } = body as {
    grade?: string;
    subjects?: string[];
    aiProvider?: string;
    aiKeys?: Record<string, string>;
  };

  // 校验年级
  if (grade && !VALID_GRADES.includes(grade as Grade)) {
    return NextResponse.json({ error: "无效年级" }, { status: 400 });
  }

  // 校验学科列表
  if (subjects) {
    const invalid = subjects.filter((s) => !VALID_SUBJECTS.includes(s as Subject));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `无效学科: ${invalid.join(",")}` }, { status: 400 });
    }
  }

  // 校验 AI 供应商
  const VALID_PROVIDERS = ["qwen", "deepseek", "minimax", "claude"];
  if (aiProvider && !VALID_PROVIDERS.includes(aiProvider)) {
    return NextResponse.json({ error: "无效 AI 供应商" }, { status: 400 });
  }

  // 校验 aiKeys：只允许合法供应商的 key
  if (aiKeys) {
    const invalidKeys = Object.keys(aiKeys).filter((k) => !VALID_PROVIDERS.includes(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: `无效供应商: ${invalidKeys.join(",")}` }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(grade !== undefined ? { grade: grade as Grade } : {}),
      ...(subjects !== undefined ? { subjects: subjects as Subject[] } : {}),
      ...(aiProvider !== undefined ? { aiProvider } : {}),
      ...(aiKeys !== undefined ? { aiKeys } : {}),
    },
    select: { grade: true, subjects: true, aiProvider: true, aiKeys: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
