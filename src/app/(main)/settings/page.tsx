"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import {
  getClientProvider,
  setClientProvider,
  getApiKey,
  setApiKey,
  isConfigured,
  PROVIDER_CONFIG,
  type ClientProvider,
} from "@/lib/ai/key-store";

const PROVIDERS = Object.entries(PROVIDER_CONFIG).map(([value, cfg]) => ({
  value: value as ClientProvider,
  ...cfg,
}));

const GRADES = [
  { value: "PRIMARY_1", label: "小学一年级" },
  { value: "PRIMARY_2", label: "小学二年级" },
  { value: "PRIMARY_3", label: "小学三年级" },
  { value: "PRIMARY_4", label: "小学四年级" },
  { value: "PRIMARY_5", label: "小学五年级" },
  { value: "PRIMARY_6", label: "小学六年级" },
  { value: "JUNIOR_1",  label: "初一（七年级）" },
  { value: "JUNIOR_2",  label: "初二（八年级）" },
  { value: "JUNIOR_3",  label: "初三（九年级）" },
  { value: "SENIOR_1",  label: "高一" },
  { value: "SENIOR_2",  label: "高二" },
  { value: "SENIOR_3",  label: "高三" },
];

const SUBJECTS = [
  { value: "MATH",      label: "数学", icon: "📐" },
  { value: "CHINESE",   label: "语文", icon: "📖" },
  { value: "ENGLISH",   label: "英语", icon: "🔤" },
  { value: "PHYSICS",   label: "物理", icon: "⚡" },
  { value: "CHEMISTRY", label: "化学", icon: "🧪" },
  { value: "BIOLOGY",   label: "生物", icon: "🧬" },
  { value: "HISTORY",   label: "历史", icon: "🏛️" },
  { value: "GEOGRAPHY", label: "地理", icon: "🌍" },
  { value: "POLITICS",  label: "政治", icon: "📜" },
];

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  qwen: (
    <svg viewBox="0 0 200 200" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      <path d="M174.82 108.75L155.38 75L165.64 57.75C166.46 56.31 166.46 54.53 165.64 53.09L155.38 35.84C154.86 34.91 153.87 34.33 152.78 34.33H114.88L106.14 19.03C105.62 18.1 104.63 17.52 103.54 17.52H83.3C82.21 17.52 81.22 18.1 80.7 19.03L61.26 52.77H41.02C39.93 52.77 38.94 53.35 38.42 54.28L28.16 71.53C27.34 72.97 27.34 74.75 28.16 76.19L45.52 107.5L36.78 122.8C35.96 124.24 35.96 126.02 36.78 127.46L47.04 144.71C47.56 145.64 48.55 146.22 49.64 146.22H87.54L96.28 161.52C96.8 162.45 97.79 163.03 98.88 163.03H119.12C120.21 163.03 121.2 162.45 121.72 161.52L141.16 127.78H158.52C159.61 127.78 160.6 127.2 161.12 126.27L171.38 109.02C172.2 107.58 172.2 105.8 171.38 104.36L174.82 108.75Z" fill="url(#qwen_grad0)"/>
      <path d="M119.12 163.03H98.88L87.54 144.71H49.64L61.26 126.39H80.7L38.42 55.29H61.26L83.3 19.03L93.56 37.35L83.3 55.29H161.58L151.32 72.54L170.76 106.28H151.32L141.16 88.34L101.18 163.03H119.12Z" fill="white"/>
      <path d="M127.86 79.83H76.14L101.18 122.11L127.86 79.83Z" fill="url(#qwen_grad1)"/>
      <defs>
        <radialGradient id="qwen_grad0" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(100)">
          <stop stopColor="#665CEE"/>
          <stop offset="1" stopColor="#332E91"/>
        </radialGradient>
        <radialGradient id="qwen_grad1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(100)">
          <stop stopColor="#665CEE"/>
          <stop offset="1" stopColor="#332E91"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  deepseek: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="8" fill="white"/>
      <defs>
        <linearGradient id="ds_stroke" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4D80F0"/>
          <stop offset="1" stopColor="#C030DF"/>
        </linearGradient>
        <linearGradient id="ds_fill" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#D8E8FF"/>
          <stop offset="1" stopColor="#F0D5FF"/>
        </linearGradient>
      </defs>
      <path fill="url(#ds_fill)" stroke="url(#ds_stroke)" strokeWidth="1.8" strokeLinecap="round" d="M22 7C24 4 27 3 29 5C30 7 29 9 27 9C25 9 23 8 22 7Z"/>
      <path fill="url(#ds_fill)" stroke="url(#ds_stroke)" strokeWidth="1.8" strokeLinecap="round" d="M25 11C27 9 30 9 31 11C32 13 29 15 27 14C26 12 24 12 25 11Z"/>
      <path fill="url(#ds_fill)" stroke="url(#ds_stroke)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M11 7C14 4 18 3 22 6C23 8 22 9 20 9C24 9 27 12 28 16C29 20 28 25 25 28C22 31 18 32 14 31C10 31 7 29 6 26C4 23 4 18 6 14C4 11 4 8 6 7C8 5 10 6 11 7Z"/>
      <path fill="none" stroke="url(#ds_stroke)" strokeWidth="1.8" strokeLinecap="round" d="M7 19C9 14 14 12 19 14C23 16 24 21 22 25"/>
      <circle cx="23" cy="16" r="1.3" fill="url(#ds_stroke)"/>
      <circle cx="22.6" cy="15.5" r="0.5" fill="white" fillOpacity="0.8"/>
    </svg>
  ),
  minimax: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="8" fill="white"/>
      <defs>
        <linearGradient id="mm_grad" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#C2327A"/>
          <stop offset="1" stopColor="#E87542"/>
        </linearGradient>
      </defs>
      <path
        stroke="url(#mm_grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        d="M3 18L3 24A2 2 0 0 1 7 24L7 11A2 2 0 0 0 11 11L11 28A2 2 0 0 1 15 28L15 7A2 2 0 0 0 19 7L19 28A2 2 0 0 1 23 28L23 9A2 2 0 0 0 27 9L27 24A2 2 0 0 1 31 24L31 16"
      />
    </svg>
  ),
  claude: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="7" fill="#C8956C"/>
      <text x="18" y="26" textAnchor="middle" fill="#1A1A1A" fontSize="20" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif">AI</text>
    </svg>
  ),
};

