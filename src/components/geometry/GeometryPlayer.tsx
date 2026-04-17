"use client";

import { useState, useCallback, useId } from "react";
import type { GeometrySolution } from "@/types/geometry";
import GeometryBoard from "./GeometryBoard";
import StepList from "./StepList";
import PlaybackControls from "./PlaybackControls";
import ExplanationPanel from "./ExplanationPanel";
import { useGeometryEngine } from "./hooks/useGeometryEngine";
import { useAutoplay } from "./hooks/useAutoplay";

interface GeometryPlayerProps {
  solution: GeometrySolution;
}

export default function GeometryPlayer({ solution }: GeometryPlayerProps) {
  const containerId = useId().replace(/:/g, "_") + "_geo";
  const [currentStep, setCurrentStep] = useState(-1); // -1 = only base
  const { initBoard, executeStep, reset } = useGeometryEngine(solution);

  const totalSteps = solution.steps.length;

  const goToStep = useCallback((idx: number) => {
    setCurrentStep(idx);
    executeStep(idx);
  }, [executeStep]);

  const handleBoardReady = useCallback((id: string) => {
    initBoard(id);
  }, [initBoard]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
    else if (currentStep === 0) {
      // Go back to base — reset board
      setCurrentStep(-1);
      reset(containerId);
    }
  }, [currentStep, goToStep, reset, containerId]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, goToStep]);

  const handleReset = useCallback(() => {
    autoplay.pause();
    setCurrentStep(-1);
    reset(containerId);
  }, [reset, containerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoplay = useAutoplay({
    totalSteps,
    currentStep,
    onStep: goToStep,
    onComplete: () => {},
  });

  const handleTogglePlay = useCallback(() => {
    if (!autoplay.isPlaying && currentStep >= totalSteps - 1) {
      // Replay from start
      setCurrentStep(-1);
      reset(containerId);
      setTimeout(() => {
        goToStep(0);
        autoplay.play();
      }, 100);
    } else if (!autoplay.isPlaying && currentStep === -1) {
      goToStep(0);
      autoplay.play();
    } else {
      autoplay.toggle();
    }
  }, [autoplay, currentStep, totalSteps, reset, containerId, goToStep]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-nebula-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-nebula-600">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold">几何解题动画</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-nebula-50 text-nebula-600 font-medium">
          {solution.type === "proof" ? "证明" : solution.type === "calculation" ? "计算" : "作图"}
        </span>
      </div>

      {/* Board */}
      <GeometryBoard containerId={containerId} onReady={handleBoardReady} />

      {/* Controls */}
      <PlaybackControls
        currentStep={Math.max(currentStep, 0)}
        totalSteps={totalSteps}
        isPlaying={autoplay.isPlaying}
        speed={autoplay.speed}
        progress={autoplay.progress}
        onPrev={handlePrev}
        onNext={handleNext}
        onReset={handleReset}
        onTogglePlay={handleTogglePlay}
        onSpeedChange={autoplay.setSpeed}
      />

      {/* Explanation */}
      <ExplanationPanel
        step={currentStep >= 0 ? solution.steps[currentStep] : null}
      />

      {/* Step List */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">解题步骤</p>
        <StepList
          steps={solution.steps}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
      </div>
    </div>
  );
}
