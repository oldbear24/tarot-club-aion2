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

export interface AnswerBlock { source: Passage; number: number }
