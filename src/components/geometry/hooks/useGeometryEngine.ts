"use client";

import { useRef, useCallback } from "react";
import type { GeometrySolution, GeometryAction } from "@/types/geometry";

// JSXGraph types (minimal subset)
interface JXGBoard {
  create: (type: string, parents: unknown[], attrs?: Record<string, unknown>) => JXGElement;
  removeObject: (el: JXGElement) => void;
  setBoundingBox: (box: [number, number, number, number], keepRatio?: boolean) => void;
  update: () => void;
  suspendUpdate: () => void;
  unsuspendUpdate: () => void;
}

interface JXGElement {
  id: string;
  setAttribute: (attrs: Record<string, unknown>) => void;
  X?: () => number;
  Y?: () => number;
}

declare const JXG: {
  JSXGraph: {
    initBoard: (id: string, opts: Record<string, unknown>) => JXGBoard;
    freeBoard: (board: JXGBoard) => void;
  };
};

const POINT_STYLE = {
  size: 3,
  color: "#4361ee",
  name: "",
  label: { fontSize: 14, offset: [8, 8], cssClass: "geo-label", highlightCssClass: "geo-label" },
  fixed: true,
};

const SEGMENT_STYLE = {
  strokeColor: "#334155",
  strokeWidth: 2,
  fixed: true,
  highlight: false,
};

const AUX_STYLE = {
  ...SEGMENT_STYLE,
  strokeColor: "#4361ee",
  dash: 2,
};

const EMPHASIS_STYLE = {
  strokeColor: "#ef4444",
  strokeWidth: 3,
};

