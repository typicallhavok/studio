import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, Lock, FileCheck, LinkIcon, Shield, Clock, Download, Eye, EyeOff } from "lucide-react";
import { encryptFile, decryptFile } from '@/lib/encryption';
import { uploadToLocalIPFS, pinIPFSHash, getFromIPFS } from '@/lib/ipfs';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { storeEvidenceOnChain } from '@/lib/blockchain';
import { formatFileSize } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface EvidenceMetadata {
	name: string;
	description: string;
	caseId: string;
	collectedBy: string;
	collectionTimestamp: number;
	location: { latitude: number, longitude: number }; // <-- always an object
}

interface Case {
	caseID: string;
	name: string;
}

export function UploadSection() {
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [ipfsHash, setIpfsHash] = useState<string | null>(null);
	const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
	const [txHash, setTxHash] = useState<string | null>(null);
	const [status, setStatus] = useState<string>('idle');
	const [usePassword, setUsePassword] = useState(false);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [metadata, setMetadata] = useState<EvidenceMetadata>({
		name: '',
		description: '',
		caseId: '',
		collectedBy: '',
		collectionTimestamp: Date.now(),
		location: { latitude: 0, longitude: 0 }, // <-- default as object
	});
	const [cases, setCases] = useState<Case[]>([]);
	const [isLoadingCases, setIsLoadingCases] = useState(false);
	const [casesError, setCasesError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchCases();
	}, []);


	const fetchCases = async () => {
		try {
			setIsLoadingCases(true);
			setCasesError(null);

			const response = await fetch('/api/cases', {
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch cases: ${response.statusText}`);
			}

			const data = await response.json();
			setCases(data);
		} catch (err) {
			console.error('Error fetching cases:', err);
			setCasesError('Failed to load cases');
		} finally {
			setIsLoadingCases(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];
			setFile(selectedFile);
			setIpfsHash(null);
			setEncryptionKey(null);
			setTxHash(null);
			setStatus('idle');
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						setMetadata(prev => ({
							...prev,
							location: {
								latitude: position.coords.latitude,
								longitude: position.coords.longitude,
							}
						}));
					},
					(error) => {
						console.error("Error getting location:", error.message);
						setMetadata(prev => ({
							...prev,
							location: { latitude: 0, longitude: 0 }
						}));
					},
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 0,
					}
				);
			} else {
				console.error("Geolocation not supported");
			}

			setMetadata(prev => ({
				...prev,
				name: selectedFile.name,
				collectionTimestamp: Date.now(),
			}));
		}
	};

	const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setMetadata(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleCaseChange = (caseId: string) => {
		setMetadata(prev => ({
			...prev,
			caseId
		}));
	};

	const handleUpload = async () => {
		if (!file) return;

		try {
			setIsUploading(true);
			setStatus('preparing');
			setUploadProgress(10);

			// Get encryption key from the backend, sending password if specified
			let keyRequest = {};
			let keyEndpoint = '/api/encryptionkey';

			// If password is enabled and provided, include it in the request
			keyRequest = {
				method: 'POST',
				credentials: 'include', // Include credentials in the request
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ filePassword:password, fileName:file.name }),
			};

			const keyResponse = await fetch(keyEndpoint, keyRequest);

			if (!keyResponse.ok) {
				throw new Error('Failed to get encryption key from server');
			}

			const { key } = await keyResponse.json();
			setUploadProgress(20);
			setStatus('encrypting');

			// Encrypt the file with the server-provided key
			const encryptedFile = await encryptFile(file, key);
			setUploadProgress(50);
			setStatus('uploading');

			// Create a file with proper name to preserve filename in IPFS
			const fileWithName = new File([encryptedFile], file.name, {
				type: 'application/octet-stream'
			});

			// Upload to local IPFS Desktop instance
			const hash = await uploadToLocalIPFS(fileWithName);
			setUploadProgress(80);

			// Pin the hash to ensure persistence
			await pinIPFSHash(hash);
			setUploadProgress(90);

			// Store evidence metadata and hash on blockchain
			setStatus('recording');
			const evidenceRecord = {
				...metadata,
				cid: hash,
				fileSize: file.size,
				fileType: file.type,
				checksum: await calculateChecksum(file),
				passwordProtected: usePassword,
			};

			console.log("Storing evidence record:", evidenceRecord);
			const { cid, txHash } = await storeEvidenceOnChain(evidenceRecord);
			setIpfsHash(cid);
			setTxHash(txHash);

			// Store results
			const indexCID = fetch("/api/indexFile", {
				method: "POST",
				credentials: "include",
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fileName: file.name, cid, txhash: txHash, caseID: metadata.caseId, description: metadata.description, password: usePassword ? password : undefined }),
			});
			setUploadProgress(100);
			setStatus('complete');
			setEncryptionKey(key);
		} catch (error) {
			console.error("Upload failed:", error);
			setStatus('failed');
		} finally {
			setIsUploading(false);
		}
	};

	const calculateChecksum = async (file: File): Promise<string> => {
		const buffer = await file.arrayBuffer();
		const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	};

	const downloadEvidence = async () => {
		if (!ipfsHash || !encryptionKey) return;

		try {
			setStatus('downloading');

			// Get the encrypted file from IPFS
			const encryptedBlob = await getFromIPFS(ipfsHash);

			// Decrypt the file
			const { blob, metadata } = await decryptFile(encryptedBlob, encryptionKey);

			// Create a download link with the original filename
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = metadata.name || `evidence-${ipfsHash.slice(0, 8)}`;
			document.body.appendChild(a);
			a.click();

			// Clean up
			setTimeout(() => {
				URL.revokeObjectURL(url);
				document.body.removeChild(a);
				setStatus('complete');
			}, 100);
		} catch (error) {
			console.error("Download failed:", error);
			setStatus('failed');
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const resetForm = () => {
		setFile(null);
		setIpfsHash(null);
		setEncryptionKey(null);
		setTxHash(null);
		setStatus('idle');
		setUsePassword(false);
		setPassword('');
		setShowPassword(false);

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setMetadata({
						name: '',
						description: '',
						caseId: '',
						collectedBy: '',
						collectionTimestamp: Date.now(),
						location: {
							latitude: position.coords.latitude,
							longitude: position.coords.longitude,
						},
					});
				},
				() => {
					setMetadata({
						name: '',
						description: '',
						caseId: '',
						collectedBy: '',
						collectionTimestamp: Date.now(),
						location: { latitude: 0, longitude: 0 },
					});
				}
			);
		} else {
			setMetadata({
				name: '',
				description: '',
				caseId: '',
				collectedBy: '',
				collectionTimestamp: Date.now(),
				location: { latitude: 0, longitude: 0 },
			});
		}
	};

	const getStatusIcon = () => {
		switch (status) {
			case 'encrypting': return <Lock className="animate-pulse" />;
			case 'uploading': return <Upload className="animate-pulse" />;
			case 'recording': return <Shield className="animate-pulse" />;
			case 'complete': return <FileCheck />;
			case 'failed': return <Shield className="text-destructive" />;
			default: return null;
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Log Chain of Evidence</CardTitle>
						<CardDescription>
							Securely store evidence with encryption and blockchain verification
						</CardDescription>
					</div>
					{status && status !== 'idle' && (
						<Badge variant={status === 'failed' ? "destructive" : status === 'complete' ? "default" : "outline"} className="flex gap-1 items-center">
							{getStatusIcon()}
							<span className="capitalize">{status}</span>
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{!file ? (
						<div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
							onClick={() => fileInputRef.current?.click()}>
							<Input
								ref={fileInputRef}
								id="file"
								type="file"
								onChange={handleFileChange}
								className="hidden"
							/>
							<Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium mb-1">Choose Evidence File</h3>
							<p className="text-sm text-muted-foreground">
								Click to browse or drag and drop
							</p>
						</div>
					) : (
						<>
							{!ipfsHash ? (
								<div className="space-y-4">
									<div className="flex items-center p-3 bg-muted rounded-md">
										<div className="mr-3 bg-background rounded-md p-2">
											<Clock className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium">{file.name}</p>
											<p className="text-xs text-muted-foreground">
												{formatFileSize(file.size)} • {file.type || "Unknown type"}
											</p>
										</div>
										<Button variant="ghost" size="sm" onClick={() => setFile(null)}>
											Change
										</Button>
									</div>

									<div className="space-y-4">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="usePassword"
												checked={usePassword}
												onCheckedChange={(checked) => setUsePassword(!!checked)}
											/>
											<Label htmlFor="usePassword" className="text-sm font-medium cursor-pointer">
												Protect with password
											</Label>
										</div>

										{usePassword && (
											<div className="space-y-2">
												<Label htmlFor="password" className="text-sm">Password</Label>
												<div className="flex relative">
													<Input
														id="password"
														type={showPassword ? "text" : "password"}
														placeholder="Enter encryption password"
														value={password}
														onChange={(e) => setPassword(e.target.value)}
														className="pr-10"
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="absolute right-0 top-0 h-full px-3"
														onClick={() => setShowPassword(!showPassword)}
													>
														{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
													</Button>
												</div>
												<p className="text-xs text-muted-foreground">
													Optional: If provided, this password will be used to derive your encryption key
												</p>
											</div>
										)}

										<div className="space-y-3">
											<h3 className="text-sm font-medium">Evidence Metadata</h3>

											<div className="grid gap-3">
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-2">
														<Label htmlFor="caseId" className="text-sm">Case</Label>
														<Select
															value={metadata.caseId}
															onValueChange={handleCaseChange}
														>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select a case" />
															</SelectTrigger>
															<SelectContent>
																{isLoadingCases ? (
																	<div className="flex items-center justify-center p-2">
																		<Loader2 className="h-4 w-4 animate-spin mr-2" />
																		<span>Loading cases...</span>
																	</div>
																) : casesError ? (
																	<div className="p-2 text-destructive text-sm">{casesError}</div>
																) : cases.length === 0 ? (
																	<div className="p-2 text-sm text-muted-foreground">No cases found</div>
																) : (
																	cases.map((caseItem) => (
																		<SelectItem key={caseItem.caseID} value={caseItem.caseID}>
																			{caseItem.name}
																		</SelectItem>
																	))
																)}
															</SelectContent>
														</Select>
													</div>
													<div className="space-y-2">
														<Label htmlFor="collectedBy" className="text-sm">Collected By</Label>
														<Input
															id="collectedBy"
															name="collectedBy"
															placeholder="Evidence collector"
															value={metadata.collectedBy}
															onChange={handleMetadataChange}
														/>
													</div>
												</div>

												<div className="space-y-2">
													<Label htmlFor="name" className="text-sm">Evidence Name</Label>
													<Input
														id="name"
														name="name"
														placeholder="Name for this evidence"
														value={metadata.name}
														onChange={handleMetadataChange}
													/>
												</div>

												<div className="space-y-2">
													<Label htmlFor="description" className="text-sm">Description</Label>
													<Textarea
														id="description"
														name="description"
														placeholder="Describe this evidence"
														value={metadata.description}
														onChange={handleMetadataChange}
														rows={3}
													/>
												</div>
											</div>
										</div>
									</div>

									<Button
										onClick={handleUpload}
										disabled={isUploading || !metadata.caseId || !metadata.name}
										className="w-full"
									>
										{isUploading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												{status === 'preparing' && "Preparing..."}
												{status === 'encrypting' && "Encrypting..."}
												{status === 'uploading' && "Uploading to IPFS..."}
												{status === 'recording' && "Recording on Blockchain..."}
											</>
										) : (
											<>
												<Lock className="mr-2 h-4 w-4" />
												Record Chain of Evidence
											</>
										)}
									</Button>

									{isUploading && (
										<div className="space-y-2">
											<Progress value={uploadProgress} className="h-2" />
										</div>
									)}
								</div>
							) : (
								<div className="space-y-5">
									<div className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-md p-4">
										<FileCheck className="h-6 w-6 text-green-600 mr-3" />
										<div>
											<h4 className="font-medium text-green-600">Evidence Securely Recorded</h4>
											<p className="text-sm text-green-600/80">
												Chain of evidence has been preserved and verified
											</p>
										</div>
									</div>

									<div className="space-y-4">
										<div className="space-y-2">
											<label className="text-sm font-medium flex items-center gap-2">
												<Lock className="h-4 w-4 text-amber-500" />
												Encryption Key
											</label>
										</div>

										<Separator />

										<div className="space-y-2">
											<label className="text-sm font-medium flex items-center gap-2">
												<LinkIcon className="h-4 w-4" />
												IPFS CID
											</label>
											<div className="flex">
												<Input value={ipfsHash} readOnly className="font-mono text-xs" />
												<Button variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(ipfsHash!)}>
													Copy
												</Button>
											</div>
										</div>

										<div className="space-y-2">
											<label className="text-sm font-medium flex items-center gap-2">
												<Shield className="h-4 w-4" />
												Blockchain Transaction
											</label>
											<div className="flex">
												<Input value={txHash ?? ''} readOnly className="font-mono text-xs" />
												<Button variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(txHash!)}>
													Copy
												</Button>
											</div>
										</div>

										<Button
											variant="default"
											onClick={downloadEvidence}
											className="w-full flex items-center justify-center gap-2"
										>
											<Download className="h-4 w-4" />
											Download Evidence File
										</Button>

										<Separator />

										<Button variant="outline" onClick={resetForm} className="w-full">
											Record New Evidence
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}