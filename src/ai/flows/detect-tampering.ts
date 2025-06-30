// This is an enhanced version of the tampering detection feature
'use server';
/**
 * @fileOverview AI-powered tool that analyzes the chain of custody logs and evidence data to identify potential tampering or discrepancies.
 *
 * - detectTampering - A function that handles the tampering detection process.
 * - DetectTamperingInput - The input type for the detectTampering function.
 * - DetectTamperingOutput - The return type for the detectTampering function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createHash } from 'crypto';

// Cache implementation
type CacheEntry = {
  result: DetectTamperingOutput;
  timestamp: number;
}
const resultsCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache lifetime

const DetectTamperingInputSchema = z.object({
  chainOfCustodyLogs: z
    .string()
    .describe('Chain of custody logs in a structured format, such as JSON or CSV.'),
  evidenceData: z
    .string()
    .describe('Evidence data, including descriptions, timestamps, and MD5 hashes of files.'),
});
export type DetectTamperingInput = z.infer<typeof DetectTamperingInputSchema>;

const DetectTamperingOutputSchema = z.object({
  isTampered: z.boolean().describe('Whether potential tampering or discrepancies are detected.'),
  explanation: z
    .string()
    .describe('Explanation of the potential tampering or discrepancies detected.'),
  confidenceScore: z
    .number()
    .describe('A score between 0 and 1 indicating the confidence level of the tampering detection.'),
});
export type DetectTamperingOutput = z.infer<typeof DetectTamperingOutputSchema>;

/**
 * Pre-processes input data to validate and normalize it before AI analysis
 */
function preprocessData(input: DetectTamperingInput): DetectTamperingInput {
  try {
    // Parse data to validate JSON structure
    const logs = JSON.parse(input.chainOfCustodyLogs);
    const evidence = JSON.parse(input.evidenceData);
    
    // Format consistently for caching purposes
    return {
      chainOfCustodyLogs: JSON.stringify(logs, null, 0),
      evidenceData: JSON.stringify(evidence, null, 0)
    };
  } catch (e) {
    // If parsing fails, return original input
    return input;
  }
}

/**
 * Performs basic rule-based checks to quickly identify obvious discrepancies
 * before involving the AI model
 */
/**
 * Performs basic rule-based checks to quickly identify obvious discrepancies
 * before involving the AI model
 */
/**
 * Performs basic rule-based checks to quickly identify obvious discrepancies
 * before involving the AI model
 */
