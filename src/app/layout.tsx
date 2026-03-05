import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ActorProvider } from "@/components/actor-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sbsmc-team-review.vercel.app"),
  applicationName: "SBS M&C 팀원 코칭/리뷰 프로그램",
  title: "SBS M&C 팀원 코칭/리뷰 프로그램",
  description: "팀장 수시 코칭 기록 MVP",
  openGraph: {
    title: "SBS M&C 팀원 코칭/리뷰 프로그램",
    description: "팀장 수시 코칭 기록 MVP",
    url: "https://sbsmc-team-review.vercel.app",
    siteName: "SBS M&C 팀원 코칭/리뷰 프로그램",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SBS M&C 팀원 코칭/리뷰 프로그램",
    description: "팀장 수시 코칭 기록 MVP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ActorProvider>{children}</ActorProvider>
      </body>
    </html>
  );
}
