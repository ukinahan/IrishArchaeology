// src/data/marqueeSites.ts
// Hand-curated allow-list of marquee archaeological sites in Ireland.
// Used by the Trip Planner to boost significance scoring so itineraries
// surface landmark sites (Newgrange, Dún Aonghasa, Cashel) instead of
// arbitrary fulachtaí fia in fields.
//
// Matched against NMS records by townland (case-insensitive substring) +
// county. SMR refs are listed where known but matching is forgiving so we
// don't depend on exact ID equality.

import { Period } from './sites';

export interface MarqueeSite {
  name: string;          // Display name
  townland?: string;     // Townland substring as it appears in NMS data
  county: string;        // Title-case county name
  period: Period;        // Best-fit period (used as fallback if NMS class is ambiguous)
  smrRef?: string;       // Optional SMR ref for direct match
  blurb?: string;        // Short editorial blurb, shown in itinerary
}

export const MARQUEE_SITES: MarqueeSite[] = [
  // --- Stone Age ---
  { name: 'Newgrange Passage Tomb', townland: 'Newgrange', county: 'Meath', period: 'stone_age', blurb: 'World-famous 5,200-year-old passage tomb, aligned to the winter solstice sunrise.' },
  { name: 'Knowth', townland: 'Knowth', county: 'Meath', period: 'stone_age', blurb: 'Largest passage tomb in the Brú na Bóinne complex; vast collection of megalithic art.' },
  { name: 'Dowth', townland: 'Dowth', county: 'Meath', period: 'stone_age', blurb: 'The third Boyne tomb — quieter than its neighbours, aligned to the winter solstice sunset.' },
  { name: 'Loughcrew Cairns', townland: 'Carnbane', county: 'Meath', period: 'stone_age', blurb: 'Hilltop passage tombs with equinox solar alignments and rich megalithic art.' },
  { name: 'Carrowmore Megalithic Cemetery', townland: 'Carrowmore', county: 'Sligo', period: 'stone_age', blurb: 'One of the largest and oldest megalithic complexes in Europe.' },
  { name: 'Carrowkeel Cairns', townland: 'Carrowkeel', county: 'Sligo', period: 'stone_age', blurb: 'Hilltop passage tombs in the Bricklieve Mountains with sweeping views.' },
  { name: 'Poulnabrone Dolmen', townland: 'Poulnabrone', county: 'Clare', period: 'stone_age', blurb: 'Iconic portal tomb on the Burren limestone pavement.' },
  { name: 'Browne\u2019s Hill Dolmen', townland: 'Kernanstown', county: 'Carlow', period: 'stone_age', blurb: 'Portal tomb with the heaviest capstone in Europe (~100 tonnes).' },
  { name: 'Creevykeel Court Tomb', townland: 'Creevykeel', county: 'Sligo', period: 'stone_age', blurb: 'One of the finest examples of a full court tomb in Ireland.' },
  { name: 'Ceide Fields', townland: 'Behy', county: 'Mayo', period: 'stone_age', blurb: 'A 5,500-year-old farming landscape preserved beneath blanket bog.' },

  // --- Bronze Age ---
  { name: 'Drombeg Stone Circle', townland: 'Drombeg', county: 'Cork', period: 'bronze_age', blurb: 'Recumbent stone circle aligned to the winter solstice sunset.' },
  { name: 'Beaghmore Stone Circles', townland: 'Beaghmore', county: 'Tyrone', period: 'bronze_age', blurb: 'Complex of seven stone circles uncovered from peat bog.' },
  { name: 'Grange Stone Circle', townland: 'Grange', county: 'Limerick', period: 'bronze_age', blurb: 'Largest stone circle in Ireland, on the shore of Lough Gur.' },
  { name: 'Lough Gur', townland: 'Lough Gur', county: 'Limerick', period: 'bronze_age', blurb: 'Continuously inhabited since the Neolithic — ringforts, tombs and a stone circle.' },

  // --- Iron Age ---
  { name: 'Du\u0301n Aonghasa', townland: 'Kilmurvy', county: 'Galway', period: 'iron_age', blurb: 'Spectacular cliff-edge stone fort on Inishmore, Aran Islands.' },
  { name: 'Du\u0301n Conchu\u0301ir', townland: 'Inishmaan', county: 'Galway', period: 'iron_age', blurb: 'Massive oval cashel on the middle Aran island.' },
  { name: 'Du\u0301n Eochla', townland: 'Eochaill', county: 'Galway', period: 'iron_age', blurb: 'Triple-walled stone fort on the highest point of Inishmore.' },
  { name: 'Hill of Tara', townland: 'Tara', county: 'Meath', period: 'iron_age', blurb: 'Ceremonial seat of the High Kings of Ireland; ringforts, mounds and the Lia Fa\u0301il.' },
  { name: 'Rathcroghan', townland: 'Rathcroghan', county: 'Roscommon', period: 'iron_age', blurb: 'Royal site of Connacht; mythological seat of Queen Medb.' },
  { name: 'Eamhain Mhacha (Navan Fort)', townland: 'Navan', county: 'Armagh', period: 'iron_age', blurb: 'Royal capital of ancient Ulster.' },
  { name: 'Du\u0301n Ailinne', townland: 'Knockaulin', county: 'Kildare', period: 'iron_age', blurb: 'Hilltop ceremonial enclosure of the Kings of Leinster.' },
  { name: 'Grianan of Aileach', townland: 'Greenan Mountain', county: 'Donegal', period: 'iron_age', blurb: 'Stone ringfort on a 244 m hilltop with panoramic views over Lough Swilly.' },
  { name: 'Dun Beag Promontory Fort', townland: 'Fahan', county: 'Kerry', period: 'iron_age', blurb: 'Cliff-edge promontory fort on the Dingle Peninsula.' },

  // --- Early Christian / Early Medieval ---
  { name: 'Skellig Michael', townland: 'Skellig Michael', county: 'Kerry', period: 'early_christian', blurb: 'Remote 6th-century monastic settlement on a precipitous Atlantic island.' },
  { name: 'Glendalough', townland: 'Glendalough', county: 'Wicklow', period: 'early_christian', blurb: 'Monastic city founded by St Kevin, set in a glacial valley.' },
  { name: 'Clonmacnoise', townland: 'Clonmacnoise', county: 'Offaly', period: 'early_christian', blurb: 'Major early monastic site on the Shannon with high crosses and round towers.' },
  { name: 'Monasterboice', townland: 'Monasterboice', county: 'Louth', period: 'early_christian', blurb: 'Home to Muiredach\u2019s Cross \u2014 the finest high cross in Ireland.' },
  { name: 'Kells Monastic Site', townland: 'Kells', county: 'Meath', period: 'early_christian', blurb: 'Spiritual home of the Book of Kells; round tower and high crosses.' },
  { name: 'Inis Cealtra (Holy Island)', townland: 'Holy Island', county: 'Clare', period: 'early_christian', blurb: 'Monastic island in Lough Derg with seven churches.' },
  { name: 'Gallarus Oratory', townland: 'Gallarus', county: 'Kerry', period: 'early_christian', blurb: 'Perfectly preserved corbelled drystone oratory.' },
  { name: 'Kilmacduagh', townland: 'Kilmacduagh', county: 'Galway', period: 'early_christian', blurb: 'Leaning round tower and ruined monastic complex.' },
  { name: 'Devenish Island', townland: 'Devenish', county: 'Fermanagh', period: 'early_christian', blurb: 'Monastic island in Lower Lough Erne.' },

  // --- Medieval ---
  { name: 'Rock of Cashel', townland: 'Cashel', county: 'Tipperary', period: 'medieval', blurb: 'Spectacular limestone outcrop topped with a cathedral, round tower and Cormac\u2019s Chapel.' },
  { name: 'Trim Castle', townland: 'Trim', county: 'Meath', period: 'medieval', blurb: 'Largest Anglo-Norman castle in Ireland, on the Boyne.' },
  { name: 'Cahir Castle', townland: 'Cahir', county: 'Tipperary', period: 'medieval', blurb: 'One of Ireland\u2019s largest and best-preserved castles.' },
  { name: 'Jerpoint Abbey', townland: 'Jerpoint', county: 'Kilkenny', period: 'medieval', blurb: 'Cistercian abbey with finely carved cloister figures.' },
  { name: 'Mellifont Abbey', townland: 'Mellifont', county: 'Louth', period: 'medieval', blurb: 'First Cistercian monastery in Ireland.' },
  { name: 'Boyle Abbey', townland: 'Boyle', county: 'Roscommon', period: 'medieval', blurb: 'Well-preserved Cistercian abbey founded in 1161.' },
  { name: 'Kilkenny Castle', townland: 'Kilkenny', county: 'Kilkenny', period: 'medieval', blurb: 'Norman stronghold of the Butler family.' },
  { name: 'Athassel Priory', townland: 'Athassel', county: 'Tipperary', period: 'medieval', blurb: 'Largest medieval priory in Ireland.' },
  { name: 'Quin Abbey', townland: 'Quin', county: 'Clare', period: 'medieval', blurb: 'Franciscan friary built within a 13th-century Norman castle.' },
  { name: 'Dunluce Castle', townland: 'Dunluce', county: 'Antrim', period: 'medieval', blurb: 'Dramatic clifftop castle ruin.' },

  // --- Post-Medieval ---
  { name: 'Charles Fort', townland: 'Kinsale', county: 'Cork', period: 'post_medieval', blurb: 'Star-shaped 17th-century coastal artillery fort.' },
  { name: 'Elizabeth Fort', townland: 'Cork City', county: 'Cork', period: 'post_medieval', blurb: 'Star-shaped fort overlooking Cork city.' },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

interface ArchSiteLike {
  name?: string;
  county?: string;
  smrRef?: string;
}

/**
 * Returns the marquee record matching this NMS site, or undefined.
 * Match strategy: SMR ref (exact) → county + townland substring on either
 * the marquee townland or the marquee display name.
 */
export function matchMarquee(site: ArchSiteLike): MarqueeSite | undefined {
  if (!site) return undefined;
  if (site.smrRef) {
    const bySmr = MARQUEE_SITES.find((m) => m.smrRef && norm(m.smrRef) === norm(site.smrRef!));
    if (bySmr) return bySmr;
  }
  const county = norm(site.county ?? '');
  const name = norm(site.name ?? '');
  if (!county || !name) return undefined;
  return MARQUEE_SITES.find((m) => {
    if (norm(m.county) !== county) return false;
    const needle = norm(m.townland ?? m.name);
    return needle.length >= 3 && name.includes(needle);
  });
}
