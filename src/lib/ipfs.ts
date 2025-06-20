/**
 * Functions to interact with a local IPFS Desktop node
 */

// Local IPFS API endpoint (default for IPFS Desktop)
const IPFS_API_URL = 'http://127.0.0.1:5001/api/v0';

/**
 * Uploads a file to the local IPFS node
 * @param file The file to upload
 * @returns IPFS CID of the uploaded content
 */
export async function uploadToLocalIPFS(file: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${IPFS_API_URL}/add?pin=false`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.Hash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload to IPFS. Is IPFS Desktop running?');
  }
}

/**
 * Pins an IPFS hash to ensure content persistence
 * @param cid IPFS CID to pin
 */
export async function pinIPFSHash(cid: string): Promise<void> {
  try {
    const response = await fetch(`${IPFS_API_URL}/pin/add?arg=${cid}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to pin content: ${response.statusText}`);
    }
    
    await response.json();
  } catch (error) {
    console.error('Error pinning content:', error);
    throw new Error('Failed to pin content on IPFS');
  }
}

/**
 * Get file from IPFS by CID
 * @param cid IPFS CID
 * @returns Blob of the file content
 */
export async function getFromIPFS(cid: string): Promise<Blob> {
  try {
    const response = await fetch(`${IPFS_API_URL}/cat?arg=${cid}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get content: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error getting content from IPFS:', error);
    throw new Error('Failed to retrieve content from IPFS');
  }
}

/**
 * Get IPFS gateway URL for a CID
 * @param cid IPFS CID
 * @returns URL that can be used to access the content
 */
export function getIPFSGatewayURL(cid: string): string {
  return `http://localhost:8080/ipfs/${cid}`;
}

export async function getFirstJsonBlockFromIPFS(cid: string): Promise<any> {
  try {
    const response = await fetch(`${IPFS_API_URL}/cat?arg=${cid}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to get content: ${response.statusText}`);
    }

    const blob = await response.blob();
    const text = await blob.text(); // Convert blob to string

    // Extract the first {} block
    const start = text.indexOf('{');
    if (start === -1) throw new Error('No opening { found');

    let openBraces = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') openBraces++;
      else if (text[i] === '}') openBraces--;

      if (openBraces === 0) {
        const jsonString = text.slice(start, i + 1);
        return JSON.parse(jsonString); // return as parsed JSON object
      }
    }

    throw new Error('No balanced {} block found');
  } catch (error) {
    console.error('Error extracting JSON from IPFS content:', error);
    throw new Error('Failed to extract JSON from IPFS content');
  }
}
