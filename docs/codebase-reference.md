# Nebula 代码库完整参考文档

> 生成时间：2026-03-22
> 项目：Nebula AI 智能学习平台

---

## 项目概述

Nebula 是面向中学生的 AI 驱动学习平台，核心功能包括拍照解题、知识卡片、错题本、智能练习。技术栈：Next.js 14 + React + TypeScript + Tailwind CSS + Capacitor（Android）。

---

## 一、类型定义

### `/src/types/question.ts`

| 类型名 | 说明 |
|--------|------|
| `Subject` | 学科联合类型：MATH / CHINESE / ENGLISH / PHYSICS / CHEMISTRY / BIOLOGY / HISTORY / GEOGRAPHY / POLITICS |
| `Grade` | 年级：PRIMARY_1~6（小学）/ JUNIOR_1~3（初中）/ SENIOR_1~3（高中）|
| `QuestionType` | 题型：CHOICE / MULTI_CHOICE / FILL_BLANK / SHORT_ANSWER / CALCULATION / PROOF / APPLICATION / TRUE_FALSE / OTHER |
| `ErrorType` | 错误类型：CONCEPT_CONFUSION / FORMULA_ERROR / CALCULATION_MISTAKE / LOGIC_ERROR / MISSING_CONDITION / METHOD_WRONG / CARELESS / NOT_UNDERSTOOD / OTHER |
| `Difficulty` | 难度：EASY / MEDIUM / HARD / CHALLENGE |
| `MasteryLevel` | 掌握度：NOT_MASTERED / PARTIAL / MASTERED |

**接口：**

`SolutionStep` — 解题步骤
- `order: number` 步骤序号
- `title: string` 步骤标题
- `content: string` 步骤说明
- `latex?: string` LaTeX 公式

`AISolution` — AI 解题结果
- `solution: string` 完整解题文本
- `steps: SolutionStep[]` 分步骤内容
- `knowledgePoints: {name, isMain}[]` 涉及知识点
- `keyFormulas?: string[]` 关键公式
- `difficulty: Difficulty` 难度评级
- `errorAnalysis?: {errorType, reason, correction}` 错误分析（用户提供答案时）
- `similarQuestion?: string` 相似题目

`QuestionRecord` — 前端题目数据完整结构（含 id、学科、题型、图片、题文、解答、步骤、用户答案、正确性、掌握度、复习次数、知识点等）

### `/src/types/knowledge.ts`

`KnowledgeCardData` — 知识点卡片数据（含定义、公式、例题、常见错误、关联知识点、用户掌握度）

`KnowledgeGraphNode` — 知识图谱节点（id、名称、学科、掌握度、错误次数、大小）

`KnowledgeGraphEdge` — 知识图谱边（source、target、类型 parent/related）

---

## 二、页面

### 根布局 `/src/app/layout.tsx`
- `metadata` — Next.js 页面元数据（标题、描述、manifest）
- `viewport` — 移动端视口配置
- `RootLayout()` — 根 HTML 包裹组件，引入 KaTeX CDN

### 落地页 `/src/app/page.tsx`
- 无状态，展示 hero、功能介绍、CTA 按钮

### 主布局 `/src/app/(main)/layout.tsx`
- 渲染子页面 + BottomNav 底部导航

---

### 首页 `/src/app/(main)/home/page.tsx`

**常量（模拟数据）：**
- `MOCK_STATS` — 学习统计：连续天数 7、今日题数 3、错题本 28 条、周正确率 72%、待复习 5
- `MOCK_RECENT_ERRORS` — 最近错题列表
- `SUBJECT_ICONS` — 学科 emoji 映射
- `MASTERY_STYLE` — 掌握度对应样式配置

**渲染内容：** 打招呼 + 连续天数、快捷操作按钮、今日概览卡、待复习提示、近期错题列表

---

### 解题页 `/src/app/(main)/scan/page.tsx`

**状态变量：**

