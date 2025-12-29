import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Structured Diary",
  description: "A structured diary MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="min-h-screen bg-app-bg text-white">
          <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
        </div>
      </body>
    </html>
  );
}
