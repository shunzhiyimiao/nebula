# Nebula 几何解题动画系统 — 技术设计文档

> 本文件供 Claude Code 在 VSCode 中使用，放置于项目根目录或 `.claude/` 目录下。
> 可作为 CLAUDE.md 的一部分，或作为独立的 prompt 文件引用。

---

## 一、功能概述

为 Nebula（星云）学习平台新增**几何解题动画**功能。学生拍照上传几何题后，LLM 解题的同时输出结构化几何指令，前端使用 JSXGraph 引擎渲染逐步动画，支持辅助线绘制、等量标记、全等高亮、直角标注等可视化效果。

核心架构：**LLM → 结构化 JSON（约束驱动） → JSXGraph 渲染 → 逐步/自动动画**

---

## 二、核心设计原则

### 约束驱动，而非坐标驱动

LLM **不输出精确坐标**，只描述几何关系。坐标计算由 JSXGraph 引擎完成。

```
❌ 坐标驱动: { "type": "add_point", "id": "D", "x": 4, "y": 0 }
✅ 约束驱动: { "type": "midpoint", "id": "D", "of": ["B", "C"] }
```

好处：
- LLM 不需要做数值计算，只需理解几何关系
- 图形自动适配不同比例和布局
- Prompt 更简洁，输出更稳定

### 渲染引擎选型：JSXGraph

- 体积小（~300KB），纯 JS，无外部依赖
- MIT 协议，可商用
- 原生支持中点、垂足、交点、角平分线等几何约束
- 动态创建/删除元素，适合逐步演示
- 比 GeoGebra（5MB+、协议受限）更适合嵌入式场景

---

## 三、LLM 输出 Schema

### TypeScript 类型定义

```typescript
/** LLM 解几何题时输出的完整结构 */
interface GeometrySolution {
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

interface AnchorPoint {
  id: string;   // 单字母，如 "A"
  x: number;    // 锚点坐标（仅基础顶点需要）
  y: number;
}

interface GeometryStep {
  id: number;
  title: string;       // 步骤标题，如 "作辅助线 AD"
  desc: string;        // 简短描述
  explanation: string;  // HTML 格式解析文本，支持 <span class='math'> 和 <span class='highlight'>
  actions: GeometryAction[];
}

/** 所有支持的几何动作类型 */
type GeometryAction =
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

// ---- 约束动作（引擎自动计算位置） ----

interface MidpointAction {
  type: "midpoint";
  id: string;           // 新点 ID
  of: [string, string]; // 哪两个点的中点
}

interface PerpendicularFootAction {
  type: "perpendicular_foot";
  id: string;               // 垂足点 ID
  from: string;             // 从哪个点作垂线
  to_line: [string, string]; // 垂线落在哪条线上
}

interface IntersectionAction {
  type: "intersection";
  id: string;
  line1: [string, string];
  line2: [string, string];
}

interface AngleBisectorAction {
  type: "angle_bisector";
  id: string;           // 角平分线与对边的交点 ID
  vertex: string;       // 角的顶点
  ray1: string;         // 角的一边端点
  ray2: string;         // 角的另一边端点
}

interface ParallelAction {
  type: "parallel";
  id: string;           // 新线段端点 ID
  through: string;      // 过哪个点
  parallel_to: [string, string]; // 平行于哪条线
}

// ---- 绘制动作 ----

interface SegmentAction {
  type: "segment";
  from: string;
  to: string;
  style?: "solid" | "auxiliary" | "dashed";
  animate?: boolean;    // 是否有画线动画
}

// ---- 标注动作 ----

interface MarkEqualAction {
  type: "mark_equal";
  edges: string[];      // 如 ["AB", "AC"]，每个是两字母拼接的边
}

interface FillPolygonAction {
  type: "fill_polygon";
  points: string[];
  color: string;         // rgba 格式
  borderColor?: string;
}

interface RightAngleAction {
  type: "right_angle";
  vertex: string;
  on_rays: [string, string];
}

interface MarkAngleAction {
  type: "mark_angle";
  vertex: string;
  ray1: string;
  ray2: string;
  label?: string;       // 如 "α" 或 "60°"
}

interface EmphasizeAction {
  type: "emphasize";
  edge: string;         // 如 "AD"
}

interface LabelAction {
  type: "label";
  text: string;
  at: string;           // 点 ID 或 "centroid_ABC" 格式
  color?: string;
}
```