| 变量 | 类型 | 说明 |
|------|------|------|
| `stage` | `"upload" \| "preview" \| "ocr" \| "solving" \| "result"` | 当前页面阶段 |
| `imageData` | `string \| null` | Base64 图片数据 |
| `fileInputRef` | `Ref` | 相册文件 input 引用 |
| `cameraInputRef` | `Ref` | 相机文件 input 引用 |
| `ocrResult` | `object \| null` | OCR 识别结果（题文、LaTeX、题型、学科、选项、置信度） |
| `ocrLoading` | `boolean` | OCR 识别中 |
| `ocrError` | `string \| null` | OCR 错误信息 |
| `selectedSubject` | `Subject` | 选择的学科，默认 MATH |
| `userAnswer` | `string` | 用户填写的答案 |
| `editedQuestion` | `string` | 用户手动修改的题目文本 |
| `solver` | `useSolver` | AI 解题 hook 状态 |

**函数：**

| 函数 | 参数 | 说明 |
|------|------|------|
| `compressImage` | `File` | 压缩图片至最大 1280px、JPEG 0.8 质量，防止上传体积过大 |
| `handleFileSelect` | `File` | 接收文件后调用 compressImage，存入 imageData |
| `handleOcr` | — | 调用 clientCallAIWithImage，发送 Base64 图片，解析返回 JSON，提取题目信息 |
| `handleSolve` | — | 调用 solver.solve，传入题目信息触发 AI 解题 |
| `handleSaveToNotebook` | — | POST /api/scan/save，将题目与解答保存到数据库 |
| `handleReset` | — | 重置所有状态回初始上传界面 |

**常量：**
- `SUBJECTS` — 6 个学科选项数组（含 emoji）

---

### 知识库页 `/src/app/(main)/knowledge/page.tsx`

**常量：**
- `KNOWLEDGE_CATEGORIES` — 按学科分组的知识点列表，含章节结构和掌握度（模拟数据）

**组件：**
- `MasteryDot` — 掌握度圆点，按百分比色彩编码

---

### 知识图谱页 `/src/app/(main)/knowledge/graph/page.tsx`

**状态变量：**
- `subjectFilter` — 节点学科过滤器，默认 "all"

**常量（模拟数据）：**
- `MOCK_NODES` — 知识点节点，含掌握度、错误次数、大小
- `MOCK_EDGES` — 节点关系连线（parent/related）
- `SUBJECT_FILTERS` — 学科筛选按钮配置

**计算值：**
- `filteredNodes` — 按学科过滤后的节点
- `filteredNodeIds` — 过滤节点 ID Set
- `filteredEdges` — 两端节点都在过滤集合内的边
- `stats` — 统计：{total, mastered, partial, weak}

---

### 知识点详情页 `/src/app/(main)/knowledge/[id]/page.tsx`
- 服务端包裹页，动态加载 PageClient（禁用 SSR）
- `generateStaticParams()` — 返回占位参数，满足静态导出要求

### 知识点详情客户端 `/src/app/(main)/knowledge/[id]/PageClient.tsx`

**状态变量：**
- `data` — 知识点卡片内容（来自 MOCK_KNOWLEDGE）
- `generating: boolean` — AI 生成中
- `activeTab: "card" | "errors" | "practice"` — 当前标签页

**函数：**
- `getMasteryConfig(mastery: number)` — 根据掌握度返回样式配置
- `MasteryRing` — SVG 圆形进度组件，显示掌握度百分比

**常量：**
- `MOCK_KNOWLEDGE` — 按知识点 ID 索引的模拟数据

---

### 错题本页 `/src/app/(main)/notebook/page.tsx`

**状态变量：**
- `activeFilter` — 掌握度筛选（all / NOT_MASTERED / PARTIAL / MASTERED）
- `activeSubject` — 学科筛选

