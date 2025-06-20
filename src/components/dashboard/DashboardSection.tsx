"use client";
import { useState, useEffect } from 'react';
import EvidenceCard from '@/components/dashboard/EvidenceCard';
import type { EvidenceItem } from '@/types/evidence';
import { FileText, BookOpen, VideoIcon, HardDrive, LayoutDashboard, Loader2, AlertTriangle } from 'lucide-react';
import { UploadSection } from "@/components/dashboard/UploadSection";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// File type icon mapping 
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileText;
  if (mimeType.startsWith('video/')) return VideoIcon;
  if (mimeType.startsWith('application/pdf')) return BookOpen;
  return HardDrive;
};

export default function DashboardSection() {
  const [caseFiles, setCaseFiles] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseFiles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/files', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch case files: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform API data into EvidenceItem format
        const formattedFiles: EvidenceItem[] = data.map((file: any) => ({
          id: file._id,
          name: file.name,
          type: file.fileType || file.mimeType || 'Digital File',
          location: file.location || 'IPFS Network',
          user: file.user,
          lastUpdate: file.timestamp ? new Date(file.timestamp).toLocaleString() : new Date().toLocaleString(),
          icon: getFileIcon(file.fileType || file.mimeType || ''),
          cid: file.cid || file.ipfsHash,
          size: file.size,
          description: file.description || '',
          password: file.password || true
        }));

        setCaseFiles(formattedFiles);
        setError(null);
      } catch (err) {
        console.error('Error fetching case files:', err);
        setError('Failed to load case files. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseFiles();
  }, []);

  return (
    <section id="dashboard" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-headline font-semibold">Real-Time Evidence Tracking</h2>
        </div>
        <div className="text-muted-foreground text-sm">
          {!isLoading && !error && (
            <span>{caseFiles.length} {caseFiles.length === 1 ? 'item' : 'items'}</span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading evidence files...</p>
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
          <div className="flex flex-wrap gap-6">
            {caseFiles.map(item => (
              <div key={item.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-shrink-0">
                <EvidenceCard item={item} />
              </div>
            ))}
          </div>

          <div className="max-w-2xl mt-10 mx-auto">
            <UploadSection />
          </div>

          {caseFiles.length === 0 && (
            <div className="bg-muted p-8 rounded-lg text-center mt-6">
              <p className="text-muted-foreground mb-2">No evidence files found.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
