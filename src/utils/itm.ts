// src/utils/itm.ts
// WGS84 (lat/lng) → Irish Transverse Mercator (EPSG:2157) Easting/Northing.
//
// ITM is a Transverse Mercator projection on the GRS80 ellipsoid:
//   Latitude of origin:  53.5°N
//   Longitude of origin: -8°W
//   False easting:       600,000 m
//   False northing:      750,000 m
//   Scale factor:        0.99982
//
// We treat WGS84 as ETRS89 (the datum ITM is defined on); the difference is
// sub-metre and irrelevant for on-screen coordinate display. Uses the
// standard Snyder series — accurate to ~10 cm anywhere in Ireland.

const A = 6378137.0;                 // GRS80 semi-major axis
const F = 1 / 298.257222101;         // GRS80 flattening
const E2 = 2 * F - F * F;            // first eccentricity squared
const EP2 = E2 / (1 - E2);           // second eccentricity squared
const K0 = 0.99982;
const LAT0 = 53.5 * Math.PI / 180;
const LON0 = -8.0 * Math.PI / 180;
const FE = 600000;
const FN = 750000;

// Meridional arc M(φ) on GRS80
function meridionalArc(phi: number): number {
  const e2 = E2;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  return A * (
    (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
    - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi)
    - (35 * e6 / 3072) * Math.sin(6 * phi)
  );
}

const M0 = meridionalArc(LAT0);

export interface ITMCoord {
  easting: number;
  northing: number;
}

/**
 * Convert WGS84 latitude/longitude (degrees) to Irish Transverse Mercator
 * Easting/Northing in metres.
 */
export function wgs84ToITM(latDeg: number, lngDeg: number): ITMCoord {
  const phi = latDeg * Math.PI / 180;
  const lam = lngDeg * Math.PI / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = A / Math.sqrt(1 - E2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = EP2 * cosPhi * cosPhi;
  const Aa = (lam - LON0) * cosPhi;
  const M = meridionalArc(phi);

  const A2 = Aa * Aa;
  const A3 = A2 * Aa;
  const A4 = A3 * Aa;
  const A5 = A4 * Aa;
  const A6 = A5 * Aa;

  const easting = K0 * N * (
    Aa
    + (1 - T + C) * A3 / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * EP2) * A5 / 120
  ) + FE;

  const northing = K0 * (
    M - M0 + N * tanPhi * (
      A2 / 2
      + (5 - T + 9 * C + 4 * C * C) * A4 / 24
      + (61 - 58 * T + T * T + 600 * C - 330 * EP2) * A6 / 720
    )
  ) + FN;

  return { easting, northing };
}

/** Format ITM coordinates for display: "E 712,345  N 745,123" style. */
export function formatITM(coord: ITMCoord): string {
  const e = Math.round(coord.easting).toLocaleString('en-IE');
  const n = Math.round(coord.northing).toLocaleString('en-IE');
  return `E ${e}  N ${n}`;
}
