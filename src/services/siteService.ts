// src/services/siteService.ts
// Queries the National Monuments Service ArcGIS Feature Service for SMR sites.
// Source: Archaeological Survey of Ireland — CC BY 4.0
import { ArchSite } from '../data/sites';
import { inferPeriod } from '../data/monumentPeriods';

const BASE_URL =
  'https://services-eu1.arcgis.com/HyjXgkV6KGMSF3jt/arcgis/rest/services/SMR/FeatureServer/0/query';

const OUT_FIELDS = [
  'SMRS',
  'ENTITY_ID',
  'COUNTY',
  'TOWNLAND',
  'LATITUDE',
  'LONGITUDE',
  'MONUMENT_CLASS',
  'WEB_NOTES',
  'WEBSITE_LINK',
].join(',');

interface ArcGISFeature {
  attributes: {
    SMRS: string;
    ENTITY_ID: string;
    COUNTY: string;
    TOWNLAND: string;
    LATITUDE: number;
    LONGITUDE: number;
    MONUMENT_CLASS: string;
    WEB_NOTES: string | null;
    WEBSITE_LINK: string | null;
  };
}

interface ArcGISResponse {
  features: ArcGISFeature[];
  exceededTransferLimit?: boolean;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapFeatureToSite(f: ArcGISFeature): ArchSite {
  const a = f.attributes;
  const monumentClass = a.MONUMENT_CLASS ?? 'Unknown';
  const townland = a.TOWNLAND ? titleCase(a.TOWNLAND) : '';
  const name = townland ? `${monumentClass}, ${townland}` : monumentClass;

  return {
    id: a.SMRS || a.ENTITY_ID,
    name,
    type: monumentClass,
    period: inferPeriod(monumentClass),
    lat: a.LATITUDE,
    lng: a.LONGITUDE,
    county: titleCase(a.COUNTY ?? ''),
    smrRef: a.SMRS ?? undefined,
    whatItIs: a.WEB_NOTES ?? `A ${monumentClass.toLowerCase()} recorded in the Sites and Monuments Record.`,
    accessStatus: 'protected',
    accessNote: 'Recorded in the Sites and Monuments Record. Protected under the National Monuments Act.',
    isMonument: true,
  };
}

/**
 * Fetch sites within a radius of a point from the NMS Feature Service.
 * @param lat  centre latitude (WGS84)
 * @param lng  centre longitude (WGS84)
 * @param radiusKm  search radius in kilometres (default 10)
 * @returns array of ArchSite records
 */
export async function fetchSitesNear(
  lat: number,
  lng: number,
  radiusKm: number = 10,
): Promise<ArchSite[]> {
  const params = new URLSearchParams({
    where: "MONUMENT_CLASS <> 'Redundant record'",
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    distance: String(radiusKm * 1000),
    units: 'esriSRUnit_Meter',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: OUT_FIELDS,
    outSR: '4326',
    returnGeometry: 'false',
    f: 'json',
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`NMS API error: ${res.status}`);
  }

  const data: ArcGISResponse = await res.json();
  return (data.features ?? []).map(mapFeatureToSite);
}

/**
 * Fetch sites filtered by county name.
 */
export async function fetchSitesByCounty(county: string): Promise<ArchSite[]> {
  const allSites: ArchSite[] = [];
  let offset = 0;
  const PAGE = 2000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      where: `COUNTY = '${county.toUpperCase()}' AND MONUMENT_CLASS <> 'Redundant record'`,
      outFields: OUT_FIELDS,
      outSR: '4326',
      returnGeometry: 'false',
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
      f: 'json',
    });

    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`NMS API error: ${res.status}`);

    const data: ArcGISResponse = await res.json();
    const batch = (data.features ?? []).map(mapFeatureToSite);
    allSites.push(...batch);

    if (!data.exceededTransferLimit || batch.length < PAGE) break;
    offset += PAGE;
  }

  return allSites;
}
