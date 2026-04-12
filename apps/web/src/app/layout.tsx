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
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "TimelyInvoices" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#2563eb" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