**常量（模拟数据）：**
- `FILTERS` — 掌握度筛选选项
- `SUBJECT_FILTERS` — 学科筛选选项
- `MOCK_ERRORS` — 错题列表（含错误类型、知识点、掌握度）
- `ERROR_TYPE_LABELS` — 错误类型中文标签映射
- `SUBJECT_ICONS` — 学科 emoji 映射

**计算值：**
- `filtered` — 按掌握度和学科双重过滤后的错题
- `stats` — {total, notMastered, partial, mastered}

---

### 错题详情页 `/src/app/(main)/notebook/[id]/page.tsx`
- 服务端包裹，动态加载 PageClient

### 错题详情客户端 `/src/app/(main)/notebook/[id]/PageClient.tsx`

**状态变量：**
- `mastery` — 用户自评掌握度
- `showDemo: boolean` — 是否显示解题演示动画

**常量（模拟数据）：**
- `MOCK_DETAIL` — 完整错题详情（题目、用户答案、正确答案、解题步骤、错因分析）
- `ERROR_TYPE_LABELS` — 错误类型图标和标签
- `MASTERY_OPTIONS` — 掌握度自评选项（含颜色）

---

### 错题分析页 `/src/app/(main)/notebook/analysis/page.tsx`

**常量（模拟数据）：**
- `MOCK_ANALYSIS` — 错误统计（错误类型分布、学科分布、掌握度分布、薄弱点、周趋势）

**组件：**
- `HorizontalBar` — 水平条形图组件

---

### 练习页 `/src/app/(main)/practice/page.tsx`

**常量（模拟数据）：**
- `PRACTICE_TYPES` — 练习模式：今日练习、每周练习册、薄弱点专攻
- `WEAK_POINTS` — 薄弱知识点列表，含错误率
- `SUBJECT_ICONS` — 学科 emoji

---

### 报告页 `/src/app/(main)/report/page.tsx`

**状态变量：**
- `activeTab: "overview" | "weekly" | "subjects"` — 报告视图标签

**常量（模拟数据）：**
- `OVERVIEW` — 总体统计（总题数、总错题、周正确率、连续天数等）
- `SUBJECT_MASTERY` — 各学科掌握度百分比
- `HEATMAP_DATA` — 112 天活跃度数据
- `WEEK_DAILY` — 本周每日统计
- `MONTHLY_TREND` — 月度趋势数据
- `WEAK_POINTS` — 薄弱点排名，含趋势方向
- `ERROR_TYPE_STATS` — 错误类型分布

**组件：**
- `StatCard` — 统计卡片
- `DonutChart` — SVG 甜甜圈图表

---

### 打印页 `/src/app/(main)/print/page.tsx`

**状态变量：**

| 变量 | 类型 | 说明 |
|------|------|------|
| `printType` | `"notebook" \| "practice" \| "report"` | 打印内容类型 |
| `subject` | `string` | 学科筛选 |
| `mastery` | `string` | 掌握度筛选 |
| `timeRange` | `"week" \| "month" \| "all"` | 时间范围 |
| `includeAnswers` | `boolean` | 是否含答案解析 |
| `studentName` | `string` | 学生姓名（封面用）|
| `previewHtml` | `string \| null` | 生成的 HTML 预览内容 |
| `previewLoading` | `boolean` | 预览生成中 |
| `showPreview` | `boolean` | 显示预览弹窗 |

**函数：**
- `handleGenerate()` — 调用 /api/print/notebook 或 /api/print/practice 生成 HTML 预览

---

### 设置页 `/src/app/(main)/settings/page.tsx`

**状态变量：**
- `provider: ClientProvider` — 选择的 AI 供应商
- `keys: Record<string, string>` — 各供应商的 API Key
- `showKey: Record<string, boolean>` — 密码显示/隐藏切换
- `saved: boolean` — 保存成功标志

**Effect：**
- 挂载时从 localStorage 读取当前供应商和所有 Key

