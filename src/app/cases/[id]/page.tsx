'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import EvidenceCard from '@/components/dashboard/EvidenceCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { LucideIcon, FileText, VideoIcon, BookOpen, HardDrive  } from 'lucide-react';
import { UploadSection } from '@/components/dashboard/UploadSection';

interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  location: string;
  user?: string;
  lastUpdate: string; // Note: this was misspelled as "laastUpdate" in your interface
  icon: LucideIcon;
  cid: string;
  size?: number;
  description?: string;
  password?: string;
}

// Reuse the same Protected Layout from dashboard
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
      <Navbar />
      <div className="container mx-auto px-4">
        <div className="flex flex-1 mt-4 rounded-lg overflow-hidden">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 bg-card rounded-lg shadow-xl p-6 overflow-auto ml-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function CaseContent() {
  const params = useParams();
  const caseId = params.id as string;

  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ total: 0, loaded: 0 });

  useEffect(() => {
    const fetchCaseEvidence = async () => {
      if (!caseId) return;

      try {
        setIsLoading(true);
        // Step 1: Fetch all files for this case from your file API
        const filesResponse = await fetch(`/api/files?caseId=${caseId}`);

        if (!filesResponse.ok) {
          throw new Error(`Failed to fetch files: ${filesResponse.statusText}`);
        }

        const filesData = await filesResponse.json();
        setProgress({ total: filesData.length, loaded: 0 });

        // Step 2: For each file CID, fetch detailed evidence from blockchain
        const evidenceDetails = [];
        for (const file of filesData) {
          try {
            const evidenceResponse = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || 'http://localhost:3000'}/evidence/${file.cid}`);

            if (!evidenceResponse.ok) {
              console.error(`Failed to fetch evidence for CID ${file.cid}`);
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
              password: data.passwordProtected ? "true" : "false"
            });
          } catch (err) {
            console.error(`Error fetching evidence detail for ${file.cid}:`, err);
          }

          // Update progress
          setProgress(prev => ({ ...prev, loaded: prev.loaded + 1 }));
        }

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

  // Helper function to format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Don't forget to add this function at the top of your component
  const getFileIcon = (mimeType: string) => {
    // Import these at the top of your file
    
    if (mimeType.startsWith('image/')) return FileText;
    if (mimeType.startsWith('video/')) return VideoIcon;
    if (mimeType.startsWith('application/pdf')) return BookOpen;
    return HardDrive;
  };

  return (
    <section id="case-details" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Case #{caseId}</h1>
        {caseDetails && (
          <span className="text-gray-600">{caseDetails.name}</span>
        )}
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
          <h2 className="text-xl font-semibold mb-4">Evidence Items ({evidence.length})</h2>
          <div className="flex flex-wrap gap-6">
            {evidence.map(item => (
              <div key={item.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-shrink-0">
                <EvidenceCard item={item} />
              </div>
            ))}
          </div>
          {evidence.length === 0 && (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No evidence found for this case.</p>
            </div>
          )}
        </>
      )}
      <div className="m-3 max-w-xl justify-center mx-auto">
        <UploadSection />
      </div>
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