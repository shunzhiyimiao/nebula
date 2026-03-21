"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  /** Map of date string "YYYY-MM-DD" -> activity count */
  data: Record<string, number>;
  /** Number of weeks to show */
  weeks?: number;
  className?: string;
}

const WEEKDAYS = ["一", "", "三", "", "五", "", "日"];

function getIntensity(count: number): string {
  if (count === 0) return "bg-gray-100";
  if (count <= 2) return "bg-emerald-200";
  if (count <= 5) return "bg-emerald-400";
  if (count <= 10) return "bg-emerald-500";
  return "bg-emerald-600";
}

export default function ActivityHeatmap({ data, weeks = 16, className }: ActivityHeatmapProps) {
  const cells = useMemo(() => {
    const result: { date: string; count: number; weekIndex: number; dayIndex: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 找到起始日（weeks周前的周一）
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
    // 调整到周一
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    let weekIndex = 0;
    const current = new Date(startDate);

    while (current <= today) {
      const dayIndex = current.getDay() === 0 ? 6 : current.getDay() - 1; // 周一=0
      const key = current.toISOString().slice(0, 10);
      result.push({
        date: key,
        count: data[key] || 0,
        weekIndex,
        dayIndex,
      });

      current.setDate(current.getDate() + 1);
      if (current.getDay() === 1) weekIndex++; // 新的一周
    }

    return result;
  }, [data, weeks]);

  const totalWeeks = Math.max(...cells.map((c) => c.weekIndex)) + 1;

  // 月份标签
  const monthLabels = useMemo(() => {
    const labels: { text: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    for (const cell of cells) {
      if (cell.dayIndex !== 0) continue;
      const month = new Date(cell.date).getMonth();
      if (month !== lastMonth) {
        labels.push({
          text: `${month + 1}月`,
          weekIndex: cell.weekIndex,
        });
        lastMonth = month;
      }
    }
    return labels;
  }, [cells]);

  const totalDays = Object.values(data).filter((v) => v > 0).length;
  const totalActivities = Object.values(data).reduce((sum, v) => sum + v, 0);

  return (
    <div className={className}>
      {/* Month labels */}
      <div className="flex ml-7 mb-1" style={{ gap: "0px" }}>
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[9px] text-[var(--color-text-tertiary)]"
            style={{
              position: "relative",
              left: `${m.weekIndex * 14}px`,
              ...(i > 0 ? { marginLeft: `-${monthLabels[i - 1].weekIndex * 14}px` } : {}),
            }}
          >
            {m.text}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Weekday labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {WEEKDAYS.map((day, i) => (
            <div key={i} className="w-5 h-[12px] flex items-center justify-end pr-0.5">
              <span className="text-[8px] text-[var(--color-text-tertiary)]">{day}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5 overflow-hidden">
          {Array.from({ length: totalWeeks }, (_, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }, (_, di) => {
                const cell = cells.find((c) => c.weekIndex === wi && c.dayIndex === di);
                if (!cell) return <div key={di} className="w-[12px] h-[12px]" />;

                return (
                  <div
                    key={di}
                    className={cn(
                      "w-[12px] h-[12px] rounded-sm transition-colors",
                      getIntensity(cell.count)
                    )}
                    title={`${cell.date}: ${cell.count}题`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] text-[var(--color-text-tertiary)]">
          {totalDays}天活跃 · {totalActivities}道题
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-[var(--color-text-tertiary)]">少</span>
          <div className="w-[10px] h-[10px] rounded-sm bg-gray-100" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-200" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-400" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-500" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-600" />
          <span className="text-[8px] text-[var(--color-text-tertiary)]">多</span>
        </div>
      </div>
    </div>
  );
}
