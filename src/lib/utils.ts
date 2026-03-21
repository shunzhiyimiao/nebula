import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 学科中文名 */
export const SUBJECT_LABELS: Record<string, string> = {
  MATH: "数学",
  CHINESE: "语文",
  ENGLISH: "英语",
  PHYSICS: "物理",
  CHEMISTRY: "化学",
  BIOLOGY: "生物",
  HISTORY: "历史",
  GEOGRAPHY: "地理",
  POLITICS: "政治",
};

/** 年级中文名 */
export const GRADE_LABELS: Record<string, string> = {
  PRIMARY_1: "一年级",
  PRIMARY_2: "二年级",
  PRIMARY_3: "三年级",
  PRIMARY_4: "四年级",
  PRIMARY_5: "五年级",
  PRIMARY_6: "六年级",
  JUNIOR_1: "初一",
  JUNIOR_2: "初二",
  JUNIOR_3: "初三",
  SENIOR_1: "高一",
  SENIOR_2: "高二",
  SENIOR_3: "高三",
};

/** 难度中文名 */
export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "简单",
  MEDIUM: "中等",
  HARD: "困难",
  CHALLENGE: "挑战",
};

/** 掌握度中文名 */
export const MASTERY_LABELS: Record<string, string> = {
  NOT_MASTERED: "未掌握",
  PARTIAL: "部分掌握",
  MASTERED: "已掌握",
};

/** 掌握度颜色 */
export const MASTERY_COLORS: Record<string, string> = {
  NOT_MASTERED: "text-wrong",
  PARTIAL: "text-partial",
  MASTERED: "text-correct",
};

/** 格式化日期 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });
}

/** 格式化相对时间 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(d);
}
