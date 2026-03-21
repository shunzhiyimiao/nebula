import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nebula — 智能学习平台",
  description: "AI驱动的中小学智能学习平台，拍照解题、知识卡片、错题本、智能练习",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4c6ef5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-mesh antialiased">
        {children}
      </body>
    </html>
  );
}
