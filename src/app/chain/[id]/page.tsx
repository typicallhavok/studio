"use client";

import React, { useEffect, useState } from "react";
import { fetchEvidence, EvidenceRecord } from "../../../lib/blockchain";
import { format } from "date-fns";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useParams } from "next/navigation";
import { PasswordModal } from "@/components/modals/PasswordModal"; // Add this import
import { decryptFile } from '@/lib/encryption'; // Add this import
import { useToast } from '@/hooks/use-toast'; // Add this import
import { getFromIPFS } from "@/lib/ipfs";


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
      router.push('/login?callbackUrl=/chainevidence');
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

function ChainEvidenceContent({ id }: { id: string }) {
  const [chainItems, setChainItems] = useState<ChainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add these new state variables for password handling
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


  // Helper function to download a file
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Chain of Evidence</h1>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Loading chain of evidence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Chain of Evidence</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Chain of Evidence</h1>

      {chainItems.length === 0 ? (
        <div>No evidence records found.</div>
      ) : (
        <div className="space-y-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Evidence ID: {id}</h2>
            <p className="text-gray-400">{chainItems.length} version{chainItems.length !== 1 ? 's' : ''} in chain</p>
          </div>

          <div className="border-l-2 border-blue-500 pl-4 space-y-12">
            {chainItems.map((item, index) => (
              <div key={item.cid} className="relative">
                <div className="absolute -left-6 mt-1.5 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {chainItems.length - index}
                </div>

                <div className="bg-slate-800 p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {format(new Date(item.collectionTimestamp), "PPpp")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-gray-200">
                    <div>
                      <p><span className="font-medium text-white">Description:</span> {item.description}</p>
                      <p><span className="font-medium text-white">Case ID:</span> {item.caseId}</p>
                      <p><span className="font-medium text-white">Collected By:</span> {item.collectedBy}</p>
                    </div>
                    <div>
                      <p><span className="font-medium text-white">File Size:</span> {(item.fileSize / 1024).toFixed(2)} KB</p>
                      <p><span className="font-medium text-white">File Type:</span> {item.fileType}</p>
                      <p><span className="font-medium text-white">CID:</span> {item.cid}</p>
                      {item.location && (
                        <p>
                          <span className="font-medium text-white">Location:</span> {' '}
                          {item.location.latitude}, {item.location.longitude}
                        </p>
                      )}
                      {item.passwordProtected && (
                        <p className="text-amber-400">
                          <span className="font-medium text-amber-400">Security:</span> Password Protected
                        </p>
                      )}
                    </div>
                  </div>

                  {item.fileData && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Download File
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add the PasswordModal component */}
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
    </div>
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