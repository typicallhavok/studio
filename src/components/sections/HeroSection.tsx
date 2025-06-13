import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Lock, Zap } from 'lucide-react'; // Added Lock and Zap for visual elements
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 text-white py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        {/* Subtle background pattern or elements could be added here */}
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">
          {/* Text Content Column */}
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 text-white hover:text-slate-200 transition-colors">
              <ShieldCheck className="h-9 w-9 sm:h-10 sm:w-10 text-accent" />
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight font-headline">Chain of Custody</span>
            </Link>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold mb-6 leading-tight font-headline">
              Secure Evidence, <br className="hidden sm:inline" />
              Assured Integrity.
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0 font-body">
              The leading platform for tamper-proof evidence management. Join professionals worldwide in upholding the highest standards of forensic and legal practice.
            </p>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 text-base sm:text-lg"
              asChild
            >
              <Link href="#dashboard">Explore Dashboard</Link>
            </Button>
          </div>

          {/* Image Content Column */}
          <div className="relative mt-12 lg:mt-0 mx-auto lg:mx-0 w-full max-w-md lg:max-w-xl xl:max-w-2xl h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px]">
            {/* Larger Screen Image - Chain of Evidence / Branching */}
            <div className="absolute top-0 right-0 w-[75%] h-[70%] sm:w-[80%] sm:h-[75%] md:w-[85%] md:h-[80%] rounded-lg overflow-hidden shadow-2xl transform translate-x-[5%] -translate-y-[5%] lg:translate-x-[10%] lg:-translate-y-[10%] border-2 border-purple-400/30">
              <Image
                src="https://placehold.co/1200x800.png"
                alt="Chain of Evidence Visualization"
                layout="fill"
                objectFit="cover"
                className="opacity-90"
                data-ai-hint="evidence graph"
              />
            </div>
            {/* Phone Image - IPFS Encrypted Log */}
            <div className="absolute bottom-0 left-0 w-[40%] h-[80%] sm:w-[40%] sm:h-[85%] md:w-[45%] md:h-[90%] rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-indigo-400/50 transform -translate-x-[10%] translate-y-[10%] lg:-translate-x-[15%] lg:translate-y-[15%]">
              <Image
                src="https://placehold.co/400x800.png"
                alt="Encrypted Log File on Phone (IPFS)"
                layout="fill"
                objectFit="cover"
                data-ai-hint="encrypted log ipfs"
              />
            </div>
             {/* Small decorative element - floating UI card */}
            <div className="absolute top-[30%] left-[20%] w-28 h-20 bg-slate-800/70 backdrop-blur-md rounded-lg shadow-xl -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center p-2 border border-slate-700">
                 <div className="text-center">
                    <Lock className="h-5 w-5 text-green-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-300">Encrypted Log</p>
                 </div>
            </div>
             <div className="absolute bottom-[25%] right-[15%] w-24 h-16 bg-purple-700/70 backdrop-blur-md rounded-lg shadow-xl translate-x-1/2 translate-y-1/2 hidden md:flex items-center justify-center p-2 border border-purple-600">
                <div className="text-center">
                    <Zap className="h-5 w-5 text-yellow-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-200">AI Verified</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
