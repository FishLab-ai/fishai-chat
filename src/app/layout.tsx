import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FishAI - FishLab-ai 自研 AI 助手",
  description: "FishAI — FishLab-ai 自研 AI 助手，Rust 推理引擎，4-bit 量化，轻量而聪明",
  keywords: ["FishAI", "FishLab-ai", "Rust", "GPT", "4-bit", "AI", "self-developed"],
  authors: [{ name: "FishLab-ai" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "FishAI - FishLab-ai 自研 AI 助手",
    description: "Rust Engine + 4-bit Quantized, No Git LFS Required",
    url: "https://github.com/FishLab-ai",
    siteName: "FishAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FishAI - FishLab-ai 自研 AI 助手",
    description: "Rust Engine + 4-bit Quantized, No Git LFS Required",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
