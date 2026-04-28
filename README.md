# Evin Cairn

**Explore Ireland's archaeology. Open the app anywhere and instantly discover the ancient sites around you.**

Evin Cairn connects to the National Monuments Service (NMS) database — over 930,000 recorded archaeological sites across Ireland — and puts them on a map at your fingertips.

## Features

- **Nearby Map** — Satellite map centred on your GPS location with colour-coded site markers. Filter by radius (250 m – 50 km), historical period, or county.
- **"What Am I Looking At?"** — Point your phone and tap. The app uses your location and compass heading to identify the nearest site and tell you what it is.
- **Stories** — Curated editorial pieces on Ireland's archaeological heritage, from passage tombs to round towers.
- **Saved Sites** — Bookmark any site for offline reference.
- **Live Data** — Queries the NMS ArcGIS Feature Service in real time; no bundled dataset to go stale.
- **Offline Cache** — Recently viewed sites are cached locally (7-day TTL) so the app works without signal.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, Expo Router v6 |
| Language | TypeScript |
| Platforms | iOS (App Store) · Android ready |
| Maps | `react-native-maps` (Apple Maps on iOS, Google Maps on Android) |
| Data | NMS ArcGIS Feature Service (spatial + attribute queries) |
| State | Zustand v5 |
| Offline | AsyncStorage with 7-day TTL |

## Project Structure

```
app/
  _layout.tsx           Root layout (GestureHandler + StatusBar)
  index.tsx             Redirects to /(tabs)
  (tabs)/
    _layout.tsx         Bottom tab bar
    index.tsx           Nearby Map screen
    explore.tsx         "What Am I Looking At?" screen
    stories.tsx         Story list screen
    saved.tsx           Saved sites screen
  site/[id].tsx         Site detail (full card)
  story/[id].tsx        Story reader

src/
  components/
    SiteCard.tsx        Full-screen site detail card
    SiteMarker.tsx      Map pin component
    PeriodBadge.tsx     Coloured period label
    PeriodFilterBar.tsx Horizontal period filter strip
    TimelineBar.tsx     Visual timeline component
    AccessBadge.tsx     Trust/safety label
    TabBarIcon.tsx      Ionicon wrapper
  data/
    sites.ts            Types + period definitions
    monumentPeriods.ts  NMS class → period mapping (~100 entries)
    stories.ts          Curated stories
  hooks/
    useLocation.ts      GPS + heading hook
  services/
    siteService.ts      NMS ArcGIS Feature Service client
  store/
    useSiteStore.ts     Zustand store (sites, saved, filters, radius)
  utils/
    theme.ts            Colours, fonts, shadows
    inference.ts        "What Am I Looking At?" engine
    offlineCache.ts     AsyncStorage site caching
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run

```bash
# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android

# Physical device (Expo Go)
npx expo start
```

### 3. Build for App Store

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

## Data Source

The app queries the **National Monuments Service ArcGIS Feature Service** in real time:

```
https://services-eu1.arcgis.com/HyjXgkV6KGMSF3jt/arcgis/rest/services/SMR/FeatureServer/0/query
```

- ~930,000 recorded archaeological sites across all 26 counties
- Spatial queries (sites within radius of GPS location)
- Paginated county queries (2,000 records per page)
- Monument classes mapped to 8 app periods: Mesolithic → Post-Medieval

## Licence

MIT
