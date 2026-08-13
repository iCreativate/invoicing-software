import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';

export const metadata: Metadata = {
  title: 'Terms of Service — TimelyInvoices',
  description: 'Terms and conditions for using TimelyInvoices.',
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit font-normal">
            Legal
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            These terms govern your use of TimelyInvoices. By creating an account or using the service, you agree to
            these terms.
          </p>
          <p className="text-xs text-muted-foreground">Last updated: 30 April 2026</p>
        </header>

        <Card className="mt-6 rounded-xl border-border p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-sm font-semibold">1. The service</h2>
              <p className="mt-2 text-muted-foreground">
                TimelyInvoices is invoicing and cashflow software for creating and managing business documents (such as
                invoices and quotes) and tracking payment status.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">2. Accounts and access</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>You are responsible for maintaining the confidentiality of your account.</li>
                <li>You must provide accurate information and keep it reasonably up to date.</li>
                <li>You may not access the service in a way intended to disrupt, harm, or abuse others.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-semibold">3. Your content</h2>
              <p className="mt-2 text-muted-foreground">
                You retain ownership of the data you upload or enter into TimelyInvoices. You grant TimelyInvoices a
                limited right to process that data only to provide and improve the service.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">4. Acceptable use</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Do not use the service for unlawful activity or to violate third-party rights.</li>
                <li>Do not attempt to probe, scan, or test the vulnerability of the platform.</li>
                <li>Do not upload malware or engage in automated abuse.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-semibold">5. Billing and plans</h2>
              <p className="mt-2 text-muted-foreground">
                If you upgrade to a paid plan, fees are billed according to the plan you select. Taxes may apply. Plan
                details and pricing are shown at checkout or in-app.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">6. Availability</h2>
              <p className="mt-2 text-muted-foreground">
                We aim for reliable uptime, but the service may occasionally be unavailable due to maintenance or
                unexpected issues. We will make reasonable efforts to restore service promptly.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">7. Disclaimers</h2>
              <p className="mt-2 text-muted-foreground">
                TimelyInvoices is provided on an “as is” basis. TimelyInvoices does not provide legal, tax, or accounting
                advice. You are responsible for verifying outputs and compliance for your business.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">8. Limitation of liability</h2>
              <p className="mt-2 text-muted-foreground">
                To the maximum extent permitted by law, TimelyInvoices will not be liable for indirect, incidental, or
                consequential damages, or loss of profits, revenue, or data arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">9. Termination</h2>
              <p className="mt-2 text-muted-foreground">
                You may stop using the service at any time. We may suspend or terminate access if we reasonably believe
                there is abuse, fraud, or material breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">10. Contact</h2>
              <p className="mt-2 text-muted-foreground">
                Questions about these terms can be sent via the contact page.
              </p>
              <div className="mt-3">
                <Button asChild variant="secondary" className="shadow-[var(--shadow-sm)]">
                  <Link href="/contact">Contact TimelyInvoices</Link>
                </Button>
              </div>
            </section>
          </div>
        </Card>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="secondary" className="shadow-[var(--shadow-sm)]">
            <Link href={routes.auth.register}>Start free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

