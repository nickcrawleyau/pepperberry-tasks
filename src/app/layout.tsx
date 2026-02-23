import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import OfflineIndicator from "@/components/OfflineIndicator";
import SessionGuard from "@/components/SessionGuard";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Pepperberry",
  description: "Task management for Pepperberry, Coolongatta NSW",
  manifest: "/manifest.json",
  icons: {
    icon: "/PBFlavicon.jpg",
  },
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
        <ServiceWorkerRegistration />
        <OfflineIndicator />
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}
