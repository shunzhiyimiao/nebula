"use client";

import { cn } from "@/lib/utils";
import type { PlaySpeed } from "./hooks/useAutoplay";

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: PlaySpeed;
  progress: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: PlaySpeed) => void;
}

const SPEED_OPTIONS: { value: PlaySpeed; label: string }[] = [
  { value: "slow", label: "慢" },
  { value: "medium", label: "中" },
  { value: "fast", label: "快" },
];

export default function PlaybackControls({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  progress,
  onPrev,
  onNext,
  onReset,
  onTogglePlay,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="space-y-2.5">
      {/* Progress bar */}
      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
        <span>{currentStep + 1} / {totalSteps}</span>
        <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-nebula-400 transition-all duration-100"
            style={{ width: `${((currentStep + (isPlaying ? progress : 0)) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Reset */}
        <button
          onClick={onReset}
          className="w-9 h-9 rounded-lg border border-[var(--color-border)] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="重置"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>

        {/* Prev */}
        <button
          onClick={onPrev}
          disabled={currentStep <= 0}
          className="w-9 h-9 rounded-lg border border-[var(--color-border)] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
          title="上一步"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={onTogglePlay}
          className={cn(
            "flex-1 h-9 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition-all",
            isPlaying
              ? "bg-amber-500 text-white"
              : "bg-nebula-gradient text-white shadow-sm"
          )}
        >
          {isPlaying ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              暂停
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {currentStep >= totalSteps - 1 ? "重播" : "播放"}
            </>
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
          className="w-9 h-9 rounded-lg border border-[var(--color-border)] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
          title="下一步"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Speed selector */}
        <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden bg-white">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSpeedChange(opt.value)}
              className={cn(
                "px-2 h-9 text-[11px] font-medium transition-colors",
                speed === opt.value
                  ? "bg-nebula-100 text-nebula-700"
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
