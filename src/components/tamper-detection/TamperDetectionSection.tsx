import TamperDetectionForm from '@/components/tamper-detection/TamperDetectionForm';
import { Cpu } from 'lucide-react';

export default function TamperDetectionSection() {
  return (
    <section id="tamper-detection" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <Cpu className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-headline font-semibold">AI-Powered Tamper Detection</h2>
      </div>
      <p className="mb-6 text-muted-foreground">
        Utilize our advanced AI tool to analyze chain of custody logs and evidence data. Identify potential discrepancies, anomalies, or breaks in the established chain, ensuring the integrity of your evidence.
      </p>
      <TamperDetectionForm />
    </section>
  );
}
