import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GlobalKeyboardShortcuts } from "@/components/shell/GlobalKeyboardShortcuts";
import { AppProviders } from "@/components/shell/AppProviders";
import { AppSerwistProvider } from "@/components/serwist/AppSerwistProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://timelyinvoices.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TimelyInvoices — ZAR invoices, quotes & VAT for SA",
    template: "%s · TimelyInvoices",
  },
  description:
    "Create professional ZAR invoices and quotes with VAT. Email or share a public link, and get paid by EFT to your business bank details.",
  applicationName: "TimelyInvoices",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "TimelyInvoices" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "TimelyInvoices",
    locale: "en_ZA",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#2563EB" }],
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
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
