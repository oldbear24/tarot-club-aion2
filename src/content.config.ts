import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: z.object({
      edition: z.literal('global-launch'),
      reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      evidence: z.enum(['official', 'community', 'editorial', 'mixed']),
      sources: z.array(z.object({
        title: z.string(),
        url: z.url(),
        scope: z.enum(['global', 'asian', 'technical', 'unspecified']),
      })).default([]),
    }) }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
