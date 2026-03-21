"use client";

import { useMemo } from "react";

interface RadarChartProps {
  data: { label: string; value: number; maxValue?: number }[];
  size?: number;
  className?: string;
}

/**
 * SVG 雷达图 — 展示各学科/知识点掌握度
 */
export default function RadarChart({ data, size = 240, className }: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const levels = 4;

  const points = useMemo(() => {
    const count = data.length;
    return data.map((d, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const max = d.maxValue || 100;
      const r = (d.value / max) * radius;
      return {
        ...d,
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 24) * Math.cos(angle),
        labelY: center + (radius + 24) * Math.sin(angle),
        axisX: center + radius * Math.cos(angle),
        axisY: center + radius * Math.sin(angle),
        angle,
      };
    });
  }, [data, center, radius]);

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} className={className} viewBox={`0 0 ${size} ${size}`}>
      {/* Background grid */}
      {Array.from({ length: levels }, (_, i) => {
        const r = (radius * (i + 1)) / levels;
        const gridPoints = data
          .map((_, j) => {
            const angle = (Math.PI * 2 * j) / data.length - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          })
          .join(" ");
        return (
          <polygon
            key={i}
            points={gridPoints}
            fill="none"
            stroke="var(--color-border-light)"
            strokeWidth="1"
            opacity={0.8}
          />
        );
      })}

      {/* Axis lines */}
      {points.map((p, i) => (
        <line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={p.axisX}
          y2={p.axisY}
          stroke="var(--color-border-light)"
          strokeWidth="1"
        />
      ))}

      {/* Data polygon - fill */}
      <polygon
        points={polygonPoints}
        fill="rgba(76, 110, 245, 0.15)"
        stroke="rgba(76, 110, 245, 0.6)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="white"
          stroke="#4c6ef5"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {points.map((p, i) => {
        const isTop = p.angle < -Math.PI / 4 && p.angle > (-3 * Math.PI) / 4;
        const isBottom = p.angle > Math.PI / 4 && p.angle < (3 * Math.PI) / 4;
        const isLeft = Math.abs(p.angle) > Math.PI / 2;

        return (
          <g key={`label-${i}`}>
            <text
              x={p.labelX}
              y={p.labelY - 6}
              textAnchor={isLeft ? "end" : Math.abs(Math.cos(p.angle)) < 0.3 ? "middle" : "start"}
              dominantBaseline={isTop ? "auto" : isBottom ? "hanging" : "middle"}
              fontSize="11"
              fontWeight="600"
              fill="var(--color-text-primary)"
            >
              {p.label}
            </text>
            <text
              x={p.labelX}
              y={p.labelY + 8}
              textAnchor={isLeft ? "end" : Math.abs(Math.cos(p.angle)) < 0.3 ? "middle" : "start"}
              dominantBaseline={isTop ? "auto" : isBottom ? "hanging" : "middle"}
              fontSize="10"
              fontWeight="500"
              fill={p.value >= 70 ? "var(--color-correct)" : p.value >= 40 ? "var(--color-partial)" : "var(--color-wrong)"}
            >
              {p.value}%
            </text>
          </g>
        );
      })}

      {/* Center value labels */}
      {Array.from({ length: levels }, (_, i) => {
        const val = Math.round((100 * (i + 1)) / levels);
        const r = (radius * (i + 1)) / levels;
        return (
          <text
            key={`val-${i}`}
            x={center + 4}
            y={center - r - 2}
            fontSize="8"
            fill="var(--color-text-tertiary)"
            opacity={0.6}
          >
            {val}
          </text>
        );
      })}
    </svg>
  );
}
