import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';

export const metadata: Metadata = {
  title: 'Privacy Policy — TimelyInvoices',
  description: 'How TimelyInvoices collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit font-normal">
            Legal
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            This policy explains how TimelyInvoices collects, uses, and protects personal information. It is written for
            clarity and supports compliance with applicable South African privacy principles (including POPIA).
          </p>
          <p className="text-xs text-muted-foreground">Last updated: 30 April 2026</p>
        </header>

        <Card className="mt-6 rounded-xl border-border p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-sm font-semibold">1. What we collect</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  <span className="text-foreground">Account information</span> such as name, email, and login/session data.
                </li>
                <li>
                  <span className="text-foreground">Workspace data</span> you enter or upload: clients, invoices, quotes,
                  payments, expenses, products/services, and settings.
                </li>
                <li>
                  <span className="text-foreground">Usage and device information</span> such as pages viewed, feature usage,
                  and basic diagnostics (for reliability and security).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-semibold">2. How we use information</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Provide the service (create invoices, track status, manage data, and process actions you request).</li>
                <li>Authenticate users, prevent abuse, and secure accounts.</li>
                <li>Improve product performance, usability, and support.</li>
                <li>Communicate service notices (e.g. important changes or security updates).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-semibold">3. Sharing and subprocessors</h2>
              <p className="mt-2 text-muted-foreground">
                TimelyInvoices uses trusted infrastructure providers to run the app (database, storage, hosting, email,
                and payments). We share only what is necessary to deliver the service and support operations. We do not
                sell your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">4. Payments</h2>
              <p className="mt-2 text-muted-foreground">
                When you use payment features, payment providers may process information required to complete a
                transaction (such as payment method details). TimelyInvoices does not store full card details.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">5. Data retention</h2>
              <p className="mt-2 text-muted-foreground">
                We retain data for as long as your account is active and as needed to provide the service. You can
                request export or deletion where applicable, subject to legal and operational requirements.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">6. Security</h2>
              <p className="mt-2 text-muted-foreground">
                We use reasonable technical and organisational safeguards to protect data. No system is 100% secure, but
                we continuously work to reduce risk and respond to issues promptly.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">7. Your rights</h2>
              <p className="mt-2 text-muted-foreground">
                You may request access, correction, export, or deletion of your personal information where applicable.
                If you have questions or requests, contact us.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold">8. Contact</h2>
              <p className="mt-2 text-muted-foreground">
                For privacy questions or requests, use the contact page.
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

