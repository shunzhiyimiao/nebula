export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurriculumScope } from "@/lib/curriculum";
import type { Subject } from "@prisma/client";

const VALID_SUBJECTS: Subject[] = [
  "MATH","CHINESE","ENGLISH","PHYSICS","CHEMISTRY","BIOLOGY","HISTORY","GEOGRAPHY","POLITICS",
];

/** GET /api/curriculum?subject=MATH — 返回当前用户年级对应学科的课纲文本 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const subject = (new URL(request.url).searchParams.get("subject") || "MATH") as Subject;
  if (!VALID_SUBJECTS.includes(subject)) {
    return NextResponse.json({ error: "无效学科" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { grade: true },
  });

  const text = getCurriculumScope(user?.grade, subject);
  return NextResponse.json({ success: true, data: { text, grade: user?.grade } });
}
