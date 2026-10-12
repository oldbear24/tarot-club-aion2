// Neither model output nor user input is ever accepted as a link target.
export function safeExternalUrl(value: string): string | undefined {
  if (!/^https?:\/\//i.test(value) || /[\s\\\u0000-\u001f]/.test(value)) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
    return url.href;
  } catch { return; }
}

export function safeWikiUrl(value: string, site: string, base: string): string | undefined {
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return;
  try {
    const url = new URL(value, site);
    const prefix = '/' + base.split('/').filter(Boolean).join('/') + '/';
    const normalizedBase = prefix.replace(/^\/\//, '/');
    if (url.origin !== new URL(site).origin || !url.pathname.startsWith(normalizedBase) || url.search) return;
    const decoded = decodeURIComponent(url.pathname);
    if (/[\\\u0000-\u001f]/.test(decoded) || decoded.split('/').some(part => part === '..' || part === '.')) return;
    return url.pathname + url.hash;
  } catch { return; }
}
