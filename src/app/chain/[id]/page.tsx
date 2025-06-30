"use client";

import React, { useEffect, useState } from "react";
import { fetchEvidence, EvidenceRecord } from "../../../lib/blockchain";
import { format } from "date-fns";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Download, AlertTriangle, Link, Clock, User, FileText, MapPin, Shield } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useParams } from "next/navigation";
import { PasswordModal } from "@/components/modals/PasswordModal";
import { decryptFile } from '@/lib/encryption';
import { useToast } from '@/hooks/use-toast';
import { getFromIPFS } from "@/lib/ipfs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface ChainItem extends EvidenceRecord {
  fileData?: Blob;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/chain');
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 border-l border-r border-white/20 shadow-2xl">
        <div className="h-full flex justify-center mt-4">
          <main className="w-full max-w-6xl bg-card rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ChainEvidenceContent({ id }: { id: string }) {
  const [chainItems, setChainItems] = useState<ChainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [currentDownloadItem, setCurrentDownloadItem] = useState<ChainItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchChainOfEvidence = async (evidenceId: string) => {
      try {
        setLoading(true);
        const evidenceChain: ChainItem[] = [];

        // Start with the current ID
        let currentId = evidenceId;
        let hasMoreItems = true;

        // Recursively fetch the chain of evidence
        while (hasMoreItems && currentId) {
          // Get evidence details from blockchain
          const evidenceDetails = await fetchEvidence(currentId);

          // Get the file data if available
          let fileData: Blob | undefined = undefined;
          try {
            const fileResponse = await fetch("/api/file", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ fileID: currentId }),
            });

            if (fileResponse.ok) {
              fileData = await fileResponse.blob();
            }
          } catch (fileError) {
            console.warn("Could not fetch file data:", fileError);
          }

          // Add to our chain
          evidenceChain.push({
            ...evidenceDetails,
            fileData,
          });

          // Check if there's a previous item in the chain
          if (typeof evidenceDetails.previous === "string" && evidenceDetails.previous) {
            currentId = evidenceDetails.previous;
          } else {
            hasMoreItems = false;
          }
        }

        setChainItems(evidenceChain);
      } catch (err) {
        console.error("Error fetching chain of evidence:", err);
        setError("Failed to load the chain of evidence.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChainOfEvidence(id);
    }
  }, [id]);

  // Add this function to handle file downloads
  const handleDownload = async (item: ChainItem) => {
    if (!item.cid) return;

    setIsDownloading(true);

    try {
      const blob = await getFromIPFS(item.cid); // same as in EvidenceCard
      if (item.passwordProtected === true) {
        // For password-protected files, show modal and store blob
        setCurrentDownloadItem({ ...item, fileData: blob });
        setPasswordModalOpen(true);
        setIsDownloading(false);
      } else {
        // For unprotected files, download directly
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name || `evidence-${item.cid}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        await fetch("/api/log", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "download",
            fileName: item.name,
            timestamp: new Date().toISOString(),
          }),
        });

        toast({ title: "Download successful", description: "File has been downloaded" });
        setIsDownloading(false);
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error retrieving the file from IPFS",
      });
      setIsDownloading(false);
    }
  };


  // Add this function to handle password submission
  const handlePasswordSubmit = async (password: string) => {
    if (!currentDownloadItem?.fileData) return;

    setIsDownloading(true);
    setPasswordError(undefined);

    try {
      const keyRequest = {
        method: 'POST',
        credentials: "include" as RequestCredentials,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePassword: password,
          fileName: currentDownloadItem.name
        }),
      };

      const keyResponse = await fetch('/api/encryptionkey', keyRequest);
      if (!keyResponse.ok) throw new Error('Failed to get encryption key from server');

      const { key } = await keyResponse.json();
      const { blob, metadata } = await decryptFile(currentDownloadItem.fileData, key);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.name || `evidence-${currentDownloadItem.cid}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      await fetch("/api/log", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          fileName: currentDownloadItem.name,
          timestamp: new Date().toISOString(),
        }),
      });

      toast({
        title: "Download successful",
        description: "File has been decrypted and downloaded",
      });

      setPasswordModalOpen(false);
    } catch (error) {
      console.error("Decryption error:", error);
      setPasswordError("Incorrect password. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-card-foreground">Chain of Evidence</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading chain of evidence...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-card-foreground">Chain of Evidence</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-card-foreground">Chain of Evidence</h1>
      </div>

      {chainItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No evidence records found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Evidence Chain Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Evidence ID</p>
                  <p className="font-mono text-sm break-all">{id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chain Length</p>
                  <p className="text-lg font-semibold text-primary">{chainItems.length} version{chainItems.length !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latest Update</p>
                  <p className="text-sm">{format(new Date(chainItems[0]?.collectionTimestamp), "PPp")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chain Timeline */}
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
            
            <div className="space-y-8">
              {chainItems.map((item, index) => (
                <div key={item.cid} className="relative">
                  {/* Timeline marker */}
                  <div className="absolute left-6 w-4 h-4 bg-primary rounded-full border-4 border-background"></div>
                  
                  {/* Version badge */}
                  <div className="absolute left-0 top-0">
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      v{chainItems.length - index}
                    </Badge>
                  </div>

                  {/* Evidence card */}
                  <div className="ml-16">
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {item.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(item.collectionTimestamp), "PPpp")}
                            </p>
                          </div>
                          {item.passwordProtected && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-card-foreground">Description</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-card-foreground">Case ID</p>
                              <p className="text-sm text-muted-foreground">{item.caseId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-card-foreground flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Collected By
                              </p>
                              <p className="text-sm text-muted-foreground">{item.collectedBy}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-card-foreground">File Details</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Size: {formatFileSize(item.fileSize)}</p>
                                <p>Type: {item.fileType}</p>
                                <p className="font-mono break-all">CID: {item.cid}</p>
                              </div>
                            </div>
                            
                            {item.location && (
                              <div>
                                <p className="text-sm font-medium text-card-foreground flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  Location
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {item.fileData && (
                          <div className="mt-6 pt-4 border-t border-border">
                            <Button
                              onClick={() => handleDownload(item)}
                              disabled={isDownloading}
                              className="flex items-center gap-2"
                            >
                              {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              Download File
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setPasswordError(undefined);
        }}
        onSubmit={handlePasswordSubmit}
        isLoading={isDownloading}
        error={passwordError}
      />
    </section>
  );
}

export default function ChainEvidencePage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <ProtectedLayout>
      <ChainEvidenceContent id={id} />
    </ProtectedLayout>
  );
}