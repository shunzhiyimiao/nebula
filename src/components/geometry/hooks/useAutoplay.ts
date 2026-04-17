"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type PlaySpeed = "slow" | "medium" | "fast";

const SPEED_MAP: Record<PlaySpeed, number> = {
  slow: 3000,
  medium: 1800,
  fast: 900,
};

interface UseAutoplayOptions {
  totalSteps: number;
  currentStep: number;
  onStep: (idx: number) => void;
  onComplete: () => void;
}

export function useAutoplay({ totalSteps, currentStep, onStep, onComplete }: UseAutoplayOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaySpeed>("medium");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(currentStep);

  stepRef.current = currentStep;

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
  }, []);

  const pause = useCallback(() => {
    clearTimers();
    setIsPlaying(false);
    setProgress(0);
  }, [clearTimers]);

  const play = useCallback(() => {
    clearTimers();
    setIsPlaying(true);

    const interval = SPEED_MAP[speed];
    const progressInterval = 50;

    // Progress bar animation
    let elapsed = 0;
    progressTimerRef.current = setInterval(() => {
      elapsed += progressInterval;
      setProgress(Math.min(elapsed / interval, 1));
    }, progressInterval);

    // Step advancement
    timerRef.current = setInterval(() => {
      const next = stepRef.current + 1;
      if (next >= totalSteps) {
        pause();
        onComplete();
      } else {
        onStep(next);
        // Reset progress
        elapsed = 0;
        setProgress(0);
      }
    }, interval);
  }, [speed, totalSteps, onStep, onComplete, pause, clearTimers]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers]);

  // Restart play when speed changes during playback
  useEffect(() => {
    if (isPlaying) {
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  return { isPlaying, speed, setSpeed, progress, play, pause, toggle };
}