---

## 四、LLM Prompt 模板

在 Nebula 解题 API 的 system prompt 中加入以下内容：

```
你是一个几何解题助手。对于几何题目，你需要输出结构化的 JSON 解题方案。

## 输出格式要求

返回一个 JSON 对象，结构如下：
- problem: 题目文本
- type: "proof" | "calculation" | "construction"
- base: 基础图形定义
  - points: 锚点数组，每个包含 id/x/y（只有初始顶点需要坐标）
  - segments: 初始线段数组，如 ["AB", "BC", "AC"]
- steps: 解题步骤数组

## 关键原则

1. **约束驱动**：新增的点用几何约束定义（midpoint/perpendicular_foot/intersection/angle_bisector），不要手算坐标
2. **逐步拆分**：每步只做一个关键操作，步骤数通常 4-6 步
3. **先标记已知，再作辅助线，最后推导结论**
4. **explanation 字段**用 HTML：数学表达式用 <span class='math'>，重点结论用 <span class='highlight'>

## 支持的 action 类型

约束类型（自动计算位置）：
- midpoint: 取中点 { type: "midpoint", id: "D", of: ["B", "C"] }
- perpendicular_foot: 作垂足 { type: "perpendicular_foot", id: "H", from: "A", to_line: ["B", "C"] }
- intersection: 求交点 { type: "intersection", id: "O", line1: ["A", "D"], line2: ["B", "E"] }
- angle_bisector: 角平分线 { type: "angle_bisector", id: "I", vertex: "A", ray1: "B", ray2: "C" }

绘制类型：
- segment: 画线段 { type: "segment", from: "A", to: "D", style: "auxiliary", animate: true }

标注类型：
- mark_equal: 标记等边 { type: "mark_equal", edges: ["AB", "AC"] }
- fill_polygon: 高亮区域 { type: "fill_polygon", points: ["A","B","D"], color: "rgba(67,97,238,0.06)" }
- right_angle: 标直角 { type: "right_angle", vertex: "D", on_rays: ["A", "B"] }
- mark_angle: 标角 { type: "mark_angle", vertex: "B", ray1: "A", ray2: "C", label: "α" }
- emphasize: 强调线段 { type: "emphasize", edge: "AD" }
- label: 添加文本 { type: "label", text: "≅", at: "centroid_ACD" }

## 示例

题目：在 △ABC 中，AB = AC，D 是 BC 的中点。求证：AD ⊥ BC。

```json
{
  "problem": "在 △ABC 中，AB = AC，D 是 BC 的中点。求证：AD ⊥ BC。",
  "type": "proof",
  "base": {
    "points": [
      { "id": "A", "x": 4, "y": 8 },
      { "id": "B", "x": 0, "y": 0 },
      { "id": "C", "x": 8, "y": 0 }
    ],
    "segments": ["AB", "BC", "AC"]
  },
  "steps": [
    {
      "id": 1,
      "title": "标记已知条件",
      "desc": "AB = AC（等腰三角形）",
      "explanation": "题目告诉我们 <span class='math'>AB = AC</span>，因此 △ABC 是<span class='highlight'>等腰三角形</span>。",
      "actions": [
        { "type": "mark_equal", "edges": ["AB", "AC"] }
      ]
    },
    {
      "id": 2,
      "title": "取 BC 中点 D",
      "desc": "D 是 BC 的中点 → midpoint 约束",
      "explanation": "用<span class='highlight'>中点约束</span>定义 D：<span class='math'>midpoint(B, C)</span>。",
      "actions": [
        { "type": "midpoint", "id": "D", "of": ["B", "C"] },
        { "type": "mark_equal", "edges": ["BD", "DC"] }
      ]
    },
    {
      "id": 3,
      "title": "作辅助线 AD",
      "desc": "连接 A 与中点 D",
      "explanation": "连接 A 和 D，这条辅助线是 △ABC 的<span class='highlight'>中线</span>。",
      "actions": [
        { "type": "segment", "from": "A", "to": "D", "style": "auxiliary", "animate": true }
      ]
    },
    {
      "id": 4,
      "title": "SSS 证明全等",
      "desc": "AB=AC, BD=DC, AD=AD → △ABD ≅ △ACD",
      "explanation": "由 SSS：<span class='math'>AB=AC</span>，<span class='math'>BD=DC</span>，<span class='math'>AD=AD</span>（公共边）→ <span class='math'>△ABD ≅ △ACD</span>。",
      "actions": [
        { "type": "fill_polygon", "points": ["A","B","D"], "color": "rgba(67,97,238,0.06)", "borderColor": "rgba(67,97,238,0.2)" },
        { "type": "fill_polygon", "points": ["A","C","D"], "color": "rgba(16,185,129,0.06)", "borderColor": "rgba(16,185,129,0.2)" },
        { "type": "label", "text": "≅", "at": "centroid_ACD" }
      ]
    },
    {
      "id": 5,
      "title": "结论：AD ⊥ BC",
      "desc": "∠ADB = ∠ADC = 90°",
      "explanation": "全等 → <span class='math'>∠ADB = ∠ADC</span>，又是邻补角 → <span class='math'>= 90°</span>。<br>✅ <span class='highlight'>AD ⊥ BC</span>",
      "actions": [
        { "type": "right_angle", "vertex": "D", "on_rays": ["A", "B"] },
        { "type": "emphasize", "edge": "AD" }
      ]
    }
  ]
}
```

只输出 JSON，不要输出其他文本。
```

