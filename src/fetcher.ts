import { getOrigin, getRobotsUrl, getSitemapUrl } from './utils/url-helpers';

export interface FetchResult {
  html: string;
  status: number;
  headers: Record<string, string | string[]>;
  loadTimeMs: number;
  finalUrl: string;
}

const TIMEOUT_MS = 15000;

export async function fetchPage(url: string): Promise<FetchResult> {
  const parsedUrl = new URL(url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const start = Date.now();
  try {
    const response = await fetch(parsedUrl, {
      redirect: 'follow',
      signal: controller.signal,
    });
    const html = await response.text();
    const elapsed = Date.now() - start;

    const headers: Record<string, string | string[]> = {};
    response.headers.forEach((value, key) => {
      const existing = headers[key];
      headers[key] = existing
        ? Array.isArray(existing)
          ? [...existing, value]
          : [existing, value]
        : value;
    });

    return {
      html,
      status: response.status,
      headers,
      loadTimeMs: elapsed,
      finalUrl: response.url,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRobotsTxt(url: string): Promise<string | undefined> {
  try {
    const origin = getOrigin(new URL(url));
    const response = await fetch(getRobotsUrl(origin), {
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      return response.text();
    }
  } catch {
    // robots.txt not available
  }
  return undefined;
}

export async function fetchSitemap(url: string): Promise<string | undefined> {
  try {
    const origin = getOrigin(new URL(url));
    const response = await fetch(getSitemapUrl(origin), {
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      return response.text();
    }
  } catch {
    // sitemap not available
  }
  return undefined;
}
