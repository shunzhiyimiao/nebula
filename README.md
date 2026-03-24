# ✦ Nebula — 智能学习平台

AI驱动的中小学智能学习平台。拍照解题 · 知识卡片 · 错题本 · 智能练习。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入你的配置：
- `DATABASE_URL` — PostgreSQL 连接字符串（推荐 [Supabase](https://supabase.com) 免费版）
- `ANTHROPIC_API_KEY` — Claude API Key
- `NEXTAUTH_SECRET` — 运行 `openssl rand -base64 32` 生成

### 3. 初始化数据库

```bash
npx prisma db push
npx prisma generate
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 技术栈

- **框架**: Next.js 14 (App Router) + TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL + Prisma ORM
- **AI**: Claude API (Anthropic)
- **公式渲染**: KaTeX
- **图表**: Recharts
- **部署**: Vercel

## 项目结构

```
src/
├── app/           # Next.js 路由和页面
├── components/    # React 组件
├── lib/           # 工具库和服务
├── hooks/         # 自定义 Hooks
├── types/         # TypeScript 类型
└── constants/     # 常量配置
```

## 开发阶段

- [x] Phase 1: 项目骨架 + 页面框架
- [x] Phase 2: 拍照解题 (OCR + AI)
- [ ] Phase 3: 知识卡片
- [ ] Phase 4: 错题本
- [ ] Phase 5: 智能练习
- [ ] Phase 6: 打印导出
- [ ] Phase 7: 学习报告
- [ ] Phase 8: 上线

## 更新日志

### 2026-03-25
- 实现用户注册 / 登录系统（NextAuth v5 + bcryptjs）
- 修复 Vercel 生产环境 MissingCSRF 错误（添加 `trustHost: true`）
- 修复 middleware cookie 名称（NextAuth v5 改为 `authjs.session-token`）
- 拍照解题保存错题时使用真实 userId
- 修复 KaTeX 异步加载导致公式不渲染的问题（defer 脚本 + useMemo 缓存冲突）
- 优化 OCR 系统提示词，要求所有数学表达式统一用 LaTeX `$...$` 包裹
- 修复 `questionLatex` 被双重包裹 `$...$` 导致渲染错误的问题
