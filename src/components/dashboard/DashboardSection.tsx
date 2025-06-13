import EvidenceCard from '@/components/dashboard/EvidenceCard';
import type { EvidenceItem } from '@/types/evidence';
import { FileText, BookOpen, VideoIcon, HardDrive, LayoutDashboard } from 'lucide-react';

const mockEvidence: EvidenceItem[] = [
  { id: 'EV001', name: 'Digital Photo_302', type: 'Digital File', status: 'In Storage', location: 'Central Vault A-01', lastHandler: 'Officer K. Minogue', lastUpdate: '2024-07-15 10:30 AM', icon: FileText },
  { id: 'EV002', name: 'Physical Ledger X1', type: 'Document', status: 'In Transit', location: 'Forensics Lab', lastHandler: 'Courier J. Donovan', lastUpdate: '2024-07-16 09:15 AM', icon: BookOpen },
  { id: 'EV003', name: 'CCTV Footage_North_Gate', type: 'Video Recording', status: 'Under Analysis', location: 'Analyst Desk 3', lastHandler: 'Analyst R. Astley', lastUpdate: '2024-07-16 11:00 AM', icon: VideoIcon },
  { id: 'EV004', name: 'Secure USB Drive Z7', type: 'Digital Storage', status: 'Awaiting Transfer', location: 'Precinct 4 Evidence Lockup', lastHandler: 'Sgt. P. Oakenfold', lastUpdate: '2024-07-14 17:45 PM', icon: HardDrive },
];

export default function DashboardSection() {
  return (
    <section id="dashboard" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-headline font-semibold">Real-Time Evidence Tracking</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockEvidence.map(item => (
          <EvidenceCard key={item.id} item={item} />
        ))}
      </div>
      {mockEvidence.length === 0 && (
        <p className="text-muted-foreground">No evidence items to display currently.</p>
      )}
    </section>
  );
}