**函数：**
- `handleSave()` — 将供应商选择和 API Key 写入 localStorage

---

## 三、组件

### 布局组件

**PageHeader** `/src/components/layout/PageHeader.tsx`

| Prop | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 页面标题 |
| `subtitle` | `string?` | 副标题 |
| `showBack` | `boolean?` | 显示返回按钮 |
| `rightAction` | `ReactNode?` | 右侧操作区 |

- 使用 `useRouter().back()` 处理返回
- 粘性顶部 header

**BottomNav** `/src/components/layout/BottomNav.tsx`

- 使用 `usePathname()` 判断当前激活项
- `NAV_ITEMS` — 6 个导航项：首页、解题、错题本、练习、报告、设置
- 每个 icon 是函数 `(active: boolean) => SVG`，激活时加粗描边
- 激活态：渐变背景 + 白色图标 + 缩放效果

---

### 解题组件

**MathRenderer** `/src/components/scan/MathRenderer.tsx`

| Prop | 说明 |
|------|------|
| `content: string` | 混合文本 + LaTeX 内容 |
| `className?: string` | 样式类 |

**内部函数：**

| 函数 | 说明 |
|------|------|
| `sanitizeLatex(latex)` | 清洗 LaTeX：修复 Unicode 上标（²→^2）、Unicode 减号（−→-）、弯引号、特殊字符 |
| `renderLatexToHtml(latex, displayMode)` | 调用 KaTeX 渲染，出错时回退为代码显示 |
| `parseContent(content)` | 解析混合文本：支持 `$...$` 行内、`$$...$$` 独立行、`**粗体**` Markdown |

**Formula 导出组件** — 单独渲染一个 LaTeX 公式

---

**SolutionStream** `/src/components/scan/SolutionStream.tsx`

| Prop | 说明 |
|------|------|
| `text: string` | 解答文本 |
| `status` | `"loading" \| "streaming" \| "done" \| "error"` |
| `error?: string` | 错误信息 |

- loading/streaming 时显示加载动画
- done 时用 MathRenderer 渲染完整解答
- error 时显示错误文字

---

**StepByStep** `/src/components/scan/StepByStep.tsx`

| Prop | 说明 |
|------|------|
| `steps: SolutionStep[]` | 解题步骤数组 |
| `className?: string` | 样式类 |

- `expandedStep: number` — 当前展开的步骤
- 上一步/下一步导航按钮
- 已展开步骤以上的内容持续显示
- 步骤进度指示器

---

### 错题本组件

**SolutionDemo** `/src/components/notebook/SolutionDemo.tsx`

| Prop | 说明 |
|------|------|
| `steps: SolutionStep[]` | 解题步骤 |
| `autoPlay?: boolean` | 是否自动播放 |

**状态：**
- `currentStep: number` — 当前步骤（-1 表示未开始）
- `isPlaying: boolean` — 播放中

**函数：**
- `handlePlay()` — 开始/重播动画
- `handlePause()` — 暂停
- `handleStepClick(index)` — 跳转到指定步骤
- 自动播放：每 2 秒推进一步（使用 timerRef）

---

### 知识组件

**KnowledgePopover** `/src/components/knowledge/KnowledgePopover.tsx`

| Prop | 说明 |
|------|------|
| `name: string` | 知识点名称 |
| `isMain?: boolean` | 是否主要知识点 |
| `onLoadData?: (name) => Promise<data>` | 按需加载数据回调 |

**状态：**
- `isOpen: boolean` — 弹窗开关
- `data` — 知识点详情（懒加载）
- `loading: boolean`

**函数：**
- `handleClick()` — 切换弹窗，首次打开时加载数据

---

**KnowledgeGraph** `/src/components/knowledge/KnowledgeGraph.tsx`

| Prop | 说明 |
|------|------|
| `nodes: GraphNode[]` | 节点数组 |
| `edges: GraphEdge[]` | 边数组 |
| `onNodeClick?` | 节点点击回调 |

