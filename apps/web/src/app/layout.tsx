import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalKeyboardShortcuts } from "@/components/shell/GlobalKeyboardShortcuts";
import { AppProviders } from "@/components/shell/AppProviders";
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
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
          <AppProviders>
            <GlobalKeyboardShortcuts />
            {children}
          </AppProviders>
        </AppSerwistProvider>
      </body>
    </html>
  );
}
