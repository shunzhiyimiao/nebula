"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-red-500">出现了一些问题</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded">
        重试
      </button>
    </div>
  );
}
