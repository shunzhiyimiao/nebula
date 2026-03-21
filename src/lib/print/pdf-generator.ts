/**
 * PDF 生成器
 *
 * MVP阶段方案: 生成打印优化的 HTML 页面，用户通过浏览器打印为 PDF
 * 后续可升级为 Puppeteer 服务端渲染
 *
 * 为什么不用 Puppeteer:
 * - Vercel Serverless 函数有 50MB 限制，Puppeteer 超出
 * - 浏览器 Ctrl+P 打印效果已经很好
 * - 零成本，无服务端依赖
 */

import type { SolutionStep } from "@/types/question";

export interface NotebookPrintData {
  title: string;
  subtitle: string;
  studentName?: string;
  date: string;
  errors: {
    id: string;
    index: number;
    subject: string;
    questionText: string;
    questionLatex?: string;
    userAnswer?: string;
    correctAnswer?: string;
    errorReason?: string;
    errorType?: string;
    steps?: SolutionStep[];
    knowledgePoints?: string[];
    difficulty?: string;
  }[];
  stats?: {
    total: number;
    notMastered: number;
    partial: number;
    mastered: number;
  };
}

export interface PracticePrintData {
  title: string;
  subtitle: string;
  studentName?: string;
  date: string;
  timeLimit?: string;
  questions: {
    index: number;
    questionText: string;
    questionLatex?: string;
    questionType: string;
    options?: string[];
    points?: number;
    correctAnswer: string;
    solution?: string;
    steps?: SolutionStep[];
  }[];
  includeAnswers: boolean;
}

const SUBJECT_LABELS: Record<string, string> = {
  MATH: "数学", CHINESE: "语文", ENGLISH: "英语",
  PHYSICS: "物理", CHEMISTRY: "化学", BIOLOGY: "生物",
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  CONCEPT_CONFUSION: "概念混淆", FORMULA_ERROR: "公式记错",
  CALCULATION_MISTAKE: "计算失误", LOGIC_ERROR: "逻辑错误",
  MISSING_CONDITION: "遗漏条件", METHOD_WRONG: "方法错误",
  CARELESS: "粗心大意", NOT_UNDERSTOOD: "完全不会",
};

