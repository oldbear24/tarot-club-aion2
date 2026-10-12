import { getCollection } from 'astro:content';
import { buildReferenceIndex } from '../lib/reference';
export async function GET() {
  // Search text is derived in the browser; shipping it would duplicate all descriptions.
  return Response.json(buildReferenceIndex(await getCollection('docs'), import.meta.env.BASE_URL).map(({ search, ...entry }) => entry));
}
