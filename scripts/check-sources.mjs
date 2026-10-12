import { readDocs } from './content.mjs';
const docs = await readDocs();
const sources = [...new Set(docs.flatMap(doc => (doc.data.sources || []).map(source => source.url)))];
let cursor = 0, failed = 0;
async function check() {
  while (cursor < sources.length) {
    const url = sources[cursor++];
    try {
      let response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(12000) });
      if (response.status === 405) response = await fetch(url, { headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(12000) });
      if (!response.ok) { failed++; console.warn(`${response.status}: ${url}`); }
      await response.body?.cancel();
    } catch (error) { failed++; console.warn(`Nedostupný zdroj: ${url} (${error.message})`); }
  }
}
await Promise.all(Array.from({ length: 6 }, check));
console.log(`Zkontrolováno ${sources.length} zdrojových URL, ${failed} vyžaduje ruční kontrolu. Chyba dostupnosti není důkaz nesprávnosti obsahu.`);
// Advisory only: a remote outage must never block production deployment.