/** 生成错题本打印 HTML */
export function generateNotebookHTML(data: NotebookPrintData): string {
  const errorsHTML = data.errors.map((err) => `
    <div class="error-item">
      <div class="error-header">
        <span class="error-num">错题 #${err.index}</span>
        <span class="error-subject">${SUBJECT_LABELS[err.subject] || err.subject}</span>
        ${err.difficulty ? `<span class="error-diff">${err.difficulty}</span>` : ""}
      </div>

      <div class="section">
        <div class="section-title">【原题】</div>
        <div class="question-text">${err.questionText}</div>
      </div>

      ${err.userAnswer ? `
      <div class="answer-compare">
        <div class="answer wrong">
          <span class="answer-label">✗ 我的答案</span>
          <span class="answer-text">${err.userAnswer}</span>
        </div>
        <div class="answer correct">
          <span class="answer-label">✓ 正确答案</span>
          <span class="answer-text">${err.correctAnswer || "—"}</span>
        </div>
      </div>` : ""}

      ${err.errorReason ? `
      <div class="section">
        <div class="section-title">【错因分析】<span class="error-type">${ERROR_TYPE_LABELS[err.errorType || ""] || ""}</span></div>
        <div class="error-reason">${err.errorReason}</div>
      </div>` : ""}

      ${err.steps && err.steps.length > 0 ? `
      <div class="section">
        <div class="section-title">【正确解法】</div>
        <div class="steps">
          ${err.steps.map((s, i) => `
            <div class="step">
              <span class="step-num">${i + 1}</span>
              <div class="step-content">
                <div class="step-title">${s.title}</div>
                <div class="step-text">${s.content}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>` : ""}

      ${err.knowledgePoints && err.knowledgePoints.length > 0 ? `
      <div class="section kp-section">
        <span class="section-title-inline">涉及知识点：</span>
        ${err.knowledgePoints.map((kp) => `<span class="kp-tag">${kp}</span>`).join("")}
      </div>` : ""}

      <div class="self-assess">
        <span>自我评估：</span>
        <span class="assess-box">□ 已掌握</span>
        <span class="assess-box">□ 部分掌握</span>
        <span class="assess-box">□ 未掌握</span>
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${data.title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.6; }

  .cover { text-align: center; padding: 60px 0 40px; border-bottom: 3px double #4c6ef5; margin-bottom: 30px; }
  .cover h1 { font-size: 24pt; font-weight: 800; color: #4c6ef5; }
  .cover .subtitle { font-size: 12pt; color: #6b7194; margin-top: 8px; }
  .cover .meta { margin-top: 20px; font-size: 10pt; color: #9ca3c4; }
  .cover .student { margin-top: 16px; font-size: 11pt; }
  .cover .student-line { display: inline-block; width: 120px; border-bottom: 1px solid #1a1a2e; }

  .error-item { page-break-inside: avoid; border: 1px solid #e0e0e8; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .error-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f5; }
  .error-num { font-weight: 700; font-size: 12pt; color: #4c6ef5; }
  .error-subject { font-size: 9pt; background: #f0f4ff; color: #4c6ef5; padding: 2px 8px; border-radius: 4px; }
  .error-diff { font-size: 9pt; background: #f5f5f5; color: #888; padding: 2px 8px; border-radius: 4px; }

  .section { margin-bottom: 12px; }
  .section-title { font-weight: 700; font-size: 10pt; color: #333; margin-bottom: 4px; }
  .section-title-inline { font-weight: 600; font-size: 9pt; color: #666; }
  .error-type { font-size: 8pt; background: #fff3e0; color: #e65100; padding: 1px 6px; border-radius: 3px; margin-left: 6px; font-weight: 500; }
  .question-text { font-size: 11pt; padding: 8px 12px; background: #fafafe; border-radius: 6px; border: 1px solid #f0f0f5; }
  .error-reason { font-size: 10pt; color: #555; padding: 8px 12px; background: #fff8f0; border-radius: 6px; border-left: 3px solid #ff9800; }

  .answer-compare { display: flex; gap: 12px; margin-bottom: 12px; }
  .answer { flex: 1; padding: 8px 12px; border-radius: 6px; }
  .answer.wrong { background: #fef2f2; border: 1px solid #fecaca; }
  .answer.correct { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .answer-label { display: block; font-size: 8pt; font-weight: 600; margin-bottom: 2px; }
  .answer.wrong .answer-label { color: #dc2626; }
  .answer.correct .answer-label { color: #16a34a; }
  .answer-text { font-size: 10pt; font-weight: 600; }

  .steps { counter-reset: step; }
  .step { display: flex; gap: 10px; margin-bottom: 8px; }
  .step-num { width: 22px; height: 22px; background: #4c6ef5; color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 700; flex-shrink: 0; }
  .step-title { font-weight: 600; font-size: 10pt; }
  .step-text { font-size: 10pt; color: #555; margin-top: 2px; }

  .kp-section { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
  .kp-tag { font-size: 8pt; background: #f0f4ff; color: #4c6ef5; padding: 2px 8px; border-radius: 4px; }

  .self-assess { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e0e0e8; font-size: 9pt; color: #888; display: flex; gap: 12px; }
  .assess-box { font-size: 9pt; }

  .stats-footer { margin-top: 30px; padding: 16px; background: #f8f9fc; border-radius: 8px; border: 1px solid #e0e0e8; page-break-inside: avoid; }
  .stats-footer h3 { font-size: 11pt; margin-bottom: 8px; }
  .stats-row { display: flex; gap: 20px; font-size: 10pt; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .error-item { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="cover">
    <h1>📝 ${data.title}</h1>
    <div class="subtitle">${data.subtitle}</div>
    <div class="meta">${data.date}</div>
    <div class="student">姓名：<span class="student-line">${data.studentName || "&nbsp;"}</span></div>
  </div>

  ${errorsHTML}

  ${data.stats ? `
  <div class="stats-footer">
    <h3>📊 统计</h3>
    <div class="stats-row">
      <span>总计: ${data.stats.total}题</span>
      <span>未掌握: ${data.stats.notMastered}</span>
      <span>部分掌握: ${data.stats.partial}</span>
      <span>已掌握: ${data.stats.mastered}</span>
    </div>
  </div>` : ""}

  <div style="text-align:center; margin-top:40px; font-size:9pt; color:#ccc;">
    Nebula · 智能学习平台
  </div>
</body>
</html>`;
}

/** 生成练习册打印 HTML */
export function generatePracticeHTML(data: PracticePrintData): string {
  // 按题型分组
  const choiceQs = data.questions.filter((q) => q.questionType === "CHOICE" || q.questionType === "MULTI_CHOICE" || q.questionType === "TRUE_FALSE");
  const fillQs = data.questions.filter((q) => q.questionType === "FILL_BLANK");
  const calcQs = data.questions.filter((q) => !["CHOICE", "MULTI_CHOICE", "TRUE_FALSE", "FILL_BLANK"].includes(q.questionType));

  function renderQuestionGroup(title: string, questions: typeof data.questions, pointsEach: number) {
    if (questions.length === 0) return "";
    return `
      <div class="q-group">
        <h3 class="group-title">${title}（每题${pointsEach}分，共${questions.length * pointsEach}分）</h3>
        ${questions.map((q) => `
          <div class="question">
            <div class="q-text"><span class="q-num">${q.index}.</span> ${q.questionText}</div>
            ${q.options ? `<div class="q-options">${q.options.map((o) => `<div class="q-option">${o}</div>`).join("")}</div>` : ""}
            ${q.questionType === "FILL_BLANK" ? '<div class="q-blank">______</div>' : ""}
            ${["CALCULATION", "SHORT_ANSWER", "PROOF", "APPLICATION"].includes(q.questionType) ? '<div class="q-workspace"></div>' : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  const answersHTML = data.includeAnswers ? `
    <div class="answers-section">
      <div class="tear-line">✂ - - - - - - - - - - - - - 答案与解析（可撕下） - - - - - - - - - - - - - ✂</div>
      ${data.questions.map((q) => `
        <div class="answer-item">
          <span class="a-num">${q.index}.</span>
          <span class="a-text">${q.correctAnswer}</span>
          ${q.solution ? `<div class="a-solution">${q.solution}</div>` : ""}
        </div>
      `).join("")}
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${data.title}</title>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.6; }

  .cover { text-align: center; padding: 40px 0 30px; border-bottom: 2px solid #4c6ef5; margin-bottom: 24px; }
  .cover h1 { font-size: 22pt; font-weight: 800; color: #4c6ef5; }
  .cover .meta { margin-top: 12px; font-size: 10pt; color: #666; }
  .cover .info { display: flex; justify-content: space-between; margin-top: 16px; font-size: 10pt; }
  .cover .info-line { display: inline-block; width: 100px; border-bottom: 1px solid #333; }

  .q-group { margin-bottom: 24px; }
  .group-title { font-size: 12pt; font-weight: 700; margin-bottom: 12px; padding: 6px 12px; background: #f0f4ff; border-radius: 6px; color: #4c6ef5; }

  .question { margin-bottom: 16px; page-break-inside: avoid; }
  .q-text { font-size: 11pt; line-height: 1.7; }
  .q-num { font-weight: 700; color: #4c6ef5; margin-right: 4px; }
  .q-options { margin: 8px 0 0 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
  .q-option { font-size: 10.5pt; padding: 2px 0; }
  .q-blank { margin: 8px 0 0 20px; font-size: 14pt; letter-spacing: 4px; }
  .q-workspace { margin-top: 8px; height: 100px; border: 1px dashed #ddd; border-radius: 6px; }

  .answers-section { margin-top: 40px; padding-top: 20px; }
  .tear-line { text-align: center; font-size: 9pt; color: #aaa; margin-bottom: 16px; letter-spacing: 2px; border-top: 1px dashed #ccc; padding-top: 12px; }
  .answer-item { margin-bottom: 8px; font-size: 10pt; }
  .a-num { font-weight: 700; color: #4c6ef5; }
  .a-text { font-weight: 600; }
  .a-solution { margin: 4px 0 0 20px; font-size: 9pt; color: #666; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .question { break-inside: avoid; }
    .answers-section { break-before: page; }
  }
</style>
</head>
<body>
  <div class="cover">
    <h1>📋 ${data.title}</h1>
    <div class="meta">${data.subtitle}</div>
    <div class="info">
      <span>姓名：<span class="info-line">${data.studentName || "&nbsp;"}</span></span>
      <span>日期：${data.date}</span>
      ${data.timeLimit ? `<span>时间：${data.timeLimit}</span>` : ""}
    </div>
  </div>

  ${renderQuestionGroup("一、选择题", choiceQs, 3)}
  ${renderQuestionGroup("二、填空题", fillQs, 4)}
  ${renderQuestionGroup("三、解答题", calcQs, 8)}

  ${answersHTML}

  <div style="text-align:center; margin-top:40px; font-size:9pt; color:#ccc;">
    Nebula · 智能学习平台
  </div>
</body>
</html>`;
}
