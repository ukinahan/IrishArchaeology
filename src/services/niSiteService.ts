// src/services/niSiteService.ts
// Queries the Northern Ireland Historic Environment Division (HERoNI) ArcGIS
// Feature Service for Sites and Monuments Record points.
// Source: Department for Communities NI — © Crown Copyright
//
// Layer schema (FeatureServer/0):
//   OBJECTID, MONID, SMRNo, Townland_s_, Edited_Type, General_Type,
//   General_Period, Protection, Grid_Reference, Council, Located, X, Y
//
// Native spatial reference is Irish Grid (EPSG:29900). We request outSR=4326
// so the service hands us WGS84 lat/lng directly — no client-side reprojection
// needed.
import { ArchSite, Period } from '../data/sites';

const BASE_URL =
  'https://services2.arcgis.com/BdBkthNLO9mzGAMO/arcgis/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/0/query';

const OUT_FIELDS = [
  'OBJECTID',
  'MONID',
  'SMRNo',
  'Townland_s_',
  'Edited_Type',
  'General_Type',
  'General_Period',
  'Protection',
  'Grid_Reference',
  'Council',
  'Located',
].join(',');

interface NIFeature {
  attributes: {
    OBJECTID: number;
    MONID: number | null;
    SMRNo: string | null;
    Townland_s_: string | null;
    Edited_Type: string | null;
    General_Type: string | null;
    General_Period: string | null;
    Protection: string | null;
    Grid_Reference: string | null;
    Council: string | null;
    Located: string | null;
  };
  geometry?: { x: number; y: number };
}

