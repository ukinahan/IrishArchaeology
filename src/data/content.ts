// src/data/content.ts
// Shared types for the remote content layer (stories + per-site enrichments).
// Both are served as JSON over HTTPS and merged with bundled fallbacks at
// runtime — see src/services/contentService.ts.
import { Period } from './sites';

export interface RemoteStory {
  id: string;
  title: string;
  hook: string;
  body: string;            // Markdown-lite (paragraphs split by \n\n, **bold**)
  period: string;          // Display label, e.g. "Iron Age (700 BC – AD 400)"
  relatedSiteIds: string[];
  readTimeMinutes: number;
  imageEmoji: string;
  imageUrl?: string;       // Optional hero image (CDN URL)
  audioUrl?: string;       // Optional narration mp3
  publishedAt?: string;    // ISO date — used for "Today in History" matching
}

/**
 * Per-site enrichment overlay. Keyed by SMR ref or NMS entity id.
 * Any field set here overrides the live NMS attributes when the site
 * detail card renders.
 */
export interface SiteEnrichment {
  id: string;              // SMR ref / entity id (matches ArchSite.id or smrRef)
  irishName?: string;
  whatItIs?: string;
  whyItMatters?: string;
  whatToLookFor?: string;
  whenUsed?: { start: number; end: number };
  period?: Period;         // Override an ambiguous monument-class mapping
  audioUrl?: string;       // Optional narration mp3
  photoUrls?: string[];    // Curated CC-licensed photos (overrides Wikimedia)
  attribution?: string;    // Credit line for curated photos
}

export interface ContentManifest {
  version: number;
  updatedAt: string;       // ISO timestamp
  stories: RemoteStory[];
  enrichments: SiteEnrichment[];
}
