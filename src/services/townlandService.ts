// Townland boundary service — queries Tailte Éireann's Townlands (National
// Statutory Boundaries 2019, generalised 20m) ArcGIS Feature Service.
//
// Used to power the "search a townland" UX in the explore map: typing
// returns matching townland names; selecting one fetches the polygon and
// outlines it on the map (similar to the NMS / ArcGIS map viewer).
//
// Layer:
//   https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/
//     Townlands_OSi_National_Statutory_Boundaries___Generalised_20m/FeatureServer/0
// Fields: TD_ID, ENGLISH, GAEILGE, COUNTY, CENTROID_X, CENTROID_Y, AREA, ...
// Geometry: Polygon, native SR EPSG:2157 (ITM); we request outSR=4326.

const TOWNLAND_QUERY_URL =
  'https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/Townlands_OSi_National_Statutory_Boundaries___Generalised_20m/FeatureServer/0/query';

export interface TownlandHit {
  tdId: string;
  name: string;
  county: string;
  area: number; // square metres, from AREA field
}

export interface TownlandPolygon {
  tdId: string;
  name: string;
  county: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  centroid: { lat: number; lng: number };
}

// Cheap autocomplete query — name + county only, no geometry.
export async function searchTownlands(
  name: string,
  limit = 8,
  signal?: AbortSignal,
): Promise<TownlandHit[]> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return [];
  // ArcGIS SQL: case-insensitive prefix + word-boundary match. Escape quotes.
  const safe = trimmed.replace(/'/g, "''").toUpperCase();
  const where = `UPPER(ENGLISH) LIKE '${safe}%' OR UPPER(ENGLISH) LIKE '% ${safe}%'`;
  const params = new URLSearchParams({
    where,
    outFields: 'TD_ID,ENGLISH,COUNTY,AREA',
    returnGeometry: 'false',
    orderByFields: 'ENGLISH',
    resultRecordCount: String(limit),
    f: 'json',
  });
  const res = await fetch(`${TOWNLAND_QUERY_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Townland search failed: ${res.status}`);
  const data = await res.json();
  return (data.features ?? [])
    .map((f: any): TownlandHit | null => {
      const a = f.attributes ?? {};
      if (!a.TD_ID || !a.ENGLISH) return null;
      return {
        tdId: String(a.TD_ID),
        name: String(a.ENGLISH),
        county: String(a.COUNTY ?? ''),
        area: typeof a.AREA === 'number' ? a.AREA : 0,
      };
    })
    .filter((x: TownlandHit | null): x is TownlandHit => x !== null);
}

// Fetch the polygon geometry for a single townland (by TD_ID) in WGS84.
export async function fetchTownlandPolygon(
  tdId: string,
  signal?: AbortSignal,
): Promise<TownlandPolygon | null> {
  const params = new URLSearchParams({
    where: `TD_ID='${tdId.replace(/'/g, "''")}'`,
    outFields: 'TD_ID,ENGLISH,COUNTY',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  });
  const res = await fetch(`${TOWNLAND_QUERY_URL}?${params.toString()}`, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data.features?.[0];
  if (!feat?.geometry) return null;
  const geom = feat.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
  const bbox = computeBbox(geom);
  if (!bbox) return null;
  return {
    tdId,
    name: String(feat.properties?.ENGLISH ?? ''),
    county: String(feat.properties?.COUNTY ?? ''),
    geometry: geom,
    bbox,
    centroid: { lat: (bbox[1] + bbox[3]) / 2, lng: (bbox[0] + bbox[2]) / 2 },
  };
}

function computeBbox(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [number, number, number, number] | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  const rings: number[][][] =
    geom.type === 'Polygon' ? geom.coordinates : ([] as number[][][]).concat(...geom.coordinates);
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  if (!Number.isFinite(minLng)) return null;
  return [minLng, minLat, maxLng, maxLat];
}
