import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';

export const metadata: Metadata = {
  title: 'Contact — TimelyInvoices',
  description: 'Get help with billing, support, or product questions.',
};

const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  'https://wa.me/27612345678?text=Hi%20TimelyInvoices%20%E2%80%94%20I%E2%80%99d%20like%20help%20choosing%20a%20plan.';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@timelyinvoices.com';

export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit font-normal">
            Support
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Contact</h1>
          <p className="text-sm text-muted-foreground">
            Need help with invoices, payments, imports, or your plan? We’ll get you sorted quickly.
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card className="rounded-xl border-border p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="text-sm font-semibold">Email support</div>
            <div className="mt-1 text-sm text-muted-foreground">For account, billing, and technical questions.</div>
            <div className="mt-4">
              <Button asChild className="w-full shadow-[var(--shadow-sm)]" variant="secondary">
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Typical response: within 1 business day.</div>
          </Card>

          <Card className="rounded-xl border-border p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="text-sm font-semibold">WhatsApp</div>
            <div className="mt-1 text-sm text-muted-foreground">Fast help choosing a plan or troubleshooting.</div>
            <div className="mt-4">
              <Button asChild className="w-full shadow-[var(--shadow-sm)]">
                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                  Message us on WhatsApp
                </a>
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Business hours: Mon–Fri.</div>
          </Card>
        </div>

        <Card className="mt-3 rounded-xl border-border p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="text-sm font-semibold">Before you contact us</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Include these details to speed things up.
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Your workspace name (or the email you signed up with)</li>
            <li>The invoice number (e.g. INV-10421) if relevant</li>
            <li>What you expected vs what happened</li>
            <li>A screenshot if possible</li>
          </ul>
        </Card>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="secondary" className="shadow-[var(--shadow-sm)]">
            <Link href={routes.auth.register}>Start free</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/privacy">Privacy</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/terms">Terms</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

