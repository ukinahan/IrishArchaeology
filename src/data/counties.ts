// src/data/counties.ts
// Single source of truth for the 26 counties of the Republic of Ireland and
// the 6 traditional counties of Northern Ireland. Imported by the map filter,
// trip planner wizard, and welcome screen so they stay in sync.
export const ROI_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
] as const;

export const NI_COUNTIES = [
  'Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone',
] as const;

/** All 32 traditional counties of the island of Ireland, alphabetical. */
export const IRISH_COUNTIES = [...ROI_COUNTIES, ...NI_COUNTIES]
  .slice()
  .sort() as readonly string[];

export type IrishCounty = (typeof IRISH_COUNTIES)[number];
