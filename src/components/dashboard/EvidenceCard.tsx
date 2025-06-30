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
  FileText,
  History
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
import Link from "next/link";
import { useState, useEffect } from 'react';
import { getFromIPFS, getFirstJsonBlockFromIPFS } from '@/lib/ipfs';
import { decryptFile } from '@/lib/encryption';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PasswordModal } from "@/components/modals/PasswordModal";
import { get } from "http";
import { useRouter } from 'next/navigation';

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

interface EvidenceCardProps {
  item: EvidenceItem;
  onViewDetails?: (item: EvidenceItem) => void; // Add this prop
}

export default function EvidenceCard({ item, onViewDetails }: EvidenceCardProps) {
  const IconComponent = item.icon || FileText;
  const [isDownloading, setIsDownloading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);
  const [fileDetails, setFileDetails] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileDetails = async () => {
    if (!fileDetails && item.cid) {
      setLoadingDetails(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || "http://localhost:3000"}/evidence/${item.cid}`);
        const data = await response.json();
        setDetails(data);
      } catch (error) {
        setDetails({ error: "Failed to fetch details" });
      }
      setLoadingDetails(false);
    }
    setFileDetails((prev) => !prev);
  }

  const handleDownload = async () => {
    if (!item.cid) return;

    setIsDownloading(true);

    try {
      // Get the file from IPFS
      const blob = await getFromIPFS(item.cid);
      if (item.password == "true") {
        // For encrypted files that need password input, open the password modal
        console.log("Blob retrieved from IPFS:", blob);

        setEncryptedBlob(blob);
        setPasswordModalOpen(true);
        setIsDownloading(false);
      } else {
        // For files without password, decrypt without requiring password input
        try {
          const keyRequest = {
            method: 'POST',
            credentials: "include",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName: item.name }), // No filePassword included
          } as RequestInit;

          const keyResponse = await fetch('/api/encryptionkey', keyRequest);

          if (!keyResponse.ok) {
            throw new Error('Failed to get encryption key from server');
          }

          const { key } = await keyResponse.json();

          // Try to decrypt the file using the key
          const { blob: decryptedBlob, metadata } = await decryptFile(blob, key);
          console.log("Decrypted Blob:", decryptedBlob, "Metadata:", metadata);

          // Create a download link with the original filename
          const url = URL.createObjectURL(decryptedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = metadata.name || `evidence-${item.id}`;
          document.body.appendChild(a);
          a.click();

          // Clean up
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);

          // Log the download
          await fetch("/api/log", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "download",
              fileName: item.name,
              timestamp: new Date().toISOString(),
            }),
          });

          toast({
            title: "Download successful",
            description: "File has been decrypted and downloaded",
          });
        } catch (decryptError) {
          console.error("Decryption error:", decryptError);

          // If decryption fails, fall back to downloading the original blob
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.name || `evidence-${item.id}`;
          document.body.appendChild(a);
          a.click();

          // Clean up
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);

          await fetch("/api/log", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "download",
              fileName: item.name,
              timestamp: new Date().toISOString(),
            }),
          });

          toast({
            title: "Download successful",
            description: "File has been downloaded",
          });
        }

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

  const handlePasswordSubmit = async (password: string) => {
    if (!encryptedBlob) return;

    setIsDownloading(true);
    setPasswordError(undefined);

    try {
      const keyRequest = {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePassword: password, fileName: item.name }),
      } as RequestInit;

      const keyResponse = await fetch('/api/encryptionkey', keyRequest);

      if (!keyResponse.ok) {
        throw new Error('Failed to get encryption key from server');
      }

      const { key } = await keyResponse.json();
      const { blob, metadata } = await decryptFile(encryptedBlob, key);

      // Create a download link with the original filename
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.name || `evidence-${item.id}`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

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

  // Add a function to fetch version history
  const fetchVersionHistory = async (hash: string, versions: any[] = []) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || "http://localhost:3000"}/evidence/${hash}`);
      if (!response.ok) return versions;

      const data = await response.json();
      versions.push({
        cid: data.cid,
        timestamp: new Date(data.collectionTimestamp).toLocaleString(),
        name: data.name,
      });

      // If there's a previous version, fetch it recursively
      if (data.previous) {
        return fetchVersionHistory(data.previous, versions);
      }

      return versions;
    } catch (error) {
      console.error("Error fetching version history:", error);
      return versions;
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      // Use the callback to open modal
      onViewDetails(item);
    } else {
      // Fallback: navigate to chain view if no callback provided
      router.push(`/chain/${item.cid}`);
    }
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md bg-background h-auto border-none">
        <div className={`h-2 w-full bg-border`}></div>
        <CardContent className="pt-6 bg-card">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-md bg-chart-5">
                <IconComponent className="h-5 w-5 text-card-foreground" />
              </div>
              <div>
                <h3 className="font-medium line-clamp-1 text-white-900" title={item.name}>{item.name}</h3>
              </div>
            </div>
            
            <DropdownMenu>
              {item.password == "true" && (<div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 font-medium">
                <Lock className="h-6 w-3" />
              </Badge>
            </div>)}
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white-500 hover:text-white-700 hover:bg-primary">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => {
                  // Prevent the dropdown from closing immediately
                  e.preventDefault();
                  handleDownload();
                }}>
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isDownloading ? "Downloading..." : "Download"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { router.push(`/chain/${item.cid}`) }}>
                  <Shield className="mr-2 h-4 w-4" /> Verify integrity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>

          <div className="grid gap-2 ">
            

            {item.previous && (
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 font-medium">
                  <History className="h-3 w-3 mr-1" />
                  Version History
                </Badge>
              </div>
            )}

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white-700">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-white-500" />
                <span>{item.lastUpdate}</span>
              </div>
            </div>
          </div>

          {/* Add the file details section here */}
          {fileDetails && (
            <div className="rounded text-xs text-gray-800 mt-4">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading details...</span>
                </div>
              ) : details ? (
                details.error ? (
                  <span className="text-red-500">{details.error}</span>
                ) : (
                  <div className="grid grid-cols-2 gap-y-2 text-card-foreground">
                    <div><b>Name:</b> {details.name}</div>
                    <div><b>File Size:</b> {formatFileSize(details.fileSize)}</div>
                    <div><b>Description:</b> {details.description}</div>
                    <div><b>File Type:</b> {details.fileType}</div>
                    <div><b>Case ID:</b> {details.caseId}</div>
                    <div><b>Password Protected:</b> {details.passwordProtected ? "Yes" : "No"}</div>
                    <div><b>Collected By:</b> {details.collectedBy}</div>
                    <div><b>Timestamp:</b> {new Date(details.collectionTimestamp).toLocaleString()}</div>
                    <div><b>Location:</b> {details.location?.latitude.toFixed(6)}, {details.location?.longitude.toFixed(6)}</div>
                    <div className="col-span-2"><b>CID:</b> <span className="font-mono text-[10px]">{details.cid}</span></div>
                    <div className="col-span-2 break-all"><b>Checksum:</b> <span className="font-mono text-[10px]">{details.checksum}</span></div>
                    {details.previous && (
                      <div className="col-span-2">
                        <div className="flex items-center gap-1 mb-1">
                          <History className="h-4 w-4 text-amber-600" />
                          <b>Previous Version:</b>
                        </div>
                        <span className="font-mono text-[10px] break-all">{details.previous}</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <span>No details available.</span>
              )}
            </div>
          )}

          {/* Add version history button and details */}
          {item.previous && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium"
                onClick={async () => {
                  if (!showHistory) {
                    setLoadingHistory(true);
                    const history = await fetchVersionHistory(item.cid);
                    setVersionHistory(history);
                    setLoadingHistory(false);
                  }
                  setShowHistory(!showHistory);
                }}
                disabled={!item.previous}
              >
                {loadingHistory ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <History className="h-3 w-3 mr-1" />
                )}
                {showHistory ? "Hide History" : "View History"}
              </Button>

              {showHistory && (
                <div className="mt-2 rounded-md bg-purple-50 p-4 text-sm text-gray-800">
                  <div className="font-medium text-gray-900">Version History</div>
                  <div className="mt-2 space-y-2">
                    {versionHistory.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs py-2">
                        No version history available.
                      </div>
                    ) : (
                      versionHistory.map((version, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <div className="flex-1 truncate">
                            <Link
                              href={`${process.env.NEXT_PUBLIC_CHAIN_EXPLORER_URL}/evidence/${version.cid}`}
                              target="_blank"
                              className="font-medium text-blue-600 hover:text-blue-700"
                            >
                              {version.name}
                            </Link>
                          </div>
                          <div className="whitespace-nowrap text-gray-500">
                            {version.timestamp}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-foreground bg-card px-6 py-3">
          <div className="w-full flex justify-between items-center">
            <span className="text-xs text-foreground font-medium">{item.type}</span>
            {item.cid && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs text-background bg-foreground hover:outline hover:outline-2 hover:outline-foreground font-medium"
                  onClick={handleFileDetails}
                >
                  {fileDetails ? "Hide details" : "View details"}
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

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
    </>
  );
}
