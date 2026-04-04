/**
 * Returns a proxied URL for private Vercel Blob files.
 * If the URL is a blob URL, routes through our API for auth + download token.
 * Otherwise returns the URL as-is (external links).
 */
export function getFileViewUrl(url: string): string {
  if (url.includes("blob.vercel-storage.com")) {
    return `/api/file/${encodeURIComponent(url)}`;
  }
  return url;
}
