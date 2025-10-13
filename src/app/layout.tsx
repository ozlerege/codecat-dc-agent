import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupabaseProvider } from "@/lib/supabase/provider";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeCat Discord Developer Agent",
  description: "AI-powered development tasks directly from Discord",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
