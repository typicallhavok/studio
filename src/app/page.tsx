
import HeroSection from '@/components/sections/HeroSection';
// import DashboardSection from '@/components/dashboard/DashboardSection'; // No longer shown on home
import ChainOfEvidenceSection from '@/components/chain-of-evidence/ChainOfEvidenceSection';
import TamperDetectionSection from '@/components/tamper-detection/TamperDetectionSection';
import OtherFeaturesSection from '@/components/features/OtherFeaturesSection';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
        <div className="space-y-12 md:space-y-16">
          {/* Dashboard is now on its own page, accessible via login */}
          {/* <div id="dashboard"> // This id is no longer needed here
            <DashboardSection />
          </div> */}
          <Separator className="my-8 md:my-12" />
          <OtherFeaturesSection />
          <Separator className="my-8 md:my-12" />
          <ChainOfEvidenceSection />
          <Separator className="my-8 md:my-12" />
          <TamperDetectionSection />
        </div>
      </main>
      <footer className="py-6 mt-12 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} TrustLedger. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
