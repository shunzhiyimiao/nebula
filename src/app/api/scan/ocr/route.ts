import { NextRequest, NextResponse } from "next/server";
import { recognizeQuestion } from "@/lib/ai/ocr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mediaType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "缺少图片数据" },
        { status: 400 }
      );
    }

    // 去掉 data URL 前缀（如果有）
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const detectedType = mediaType || "image/jpeg";

    const result = await recognizeQuestion(base64Data, detectedType);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "识别失败，请重试", detail: String(error) },
      { status: 500 }
    );
  }
}
