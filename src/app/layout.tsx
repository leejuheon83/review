import type { Metadata, Viewport } from "next";
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
  description: "팀장을 위한 팀원 코칭·피드백 기록 및 리더십 진단 웹앱",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "팀원 코칭",
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
  openGraph: {
    title: "SBS M&C 팀원 코칭/리뷰 프로그램",
    description: "",
    url: "https://sbsmc-team-review.vercel.app",
    siteName: "SBS M&C 팀원 코칭/리뷰 프로그램",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SBS M&C 팀원 코칭/리뷰 프로그램",
    description: "",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
