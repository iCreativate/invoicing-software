import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { TimelyFlow } from '@/components/landing/TimelyFlow';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { CollectionsSection } from '@/components/landing/CollectionsSection';
import { CashflowSection } from '@/components/landing/CashflowSection';
import { ClientSection } from '@/components/landing/ClientSection';
import { InsightsSection } from '@/components/landing/InsightsSection';
import { LocalSection } from '@/components/landing/LocalSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FinalCta } from '@/components/landing/FinalCta';
import { LandingFooter } from '@/components/landing/LandingFooter';

export function LandingPage() {
  return (
    <div className="ti-landing min-h-dvh">
      <LandingNav />
      <main>
        <Hero />
        <ProblemSection />
        <TimelyFlow />
        <ProductShowcase />
        <CollectionsSection />
        <CashflowSection />
        <ClientSection />
        <InsightsSection />
        <LocalSection />
        <TrustSection />
        <PricingSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
