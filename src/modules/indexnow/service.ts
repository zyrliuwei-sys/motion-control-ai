const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const MAX_URLS_PER_SUBMISSION = 10_000;

/** Only public, crawlable routes are included in the one-click submission. */
const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/privacy-policy',
  '/terms-of-service',
] as const;

export interface IndexNowSubmission {
  submitted: number;
  status: number;
}

function getSiteUrl(siteUrl: string): URL {
  try {
    const url = new URL(siteUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('App URL must use http or https');
    }
    return url;
  } catch {
    throw new Error('A valid App URL is required for IndexNow');
  }
}

function normalizeKey(key: string): string {
  const value = key.trim();
  if (!INDEXNOW_KEY_PATTERN.test(value)) {
    throw new Error(
      'IndexNow key must contain 8–128 letters, numbers, or dashes'
    );
  }
  return value;
}

export function isValidIndexNowKey(key: string | undefined): key is string {
  return Boolean(key && INDEXNOW_KEY_PATTERN.test(key.trim()));
}

/** Public ownership-verification file served by /indexnow-key.txt. */
export function getIndexNowKeyLocation(siteUrl: string): string {
  const origin = getSiteUrl(siteUrl).origin;
  return new URL('/indexnow-key.txt', origin).href;
}

export function getPublicIndexNowUrls(siteUrl: string): string[] {
  const origin = getSiteUrl(siteUrl).origin;
  return PUBLIC_PATHS.map((path) => new URL(path, origin).href);
}

/**
 * Submit public URLs through IndexNow. The admin API never returns the key;
 * search engines verify ownership through the required same-host text file.
 */
export async function submitIndexNowUrls(params: {
  siteUrl: string;
  key: string;
  urls: string[];
}): Promise<IndexNowSubmission> {
  const site = getSiteUrl(params.siteUrl);
  const key = normalizeKey(params.key);
  const uniqueUrls = [...new Set(params.urls)].map((value) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Invalid URL: ${value}`);
    }

    if (url.host !== site.host) {
      throw new Error(
        'All IndexNow URLs must belong to the configured App URL'
      );
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('IndexNow URLs must use http or https');
    }
    return url.href;
  });

  if (uniqueUrls.length === 0) {
    throw new Error('At least one public URL is required');
  }
  if (uniqueUrls.length > MAX_URLS_PER_SUBMISSION) {
    throw new Error(`IndexNow accepts at most ${MAX_URLS_PER_SUBMISSION} URLs`);
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: site.host,
      key,
      keyLocation: getIndexNowKeyLocation(site.href),
      urlList: uniqueUrls,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).trim().slice(0, 300);
    throw new Error(
      `IndexNow submission failed (${response.status})${detail ? `: ${detail}` : ''}`
    );
  }

  return { submitted: uniqueUrls.length, status: response.status };
}
