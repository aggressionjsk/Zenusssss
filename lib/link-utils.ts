/**
 * Utility functions for link detection and handling
 */

/**
 * Detects URLs in text content
 * @param text The text to search for URLs
 * @returns The first URL found or null if none
 */
export function detectUrl(text: string): string | null {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  // Return the first URL found or null
  return matches && matches.length > 0 ? matches[0] : null;
}

/**
 * Validates if a string is a valid URL
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}