**内部函数：**

| 函数 | 说明 |
|------|------|
| `simulate()` | 力导向图物理模拟：排斥力 + 重力 + 边吸引力 |
| `draw()` | Canvas 渲染节点和边 |
| `getNodeAt(x, y)` | 按坐标查找节点 |
| `handleMouseMove/Down/Up` | 拖拽节点、悬停检测 |

- 节点颜色按掌握度：绿（掌握）/ 黄（部分）/ 红（未掌握）
- 边类型：parent（实线）/ related（虚线）
- 响应容器尺寸变化

---

### 报告组件

**ActivityHeatmap** `/src/components/report/ActivityHeatmap.tsx`

| Prop | 说明 |
|------|------|
| `data: Record<string, number>` | 每日活跃次数 |
| `weeks?: number` | 显示周数，默认 16 |

- `getIntensity(count)` — 按活跃次数返回颜色深度 CSS 类
- GitHub 风格热力图，含月份标签、星期标签

---

**RadarChart** `/src/components/report/RadarChart.tsx`

| Prop | 说明 |
|------|------|
| `data: {label, value, maxValue?}[]` | 雷达图数据 |
| `size?: number` | 图表尺寸，默认 240 |

- 纯 SVG 实现
- 按掌握度着色（绿/黄/红）
- 可配置网格层数
- 自适应标签位置

---

### 打印组件

**PrintPreview** `/src/components/print/PrintPreview.tsx`

| Prop | 说明 |
|------|------|
| `html: string \| null` | 预览 HTML 内容 |
| `loading: boolean` | 加载中 |
| `onClose` | 关闭回调 |

**状态：**
- `scale: number` — 缩放级别（0.3~1.0）

**函数：**
- `handlePrint()` — 通过 iframe 触发浏览器打印对话框
- `handleDownload()` — 下载 HTML 文件

---

## 四、Hooks

### useSolver `/src/hooks/useSolver.ts`

**返回值：** `{status, streamText, structuredData, error, solve, reset}`

**状态：**

| 变量 | 类型 | 说明 |
|------|------|------|
| `status` | `"idle" \| "loading" \| "streaming" \| "done" \| "error"` | 解题状态 |
| `streamText` | `string` | 累积的流式响应文本 |
| `structuredData` | `object \| null` | 解析出的结构化数据（步骤、知识点、公式、难度、答案、错因分析）|
| `error` | `string \| null` | 错误信息 |

**函数：**

| 函数 | 说明 |
|------|------|
| `buildSystemPrompt(subject, hasError, grade)` | 构建 AI 系统提示词，包含学科、是否有用户答案、年级信息 |
| `solve(params)` | 调用 clientCallAIStream，读取流，累积文本，提取 `===JSON_START===` 与 `===JSON_END===` 之间的 JSON |
| `reset()` | 中止流，重置所有状态 |

**特性：**
- AbortController 支持取消
- 流式响应同步更新 streamText
- 自��提取结构化 JSON 数据

---

### useNotebook `/src/hooks/useNotebook.ts`

**返回值：** `{loading, updateMastery, recordReview, reExplain, removeFromNotebook}`

| 函数 | 说明 |
|------|------|
| `updateMastery(id, masteryLevel)` | PATCH /api/notebook/{id}，更新掌握度 |
| `recordReview(id)` | PATCH /api/notebook/{id}，增加复习次数 |
| `reExplain(id)` | POST /api/notebook/{id}，AI 重新解释 |
| `removeFromNotebook(id)` | DELETE /api/notebook/{id}，移出错题本 |

---

### useKnowledge `/src/hooks/useKnowledge.ts`

**返回值：** `{loading, fetchDetail, generateCard, fetchByName}`

| 函数 | 说明 |
|------|------|
| `fetchDetail(id)` | GET /api/knowledge/{id} |
| `generateCard(id)` | POST /api/knowledge/{id} AI 生成，再 fetchDetail |
| `fetchByName(name, subject?)` | GET /api/knowledge?name={name}&subject={subject} |

