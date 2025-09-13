/**
 * NFT metadata utility functions
 */

/**
 * Extract prompt from NFT description
 */
export function extractPromptFromDescription(description: string, maxLength = 100): string {
  // Look for "Prompt:" in the description
  const promptMatch = description.match(/Prompt:\s*(.+?)(?:\n|$)/i);
  if (promptMatch && promptMatch[1]) {
    const prompt = promptMatch[1].trim();
    // Truncate if needed
    return prompt.length > maxLength ? `${prompt.substring(0, maxLength)}...` : prompt;
  }

  // Fallback: use first part of description
  const truncated = description.substring(0, maxLength);
  return truncated.length < description.length ? `${truncated}...` : truncated;
}
