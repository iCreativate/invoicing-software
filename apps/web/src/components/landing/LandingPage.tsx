import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { TimelyFlow } from '@/components/landing/TimelyFlow';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { CollectionsSection } from '@/components/landing/CollectionsSection';
import { CashflowSection } from '@/components/landing/CashflowSection';
import { ClientSection } from '@/components/landing/ClientSection';
import { EditorialSection } from '@/components/landing/EditorialSection';
import { InsightsSection } from '@/components/landing/InsightsSection';
import { BentoFeatures } from '@/components/landing/BentoFeatures';
import { ProofSection } from '@/components/landing/ProofSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FinalCta } from '@/components/landing/FinalCta';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Reveal } from '@/components/landing/landingMotion';

export function LandingPage() {
  return (
    <div className="ti-landing min-h-dvh">
      <LandingNav />
      <main id="main">
        <Hero />
        <Reveal>
          <ProblemSection />
                </Reveal>
        <Reveal delayMs={40}>
          <TimelyFlow />
                </Reveal>
        <Reveal>
          <ProductShowcase />
                </Reveal>
        <Reveal delayMs={40}>
          <CollectionsSection />
                </Reveal>
        <Reveal>
          <CashflowSection />
                </Reveal>
        <Reveal delayMs={40}>
          <ClientSection />
            </Reveal>
              <Reveal>
          <EditorialSection />
              </Reveal>
        <Reveal delayMs={40}>
          <InsightsSection />
              </Reveal>
              <Reveal>
          <BentoFeatures />
              </Reveal>
        <Reveal delayMs={40}>
          <ProofSection />
                </Reveal>
              <Reveal>
          <PricingSection />
              </Reveal>
        <Reveal delayMs={40}>
          <FinalCta />
            </Reveal>
      </main>
      <LandingFooter />
    </div>
  );
}
