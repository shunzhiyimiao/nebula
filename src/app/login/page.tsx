"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        setError("邮箱或密码错误");
        setLoading(false);
      } else {
        window.location.href = "/home";
      }
    } catch {
      setError("登录失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-mesh">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-nebula-gradient flex items-center justify-center shadow-lg shadow-nebula-500/20 mb-4">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">欢迎回来</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">登录你的 Nebula 账号</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] p-6 space-y-4">
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
              placeholder="••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-nebula-gradient text-white font-semibold text-sm shadow-lg shadow-nebula-500/20 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-tertiary)] mt-6">
          还没有账号？{" "}
          <Link href="/register" className="text-nebula-600 font-medium">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
