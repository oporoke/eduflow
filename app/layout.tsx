import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import "@uploadthing/react/styles.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import EmergencyAlertBanner from "@/components/EmergencyAlertBanner";
import {LanguageProvider} from "@/lib/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduFlow - Digital Learning Platform",
  description: "CBC-aligned Learning Management System for Kenyan Schools",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EduFlow",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-152x152.png",
  },
};
export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EduFlow" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <title>EduFlow - Digital Learning Platform</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <Providers>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <EmergencyAlertBanner />
          <ServiceWorkerRegistration />
          <InstallPrompt />
          <AccessibilityToolbar />
          {children}
        </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
