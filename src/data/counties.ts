// src/data/counties.ts
// Single source of truth for the 26 counties of the Republic of Ireland.
// Imported by the map filter, trip planner wizard, and welcome screen so
// they stay in sync.
export const IRISH_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
] as const;

export type IrishCounty = (typeof IRISH_COUNTIES)[number];
