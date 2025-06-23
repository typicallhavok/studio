/**
 * Evidence record structure (matches backend's EvidenceRequest)
 */
export interface EvidenceRecord {
  name: string;
  description: string;
  caseId: string;
  collectedBy: string;
  collectionTimestamp: number;
  location: { latitude: number; longitude: number }; // <-- now an object
  cid: string;
  fileSize: number;
  fileType: string;
  checksum: string;
  passwordProtected: string;
  previous?: boolean; // Optional field for previous evidence CID
}

/**
 * Store evidence on Hyperledger Fabric via API
 * @param evidenceRecord - The evidence record to store
 * @returns Object with cid and txHash from backend
 */
export async function storeEvidenceOnChain(evidenceRecord: EvidenceRecord): Promise<{ cid: string; txHash: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || "http://localhost:3000"}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(evidenceRecord),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to store evidence');
    }

    return {
      cid: data.cid,
      txHash: data.txHash,
    };
  } catch (error) {
    console.error('Error storing evidence:', error);
    throw error;
  }
}

/**
 * Verify (fetch) evidence record from Hyperledger Fabric by ID (likely IPFS CID or case ID)
 * @param id - Evidence ID to retrieve
 * @returns The EvidenceRecord object
 */
export async function verifyEvidenceOnChain(id: string): Promise<EvidenceRecord> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || "http://localhost:3000"}/evidence/${id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify evidence');
    }

    return data as EvidenceRecord;
  } catch (error) {
    console.error('Error verifying evidence:', error);
    throw error;
  }
}

/**
 * Update status of evidence
 * @param id - Evidence ID
 * @param status - New status string
 * @returns Backend confirmation
 */
export async function updateEvidenceStatus(id: string, status: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CHAIN_URL || "http://localhost:3000"}/evidence/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update status');
    }

    return data.message;
  } catch (error) {
    console.error('Error updating evidence status:', error);
    throw error;
  }
}

/**
 * Fetch evidence by ID from the backend API
 * @param id - The evidence ID (e.g., CID)
 * @returns The EvidenceRecord object
 */
export async function fetchEvidence(id: string): Promise<EvidenceRecord> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CHAIN_URL || "http://localhost:3000"}/evidence/${id}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch evidence");
    }

    return data as EvidenceRecord;
  } catch (error) {
    console.error("Error fetching evidence:", error);
    throw error;
  }
}
