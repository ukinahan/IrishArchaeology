import { writeFileSync, mkdirSync, statSync } from 'node:fs';
import { STORIES } from '../src/data/stories';
import { BUNDLED_ENRICHMENTS } from '../src/data/enrichments';

const manifest = {
  version: 1,
  updatedAt: new Date().toISOString(),
  stories: STORIES,
  enrichments: BUNDLED_ENRICHMENTS,
};

mkdirSync('docs', { recursive: true });
writeFileSync('docs/content.json', JSON.stringify(manifest, null, 2));
const size = statSync('docs/content.json').size;
console.log(`Wrote docs/content.json (${size} bytes) with ${STORIES.length} stories and ${BUNDLED_ENRICHMENTS.length} enrichments.`);