---

## 五、前端实现指南

### 技术栈

- **渲染引擎**: JSXGraph 1.8+（CDN 或 npm `jsxgraph`）
- **框架集成**: React 组件 `<GeometryPlayer>`
- **动画**: 逐步执行 + 自动播放（可暂停、调速）

### 组件架构

```
<GeometryPlayer>
├── <GeometryBoard>        // JSXGraph 画布
│   └── useJSXGraph()      // 初始化 & 元素管理 hook
├── <StepList>              // 步骤列表（可点击跳转）
├── <PlaybackControls>      // 上一步/下一步/重置/自动播放
│   └── <SpeedSelector>     // 速度选择（慢/中/快）
└── <ExplanationPanel>      // 当前步骤解析
```

### 核心 Hook: `useGeometryEngine`

```typescript
function useGeometryEngine(solution: GeometrySolution) {
  const boardRef = useRef<JXG.Board>();
  const elementsRef = useRef<Record<string, JXG.GeometryElement>>({});
  const stepElementsRef = useRef<JXG.GeometryElement[][]>([]);
  
  // 约束动作 → JSXGraph API 映射
  const actionMap: Record<string, (action: any) => JXG.GeometryElement[]> = {
    midpoint: (a) => {
      const pt = board.create('midpoint', [E[a.of[0]], E[a.of[1]]], opts);
      E[a.id] = pt;
      return [pt];
    },
    perpendicular_foot: (a) => {
      const line = board.create('line', [E[a.to_line[0]], E[a.to_line[1]]], {visible:false});
      const foot = board.create('perpendicularpoint', [E[a.from], line], opts);
      E[a.id] = foot;
      return [line, foot];
    },
    intersection: (a) => {
      const l1 = board.create('line', [E[a.line1[0]], E[a.line1[1]]], {visible:false});
      const l2 = board.create('line', [E[a.line2[0]], E[a.line2[1]]], {visible:false});
      const pt = board.create('intersection', [l1, l2], opts);
      E[a.id] = pt;
      return [l1, l2, pt];
    },
    // ... 其余类型同理
  };
  
  const executeStep = (stepIdx: number) => { ... };
  const undoStep = (stepIdx: number) => { ... };
  const reset = () => { ... };
  
  return { executeStep, undoStep, reset, currentElements: elementsRef };
}
```

