// In-memory cache for artist and song album art fetched from iTunes Search API
const itunesCoverCache = new Map<string, string>();

/**
 * Searches iTunes Search API for album cover art matching station name or track title.
 * Returns high-resolution (600x600) artwork URL, or null if not found.
 */
export async function fetchAlbumArtFromItunes(query: string): Promise<string | null> {
  const cleanQuery = query
    .replace(/[\[\(].*?[\]\)]/g, '') // remove brackets
    .replace(/^(radio|fm|online|stream|live)\s+/i, '')
    .replace(/\s+(radio|fm|online|stream|live)$/i, '')
    .trim();

  if (!cleanQuery || cleanQuery.length < 3) return null;

  const cacheKey = cleanQuery.toLowerCase();
  if (itunesCoverCache.has(cacheKey)) {
    return itunesCoverCache.get(cacheKey) || null;
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=music&entity=song&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.resultCount > 0 && data.results && data.results[0]?.artworkUrl100) {
      // Upgrade artwork from 100x100 to 600x600 high definition
      const highResArt = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
      itunesCoverCache.set(cacheKey, highResArt);
      return highResArt;
    }

    itunesCoverCache.set(cacheKey, '');
    return null;
  } catch (err) {
    console.warn('iTunes Search API failed or timed out for:', query, err);
    return null;
  }
}
