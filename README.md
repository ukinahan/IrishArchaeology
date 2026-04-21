# Evin Cairn — Irish Archaeology App

**"Open the app anywhere in Ireland and instantly understand the archaeology beneath your feet — in plain English."**

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 52 + Expo Router v4 |
| Platforms | iOS & Android |
| Maps | `react-native-maps` (Google Maps on Android, Apple Maps on iOS) · Mapbox token ready in `app.json` |
| State | Zustand (no boilerplate) |
| Navigation | Expo Router file-based tabs + stack |
| Offline | AsyncStorage site cache (7-day TTL, bundled fallback) |
| Language | TypeScript throughout |

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
    meathSites.ts       Pilot dataset — 10 Meath sites
    stories.ts          5 flagship stories (500-700 words each)
  hooks/
    useLocation.ts      GPS + heading hook
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

### 2. Add your Mapbox token

Edit `app.json` → `extra.MAPBOX_ACCESS_TOKEN` with your token from [mapbox.com](https://mapbox.com).

> The app ships with `react-native-maps` (free, no token needed) as the default map provider. Switch to `@rnmapbox/maps` for offline tile downloads and custom styling — the dependency is already included.

### 3. Run

```bash
# iOS simulator
npx expo start --ios

# Android emulator  
npx expo start --android

# Physical device (Expo Go)
npx expo start
```

## Pilot Dataset — County Meath

10 curated high-confidence sites:

| Site | Type | Period |
|---|---|---|
| Newgrange | Passage Tomb | Stone Age |
| Knowth | Passage Tomb Complex | Stone Age |
| Dowth | Passage Tomb | Stone Age |
| Hill of Tara | Royal Ceremonial Complex | Iron Age |
| Loughcrew Cairns | Passage Tomb Cemetery | Stone Age |
| Tlachtga (Hill of Ward) | Ceremonial Hillfort | Iron Age |
| Skryne Church | Medieval Church | Medieval |
| Trim Castle | Anglo-Norman Castle | Medieval |
| Fourknocks | Passage Tomb | Stone Age |
| Bective Abbey | Cistercian Abbey | Medieval |

## Stories (Launch Set)

1. Daily Life in a Ringfort
2. Who Built the Passage Tombs — and Why?
3. Monasteries as Power Centres
4. The Origin of Halloween *(Tlachtga linkage)*
5. The Norman Transformation of Ireland *(Trim + Bective linkage)*

## MVP Features Implemented

- [x] GPS-first map with period filtering and radius selector
- [x] Plain-English site cards with timeline bar
- [x] "What Am I Looking At?" probabilistic inference engine
- [x] Time-Period Explorer filter bar
- [x] Offline caching (AsyncStorage, 7-day TTL)
- [x] Save & share (bookmark + native Share API)
- [x] Trust & safety labels (access status, monument protection notices)
- [x] Story reader with related site linking

## Next Steps (Post-MVP)

- [ ] Expand dataset to full SMR integration
- [ ] Switch map to Mapbox for offline tile downloads
- [ ] County/road-trip pack downloads
- [ ] AR overlay (camera + compass + site markers)
- [ ] User site submissions with NMS review workflow
- [ ] Fáilte Ireland / county council partnership data

## Data Sources & Credits

Pilot site data compiled from public sources:
- [National Monuments Service (Ireland)](https://www.archaeology.ie)
- [Historic Environment Viewer](https://maps.archaeology.ie/HistoricEnvironment/)
- Published archaeological surveys

All site descriptions are original, written for a general audience.

## Licence

MIT for code · Site content © Evin Cairn
