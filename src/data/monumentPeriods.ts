// src/data/monumentPeriods.ts
// Maps NMS MONUMENT_CLASS values to the app's Period taxonomy.
// Based on the Archaeological Survey of Ireland classification system.
import { Period } from './sites';

const CLASS_TO_PERIOD: Record<string, Period> = {
  // ─── Mesolithic (hunter-gatherer, pre-farming) ──────────────────
  'Shell midden': 'mesolithic',
  'Flint scatter': 'mesolithic',

  // ─── Neolithic (megalithic tombs, farming) ──────────────────────
  'Court tomb': 'neolithic',
  'Passage tomb': 'neolithic',
  'Passage tomb - unclassified': 'neolithic',
  'Portal tomb': 'neolithic',
  'Linkardstown-type burial': 'neolithic',
  'Megalithic tomb - unclassified': 'neolithic',
  'Megalithic structure': 'neolithic',

  // ─── Bronze Age ─────────────────────────────────────────────────
  'Fulacht fia': 'bronze_age',
  'Fulacht fiadh': 'bronze_age',
  'Standing stone': 'bronze_age',
  'Stone circle': 'bronze_age',
  'Stone row': 'bronze_age',
  'Stone pair': 'bronze_age',
  'Stone alignment': 'bronze_age',
  'Wedge tomb': 'bronze_age',
  'Boulder burial': 'bronze_age',
  'Cist': 'bronze_age',
  'Barrow - ring-barrow': 'bronze_age',
  'Barrow - bowl-barrow': 'bronze_age',
  'Barrow - pond barrow': 'bronze_age',
  'Barrow - embanked barrow': 'bronze_age',
  'Barrow - mound barrow': 'bronze_age',
  'Barrow - ring-ditch': 'bronze_age',
  'Barrow - unclassified': 'bronze_age',
  'Burnt mound': 'bronze_age',
  'Cairn - unclassified': 'bronze_age',
  'Cairn - burial': 'bronze_age',
  'Cairn - clearance': 'bronze_age',
  'Pit-circle': 'bronze_age',
  'Cup-marked stone': 'bronze_age',

  // ─── Iron Age ───────────────────────────────────────────────────
  'Hillfort': 'iron_age',
  'Trivallate hillfort': 'iron_age',
  'Bivallate hillfort': 'iron_age',
  'Univallate hillfort': 'iron_age',
  'Promontory fort - inland': 'iron_age',
  'Promontory fort - coastal': 'iron_age',
  'Promontory fort - unclassified': 'iron_age',
  'Linear earthwork': 'iron_age',
  'Ceremonial enclosure': 'iron_age',
  'Ritual site - post-prehistoric': 'iron_age',
  'Inauguration site': 'iron_age',
  'Royal site': 'iron_age',
  'La Tene object find-spot': 'iron_age',
  'Crannog': 'iron_age',

  // ─── Early Christian (5th–8th century) ──────────────────────────
  'Church': 'early_christian',
  'Ecclesiastical enclosure': 'early_christian',
  'Ecclesiastical site': 'early_christian',
  'Holy well': 'early_christian',
  'High cross': 'early_christian',
  'Cross': 'early_christian',
  'Cross-inscribed stone': 'early_christian',
  'Cross-inscribed slab': 'early_christian',
  'Cross-slab': 'early_christian',
  'Round tower': 'early_christian',
  'Bullaun stone': 'early_christian',
  'Ogham stone': 'early_christian',
  'Leacht': 'early_christian',
  'Oratory': 'early_christian',
  'Penitential station': 'early_christian',
  'Pilgrimage station': 'early_christian',
  'Early medieval monastery': 'early_christian',

  // ─── Early Medieval (Secular, 5th–12th century) ─────────────────
  'Ringfort - rath': 'early_medieval',
  'Ringfort - cashel': 'early_medieval',
  'Ringfort - unclassified': 'early_medieval',
  'Enclosure': 'early_medieval',
  'Souterrain': 'early_medieval',
  'Children\'s burial ground': 'early_medieval',
  'Dwelling': 'early_medieval',
  'Horizontal mill': 'early_medieval',
  'Togher/trackway': 'early_medieval',

  // ─── Medieval (12th–16th century) ───────────────────────────────
  'Castle - Anglo-Norman': 'medieval',
  'Castle - tower house': 'medieval',
  'Castle - unclassified': 'medieval',
  'Castle - hall': 'medieval',
  'Motte': 'medieval',
  'Motte and bailey': 'medieval',
  'Moated site': 'medieval',
  'Tower house': 'medieval',
  'Abbey': 'medieval',
  'Priory': 'medieval',
  'Friary': 'medieval',
  'Cathedral': 'medieval',
  'Chapel': 'medieval',
  'Medieval church': 'medieval',
  'Fortified house': 'medieval',
  'Town defences': 'medieval',
  'Town gate': 'medieval',
  'Bridge': 'medieval',
  'Market cross': 'medieval',
  'Bawn': 'medieval',
  'Deserted medieval settlement': 'medieval',
  'Deserted medieval village': 'medieval',

  // ─── Post-Medieval (17th century onward) ────────────────────────
  'House - indeterminate date': 'post_medieval',
  'House - 16th/17th century': 'post_medieval',
  'House - 17th century': 'post_medieval',
  'House - 18th/19th century': 'post_medieval',
  'Country house': 'post_medieval',
  'Mill - unclassified': 'post_medieval',
  'Windmill': 'post_medieval',
  'Lime kiln': 'post_medieval',
  'Ice house': 'post_medieval',
  'Dovecote': 'post_medieval',
  'Military road': 'post_medieval',
  'Barracks': 'post_medieval',
  'Battery': 'post_medieval',
  'Martello tower': 'post_medieval',
  'Signal tower': 'post_medieval',
  'Lighthouse': 'post_medieval',
  'Designed landscape': 'post_medieval',
  'Garden': 'post_medieval',
  'Battlefield': 'post_medieval',
  'Graveyard': 'post_medieval',
  'Grave slab': 'post_medieval',
  'Headstone': 'post_medieval',
};

