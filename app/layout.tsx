import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Surfer - AI Search Engine",
  description: "Self-hosted AI-powered search engine with real-time answers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