function performBasicChecks(input: DetectTamperingInput): DetectTamperingOutput | null {
  try {
    const logs = JSON.parse(input.chainOfCustodyLogs);
    const evidence = JSON.parse(input.evidenceData);
    
    // Check for empty data
    if (!logs.length) {
      return {
        isTampered: false,
        explanation: "Insufficient data to make a determination.",
        confidenceScore: 0.1
      };
    }
    
    // Helper function to parse dates consistently, handling various formats
    const parseDate = (dateStr: string): Date => {
      // Try different date formats
      if (dateStr.includes('/')) {
        // Format: DD/MM/YYYY
        const [day, month, yearTime] = dateStr.split('/');
        const [year, time] = yearTime.split(', ');
        const [hour, minute, second] = time.split(':');
        return new Date(Number(year), Number(month) - 1, Number(day), 
          Number(hour), Number(minute), Number(second));
      } else {
        // ISO format or other standard formats
        return new Date(dateStr);
      }
    };
    
    // 1. Check for "undefined" file names with multiple encryption keys
    interface UndefinedFileLog {
      details?: string;
      [key: string]: any;
    }
    const undefinedFileLogs: UndefinedFileLog[] = (logs as UndefinedFileLog[]).filter((log: UndefinedFileLog) => 
      log.details && log.details.includes("for the file undefined")
    );
    
    if (undefinedFileLogs.length >= 3) {
      return {
        isTampered: true,
        explanation: "Multiple encryption keys generated for undefined files. This indicates corrupted logs or deliberate file name obfuscation.",
        confidenceScore: 0.85
      };
    }
    
    // 2. Check for rapid-fire encryption key generation (multiple keys in short timeframe)
    // Group logs by file name
    const fileGroups = new Map<string, Array<any>>();
    
    interface EncryptionKeyLog {
      details?: string;
      [key: string]: any;
    }

    logs.forEach((log: EncryptionKeyLog) => {
      if (log.details && log.details.includes("Generated encryption key")) {
        // Extract filename
        const fileMatch: RegExpMatchArray | null = log.details.match(/for the file (.*?)(?:$|\s|\.)/);
        if (fileMatch && fileMatch[1]) {
          const fileName: string = fileMatch[1];
          if (!fileGroups.has(fileName)) {
            fileGroups.set(fileName, []);
          }
          fileGroups.get(fileName)?.push(log);
        }
      }
    });
    
    // Check each file group for rapid key generation
    for (const [fileName, fileLogs] of fileGroups.entries()) {
      if (fileLogs.length >= 3) {
        // Sort by timestamp
        fileLogs.sort((a, b) => 
          parseDate(a.timestamp ?? '').getTime() - parseDate(b.timestamp ?? '').getTime()
        );
        
        // Check time window for 3+ keys generated
        for (let i = 0; i < fileLogs.length - 2; i++) {
          const time1 = parseDate(fileLogs[i].timestamp ?? '').getTime();
          const time3 = parseDate(fileLogs[i+2].timestamp ?? '').getTime();
          
          // If 3+ keys generated within 10 seconds
          if ((time3 - time1) < 10000) {
            return {
              isTampered: true,
              explanation: `Suspicious pattern: Multiple encryption keys (${fileLogs.length}) generated for "${fileName}" within a very short time window (${Math.floor((time3-time1)/1000)} seconds).`,
              confidenceScore: 0.8
            };
          }
        }
      }
    }
    
    // 3. Check for file modifications without proper access sequence
    interface ModifiedLog {
      actionType?: string;
      details?: string;
      fileName?: string;
      timestamp?: string;
      [key: string]: any;
    }

    const modifiedFiles: ModifiedLog[] = logs.filter((log: ModifiedLog) => 
      log.actionType === "modified" || (log.details && log.details.includes("modified by"))
    );
    
    for (const modifiedLog of modifiedFiles) {
      // Extract actual filename from either fileName field or details
      let fileName = modifiedLog.fileName;
      if ((fileName === "N/A" || !fileName) && modifiedLog.details) {
        const match = modifiedLog.details.match(/File (.*?) modified by/);
        if (match && match[1]) fileName = match[1];
      }
      
      if (fileName && fileName !== "N/A") {
        // Find access events for this file before modification
        const modTime = parseDate(modifiedLog.timestamp ?? '').getTime();
        interface AccessLog {
          actionType?: string;
          details?: string;
          fileName?: string;
          timestamp?: string;
          [key: string]: any;
        }

        const priorAccess: AccessLog[] = logs.filter((log: AccessLog) => {
          // Look for access in fileName field or in details
          const fileInDetails: boolean = !!(log.details && 
            (log.details.includes(`for the file ${fileName}`) || 
             log.details.includes(`file: ${fileName}`)));
          
          const isAccess: boolean = log.actionType === "access";
          const isBeforeMod: boolean = parseDate(log.timestamp ?? '').getTime() < modTime;
          
          return ((log.fileName === fileName || fileInDetails) && isAccess && isBeforeMod);
        });
        
        if (priorAccess.length === 0) {
          return {
            isTampered: true,
            explanation: `Suspicious activity: File "${fileName}" was modified without prior access records. This violates proper chain of custody.`,
            confidenceScore: 0.9
          };
        }
      }
    }
    
    // 4. Check for inconsistent file names (spaces, special chars differences)
    const fileNameMap = new Map<string, Set<string>>();
    
    // Collect all variations of file names from logs
    interface FileNameLog {
      fileName?: string;
      details?: string;
      [key: string]: any;
    }

    logs.forEach((log: FileNameLog) => {
      // Get file name from the fileName field if it exists and is not "N/A"
      let fileNameFromField: string | null = log.fileName && log.fileName !== "N/A" ? log.fileName : null;
      
      // Get file name from details if it exists
      let fileNameFromDetails: string | null = null;
      if (log.details) {
      const detailsMatch: RegExpMatchArray | null = log.details.match(/(?:for the file|file:|File )(.*?)(?:$|\s|\.| by)/);
      if (detailsMatch && detailsMatch[1]) {
        fileNameFromDetails = detailsMatch[1].trim();
      }
      }
      
      // If we have both file names and they're different, this might be suspicious
      if (
      fileNameFromField &&
      fileNameFromDetails &&
      fileNameFromField !== fileNameFromDetails &&
      fileNameFromField.toLowerCase().replace(/\s+/g, '') === fileNameFromDetails.toLowerCase().replace(/\s+/g, '')
      ) {
      // Normalize file name for grouping (remove spaces, special chars, lowercase)
      const normalizedName: string = fileNameFromDetails.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!fileNameMap.has(normalizedName)) {
        fileNameMap.set(normalizedName, new Set<string>());
      }
      fileNameMap.get(normalizedName)?.add(fileNameFromField);
      fileNameMap.get(normalizedName)?.add(fileNameFromDetails);
      }
    });
    
    // Check for files with multiple naming variations
    for (const [normalizedName, variations] of fileNameMap.entries()) {
      if (variations.size > 1) {
        return {
          isTampered: true,
          explanation: `File integrity concern: The same file appears with different naming variations (${Array.from(variations).join(', ')}). This could indicate tampering or obfuscation attempts.`,
          confidenceScore: 0.85
        };
      }
    }
    
    // 5. Check for downloads by undefined or unauthorized users
    interface LogEntry {
      actionType?: string;
      details?: string;
      fileName?: string;
      timestamp?: string;
      [key: string]: any;
    }

    interface EvidenceAccessControl {
      downloadAuthorized?: string[];
      userRole?: string;
      [key: string]: any;
    }

    interface EvidenceData {
      accessControl?: EvidenceAccessControl;
      [key: string]: any;
    }

    const logsTyped: LogEntry[] = logs as LogEntry[];
    const evidenceTyped: EvidenceData = evidence as EvidenceData;

    const downloadLogs: LogEntry[] = logsTyped.filter((log: LogEntry) => 
      log.actionType === "download" || (log.details && log.details.includes("download"))
    );
    
    for (const downloadLog of downloadLogs) {
      if (downloadLog.details && downloadLog.details.includes("name undefined")) {
        if (evidence && evidence.accessControl && 
            Array.isArray(evidence.accessControl.downloadAuthorized) &&
            evidence.accessControl.userRole &&
            !evidence.accessControl.downloadAuthorized.includes(evidence.accessControl.userRole)) {
          return {
            isTampered: true,
            explanation: "Security breach detected: File download by unauthorized user with undefined name. This indicates a potential access control violation.",
            confidenceScore: 0.95
          };
        } else {
          return {
            isTampered: true,
            explanation: "Security concern: File download by user with undefined name. This should be investigated.",
            confidenceScore: 0.75
          };
        }
      }
    }
    
    return null; // No basic issues found, continue to AI analysis
  } catch (e) {
    console.error("Error in performBasicChecks:", e);
    return null; // Error in basic check, continue to AI analysis
  }
}