### 自动播放 Hook: `useAutoplay`

```typescript
function useAutoplay(options: {
  totalSteps: number;
  onStep: (idx: number) => void;
  onComplete: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<'slow'|'medium'|'fast'>('medium');
  const [progress, setProgress] = useState(0); // 0-1 当前步倒计时进度
  
  const speedMap = { slow: 3000, medium: 1800, fast: 900 };
  
  const play = () => { ... };
  const pause = () => { ... };
  const toggle = () => isPlaying ? pause() : play();
  
  return { isPlaying, speed, setSpeed, progress, toggle };
}
```

### JSXGraph 约束 API 速查

| 约束类型 | JSXGraph API | 说明 |
|---------|-------------|------|
| 中点 | `board.create('midpoint', [p1, p2])` | 两点中点 |
| 垂足 | `board.create('perpendicularpoint', [pt, line])` | 点到线的垂足 |
| 交点 | `board.create('intersection', [line1, line2])` | 两线交点 |
| 垂线 | `board.create('perpendicular', [line, pt])` | 过点作垂线 |
| 平行线 | `board.create('parallel', [line, pt])` | 过点作平行线 |
| 角平分线 | `board.create('bisector', [p1, vertex, p2])` | 角平分线 |
| 圆 | `board.create('circle', [center, radius])` | 圆 |
| 弧上角 | `board.create('angle', [p1, vertex, p2])` | 标注角 |

---

## 六、集成到 Nebula 解题流程

```
用户拍照 → OCR + 预处理 → 识别为几何题
  ↓
LLM 解题（system prompt 含上述模板）
  ↓
返回 GeometrySolution JSON
  ↓
前端 <GeometryPlayer> 渲染
  ├─ 逐步手动模式（默认）
  └─ 自动演示模式（点击播放）
  ↓
如果 JSON 解析失败 → fallback 到纯文字解题
```

### 判断是否为几何题

在 OCR 结果后加一次分类调用，或在主解题 prompt 中让 LLM 自行判断：
- 如果是几何题 → 输出 GeometrySolution JSON
- 如果不是 → 输出普通文字解答

### 错误处理

1. **JSON 解析失败**: fallback 纯文字
2. **未知 action type**: 跳过该 action，继续渲染
3. **引用不存在的点 ID**: 跳过并在控制台 warn
4. **base 坐标不合理**: 前端做 boundingbox 自适应

---

## 七、覆盖的题型范围

本方案覆盖初中几何核心题型：

| 题型 | 常用约束 |
|------|---------|
| 等腰三角形证明 | midpoint, mark_equal, right_angle |
| 全等三角形 | fill_polygon, mark_equal, label |
| 相似三角形 | mark_angle, fill_polygon, label |
| 平行四边形性质 | parallel, midpoint, mark_equal |
| 圆的相关 | circle, intersection, mark_angle |
| 辅助线作法 | perpendicular_foot, angle_bisector, segment |

---

## 八、文件结构建议

```
src/
├── components/
│   └── geometry/
│       ├── GeometryPlayer.tsx        // 主组件
│       ├── GeometryBoard.tsx         // JSXGraph 画布
│       ├── StepList.tsx              // 步骤列表
│       ├── PlaybackControls.tsx      // 播放控制（含自动播放）
│       ├── ExplanationPanel.tsx      // 解析面板
│       └── hooks/
│           ├── useGeometryEngine.ts  // 渲染引擎 hook
│           └── useAutoplay.ts        // 自动播放 hook
├── types/
│   └── geometry.ts                   // TypeScript 类型定义
├── lib/
│   └── geometry-prompt.ts            // LLM prompt 模板
└── app/
    └── solve/
        └── page.tsx                  // 解题页面（集成 GeometryPlayer）
```
