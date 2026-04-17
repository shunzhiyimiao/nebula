/** 几何解题动画系统 — 类型定义 */

/** LLM 解几何题时输出的完整结构 */
export interface GeometrySolution {
  problem: string;
  type: "proof" | "calculation" | "construction";

  /** 基础图形 — 只有锚点需要坐标，其余由约束推导 */
  base: {
    points: AnchorPoint[];
    segments: string[]; // 如 ["AB", "BC", "AC"]
  };

  /** 解题步骤 */
  steps: GeometryStep[];
}

export interface AnchorPoint {
  id: string; // 单字母，如 "A"
  x: number;
  y: number;
}

export interface GeometryStep {
  id: number;
  title: string;
  desc: string;
  explanation: string; // HTML 格式，支持 <span class='math'> 和 <span class='highlight'>
  actions: GeometryAction[];
}

/** 所有支持的几何动作类型 */
export type GeometryAction =
  | MidpointAction
  | PerpendicularFootAction
  | IntersectionAction
  | AngleBisectorAction
  | ParallelAction
  | SegmentAction
  | MarkEqualAction
  | FillPolygonAction
  | RightAngleAction
  | MarkAngleAction
  | EmphasizeAction
  | LabelAction;

// ---- 约束动作 ----

export interface MidpointAction {
  type: "midpoint";
  id: string;
  of: [string, string];
}

export interface PerpendicularFootAction {
  type: "perpendicular_foot";
  id: string;
  from: string;
  to_line: [string, string];
}

export interface IntersectionAction {
  type: "intersection";
  id: string;
  line1: [string, string];
  line2: [string, string];
}

export interface AngleBisectorAction {
  type: "angle_bisector";
  id: string;
  vertex: string;
  ray1: string;
  ray2: string;
}

export interface ParallelAction {
  type: "parallel";
  id: string;
  through: string;
  parallel_to: [string, string];
}

// ---- 绘制动作 ----

export interface SegmentAction {
  type: "segment";
  from: string;
  to: string;
  style?: "solid" | "auxiliary" | "dashed";
  animate?: boolean;
}

// ---- 标注动作 ----

export interface MarkEqualAction {
  type: "mark_equal";
  edges: string[];
}

export interface FillPolygonAction {
  type: "fill_polygon";
  points: string[];
  color: string;
  borderColor?: string;
}

export interface RightAngleAction {
  type: "right_angle";
  vertex: string;
  on_rays: [string, string];
}

export interface MarkAngleAction {
  type: "mark_angle";
  vertex: string;
  ray1: string;
  ray2: string;
  label?: string;
}

export interface EmphasizeAction {
  type: "emphasize";
  edge: string;
}

export interface LabelAction {
  type: "label";
  text: string;
  at: string; // 点 ID 或 "centroid_ABC" 格式
  color?: string;
}
