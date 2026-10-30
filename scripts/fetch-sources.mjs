// Fetches each source page and saves its plain text to content/sources/<id>.txt, so every
// quoted passage in the content can be checked verbatim against what was actually fetched.
// Usage: node scripts/fetch-sources.mjs [id ...]   (no ids = fetch all in content/sources/index.json)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const index = JSON.parse(readFileSync('content/sources/index.json', 'utf8'));
const want = process.argv.slice(2);

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

mkdirSync('content/sources', { recursive: true });
for (const s of index) {
  if (want.length && !want.includes(s.id)) continue;
  try {
    const res = await fetch(s.url, { headers: { 'User-Agent': 'Mozilla/5.0 (study-app source fetch)' }, redirect: 'follow' });
    const text = htmlToText(await res.text());
    writeFileSync(`content/sources/${s.id}.txt`, `URL: ${s.url}\nFETCHED: ${new Date().toISOString()}\nSTATUS: ${res.status}\n\n${text}\n`);
    console.log(s.id, res.status, text.length);
  } catch (e) {
    console.log(s.id, 'ERROR', e.message);
  }
}
