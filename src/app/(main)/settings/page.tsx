"use client";

import React, { useState, useEffect } from "react";
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

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  qwen: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="9" fill="#615CE8"/>
      <path d="M18 8c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S23.523 8 18 8zm0 3a7 7 0 0 1 6.929 6H11.07A7 7 0 0 1 18 11zm0 14a7 7 0 0 1-6.929-6h13.858A7 7 0 0 1 18 25z" fill="white"/>
      <circle cx="18" cy="18" r="2.5" fill="white"/>
    </svg>
  ),
  deepseek: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="9" fill="#0066FF"/>
      <path d="M10 22c0-4.418 3.582-8 8-8 2.21 0 4.21.896 5.657 2.343" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 14c0 4.418-3.582 8-8 8-2.21 0-4.21-.896-5.657-2.343" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="26" cy="14" r="2" fill="#00CFFF"/>
      <circle cx="10" cy="22" r="2" fill="#00CFFF"/>
    </svg>
  ),
  minimax: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="9" fill="#0A0A0A"/>
      <path d="M8 24V12l5 8 5-8v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 12v12M28 12v12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  claude: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="9" fill="#CC785C"/>
      <path d="M13 26l5-16 5 16" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 21h6" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
};

export default function SettingsPage() {
  const [provider, setProvider] = useState<ClientProvider>("qwen");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProvider(getClientProvider());
    const loaded: Record<string, string> = {};
    PROVIDERS.forEach((p) => {
      loaded[p.value] = getApiKey(p.value);
    });
    setKeys(loaded);
  }, []);

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

        <div className="h-8" />
      </div>
    </div>
  );
}
