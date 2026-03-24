"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const GRADE_OPTIONS = [
  { value: "PRIMARY_1", label: "小学一年级" },
  { value: "PRIMARY_2", label: "小学二年级" },
  { value: "PRIMARY_3", label: "小学三年级" },
  { value: "PRIMARY_4", label: "小学四年级" },
  { value: "PRIMARY_5", label: "小学五年级" },
  { value: "PRIMARY_6", label: "小学六年级" },
  { value: "JUNIOR_1", label: "初一" },
  { value: "JUNIOR_2", label: "初二" },
  { value: "JUNIOR_3", label: "初三" },
  { value: "SENIOR_1", label: "高一" },
  { value: "SENIOR_2", label: "高二" },
  { value: "SENIOR_3", label: "高三" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", grade: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("密码至少6位");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }
      // Auto login after register
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirectTo: "/home",
      });
    } catch (err: any) {
      if (err?.message === "NEXT_REDIRECT") return;
      setError("注册失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-mesh">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-nebula-gradient flex items-center justify-center shadow-lg shadow-nebula-500/20 mb-4">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">创建账号</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">加入 Nebula，开启智能学习</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">昵称</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="你的名字"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">邮箱</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">密码</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="至少6位"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">年级（选填）</label>
            <select
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all text-[var(--color-text-primary)]"
            >
              <option value="">请选择年级</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-nebula-gradient text-white font-semibold text-sm shadow-lg shadow-nebula-500/20 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-tertiary)] mt-6">
          已有账号？{" "}
          <Link href="/login" className="text-nebula-600 font-medium">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}
