import type { EvidenceItem } from '@/types/evidence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, UserCircle, Clock } from 'lucide-react';

interface EvidenceCardProps {
  item: EvidenceItem;
}

const statusColors: Record<EvidenceItem['status'], string> = {
  'In Storage': 'bg-green-500 hover:bg-green-600',
  'In Transit': 'bg-blue-500 hover:bg-blue-600',
  'Under Analysis': 'bg-yellow-500 hover:bg-yellow-600 text-black',
  'Awaiting Transfer': 'bg-gray-500 hover:bg-gray-600',
  'Archived': 'bg-purple-500 hover:bg-purple-600',
};

export default function EvidenceCard({ item }: EvidenceCardProps) {
  const IconComponent = item.icon;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className="h-8 w-8 text-primary" />
            <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">{item.id}</Badge>
        </div>
        <CardDescription className="pt-1 text-sm">{item.type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Badge className={`${statusColors[item.status]} text-primary-foreground text-xs`}>{item.status}</Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>{item.lastHandler}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{item.lastUpdate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
