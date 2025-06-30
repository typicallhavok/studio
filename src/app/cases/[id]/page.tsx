'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Upload, ArrowLeft, Eye, Download, MapPin, Clock, User, FileText, Shield } from 'lucide-react';
import EvidenceCard from '@/components/dashboard/EvidenceCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/layout/Navbar';
import { LucideIcon, FileText as FileTextIcon, VideoIcon, BookOpen, HardDrive } from 'lucide-react';
import { UploadSection } from '@/components/dashboard/UploadSection';

interface EvidenceItem {
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
  caseId?: string; // Add caseId to the interface
}

// Updated Protected Layout to match other pages
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/cases');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 border-l border-r border-white/20 shadow-2xl mt-2 rounded-lg">
        <div className="flex h-[calc(100vh-5rem)]">
          <div className="flex-1 flex justify-center">
            <main className="w-full max-w-6xl rounded-xl p-6 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

// Evidence Details Modal Component
function EvidenceDetailsModal({ evidence, isOpen, onClose }: {
  evidence: EvidenceItem | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!evidence) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Evidence Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-card-foreground">{evidence.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4" />
                Last updated: {evidence.lastUpdate}
              </p>
            </div>
            {evidence.password === "true" && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Shield className="h-3 w-3 mr-1" />
                Password Protected
              </Badge>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">Description</p>
                <p className="text-sm text-muted-foreground">{evidence.description || 'No description provided'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-card-foreground">File Type</p>
                <p className="text-sm text-muted-foreground">{evidence.type}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-card-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Uploaded By
                </p>
                <p className="text-sm text-muted-foreground">{evidence.user || 'Unknown'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">File Size</p>
                <p className="text-sm text-muted-foreground">
                  {evidence.size ? formatFileSize(evidence.size) : 'Unknown'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-card-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </p>
                <p className="text-sm text-muted-foreground font-mono">{evidence.location}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-card-foreground">IPFS CID</p>
                <p className="text-sm text-muted-foreground font-mono break-all">{evidence.cid}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-card-foreground">Case ID</p>
                <p className="text-sm text-muted-foreground">{evidence.caseId}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Chain
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CaseContent() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ total: 0, loaded: 0 });
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCaseEvidence = async () => {
      if (!caseId) return;

      try {
        setIsLoading(true);
        console.log('Fetching files for case ID:', caseId);
        
        // Step 1: Fetch all files for this specific case
        const filesResponse = await fetch(`/api/files?caseId=${encodeURIComponent(caseId)}`, {
          credentials: 'include'
        });

        if (!filesResponse.ok) {
          throw new Error(`Failed to fetch files: ${filesResponse.statusText}`);
        }

        const filesData = await filesResponse.json();
        console.log('Files data received:', filesData);
        
        // Filter files to ensure they belong to this case (double-check)
        const caseSpecificFiles = filesData.filter((file: any) => 
          file.caseId === caseId || file.caseID === caseId
        );
        
        console.log('Case-specific files:', caseSpecificFiles);
        setProgress({ total: caseSpecificFiles.length, loaded: 0 });

        if (caseSpecificFiles.length === 0) {
          setEvidence([]);
          setIsLoading(false);
          return;
        }

        // Step 2: For each file CID, fetch detailed evidence from blockchain
        const evidenceDetails = [];
        for (const file of caseSpecificFiles) {
          try {
            const evidenceResponse = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || 'http://localhost:3000'}/evidence/${file.cid}`);

            if (!evidenceResponse.ok) {
              console.error(`Failed to fetch evidence for CID ${file.cid}`);
              // Still add basic file info even if blockchain fetch fails
              evidenceDetails.push({
                id: file.cid || file._id,
                name: file.name || 'Unknown File',
                type: file.fileType || file.mimeType || 'Digital File',
                location: file.location || 'Unknown Location',
                user: file.user || 'Unknown User',
                lastUpdate: file.timestamp ? new Date(file.timestamp).toLocaleString() : new Date().toLocaleString(),
                icon: getFileIcon(file.fileType || file.mimeType || ''),
                cid: file.cid || '',
                size: file.size || 0,
                description: file.description || '',
                password: file.password ? "true" : "false",
                caseId: file.caseId || file.caseID
              });
              continue;
            }

            const data = await evidenceResponse.json();
            
            // Map to the expected format for EvidenceCard
            evidenceDetails.push({
              id: data.cid,
              name: data.name,
              type: data.fileType || 'Digital File',
              location: `${data.location?.latitude || 0},${data.location?.longitude || 0}`,
              user: data.collectedBy,
              lastUpdate: new Date(data.collectionTimestamp).toLocaleString(),
              icon: getFileIcon(data.fileType || ''),
              cid: data.cid,
              size: Number(data.fileSize),
              description: data.description || '',
              password: data.passwordProtected ? "true" : "false",
              caseId: caseId // Ensure we set the current case ID
            });
          } catch (err) {
            console.error(`Error fetching evidence detail for ${file.cid}:`, err);
            // Add basic file info as fallback
            evidenceDetails.push({
              id: file.cid || file._id,
              name: file.name || 'Unknown File',
              type: file.fileType || file.mimeType || 'Digital File',
              location: file.location || 'Unknown Location',
              user: file.user || 'Unknown User',
              lastUpdate: file.timestamp ? new Date(file.timestamp).toLocaleString() : new Date().toLocaleString(),
              icon: getFileIcon(file.fileType || file.mimeType || ''),
              cid: file.cid || '',
              size: file.size || 0,
              description: file.description || '',
              password: file.password ? "true" : "false",
              caseId: file.caseId || file.caseID
            });
          }

          // Update progress
          setProgress(prev => ({ ...prev, loaded: prev.loaded + 1 }));
        }

        console.log('Final evidence details:', evidenceDetails);
        setEvidence(evidenceDetails);

      } catch (err: any) {
        setError(err.message || 'Failed to load evidence');
        console.error('Error fetching case evidence:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseEvidence();
  }, [caseId]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileTextIcon;
    if (mimeType.startsWith('video/')) return VideoIcon;
    if (mimeType.startsWith('application/pdf')) return BookOpen;
    return HardDrive;
  };

  // Function to refresh the evidence after successful upload
  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    // Refetch the evidence to show the newly uploaded item
    const fetchCaseEvidence = async () => {
      try {
        const filesResponse = await fetch(`/api/files?caseId=${encodeURIComponent(caseId)}`, {
          credentials: 'include'
        });
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          
          // Filter to ensure only files for this case
          const caseSpecificFiles = filesData.filter((file: any) => 
            file.caseId === caseId || file.caseID === caseId
          );
          
          const evidenceDetails = [];
          
          for (const file of caseSpecificFiles) {
            try {
              const evidenceResponse = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || 'http://localhost:3000'}/evidence/${file.cid}`);
              if (evidenceResponse.ok) {
                const data = await evidenceResponse.json();
                evidenceDetails.push({
                  id: data.cid,
                  name: data.name,
                  type: data.fileType || 'Digital File',
                  location: `${data.location?.latitude || 0},${data.location?.longitude || 0}`,
                  user: data.collectedBy,
                  lastUpdate: new Date(data.collectionTimestamp).toLocaleString(),
                  icon: getFileIcon(data.fileType || ''),
                  cid: data.cid,
                  size: Number(data.fileSize),
                  description: data.description || '',
                  password: data.passwordProtected ? "true" : "false",
                  caseId: caseId
                });
              } else {
                // Fallback to file data
                evidenceDetails.push({
                  id: file.cid || file._id,
                  name: file.name || 'Unknown File',
                  type: file.fileType || file.mimeType || 'Digital File',
                  location: file.location || 'Unknown Location',
                  user: file.user || 'Unknown User',
                  lastUpdate: file.timestamp ? new Date(file.timestamp).toLocaleString() : new Date().toLocaleString(),
                  icon: getFileIcon(file.fileType || file.mimeType || ''),
                  cid: file.cid || '',
                  size: file.size || 0,
                  description: file.description || '',
                  password: file.password ? "true" : "false",
                  caseId: file.caseId || file.caseID
                });
              }
            } catch (err) {
              console.error(`Error fetching evidence detail for ${file.cid}:`, err);
            }
          }
          setEvidence(evidenceDetails);
        }
      } catch (err) {
        console.error('Error refetching evidence:', err);
      }
    };
    fetchCaseEvidence();
  };

  const handleViewDetails = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setIsDetailsModalOpen(true);
  };

  return (
    <section id="case-details" className="py-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-card-foreground">Case #{caseId}</h1>
            {caseDetails && (
              <span className="text-muted-foreground">{caseDetails.name}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm">
            {!isLoading && !error && (
              <span>{evidence.length} {evidence.length === 1 ? 'item' : 'items'}</span>
            )}
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Evidence to Case #{caseId}</DialogTitle>
              </DialogHeader>
              <UploadSection fixedCaseId={caseId} onUploadSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading evidence... {progress.total > 0 ? `(${progress.loaded}/${progress.total})` : ''}</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <>
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Evidence Items ({evidence.length})</h2>
          <div className="flex flex-wrap gap-6">
            {evidence.map(item => (
              <div key={item.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-shrink-0">
                <EvidenceCard 
                  item={item} 
                  onViewDetails={() => handleViewDetails(item)}
                />
              </div>
            ))}
          </div>
          {evidence.length === 0 && (
            <div className="bg-background p-8 rounded-lg text-center mt-6">
              <p className="text-muted-foreground mb-2">No evidence found for this case.</p>
              <p className="text-sm text-muted-foreground">Upload some evidence to get started.</p>
            </div>
          )}
        </>
      )}

      {/* Evidence Details Modal */}
      <EvidenceDetailsModal
        evidence={selectedEvidence}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEvidence(null);
        }}
      />
    </section>
  );
}

export default function CaseDetailsPage() {
  return (
    <ProtectedLayout>
      <CaseContent />
    </ProtectedLayout>
  );
}