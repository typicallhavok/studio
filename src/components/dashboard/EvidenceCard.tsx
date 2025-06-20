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
import Link from "next/link";
import { useState, useEffect } from 'react';
import { getFromIPFS, getFirstJsonBlockFromIPFS } from '@/lib/ipfs';
import { decryptFile } from '@/lib/encryption';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PasswordModal } from "@/components/modals/PasswordModal";
import { get } from "http";

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
}

export default function EvidenceCard({ item }: EvidenceCardProps) {
  const IconComponent = item.icon || FileText;
  const [isDownloading, setIsDownloading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);
  const [fileDetails, setFileDetails] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();

  const handleFileDetails = async () => {
    if (!fileDetails && item.cid) {
      setLoadingDetails(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || "http://localhost:3000"}/evidence/${item.cid}`);
        const data = await response.json();
        console.log("Fetched details:", data);
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
        // For encrypted files, open the password modal
        setEncryptedBlob(blob);
        setPasswordModalOpen(true);
        setIsDownloading(false);
      } else {
        // For unencrypted files, download directly
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

        toast({
          title: "Download successful",
          description: "File has been downloaded",
        });
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
        body: JSON.stringify({ password }),
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

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md border bg-background h-auto">
        <div className={`h-2 w-full bg-primary`}></div>
        <CardContent className="pt-6 bg-purple-800/5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-md bg-blue-50">
                <IconComponent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium line-clamp-1 text-white-900" title={item.name}>{item.name}</h3>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white-500 hover:text-white-700 hover:bg-gray-100">
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
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" /> Verify integrity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid gap-2 ">
            {item.password == "true" && (<div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
                <Lock className="h-3 w-3 mr-1" />
                Password Protected
              </Badge>
            </div>)}

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white-700">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-white-500" />
                <span>{item.lastUpdate}</span>
              </div>
            </div>
          </div>

          {/* Add the file details section here */}
          {fileDetails && (
            <div className="rounded text-xs text-gray-800 dark:text-gray-200 mt-4">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading details...</span>
                </div>
              ) : details ? (
                details.error ? (
                  <span className="text-red-500">{details.error}</span>
                ) : (
                  <div className="grid grid-cols-2 gap-y-2">
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
                  </div>
                )
              ) : (
                <span>No details available.</span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-gray-100 bg-purple-800/5 px-6 py-3">
          <div className="w-full flex justify-between items-center">
            <span className="text-xs text-purple-600 font-medium">{item.type}</span>
            {item.cid && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
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
