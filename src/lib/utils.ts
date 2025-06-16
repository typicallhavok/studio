import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size in a human-readable format
 * @param bytes The file size in bytes
 * @returns A formatted string (e.g., "4.2 MB")
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Format a date in a human-readable format
 * @param timestamp The timestamp in milliseconds
 * @returns A formatted date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
