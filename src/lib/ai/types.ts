export interface ExternalSource {
  title: string;
  url: string;
  scope: 'global' | 'asian' | 'technical' | 'unspecified';
}

export interface Passage {
  id: string;
  title: string;
  url: string;
  heading?: string;
  anchor?: string;
  sourceType: 'wiki';
  scope: 'global-launch';
  excerpt: string;
  aliases: string[];
  reviewedAt: string;
  evidence: 'official' | 'community' | 'editorial' | 'mixed';
  sources: ExternalSource[];
}

export interface WikiIndex { version: 1; passages: Passage[] }

// Model text interleaved with citation numbers; number n points at sources[n - 1].
export interface Answer { parts: (string | number)[]; sources: Passage[] }