/**
 * Generates a cache key from the input data
 */
function generateCacheKey(input: DetectTamperingInput): string {
  return createHash('md5')
    .update(input.chainOfCustodyLogs + input.evidenceData)
    .digest('hex');
}

export async function detectTampering(input: DetectTamperingInput): Promise<DetectTamperingOutput> {
  // Preprocess the input data
  const processedInput = preprocessData(input);
  
  // Generate cache key
  const cacheKey = generateCacheKey(processedInput);
  
  // Check cache
  const now = Date.now();
  const cachedResult = resultsCache.get(cacheKey);
  if (cachedResult && (now - cachedResult.timestamp) < CACHE_TTL) {
    return cachedResult.result;
  }
  
  // Perform basic checks that don't require AI
  const basicCheckResult = performBasicChecks(processedInput);
  if (basicCheckResult) {
    // Cache and return the result
    resultsCache.set(cacheKey, {
      result: basicCheckResult,
      timestamp: now
    });
    return basicCheckResult;
  }
  
  // Proceed with AI analysis
  const result = await detectTamperingFlow(processedInput);
  
  // Cache the result
  resultsCache.set(cacheKey, {
    result,
    timestamp: now
  });
  
  return result;
}

const prompt = ai.definePrompt({
  name: 'detectTamperingPrompt',
  input: {schema: DetectTamperingInputSchema},
  output: {schema: DetectTamperingOutputSchema},
  prompt: `You are an expert in digital forensics and cybersecurity, specializing in detecting tampering in chain of custody logs and evidence data.

Task: Analyze the provided chain of custody logs and evidence data to identify potential tampering or discrepancies.

###Analysis Guidelines:
1. CAREFULLY verify file hash integrity across logs
2. Check timestamp consistency and sequence validity
3. Identify unusual access patterns or unauthorized modifications
4. Compare access logs against authorized user actions
5. Look for missing entries or gaps in the chain of custody
6. If the File says it has been modified, it means that a new file has been created with a different hash which is a newer version of the file
7. Consider legitimate explanations for discrepancies (e.g., system updates, maintenance)
8. Use a conservative approach to minimize false positives

###Evidence Standards:
- AVOID FALSE POSITIVES: Only report tampering when evidence is substantial
- Require multiple indicators before concluding tampering
- Consider legitimate explanations for discrepancies
- Rate confidence based on corroborating evidence
- Use conservative scoring to minimize false alarms
- Document all findings with specific details
- Provide clear, factual explanations for conclusions
- Never assume tampering from a single anomaly unless it's critical (e.g., hash mismatch)

###Explanation Format:
-Explain findings in a structured format
-Include specific details about the evidence
-Use clear, factual language
-Explain in plain terms, avoiding technical jargon

###Chain of Custody Logs:
{{{chainOfCustodyLogs}}}

###Evidence Data:
{{{evidenceData}}}

###Analysis Requirements:
1. isTampered: Set to true ONLY when concrete evidence exists
2. explanation: Provide specific, factual details supporting your conclusion
3. confidenceScore: Use a conservative approach:
   - 0.9+ only for definitive proof
   - 0.7-0.8 for strong indicators
   - 0.4-0.6 for suspicious patterns requiring further investigation
   - Below 0.4 for minor irregularities

Remember: False positives damage trust in the system. Be certain before declaring tampering.
`,
});

const detectTamperingFlow = ai.defineFlow(
  {
    name: 'detectTamperingFlow',
    inputSchema: DetectTamperingInputSchema,
    outputSchema: DetectTamperingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // Add additional validation to prevent false positives
    const result = output!;
    
    // If confidence is below threshold but marked as tampered,
    // adjust to reduce false positives
    if (result.isTampered && result.confidenceScore < 0.6) {
      return {
        ...result,
        isTampered: false,
        explanation: `Potential concern identified but insufficient evidence for tampering: ${result.explanation}`,
        confidenceScore: result.confidenceScore
      };
    }
    
    return result;
  }
);