// Keyword fallback for classes not in the explicit map
const KEYWORD_TO_PERIOD: [RegExp, Period][] = [
  [/\bshell midden\b/i, 'mesolithic'],
  [/\bflint scatter\b/i, 'mesolithic'],
  [/\btomb\b/i, 'neolithic'],
  [/\bmegalith/i, 'neolithic'],
  [/\bfulacht/i, 'bronze_age'],
  [/\bbarrow\b/i, 'bronze_age'],
  [/\bcairn\b/i, 'bronze_age'],
  [/\bstanding stone/i, 'bronze_age'],
  [/\bhillfort/i, 'iron_age'],
  [/\bpromontory fort/i, 'iron_age'],
  [/\bcrannog/i, 'iron_age'],
  [/\becclesiastical/i, 'early_christian'],
  [/\bchurch\b/i, 'early_christian'],
  [/\bcross\b/i, 'early_christian'],
  [/\bholy well/i, 'early_christian'],
  [/\bround tower/i, 'early_christian'],
  [/\bringfort/i, 'early_medieval'],
  [/\brath\b/i, 'early_medieval'],
  [/\bcashel\b/i, 'early_medieval'],
  [/\bsouterrain/i, 'early_medieval'],
  [/\benclosure/i, 'early_medieval'],
  [/\bcastle/i, 'medieval'],
  [/\bmotte/i, 'medieval'],
  [/\btower house/i, 'medieval'],
  [/\babbey\b/i, 'medieval'],
  [/\bpriory\b/i, 'medieval'],
  [/\bfriary\b/i, 'medieval'],
  [/\bmoated site/i, 'medieval'],
  [/\bmill\b/i, 'post_medieval'],
  [/\bhouse\b/i, 'post_medieval'],
  [/\bkiln\b/i, 'post_medieval'],
  [/\bbarracks/i, 'post_medieval'],
];

export function inferPeriod(monumentClass: string): Period {
  const exact = CLASS_TO_PERIOD[monumentClass];
  if (exact) return exact;

  for (const [re, period] of KEYWORD_TO_PERIOD) {
    if (re.test(monumentClass)) return period;
  }

  // Default: early_medieval is statistically the most common period for Irish field monuments
  return 'early_medieval';
}