export function useGeometryEngine(solution: GeometrySolution | null) {
  const boardRef = useRef<JXGBoard | null>(null);
  const elementsRef = useRef<Record<string, JXGElement>>({});
  const stepElementsRef = useRef<JXGElement[][]>([]);
  const executedStepsRef = useRef<number>(0);

  /** 初始化画布并绘制基础图形 */
  const initBoard = useCallback((containerId: string) => {
    if (!solution) return;

    // 清理旧画布
    if (boardRef.current) {
      try { JXG.JSXGraph.freeBoard(boardRef.current); } catch {}
    }
    elementsRef.current = {};
    stepElementsRef.current = [];
    executedStepsRef.current = 0;

    // 计算 bounding box
    const xs = solution.base.points.map((p) => p.x);
    const ys = solution.base.points.map((p) => p.y);
    const pad = 2;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;

    const board = JXG.JSXGraph.initBoard(containerId, {
      boundingbox: [minX, maxY, maxX, minY],
      axis: false,
      grid: false,
      showNavigation: false,
      showCopyright: false,
      pan: { enabled: false },
      zoom: { enabled: false },
      keepaspectratio: true,
    });
    boardRef.current = board;
    const E = elementsRef.current;

    // 绘制锚点
    for (const pt of solution.base.points) {
      E[pt.id] = board.create("point", [pt.x, pt.y], {
        ...POINT_STYLE,
        name: pt.id,
      });
    }

    // 绘制基础线段
    for (const seg of solution.base.segments) {
      const [a, b] = seg.split("");
      if (E[a] && E[b]) {
        board.create("segment", [E[a], E[b]], SEGMENT_STYLE);
      }
    }
  }, [solution]);

  /** 获取点的坐标（用于 centroid 等计算） */
  const getPointCoords = useCallback((id: string): [number, number] | null => {
    const E = elementsRef.current;
    const pt = E[id];
    if (pt?.X && pt?.Y) return [pt.X(), pt.Y()];
    return null;
  }, []);

  /** 解析 centroid_ABC 格式 */
  const parseCentroid = useCallback((at: string): [number, number] | null => {
    const match = at.match(/^centroid_(\w+)$/);
    if (!match) return null;
    const ids = match[1].split("");
    const coords = ids.map((id) => getPointCoords(id)).filter(Boolean) as [number, number][];
    if (coords.length < 2) return null;
    const cx = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const cy = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [cx, cy];
  }, [getPointCoords]);

  /** 执行单个 action */
  const executeAction = useCallback((action: GeometryAction): JXGElement[] => {
    const board = boardRef.current;
    if (!board) return [];
    const E = elementsRef.current;
    const created: JXGElement[] = [];

    switch (action.type) {
      case "midpoint": {
        const [p1, p2] = action.of;
        if (!E[p1] || !E[p2]) break;
        const pt = board.create("midpoint", [E[p1], E[p2]], {
          ...POINT_STYLE,
          name: action.id,
        });
        E[action.id] = pt;
        created.push(pt);
        break;
      }

      case "perpendicular_foot": {
        if (!E[action.from] || !E[action.to_line[0]] || !E[action.to_line[1]]) break;
        const line = board.create("line", [E[action.to_line[0]], E[action.to_line[1]]], {
          visible: false, straightFirst: false, straightLast: false,
        });
        const foot = board.create("perpendicularpoint", [E[action.from], line], {
          ...POINT_STYLE,
          name: action.id,
        });
        E[action.id] = foot;
        created.push(line, foot);
        break;
      }

      case "intersection": {
        if (!E[action.line1[0]] || !E[action.line1[1]] || !E[action.line2[0]] || !E[action.line2[1]]) break;
        const l1 = board.create("line", [E[action.line1[0]], E[action.line1[1]]], {
          visible: false,
        });
        const l2 = board.create("line", [E[action.line2[0]], E[action.line2[1]]], {
          visible: false,
        });
        const pt = board.create("intersection", [l1, l2, 0], {
          ...POINT_STYLE,
          name: action.id,
        });
        E[action.id] = pt;
        created.push(l1, l2, pt);
        break;
      }

      case "angle_bisector": {
        if (!E[action.ray1] || !E[action.vertex] || !E[action.ray2]) break;
        const bisector = board.create("bisector", [E[action.ray1], E[action.vertex], E[action.ray2]], {
          visible: false,
        });
        // Find intersection with opposite side
        const oppLine = board.create("line", [E[action.ray1], E[action.ray2]], {
          visible: false,
        });
        const pt = board.create("intersection", [bisector, oppLine, 0], {
          ...POINT_STYLE,
          name: action.id,
        });
        E[action.id] = pt;
        created.push(bisector, oppLine, pt);
        break;
      }

      case "parallel": {
        if (!E[action.through] || !E[action.parallel_to[0]] || !E[action.parallel_to[1]]) break;
        const refLine = board.create("line", [E[action.parallel_to[0]], E[action.parallel_to[1]]], {
          visible: false,
        });
        const parLine = board.create("parallel", [refLine, E[action.through]], {
          ...AUX_STYLE,
        });
        E[action.id] = parLine;
        created.push(refLine, parLine);
        break;
      }

      case "segment": {
        if (!E[action.from] || !E[action.to]) break;
        const style = action.style === "auxiliary" || action.style === "dashed" ? AUX_STYLE : SEGMENT_STYLE;
        const seg = board.create("segment", [E[action.from], E[action.to]], {
          ...style,
          ...(action.style === "dashed" ? { dash: 3 } : {}),
        });
        created.push(seg);
        break;
      }

      case "mark_equal": {
        for (let i = 0; i < action.edges.length; i++) {
          const edge = action.edges[i];
          const [a, b] = edge.split("");
          if (!E[a] || !E[b]) continue;
          const ticks = board.create("ticks", [
            board.create("segment", [E[a], E[b]], { visible: false }),
          ], {
            drawLabels: false,
            drawZero: false,
            ticksDistance: 0.5,
            majorHeight: 8,
            minorTicks: 0,
            strokeColor: "#4361ee",
            insertTicks: false,
            ticksNumber: i + 1,
          });
          created.push(ticks);
        }
        break;
      }

      case "fill_polygon": {
        const pts = action.points.map((id) => E[id]).filter(Boolean);
        if (pts.length < 3) break;
        const poly = board.create("polygon", pts, {
          fillColor: action.color,
          borders: {
            strokeColor: action.borderColor || "transparent",
            strokeWidth: 1,
          },
          fillOpacity: 1,
          highlight: false,
          hasInnerPoints: false,
          vertices: { visible: false },
        });
        created.push(poly);
        break;
      }

      case "right_angle": {
        if (!E[action.vertex] || !E[action.on_rays[0]] || !E[action.on_rays[1]]) break;
        const angle = board.create("angle", [E[action.on_rays[0]], E[action.vertex], E[action.on_rays[1]]], {
          type: "square",
          orthoType: "square",
          radius: 0.4,
          fillColor: "transparent",
          strokeColor: "#4361ee",
          strokeWidth: 1.5,
          name: "",
        });
        created.push(angle);
        break;
      }

      case "mark_angle": {
        if (!E[action.ray1] || !E[action.vertex] || !E[action.ray2]) break;
        const angle = board.create("angle", [E[action.ray1], E[action.vertex], E[action.ray2]], {
          radius: 0.6,
          fillColor: "rgba(67,97,238,0.08)",
          strokeColor: "#4361ee",
          strokeWidth: 1.5,
          name: action.label || "",
          label: { fontSize: 12, color: "#4361ee" },
        });
        created.push(angle);
        break;
      }

      case "emphasize": {
        const [a, b] = action.edge.split("");
        if (!E[a] || !E[b]) break;
        const seg = board.create("segment", [E[a], E[b]], EMPHASIS_STYLE);
        created.push(seg);
        break;
      }

      case "label": {
        let coords: [number, number] | null = null;
        if (action.at.startsWith("centroid_")) {
          coords = parseCentroid(action.at);
        } else {
          coords = getPointCoords(action.at);
        }
        if (!coords) break;
        const txt = board.create("text", [coords[0], coords[1], action.text], {
          fontSize: 14,
          color: action.color || "#4361ee",
          anchorX: "middle",
          anchorY: "middle",
          fixed: true,
        });
        created.push(txt);
        break;
      }
    }

    return created;
  }, [getPointCoords, parseCentroid]);

  /** 执行到指定步骤（包含） */
  const executeStep = useCallback((stepIdx: number) => {
    if (!solution || !boardRef.current) return;

    const board = boardRef.current;
    board.suspendUpdate();

    // 撤销超出的步骤
    while (executedStepsRef.current > stepIdx + 1) {
      executedStepsRef.current--;
      const elements = stepElementsRef.current.pop();
      if (elements) {
        for (const el of elements) {
          try { board.removeObject(el); } catch {}
        }
      }
    }

    // 执行缺少的步骤
    while (executedStepsRef.current <= stepIdx) {
      const step = solution.steps[executedStepsRef.current];
      if (!step) break;
      const stepElements: JXGElement[] = [];
      for (const action of step.actions) {
        try {
          const created = executeAction(action);
          stepElements.push(...created);
        } catch (e) {
          console.warn(`Geometry action failed:`, action, e);
        }
      }
      stepElementsRef.current.push(stepElements);
      executedStepsRef.current++;
    }

    board.unsuspendUpdate();
  }, [solution, executeAction]);

  /** 重置到初始状态 */
  const reset = useCallback((containerId: string) => {
    initBoard(containerId);
  }, [initBoard]);

  return { initBoard, executeStep, reset, boardRef };
}
