import ChainTimelineChart from '@/components/chain-of-evidence/ChainTimelineChart';
import type { ChainEvent } from '@/types/evidence';
import { GitFork } from 'lucide-react'; // Using GitFork as GitBranch is not available

const mockChainEvents: ChainEvent[] = [
  { evidenceId: 'EV001', timestamp: new Date('2024-07-15 09:00:00').getTime(), action: 'Logged', actor: 'Officer K. Minogue', details: 'Collected from scene' },
  { evidenceId: 'EV001', timestamp: new Date('2024-07-15 09:30:00').getTime(), action: 'Hashed', actor: 'System', details: 'SHA256: a1b2c3d4e5f6...' },
  { evidenceId: 'EV001', timestamp: new Date('2024-07-15 10:00:00').getTime(), action: 'Stored', actor: 'Officer K. Minogue', details: 'Central Vault A-01' },
  { evidenceId: 'EV001', timestamp: new Date('2024-07-15 14:00:00').getTime(), action: 'Access Request', actor: 'Detective L. Richie', details: 'View evidence' },
  { evidenceId: 'EV001', timestamp: new Date('2024-07-15 14:05:00').getTime(), action: 'Accessed', actor: 'Detective L. Richie', details: 'Viewed metadata' },
  { evidenceId: 'EV001', timestamp: new Date('2024-07-16 10:00:00').getTime(), action: 'Transferred', actor: 'Officer K. Minogue', details: 'To Forensics Lab, Courier J. Donovan' },
];

export default function ChainOfEvidenceSection() {
  // In a real app, you would select an evidence ID and fetch its events.
  const selectedEvidenceId = 'EV001';
  const eventsForSelectedEvidence = mockChainEvents.filter(event => event.evidenceId === selectedEvidenceId);

  return (
    <section id="chain-of-evidence" className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <GitFork className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-headline font-semibold">Chain of Evidence Visualization</h2>
      </div>
      <ChainTimelineChart events={eventsForSelectedEvidence} evidenceId={selectedEvidenceId} />
    </section>
  );
}
