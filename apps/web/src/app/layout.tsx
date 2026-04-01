import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalKeyboardShortcuts } from "@/components/shell/GlobalKeyboardShortcuts";
import { AppSerwistProvider } from "@/components/serwist/AppSerwistProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TimelyInvoices — Invoicing & cashflow",
  description: "Quotes, recurring invoices, expenses, and client-friendly payments.",
  appleWebApp: { capable: true, title: "TimelyInvoices" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#2563eb" }],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppSerwistProvider>
          <GlobalKeyboardShortcuts />
          {children}
        </AppSerwistProvider>
      </body>
    </html>
  );
}
