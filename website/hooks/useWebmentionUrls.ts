import { usePageContext } from "vike-react/usePageContext";

/**
 * Custom hook to generate webmention URL variants for the current page.
 * Returns both URL variants (with and without trailing slash) to ensure
 * compatibility with different social media platforms that share URLs differently.
 *
 * Some platforms (like Bluesky) share URLs without trailing slashes,
 * while others (like some Mastodon instances) include them.
 * webmention.io treats these as different URLs, so we need to query both.
 *
 * @returns Object containing urlWithoutSlash and urlWithSlash
 */
export function useWebmentionUrls(baseUrl = "https://www.fretchen.eu") {
  const pageContext = usePageContext();

  // Normalize pathname to version without trailing slash
  const pathname = pageContext.urlPathname.endsWith("/")
    ? pageContext.urlPathname.slice(0, -1)
    : pageContext.urlPathname;

  return {
    urlWithoutSlash: `${baseUrl}${pathname}`,
    urlWithSlash: `${baseUrl}${pathname}/`,
  };
}
