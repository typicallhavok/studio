import { LucideIcon } from 'lucide-react';

export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  lastHandler?: string;
  lastUpdate: string;
  icon: LucideIcon;
  ipfsHash?: string;
  size?: number;
  caseId?: string;
  description?: string;
  encrypted?: boolean;
}

export interface ChainEvent {
  timestamp: number;
  action: string;
  actor: string;
  details: string;
  evidenceId?: string;
}
