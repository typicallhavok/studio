import { LucideIcon } from 'lucide-react';

export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  location: string;
  user?: string;
  lastUpdate: string;
  icon: LucideIcon;
  cid: string;
  size?: number;
  description?: string;
  password?: string;
  previous?: string;
}

export interface ChainEvent {
  timestamp: number;
  action: string;
  actor: string;
  details: string;
  evidenceId?: string;
}
