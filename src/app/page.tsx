import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-nebula-gradient flex items-center justify-center shadow-lg shadow-nebula-500/20">
              <span className="text-4xl">✦</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl font-800 tracking-tight mb-4">
            <span className="text-gradient-nebula">Nebula</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] mb-2 font-medium">
            智能学习平台
          </p>
          <p className="text-[var(--color-text-tertiary)] mb-10 leading-relaxed">
            拍照解题 · 知识卡片 · 错题本 · 智能练习
            <br />
            让每个错误都成为进步的星光
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Link
              href="/home"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-nebula-gradient text-white font-semibold text-base shadow-lg shadow-nebula-500/25 hover:shadow-xl hover:shadow-nebula-500/30 transition-all active:scale-[0.98]"
            >
              开始使用
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white/80 text-[var(--color-text-primary)] font-medium text-base border border-[var(--color-border)] hover:bg-white transition-all"
            >
              登录账号
            </Link>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: "📸", title: "拍照解题", desc: "OCR识别 + AI逐步讲解" },
              { icon: "🃏", title: "知识卡片", desc: "点击知识点即刻弹出" },
              { icon: "📝", title: "智能错题本", desc: "自动收录 + 错因分析" },
              { icon: "📋", title: "个性练习", desc: "每日/每周专项训练" },
            ].map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-2xl bg-white/60 border border-[var(--color-border-light)]"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-2 font-semibold text-sm">{f.title}</h3>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[var(--color-text-tertiary)]">
        Nebula © 2026
      </footer>
    </div>
  );
}