---

## 五、工具库

### utils `/src/lib/utils.ts`

| 导出 | 说明 |
|------|------|
| `cn(...inputs)` | 合并 Tailwind 类名（clsx + tailwind-merge）|
| `formatDate(date)` | 格式化为中文日期，如 "3月22日" |
| `timeAgo(date)` | 相对时间，如 "2小时前" |
| `SUBJECT_LABELS` | 学科代码 → 中文名映射 |
| `GRADE_LABELS` | 年级代码 → 中文名映射 |
| `DIFFICULTY_LABELS` | 难度 → 中文名映射 |
| `MASTERY_LABELS` | 掌握度 → 中文状态映射 |
| `MASTERY_COLORS` | 掌握度 → Tailwind 色彩类映射 |

---

### AI Key Store `/src/lib/ai/key-store.ts`

| 导出 | 说明 |
|------|------|
| `ClientProvider` | 类型：`"qwen" \| "deepseek" \| "minimax" \| "claude"` |
| `PROVIDER_CONFIG` | 各供应商配置：baseUrl、model、vlModel、supportsVision、icon |
| `getClientProvider()` | 从 localStorage 读取当前供应商 |
| `setClientProvider(provider)` | 写入 localStorage |
| `getApiKey(provider)` | 读取指定供应商的 Key |
| `setApiKey(provider, key)` | 写入指定供应商的 Key |
| `isConfigured(provider)` | 检查是否已配置 Key |

**供应商配置：**
- `qwen` — baseUrl: dashscope，model: qwen-plus，vlModel: qwen-vl-plus，支持视觉
- `deepseek` — baseUrl: api.deepseek.com，model: deepseek-chat，不支持视觉
- `minimax` — baseUrl: api.minimax.chat，不支持视觉
- `claude` — baseUrl: api.anthropic.com，支持视觉

---

### Client Caller `/src/lib/ai/client-caller.ts`

| 导出函数 | 说明 |
|----------|------|
| `clientCallAI(params)` | 客户端非流式调用 AI |
| `clientCallAIStream(params)` | 客户端流式调用，返回 ReadableStream |
| `clientCallAIWithImage(params)` | 带图片的调用（OCR 识别）|

**内部函数：**
- `isNative()` — 检测是否运行在 Capacitor 原生环境
- `nativePost(url, headers, data)` — 使用 CapacitorHttp 发起原生 HTTP 请求（绕过 CORS）

**特性：**
- 原生环境（Android APK）自动使用 CapacitorHttp 绕过 WebView CORS 限制
- 流式模式在原生环境自动降级为非流式（CapacitorHttp 不支持 SSE）
- 读取 localStorage 中的 API Key
- 使用 OpenAI 兼容 API 格式

---

### AI Client（服务端）`/src/lib/ai/client.ts`

| 导出函数 | 说明 |
|----------|------|
| `callAI(params)` | 服务端非流式调用，路由到对应供应商 |
| `callAIStream(params)` | 服务端流式调用，返回 SSE ReadableStream |
| `callAIWithImage(params)` | 服务端带图片调用 |

- 通过 `AI_PROVIDER` 环境变量路由到 Claude / DeepSeek / MiniMax / Qwen
- Claude 使用 Anthropic SDK
- 其他供应商使用 OpenAI 兼容 API

---

### AI Provider `/src/lib/ai/provider.ts`

| 导出 | 说明 |
|------|------|
| `AIProvider` | 类型：`"claude" \| "deepseek" \| "minimax" \| "qwen"` |
| `getProvider()` | 读取 `AI_PROVIDER` 环境变量 |
| `getProviderLabel(provider?)` | 返回供应商展示名称 |
| `supportsVision(provider?)` | 是否支持图片识别 |

---

### Database Available `/src/lib/db-available.ts`

