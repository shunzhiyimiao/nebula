"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className={cn("sticky top-0 z-40 bg-glass border-b border-[var(--color-border-light)]", className)}>
      <div className="max-w-lg mx-auto flex items-center h-14 px-4">
        {/* Left: Back button */}
        {showBack && (
          <button
            onClick={() => router.back()}
            className="mr-3 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors -ml-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Center: Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-tertiary)] truncate">{subtitle}</p>
          )}
        </div>

        {/* Right: Action */}
        {rightAction && (
          <div className="ml-3 flex-shrink-0">{rightAction}</div>
        )}
      </div>
    </header>
  );
}
