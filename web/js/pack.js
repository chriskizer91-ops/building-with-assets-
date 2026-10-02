// Makes a game page self-contained: scripts and stylesheets it loads from the internet (a 3D
// library from a CDN, Google Fonts) are fetched once and written into the page itself, fonts
// as data: URLs. After that the game never needs the internet again.
//
// Pure functions with no browser-only APIs, so the same file runs in the app and in Node
// (tools/collect-games.mjs).

const EXTERNAL = /^(https?:)?\/\//i;

function attr(tag, name) {
  const m = new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

function absolute(url) { return url.startsWith('//') ? 'https:' + url : url; }

// Lists what a page pulls from the internet.
export function findExternal(html) {
  const out = [];
  const scriptRe = /<script\b[^>]*>/gi;
  for (let m; (m = scriptRe.exec(html));) {
    const src = attr(m[0], 'src');
    if (src && EXTERNAL.test(src)) out.push({ kind: 'script', url: absolute(src) });
  }
  const linkRe = /<link\b[^>]*>/gi;
  for (let m; (m = linkRe.exec(html));) {
    const href = attr(m[0], 'href');
    if (!href || !EXTERNAL.test(href)) continue;
    const rel = (attr(m[0], 'rel') || '').toLowerCase();
    if (rel.includes('stylesheet')) out.push({ kind: 'style', url: absolute(href) });
    else if (rel.includes('preconnect') || rel.includes('dns-prefetch')) out.push({ kind: 'hint', url: absolute(href) });
    else if (rel.includes('icon')) out.push({ kind: 'icon', url: absolute(href) });
    else out.push({ kind: 'other', url: absolute(href) });
  }
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  for (let m; (m = styleRe.exec(html));) {
    for (const im of m[1].matchAll(IMPORT_RE)) out.push({ kind: 'style', url: absolute(im[2]) });
  }
  return out;
}

// @import url('https://...') inside a <style> block
const IMPORT_RE = /@import\s+(?:url\(\s*)?(['"]?)((?:https?:)?\/\/[^'")\s]+)\1\s*\)?\s*([^;]*);/gi;

function toBase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(s);
}

const FONT_TYPES = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

async function inlineCssUrls(css, base, get, report) {
  const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  const urls = new Set();
  for (let m; (m = re.exec(css));) {
    const u = m[2].trim();
    if (!u.startsWith('data:')) urls.add(u);
  }
  const map = {};
  for (const u of urls) {
    let abs;
    try { abs = new URL(u, base).href; } catch { continue; }
    try {
      const { bytes, type } = await get(abs);
      const ext = (abs.split('?')[0].split('.').pop() || '').toLowerCase();
      const mime = (type && !type.startsWith('text/') ? type.split(';')[0] : '') || FONT_TYPES[ext] || 'application/octet-stream';
      map[u] = `data:${mime};base64,${toBase64(bytes)}`;
      report.inlined.push(abs);
    } catch (e) {
      report.failed.push(abs);
    }
  }
  return css.replace(re, (all, q, u) => (map[u.trim()] ? `url(${map[u.trim()]})` : all));
}

// get(url) -> Promise<{ bytes: Uint8Array, type: string }>
export async function packHtml(html, get) {
  const report = { inlined: [], failed: [], kept: [] };
  const dec = new TextDecoder();
  const parts = [];
  let last = 0;

  const tagRe = /<script\b[^>]*>\s*<\/script\s*>|<link\b[^>]*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
  for (let m; (m = tagRe.exec(html));) {
    const tag = m[0];
    if (/^<style/i.test(tag)) {
      if (!IMPORT_RE.test(tag)) continue;
      IMPORT_RE.lastIndex = 0;
      let outTag = '';
      let at = 0;
      for (const im of tag.matchAll(IMPORT_RE)) {
        const abs = absolute(im[2]);
        let rep = im[0];
        try {
          const { bytes } = await get(abs);
          const media = (im[3] || '').trim();
          const css = await inlineCssUrls(dec.decode(bytes), abs, get, report);
          rep = `/* packed for offline play from ${abs} */\n${media ? `@media ${media} {\n${css}\n}` : css}\n`;
          report.inlined.push(abs);
        } catch { report.failed.push(abs); }
        outTag += tag.slice(at, im.index) + rep;
        at = im.index + im[0].length;
      }
      outTag += tag.slice(at);
      parts.push(html.slice(last, m.index), outTag);
      last = m.index + tag.length;
      continue;
    }
    const isScript = /^<script/i.test(tag);
    const url = attr(tag, isScript ? 'src' : 'href');
    if (!url || !EXTERNAL.test(url)) continue;
    const abs = absolute(url);
    let replacement = null;
    if (isScript) {
      try {
        const { bytes } = await get(abs);
        const code = dec.decode(bytes).replace(/<\/script/gi, '<\\/script');
        const type = attr(tag, 'type');
        replacement = `<script${type ? ` type="${type}"` : ''}>/* packed for offline play from ${abs} */\n${code}\n</script>`;
        report.inlined.push(abs);
      } catch { report.failed.push(abs); }
    } else {
      const rel = (attr(tag, 'rel') || '').toLowerCase();
      if (rel.includes('preconnect') || rel.includes('dns-prefetch')) replacement = '';
      else if (rel.includes('stylesheet')) {
        try {
          const { bytes } = await get(abs);
          const css = await inlineCssUrls(dec.decode(bytes), abs, get, report);
          const media = attr(tag, 'media');
          replacement = `<style${media ? ` media="${media}"` : ''}>/* packed for offline play from ${abs} */\n${css}\n</style>`;
          report.inlined.push(abs);
        } catch { report.failed.push(abs); }
      } else report.kept.push(abs);
    }
    if (replacement === null) continue;
    parts.push(html.slice(last, m.index), replacement);
    last = m.index + tag.length;
  }
  parts.push(html.slice(last));
  return { html: parts.join(''), report };
}

// A fetch-based getter for the browser and for Node 18+.
export function fetchGetter(fetchImpl = fetch) {
  const cache = new Map();
  return (url) => {
    if (!cache.has(url)) {
      cache.set(url, fetchImpl(url).then(async (r) => {
        if (!r.ok) throw new Error(r.status + ' ' + url);
        return { bytes: new Uint8Array(await r.arrayBuffer()), type: r.headers.get('content-type') || '' };
      }));
    }
    return cache.get(url);
  };
}
