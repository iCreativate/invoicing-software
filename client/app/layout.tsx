import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  title: "Timely - Modern Finance, Payroll & Operations Platform",
  description: "All-in-one financial platform for modern businesses",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full min-h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full min-h-screen max-w-full`}
      >
        <div className="w-full min-h-screen max-w-full min-w-0">
          {children}
        </div>
      </body>
    </html>
  );
}
