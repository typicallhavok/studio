import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  MoreVertical,
  Clock,
  MapPin,
  User,
  Shield,
  Download,
  Eye,
  Lock,
  FileText
} from 'lucide-react';
import type { EvidenceItem } from '@/types/evidence';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatFileSize } from "@/lib/utils";

interface EvidenceCardProps {
  item: EvidenceItem;
}

// Map status to badge variant
const getStatusBadge = (
  status: string
): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
  const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'In Storage': 'outline',
    'In Transit': 'secondary',
    'Under Analysis': 'default',
    'Awaiting Transfer': 'secondary',
    'Verified': 'default',
    'Secure': 'outline'
  };

  return statusMap[status] || 'outline';
};

export default function EvidenceCard({ item }: EvidenceCardProps) {
  const IconComponent = item.icon || FileText;
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border bg-white">
      <div className={`h-2 w-full bg-primary`}></div>
      <CardContent className="pt-6 bg-purple-800/20">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-md bg-blue-50">
              <IconComponent className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium line-clamp-1 text-gray-900" title={item.name}>{item.name}</h3>
              <p className="text-sm text-gray-600">#{item.id}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" /> View details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" /> Verify integrity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-2 mt-2">
          <div className="flex items-start gap-2">
            <Badge variant={getStatusBadge(item.status)} className="mr-1 font-medium text-black">
              {item.status}
            </Badge>
            {item.encrypted && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
                <Lock className="h-3 w-3 mr-1" />
                Encrypted
              </Badge>
            )}
          </div>
          
          <div className="mt-4 space-y-3 text-sm">
            {item.caseId && (
              <div className="flex items-center gap-2 text-gray-700">
                <Shield className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                <span>Case: <span className="font-medium">{item.caseId}</span></span>
              </div>
            )}
            
            {item.size && (
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                <span>{formatFileSize(item.size)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
              <span>{item.location}</span>
            </div>
            
            {item.lastHandler && (
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                <span>{item.lastHandler}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
              <span>{item.lastUpdate}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-100 bg-gray-100 px-6 py-3">
        <div className="w-full flex justify-between items-center">
          <span className="text-xs text-gray-600 font-medium">{item.type}</span>
          {item.ipfsHash && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                View details
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