| 导出 | 说明 |
|------|------|
| `isDatabaseAvailable()` | 检查 `DATABASE_URL` 是否为非占位符，供 API 路由在无数据库时提前返回空数据 |

---

### Prisma `/src/lib/prisma.ts`

- 单例模式 PrismaClient
- 开发环境开启查询日志
- 全局引用防止热更新重复创建连接

---

### Auth `/src/lib/auth.ts`

- NextAuth 配置：CredentialsProvider（邮箱+密码）
- JWT 会话策略
- 自定义登录页：/login
- Session 和 JWT 回调处理 token 数据

---

## 六、API 路由（服务端）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/knowledge` | GET | 按名称/学科查询知识点 |
| `/api/knowledge/[id]` | GET | 获取知识点详情 |
| `/api/knowledge/[id]` | POST | AI 生成知识点卡片内容 |
| `/api/knowledge/graph` | GET | 获取知识图谱数据 |
| `/api/notebook` | GET | 错题本列表 |
| `/api/notebook/[id]` | GET | 错题详情 |
| `/api/notebook/[id]` | PATCH | 更新掌握度 / 记录复习 |
| `/api/notebook/[id]` | DELETE | 移出错题本 |
| `/api/notebook/[id]` | POST | AI 重新解释 |
| `/api/notebook/analysis` | GET | 错题统计分析 |
| `/api/scan/save` | POST | 保存题目到错题本 |
| `/api/report/overview` | GET | 总体学习统计 |
| `/api/report/weekly` | GET | 周统计数据 |
| `/api/print/notebook` | POST | 生成错题本打印 HTML |
| `/api/print/practice` | POST | 生成练习册打印 HTML |
| `/api/auth/[...nextauth]` | ANY | NextAuth 认证路由 |

**所有 API 路由均包含：**
- `isDatabaseAvailable()` 检查，无数据库时返回空数据（`{ data: [], success: true }`）
- `generateStaticParams()` 返回占位参数，满足静态导出要求

---

## 七、构建与部署

### 构建脚本 `/scripts/build-capacitor.sh`

1. 将 `src/app/api/` 临时移至 `/tmp/nebula_api_backup`（避免静态导出冲突）
2. 设置 `CAPACITOR_BUILD=true` 运行 `next build`（启用 `output: 'export'`）
3. 将 API 目录移回恢复工程

### next.config.mjs

- 仅当 `CAPACITOR_BUILD=true` 时启用 `output: "export"`
- 始终启用 `trailingSlash: true` 和 `images: { unoptimized: true }`

### Capacitor 配置 `/capacitor.config.ts`

- webDir 指向 `out/`（Next.js 静态导出目录）
- 打包为 Android APK

---

## 八、功能实现状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 拍照 OCR 识别 | ✅ 完整 | 图片压缩 + Qwen VL 识别 + JSON 解析 |
| AI 流式解题 | ✅ 完整 | 流式显示，原生端降级非流式 |
| LaTeX 数学渲染 | ✅ 完整 | KaTeX + Unicode 清洗 + 错误回退 |
| 设置页 API Key | ✅ 完整 | localStorage 持久化，4 供应商支持 |
| Android APK 打包 | ✅ 完整 | Capacitor 8，CORS 已处理 |
| 错题本保存 | 🟡 API 已写 | 数据库未连接，返回空数据 |
| 错题本查看 | 🟡 模拟数据 | 界面完整，数据硬编码 |
| 知识图谱 | 🟡 模拟数据 | 力导向图渲染完整，数据硬编码 |
| 学习报告 | 🟡 模拟数据 | 图表完整，数据硬编码 |
| 用户登录注册 | 🟡 框架 | NextAuth 配置完成，无真实用户库 |
| 练习系统 | ❌ 未实现 | 界面占位，无逻辑 |
| 打印导出 | ❌ 未实现 | 界面完整，API 骨架未完成 |
