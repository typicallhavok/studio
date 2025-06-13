import FeatureCard from '@/components/features/FeatureCard';
import { FilePlus2, UsersRound, Archive, ScrollText, PuzzleIcon } from 'lucide-react';

const otherFeatures = [
  {
    title: 'Evidence Logging',
    description: 'Secure evidence logging with blockchain timestamping and hashing, ensuring immutability and verifiability of each record.',
    icon: FilePlus2,
  },
  {
    title: 'Access Control',
    description: 'Role-based access control for evidence viewing, modification, and transfer, based on secure cryptographic identification methods.',
    icon: UsersRound,
  },
  {
    title: 'Secure Storage',
    description: 'Secure file storage using blockchain for verifiable backups. Guarantees long-term evidence availability, recoverability, and file integrity checks.',
    icon: Archive,
  },
  {
    title: 'Audit Trails',
    description: 'Automatic generation of comprehensive audit trails documenting all evidence-related activities, secured by blockchain technology for tamper-proof records.',
    icon: ScrollText,
  },
];

export default function OtherFeaturesSection() {
  return (
    <section id="other-features" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <PuzzleIcon className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-headline font-semibold">Core Platform Capabilities</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {otherFeatures.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </section>
  );
}
