import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import OfflineIndicator from "@/components/OfflineIndicator";
import SessionGuard from "@/components/SessionGuard";
import NavigationProgress from "@/components/NavigationProgress";
import ToastProvider from "@/components/ui/ToastProvider";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Pepperberry",
  description: "Task management for Pepperberry, Coolangatta NSW",
  manifest: "/manifest.json",
  icons: {
    icon: "/PBFlavicon.jpg",
    apple: "/apple-touch-icon.png",
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
        <ToastProvider>
          <ServiceWorkerRegistration />
          <OfflineIndicator />
          <SessionGuard />
          <NavigationProgress />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