export default function SettingsPage() {
  const [provider, setProvider] = useState<ClientProvider>("qwen");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  // 学习档案
  const [grade, setGrade] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setProvider(getClientProvider());
    const loaded: Record<string, string> = {};
    PROVIDERS.forEach((p) => {
      loaded[p.value] = getApiKey(p.value);
    });
    setKeys(loaded);

    // 加载用户档案
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setGrade(res.data.grade || "");
          setSubjects(res.data.subjects || []);
        }
      })
      .catch(() => {});
  }, []);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: grade || null, subjects }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleSubject = (value: string) => {
    setSubjects((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleSave = () => {
    setClientProvider(provider);
    PROVIDERS.forEach((p) => {
      if (keys[p.value] !== undefined) {
        setApiKey(p.value, keys[p.value].trim());
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="设置" />

      <div className="px-4 pt-5 space-y-4 animate-fade-in">

        {/* 学习档案 */}
        <section className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
            <h3 className="text-sm font-semibold">学习档案</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">用于匹配课纲范围，确保练习题不超纲</p>
          </div>

          <div className="p-4 space-y-4">
            {/* 年级 */}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-2">当前年级</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
              >
                <option value="">请选择年级</option>
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* 学科 */}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-2">学习学科（可多选）</label>
              <div className="grid grid-cols-3 gap-2">
                {SUBJECTS.map((s) => {
                  const active = subjects.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleSubject(s.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all",
                        active
                          ? "border-nebula-400 bg-nebula-50/50 text-nebula-700"
                          : "border-[var(--color-border-light)] bg-white text-[var(--color-text-secondary)]"
                      )}
                    >
                      <span className="text-base">{s.icon}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className={cn(
                "w-full h-11 rounded-xl font-semibold text-sm transition-all",
                profileSaved
                  ? "bg-emerald-500 text-white"
                  : "bg-nebula-gradient text-white shadow-lg shadow-nebula-500/20 active:scale-[0.98]"
              )}
            >
              {profileSaved ? "✅ 已保存" : profileSaving ? "保存中..." : "保存档案"}
            </button>
          </div>
        </section>

        {/* AI 引擎选择 */}
        <section className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
            <h3 className="text-sm font-semibold">AI 引擎</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">选择解题使用的 AI 模型</p>
          </div>

          <div className="p-4 space-y-2">
            {PROVIDERS.map((p) => {
              const active = provider === p.value;
              const configured = isConfigured(p.value) || keys[p.value]?.length > 0;
              return (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className={cn(
                    "w-full rounded-2xl p-3.5 text-left transition-all border-2",
                    active ? "border-nebula-400 bg-nebula-50/30" : "border-[var(--color-border-light)] bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0">{PROVIDER_ICONS[p.value]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{p.name}</span>
                        {active && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-nebula-100 text-nebula-600 font-medium">当前使用</span>}
                        {configured
                          ? <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">已配置</span>
                          : <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-medium">未配置</span>
                        }
                        {p.supportsVision && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium">支持拍照</span>}
                      </div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{p.model}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      active ? "border-nebula-500" : "border-gray-300"
                    )}>
                      {active && <div className="w-2.5 h-2.5 rounded-full bg-nebula-500" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* API Key 输入 */}
        <section className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
            <h3 className="text-sm font-semibold">API Key 配置</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">Key 仅保存在本机，不上传服务器</p>
          </div>

          <div className="p-4 space-y-4">
            {PROVIDERS.map((p) => (
              <div key={p.value}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex-shrink-0 scale-75 origin-left">{PROVIDER_ICONS[p.value]}</span>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{p.name} API Key</label>
                  {!p.supportsVision && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">不支持拍照识别</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKey[p.value] ? "text" : "password"}
                    value={keys[p.value] || ""}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [p.value]: e.target.value }))}
                    placeholder={p.placeholder}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[var(--color-border)] bg-gray-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
                  />
                  <button
                    onClick={() => setShowKey((prev) => ({ ...prev, [p.value]: !prev[p.value] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showKey[p.value] ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={handleSave}
              className={cn(
                "w-full h-11 rounded-xl font-semibold text-sm transition-all",
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-nebula-gradient text-white shadow-lg shadow-nebula-500/20 active:scale-[0.98]"
              )}
            >
              {saved ? "✅ 已保存" : "保存设置"}
            </button>
          </div>
        </section>

        {/* 获取 Key 指引 */}
        <section className="bg-nebula-50/60 rounded-2xl p-4 border border-nebula-100/60">
          <h3 className="text-xs font-semibold text-nebula-800 mb-2">📋 如何获取 API Key</h3>
          <div className="space-y-2 text-[11px] text-nebula-700/80">
            <div>🔷 <strong>通义千问</strong>：<span className="text-nebula-600">bailian.console.aliyun.com</span> → 右上角 API Key</div>
            <div>🔮 <strong>DeepSeek</strong>：<span className="text-nebula-600">platform.deepseek.com</span> → API Keys</div>
            <div>⚡ <strong>MiniMax</strong>：<span className="text-nebula-600">platform.minimax.io</span> → 账户设置</div>
            <div>🤖 <strong>Claude</strong>：<span className="text-nebula-600">console.anthropic.com</span> → API Keys</div>
          </div>
        </section>

        {/* 关于 */}
        <div className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
          <h3 className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">关于</h3>
          {[
            { label: "版本", value: "v0.1.0" },
            { label: "隐私政策", value: "" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm">{item.label}</span>
              <span className="text-sm text-[var(--color-text-tertiary)]">{item.value}</span>
            </div>
          ))}
        </div>

        {/* 退出登录 */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full h-11 rounded-xl border border-red-200 text-red-500 font-medium text-sm bg-white active:scale-[0.98] transition-all"
        >
          退出登录
        </button>

        <div className="h-8" />
      </div>
    </div>
  );
}
