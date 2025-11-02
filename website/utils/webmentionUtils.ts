/**
 * Utility functions for handling webmentions
 */

interface Webmention {
  "wm-id": number;
  "wm-property": string;
  [key: string]: unknown;
}

interface WebmentionApiResponse {
  children?: Webmention[];
}

/**
 * Deduplicates webmentions by their wm-id.
 * This is necessary because webmention.io treats URLs with and without trailing slashes
 * as different targets, so the same webmention might appear in both API responses.
 *
 * Uses a Set for O(n) complexity instead of nested array operations.
 *
 * @param mentions - Array of webmentions from one or more API responses
 * @returns Deduplicated array of webmentions
 */
export function deduplicateWebmentions(mentions: Webmention[]): Webmention[] {
  const seen = new Set<number>();
  return mentions.filter((mention) => {
    if (seen.has(mention["wm-id"])) {
      return false;
    }
    seen.add(mention["wm-id"]);
    return true;
  });
}

/**
 * Combines multiple webmention API responses and deduplicates them.
 * Use this when fetching webmentions from multiple URL variants.
 *
 * @param responses - Array of API response objects
 * @returns Deduplicated array of webmentions
 */
export function combineAndDeduplicateWebmentions(...responses: WebmentionApiResponse[]): Webmention[] {
  const allMentions = responses.flatMap((response) => response.children || []);
  return deduplicateWebmentions(allMentions);
}

/**
 * Fetches webmentions for both URL variants (with and without trailing slash)
 * and returns deduplicated mentions.
 *
 * @param urlWithoutSlash - URL without trailing slash
 * @param urlWithSlash - URL with trailing slash
 * @returns Promise resolving to deduplicated array of webmentions
 */
export async function fetchWebmentions(
  urlWithoutSlash: string,
  urlWithSlash: string,
): Promise<{ mentions: Webmention[]; count: number }> {
  try {
    const [dataWithout, dataWith] = await Promise.all([
      fetch(`https://webmention.io/api/mentions.jf2?target=${urlWithoutSlash}`).then((r) => r.json()),
      fetch(`https://webmention.io/api/mentions.jf2?target=${urlWithSlash}`).then((r) => r.json()),
    ]);

    const mentions = combineAndDeduplicateWebmentions(dataWithout, dataWith);

    return {
      mentions,
      count: mentions.length,
    };
  } catch {
    return {
      mentions: [],
      count: 0,
    };
  }
}
