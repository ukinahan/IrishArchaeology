// src/data/enrichments.ts
// Bundled site enrichment overlays for marquee monuments. Used as a
// fallback when the remote ContentManifest is unavailable, and merged with
// remote enrichments by id (remote wins).
//
// Keyed by NMS entity id / SMR ref. Add hand-curated entries here for the
// top sites; everything else falls back to the live NMS WEB_NOTES.
import { SiteEnrichment } from './content';

export const BUNDLED_ENRICHMENTS: SiteEnrichment[] = [
  {
    id: 'ME019-046----',
    irishName: 'Sí an Bhrú',
    whatItIs:
      'A vast Neolithic passage tomb built around 3200 BC, predating the Egyptian pyramids by six centuries. The mound covers roughly an acre and contains a 19-metre passage leading to a cruciform chamber with a corbelled roof that has remained dry for 5,200 years.',
    whyItMatters:
      'Newgrange is one of the finest Neolithic monuments in Europe and a UNESCO World Heritage Site. Its roofbox admits the rising sun on the winter solstice, illuminating the chamber for about 17 minutes — a feat of astronomical engineering by a society without writing or metal tools.',
    whatToLookFor:
      'The white quartz facade, the carved entrance stone (the most famous piece of megalithic art in Europe), the roofbox above the entrance, and the kerbstones encircling the mound. The interior is accessible only by guided tour from the visitor centre.',
    whenUsed: { start: -3200, end: -2500 },
    period: 'stone_age',
  },
  {
    id: 'ME020-005----',
    irishName: 'Teamhair na Rí',
    whatItIs:
      'A complex of Neolithic, Bronze Age, and Iron Age monuments on a low ridge in Co. Meath. Tara was the inauguration site of the High Kings of Ireland and held immense political and ceremonial significance from prehistory into the early medieval period.',
    whyItMatters:
      'Tara is arguably the single most symbolic place in Irish history. The Lia Fáil (Stone of Destiny) on the summit was said to roar when the rightful king touched it. Daniel O\u2019Connell held a famous monster-meeting here in 1843 attended by an estimated 750,000 people.',
    whatToLookFor:
      'The Mound of the Hostages (a small passage tomb), the Forrad and Teach Cormaic ringforts, the Lia Fáil standing stone, and the long earthwork known as the Banqueting Hall. The site is freely accessible.',
    whenUsed: { start: -3000, end: 1100 },
    period: 'iron_age',
  },
  {
    id: 'KE110-001----',
    whatItIs:
      'A 6th-century monastic settlement clinging to a 218-metre rocky pinnacle eight miles off the Kerry coast. Six beehive-shaped corbelled stone huts, two oratories, and a small graveyard sit on terraces cut from the rock.',
    whyItMatters:
      'Skellig Michael is one of the best-preserved early monastic sites in Europe and a UNESCO World Heritage Site. The community survived here for some 600 years, abandoned only after repeated Viking raids and worsening Atlantic storms in the 12th century.',
    whatToLookFor:
      'The 600-step pilgrim staircase, the beehive cells (clocháin) with their corbelled roofs, the cruciform St Michael\u2019s Church, and the cross-inscribed slabs. Boat trips run from Portmagee, May–September only, weather permitting.',
    whenUsed: { start: 588, end: 1200 },
    period: 'early_christian',
  },
  {
    id: 'GA100-001----',
    irishName: 'Dún Aonghasa',
    whatItIs:
      'A massive prehistoric stone fort on the edge of a 100-metre Atlantic cliff on Inishmore in the Aran Islands. Three concentric drystone walls enclose a semicircular area, with a chevaux de frise of upright stones outside the middle rampart.',
    whyItMatters:
      'Dún Aonghasa is among the finest prehistoric monuments in western Europe. Excavations have shown occupation from the late Bronze Age (~1100 BC) through the early medieval period, suggesting it was both a refuge and a ceremonial centre.',
    whatToLookFor:
      'The chevaux de frise (dense field of upright stones designed to break a charge), the central platform, and the staggering cliff drop. The walk up from the visitor centre takes about 20 minutes.',
    whenUsed: { start: -1100, end: 1000 },
    period: 'iron_age',
  },
];
