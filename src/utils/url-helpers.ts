export function getOrigin(url: URL): string {
  return url.origin;
}

export function resolveRelative(base: URL, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return new URL(path, base).href;
}

export function getSitemapUrl(origin: string): string {
  return `${origin}/sitemap.xml`;
}

export function getRobotsUrl(origin: string): string {
  return `${origin}/robots.txt`;
}