interface NIResponse {
  features: NIFeature[];
  exceededTransferLimit?: boolean;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map the free-text General_Period value to our Period taxonomy. */
function mapNIPeriod(raw: string | null): Period {
  if (!raw) return 'early_medieval';
  const u = raw.toUpperCase();
  if (u.includes('MESOLITHIC')) return 'mesolithic';
  if (u.includes('NEOLITHIC')) return 'neolithic';
  if (u.includes('BRONZE')) return 'bronze_age';
  if (u.includes('IRON')) return 'iron_age';
  if (u.includes('EARLY CHRISTIAN') || u.includes('EARLY MEDIEVAL')) return 'early_christian';
  if (u.includes('MEDIEVAL') && u.includes('POST')) return 'post_medieval';
  if (u.includes('MEDIEVAL')) return 'medieval';
  if (u.includes('POST')) return 'post_medieval';
  if (u.includes('PREHISTORIC')) return 'bronze_age';
  if (u.includes('MODERN') || u.includes('INDUSTRIAL')) return 'post_medieval';
  return 'early_medieval';
}

/** Derive a traditional county from the modern NI council name. */
function councilToCounty(council: string | null): string {
  if (!council) return 'Northern Ireland';
  const c = council.toUpperCase();
  if (c.includes('BELFAST')) return 'Antrim';
  if (c.includes('LISBURN') || c.includes('CASTLEREAGH')) return 'Antrim';
  if (c.includes('ANTRIM') || c.includes('NEWTOWNABBEY')) return 'Antrim';
  if (c.includes('MID') && c.includes('EAST ANTRIM')) return 'Antrim';
  if (c.includes('CAUSEWAY')) return 'Antrim';
  if (c.includes('ARDS') || c.includes('NORTH DOWN')) return 'Down';
  if (c.includes('NEWRY') || c.includes('MOURNE')) return 'Down';
  if (c.includes('ARMAGH') || c.includes('BANBRIDGE') || c.includes('CRAIGAVON')) return 'Armagh';
  if (c.includes('FERMANAGH')) return 'Fermanagh';
  if (c.includes('OMAGH')) return 'Tyrone';
  if (c.includes('MID ULSTER')) return 'Tyrone';
  if (c.includes('DERRY') || c.includes('STRABANE')) return 'Londonderry';
  return titleCase(council);
}

function mapFeatureToSite(f: NIFeature): ArchSite | null {
  const a = f.attributes;
  const lng = f.geometry?.x;
  const lat = f.geometry?.y;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const monumentClass = a.General_Type ?? a.Edited_Type ?? 'Monument';
  const townland = a.Townland_s_ ? titleCase(a.Townland_s_) : '';
  const name = townland ? `${monumentClass}, ${townland}` : monumentClass;
  // Stable, namespaced ID so NI records never collide with NMS SMR IDs
  const id = a.SMRNo ? `NI:${a.SMRNo}` : `NI:OID${a.OBJECTID}`;

  const detail = [
    a.Edited_Type && a.Edited_Type !== monumentClass ? a.Edited_Type : null,
    a.General_Period ? `Period: ${titleCase(a.General_Period)}` : null,
    a.Protection ? `Protection: ${a.Protection}` : null,
    a.Grid_Reference ? `Grid Reference: ${a.Grid_Reference}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    id,
    name,
    type: monumentClass,
    period: mapNIPeriod(a.General_Period),
    lat,
    lng,
    county: councilToCounty(a.Council),
    smrRef: a.SMRNo ?? undefined,
    whatItIs:
      detail ||
      `A ${monumentClass.toLowerCase()} recorded in the Northern Ireland Sites and Monuments Record.`,
    accessStatus: a.Protection && /scheduled|state\s*care/i.test(a.Protection) ? 'protected' : 'private',
    accessNote:
      'Recorded in the Northern Ireland Sites and Monuments Record (HERoNI). © Crown Copyright.',
    isMonument: true,
  };
}

function buildBaseParams(): URLSearchParams {
  return new URLSearchParams({
    outFields: OUT_FIELDS,
    outSR: '4326',
    returnGeometry: 'true',
    f: 'json',
  });
}

/** Fetch NI sites within a radius of a point (lat/lng WGS84). */
export async function fetchNISitesNear(
  lat: number,
  lng: number,
  radiusKm: number = 10,
): Promise<ArchSite[]> {
  const params = buildBaseParams();
  params.set('where', '1=1');
  params.set('geometry', `${lng},${lat}`);
  params.set('geometryType', 'esriGeometryPoint');
  params.set('inSR', '4326');
  params.set('distance', String(radiusKm * 1000));
  params.set('units', 'esriSRUnit_Meter');
  params.set('spatialRel', 'esriSpatialRelIntersects');

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const data: NIResponse = await res.json();
    return (data.features ?? [])
      .map(mapFeatureToSite)
      .filter((s): s is ArchSite => s !== null);
  } catch {
    return [];
  }
}

/** Fetch NI sites inside a WGS84 bounding box. */
export async function fetchNISitesInBounds(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
  maxResults: number = 1000,
): Promise<ArchSite[]> {
  const params = buildBaseParams();
  params.set('where', '1=1');
  params.set('geometry', `${minLng},${minLat},${maxLng},${maxLat}`);
  params.set('geometryType', 'esriGeometryEnvelope');
  params.set('inSR', '4326');
  params.set('spatialRel', 'esriSpatialRelIntersects');
  params.set('resultRecordCount', String(maxResults));

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const data: NIResponse = await res.json();
    return (data.features ?? [])
      .map(mapFeatureToSite)
      .filter((s): s is ArchSite => s !== null);
  } catch {
    return [];
  }
}

/**
 * Fetch ALL Northern Ireland sites by paging through the layer.
 * Used when the user picks one of the six NI counties from the dropdown.
 * The HERoNI service caps `maxRecordCount` at 2000, so we page in parallel
 * after grabbing the count.
 */
export async function fetchNISitesByCounty(traditionalCounty: string): Promise<ArchSite[]> {
  // The layer doesn't carry a "traditional county" column — only Council. We
  // pull a generous bbox covering all of NI and filter client-side. NI is
  // small enough that this is faster than firing 11 council queries.
  const NI_BBOX = { minLat: 54.0, minLng: -8.2, maxLat: 55.4, maxLng: -5.3 };
  const all = await fetchAllNI();
  const want = traditionalCounty.trim().toLowerCase();
  return all.filter(
    (s) =>
      s.lat >= NI_BBOX.minLat &&
      s.lat <= NI_BBOX.maxLat &&
      s.lng >= NI_BBOX.minLng &&
      s.lng <= NI_BBOX.maxLng &&
      s.county.toLowerCase() === want,
  );
}

/** Fetch every NI site (paginated). */
export async function fetchAllNI(): Promise<ArchSite[]> {
  const PAGE = 2000; // service maxRecordCount

  const countParams = new URLSearchParams({
    where: '1=1',
    returnCountOnly: 'true',
    f: 'json',
  });
  const buildPage = (offset: number) => {
    const p = buildBaseParams();
    p.set('where', '1=1');
    p.set('resultOffset', String(offset));
    p.set('resultRecordCount', String(PAGE));
    p.set('orderByFields', 'OBJECTID');
    return `${BASE_URL}?${p.toString()}`;
  };

  let total = 0;
  try {
    const r = await fetch(`${BASE_URL}?${countParams.toString()}`);
    if (r.ok) {
      const d = (await r.json()) as { count?: number };
      total = typeof d.count === 'number' ? d.count : 0;
    }
  } catch {
    // ignore — we'll fall back to a single page below
  }

  if (total === 0) {
    // Fallback: just take the first page
    try {
      const r = await fetch(buildPage(0));
      if (!r.ok) return [];
      const d: NIResponse = await r.json();
      return (d.features ?? [])
        .map(mapFeatureToSite)
        .filter((s): s is ArchSite => s !== null);
    } catch {
      return [];
    }
  }

  const offsets: number[] = [];
  for (let off = 0; off < total; off += PAGE) offsets.push(off);

  const pages = await Promise.all(
    offsets.map(async (off) => {
      try {
        const r = await fetch(buildPage(off));
        if (!r.ok) return [] as ArchSite[];
        const d: NIResponse = await r.json();
        return (d.features ?? [])
          .map(mapFeatureToSite)
          .filter((s): s is ArchSite => s !== null);
      } catch {
        return [] as ArchSite[];
      }
    }),
  );

  return pages.flat();
}

/** Sparse country-wide NI sample — analogue of fetchCountrySample for ROI. */
export async function fetchNICountrySample(maxResults: number = 600): Promise<ArchSite[]> {
  const params = buildBaseParams();
  params.set('where', '1=1');
  params.set('resultRecordCount', String(Math.min(maxResults, 2000)));
  params.set('orderByFields', 'OBJECTID');
  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const data: NIResponse = await res.json();
    const sites = (data.features ?? [])
      .map(mapFeatureToSite)
      .filter((s): s is ArchSite => s !== null);
    // Stride-sample to spread coverage if we got more than we want
    if (sites.length <= maxResults) return sites;
    const step = sites.length / maxResults;
    const out: ArchSite[] = [];
    for (let i = 0; i < maxResults; i++) out.push(sites[Math.floor(i * step)]);
    return out;
  } catch {
    return [];
  }
}

/** Free-text search by townland or monument type across NI. */
export async function searchNISites(query: string, limit: number = 25): Promise<ArchSite[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const cleaned = q.replace(/[\u0000-\u001F\u007F%_]/g, '').slice(0, 60);
  if (cleaned.length < 2) return [];
  const safe = cleaned.replace(/'/g, "''").toUpperCase();
  const where =
    `(UPPER(Townland_s_) LIKE '%${safe}%'` +
    ` OR UPPER(General_Type) LIKE '%${safe}%'` +
    ` OR UPPER(Edited_Type) LIKE '%${safe}%'` +
    ` OR UPPER(SMRNo) LIKE '%${safe}%')`;
  const params = buildBaseParams();
  params.set('where', where);
  params.set('resultRecordCount', String(Math.min(Math.max(1, limit), 50)));
  params.set('orderByFields', 'Townland_s_ ASC');
  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const data: NIResponse = await res.json();
    return (data.features ?? [])
      .map(mapFeatureToSite)
      .filter((s): s is ArchSite => s !== null);
  } catch {
    return [];
  }
}

/** Six traditional counties of Northern Ireland. */
export const NI_COUNTIES = ['Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone'] as const;
