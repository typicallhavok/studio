import type { LucideIcon } from 'lucide-react';

export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  status: 'In Storage' | 'In Transit' | 'Under Analysis' | 'Awaiting Transfer' | 'Archived';
  location: string;
  lastHandler: string;
  lastUpdate: string;
  icon: LucideIcon;
}

export interface ChainEvent {
  timestamp: number;
  action: string;
  actor: string;
  details: string;
  evidenceId?: string;
}
