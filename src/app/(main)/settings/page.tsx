"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

interface ProviderInfo {
  provider: string;
  label: string;
  supportsVision: boolean;
  models: {
    claude: { model: string; configured: boolean };
    deepseek: { model: string; configured: boolean; baseUrl: string };
  };
}

const AI_PROVIDERS = [
  {
    value: "deepseek",
    name: "DeepSeek",
    desc: "DeepSeek-V3，国内访问快，性价比高",
    icon: "🔮",
    color: "from-blue-600 to-cyan-500",
    features: ["中文理解强", "数学推理好", "API价格低", "国内直连"],
  },
  {
    value: "minimax",
    name: "MiniMax",
    desc: "MiniMax-M2.5，代码和智能体能力强",
    icon: "⚡",
    color: "from-violet-600 to-purple-500",
    features: ["多模态", "代码能力强", "长上下文", "国内直连"],
  },
  {
    value: "qwen",
    name: "通义千问",
    desc: "阿里云 Qwen，中文能力顶尖，有专用OCR模型",
    icon: "🔷",
    color: "from-indigo-500 to-blue-500",
    features: ["中文最强", "专用OCR模型", "阿里云生态", "国内直连"],
  },
  {
    value: "claude",
    name: "Claude",
    desc: "Anthropic Claude，多模态能力强",
    icon: "🤖",
    color: "from-orange-500 to-amber-500",
    features: ["多模态强", "长文本", "推理深度", "需要翻墙"],
  },
];

export default function SettingsPage() {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [activeProvider, setActiveProvider] = useState(
    process.env.NEXT_PUBLIC_AI_PROVIDER || "deepseek"
  );

  useEffect(() => {
    fetch("/api/ai/provider")
      .then((r) => r.json())
      .then(setProviderInfo)
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="设置" />

      <div className="px-4 pt-5 space-y-4 animate-fade-in">
        {/* Profile */}
        <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-nebula-gradient flex items-center justify-center text-white text-xl font-bold">
              N
            </div>
            <div>
              <h3 className="font-semibold">未登录</h3>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">登录后数据自动云端同步</p>
            </div>
          </div>
        </div>

        {/* AI Provider Selection */}
        <section className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
            <h3 className="text-sm font-semibold">AI 引擎</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              选择解题和OCR使用的AI模型
            </p>
          </div>

          <div className="p-4 space-y-3">
            {AI_PROVIDERS.map((p) => {
              const isActive = activeProvider === p.value;
              const isConfigured = providerInfo?.models?.[p.value as keyof typeof providerInfo.models]?.configured;

              return (
                <button
                  key={p.value}
                  onClick={() => setActiveProvider(p.value)}
                  className={cn(
                    "w-full rounded-2xl p-4 text-left transition-all border-2",
                    isActive
                      ? "border-nebula-400 bg-nebula-50/30 shadow-sm"
                      : "border-[var(--color-border-light)] bg-white hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl flex-shrink-0",
                      p.color
                    )}>
                      {p.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{p.name}</span>
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-nebula-100 text-nebula-600 font-medium">
                            当前使用
                          </span>
                        )}
                        {isConfigured === false && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-medium">
                            未配置
                          </span>
                        )}
                        {isConfigured === true && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-correct font-medium">
                            已配置
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{p.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.features.map((f) => (
                          <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-[var(--color-text-secondary)]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Radio indicator */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors",
                      isActive ? "border-nebula-500" : "border-gray-300"
                    )}>
                      {isActive && <div className="w-2.5 h-2.5 rounded-full bg-nebula-500" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Model Info */}
          {providerInfo && (
            <div className="px-4 pb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-[10px] text-[var(--color-text-tertiary)] space-y-1">
                <div className="flex justify-between">
                  <span>当前引擎</span>
                  <span className="font-medium text-[var(--color-text-secondary)]">{providerInfo.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>模型</span>
                  <span className="font-mono text-[var(--color-text-secondary)]">
                    {providerInfo.models[providerInfo.provider as keyof typeof providerInfo.models]?.model || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>图片识别(OCR)</span>
                  <span className={providerInfo.supportsVision ? "text-correct" : "text-wrong"}>
                    {providerInfo.supportsVision ? "支持" : "不支持"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 pb-4">
            <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
              💡 切换 AI 引擎需要修改 <code className="bg-gray-100 px-1 rounded">.env.local</code> 中的
              <code className="bg-gray-100 px-1 rounded">AI_PROVIDER</code> 和对应的 API Key，然后重启服务。
            </p>
          </div>
        </section>

        {/* Learning Settings */}
        <div className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
          <h3 className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">学习设置</h3>
          {[
            { label: "年级", value: "初三" },
            { label: "关注学科", value: "数学、物理、化学" },
            { label: "每日练习量", value: "10题" },
            { label: "复习提醒", value: "开启" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[var(--color-text-tertiary)]">{item.value}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
          <h3 className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">关于</h3>
          {[
            { label: "版本", value: "v0.1.0" },
            { label: "AI 引擎", value: providerInfo?.label || "加载中..." },
            { label: "隐私政策", value: "" },
            { label: "用户协议", value: "" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm">{item.label}</span>
              <div className="flex items-center gap-1.5">
                {item.value && <span className="text-sm text-[var(--color-text-tertiary)]">{item.value}</span>}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
