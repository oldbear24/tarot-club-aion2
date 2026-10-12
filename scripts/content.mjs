import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
export async function readDocs(root = 'src/content/docs') {
  const docs = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (/\.mdx?$/.test(path)) {
        const text = await readFile(path, 'utf8');
        const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!match) throw new Error(`Neplatná metadata: ${path}`);
        docs.push({ id: relative(root, path).replaceAll('\\', '/').replace(/\.mdx?$/, ''), data: parse(match[1]), body: match[2] });
      }
    }
  }
  await visit(root);
  return docs;
}
