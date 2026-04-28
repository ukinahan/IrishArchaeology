# Sprint 7 Master Plan — "From Useful to Loved"

**Theme:** Trust the planner, never lose offline, hear the stones speak.
**Duration:** ~3 weeks (15 working days), broken into 3 weekly milestones.
**Ship target:** v1.7.0 → builds 44–55 across the sprint, single App Store submission at end.
**Status legend:** ⬜ not started · 🟡 in progress · ✅ done

---

## Milestone 7A — "Trustworthy" (Week 1, builds 44–47)

Goal: the planner stops lying about distances; the app becomes useful in the field.

### 7A.1 — Mapbox Directions integration ⬜
**Files to add/touch:**
- `src/services/directionsService.ts` *(new)* — wraps Mapbox Directions API; returns `{ km, minutes, polyline }`
- `src/utils/tripPlanner.ts` — `orderStops()` becomes async; uses real distance matrix
- `src/utils/distanceCache.ts` *(new)* — AsyncStorage cache keyed by rounded `lat,lng→lat,lng` (4 decimals), TTL 30 days
- `app/(tabs)/plan.tsx` — show "Calculating route…" between cluster + render
- `app.config.js` — read `MAPBOX_DIRECTIONS_TOKEN` (same token works)

**Cost guard:** rate-limit to 1 matrix request per planner run; cache aggressively.

**Tests:** `__tests__/directionsService.test.ts` (mocked fetch), `__tests__/distanceCache.test.ts`

**AC:** Plan shows real km + drive minutes; offline → falls back to current great-circle estimate with a "(estimated)" tag.

### 7A.2 — "Near me now" button ⬜
**Files:**
- `app/(tabs)/index.tsx` — new `<NearMeButton/>` overlay on map (bottom-left, above tab bar)
- `src/components/NearMeButton.tsx` *(new)*
- `src/utils/proximity.ts` *(new)* — `sitesWithinMinutes(origin, all, mins)` using straight-line + ROAD_FACTOR for the cheap pre-filter, then real Mapbox distance for the top 20

**UX:** Tap → bottom sheet with sites within 30 min, sorted by drive time, tappable → site detail. Default radius user-adjustable (15/30/60 min chips).

**AC:** Returns ≥1 site for any urban area in Ireland; works with location permission denied (graceful empty state with "Enable location" CTA).

### 7A.3 — Offline mode for counties ⬜
**Files:**
- `src/services/offlinePackService.ts` *(new)* — wraps `offlineManager.createPack()` for Mapbox + bulk-fetches site JSON + photo thumbnails to AsyncStorage
- `app/settings.tsx` — new "Downloads" section: list of counties with size + delete
- `src/store/useDownloadsStore.ts` *(new)* — Zustand persisted state of downloaded county manifests

**Storage budget:** target <50 MB per county (Mapbox tiles dominate). Show estimated size before download.

**AC:** Airplane-mode test: open a downloaded county → map renders, sites cluster, photos show, site detail opens.

---

## Milestone 7B — "Deep" (Week 2, builds 48–51)

Goal: site pages become guidebook-quality; serendipity loops emerge.

### 7B.1 — Site detail page v2 ⬜
**Files:**
- `app/site/[id].tsx` — extensive rewrite, additive sections
- `src/services/wikipediaService.ts` *(new)* — REST API extract endpoint, cache forever
- `src/services/sunriseService.ts` *(new)* — sunrise-sunset.org API, cache 30 days per coord
- `src/utils/visitTime.ts` *(new)* — `recommendedVisitMinutes(site)` based on type + marquee status
- `src/components/NearbySitesCarousel.tsx` *(new)* — uses `proximity.ts` for "within 10 km"
- `src/components/AccessibilityCard.tsx` *(new)* — parking, walk distance, terrain (data on marquee sites only initially)

**Data:** Extend `marqueeSites.ts` with `accessibility?: { parking, walkMinutes, terrain }`. Crowd-source the rest in Sprint 8.

**AC:** Newgrange page now has: photo, period badge, Wikipedia summary, golden hour times, recommended visit duration, parking/walk info, 5 nearby sites, "Add to trip" button.

### 7B.2 — Add-to-Trip from site detail ⬜
**Files:**
- `app/site/[id].tsx` — "Add to plan" button
- `src/store/useTripDraftStore.ts` *(new)* — holds an in-progress site collection across screens; planner consumes it as a fixed-include list

**Tripplanner change:** Accept `mustInclude: ArchSite[]` — those sites bypass scoring + dedupe and are inserted into clusters first.

**AC:** Browse map → tap 4 sites → add each → tap "Plan trip with these" → planner builds days around them.

### 7B.3 — Trip share links (deferred-deep-link MVP) ⬜
**Files:**
- `src/services/planShareService.ts` *(new)* — POST plan to a tiny Cloudflare Worker, returns short URL
- Worker code in `infra/share-worker/` *(new)* — Workers KV stores `{shortId: planJson}`, 90-day TTL, free tier covers ~100k plans
- `app/plan/[shareId].tsx` *(new)* — receives a shared plan
- `app.json` — universal links + custom scheme `evincairn://plan/abc123`

**AC:** Tap "Share" on a saved plan → get `https://evincairn.app/p/abc123` → opening on a phone with the app deep-links into the imported plan; without app, browser shows preview + "Get Evin Cairn" button.

---

## Milestone 7C — "Loved" (Week 3, builds 52–55)

Goal: audio guides + premium scaffolding + Stories content.

### 7C.1 — Audio guides infrastructure ⬜
**Files:**
- `src/services/audioService.ts` *(new)* — wraps `expo-av` `Audio.Sound`
- `src/components/AudioPlayer.tsx` *(new)* — mini player on site detail; play/pause, scrubber, 15s skip
- `src/store/useAudioStore.ts` *(new)* — single-session playback state, pause-on-background
- Manifest: `audio-manifest.json` hosted at `https://ukinahan.github.io/IrishArchaeology/audio/manifest.json` mapping `siteId → mp3 URL + duration + transcript`
- Audio files hosted on Cloudflare R2 (custom domain `audio.evincairn.app`), 128 kbps mono mp3, ~2 MB per 3-min guide

**Content production (parallel track):**
- 30 marquee sites × ~300-word script (Claude 4 Opus)
- ElevenLabs voice (Irish/English narrator preset) → ~€30 of credits
- Manual review for pronunciation (Sí, Brú na Bóinne, Dún Aonghasa)

**AC:** Newgrange site page → tap "Listen" → 3-min guide plays; works offline if county was downloaded; pauses on incoming call/notification.

### 7C.2 — Stories tab content drop ⬜
**Files:**
- `src/data/stories.ts` — add 10 new stories (target: 20 total)
- New stories link to ≥3 site IDs each → "Visit these places" CTA at the bottom

**Content:**
- "Why Did They Build Newgrange?"
- "The Vikings Weren't Just Raiders"
- "Ireland's Pyramids: The Cairns of the Boyne"
- "What's Inside a Ringfort?"
- "How to Read a Round Tower"
- "The Last Druids"
- "Cromwell's Trail of Destruction"
- "The Famine in the Landscape"
- "Ogham: Ireland's First Writing"
- "Brigid: Saint, Goddess, Both"

Each ~600-800 words, illustrated with Wikimedia images.

**AC:** Stories tab has 20 cards; tapping a story → reading view → "Visit these sites" deep-links into trip planner with `mustInclude`.

### 7C.3 — Premium scaffolding (no paywall yet) ⬜
**Files:**
- `src/services/iapService.ts` *(new)* — RevenueCat wrapper (`react-native-purchases`)
- `src/store/useEntitlementsStore.ts` *(new)* — `isPremium: boolean`, syncs with RC
- `app/settings.tsx` — new "Evin Cairn Premium" card (greyed out: "Coming soon")
- App Store Connect: configure subscription product `premium_monthly_499` + `premium_yearly_1999` (in review state)

**No features paywalled this sprint.** Scaffolding only — flip the switch in 7.1 once RC is verified working.

**AC:** RevenueCat dashboard shows TestFlight users; `isPremium` correctly reads sandbox purchases when toggled manually.

### 7C.4 — Analytics events (PostHog) ⬜
**Files:**
- `src/services/telemetry.ts` — add PostHog client beside Sentry; gated on same `analytics === 'granted'` consent
- New events: `site_view`, `site_added_to_trip`, `trip_planned`, `trip_saved`, `trip_shared`, `audio_played`, `audio_completed`, `time_machine_used`, `near_me_used`, `offline_pack_downloaded`

**AC:** PostHog dashboard shows funnel: `site_view → site_added_to_trip → trip_planned → trip_saved`. Consent-denied users emit zero events (verified by toggling settings).

---

## Cross-cutting / housekeeping

### Performance pass ⬜
- `React.memo` on `SiteCard`, `SiteMarker`, `DayCard`
- `useMemo` for `filteredSites` in Explore
- `FlatList` `getItemLayout` for Stories + Saved

### Accessibility pass ⬜
- VoiceOver labels on all icon-only buttons (audit with Xcode Accessibility Inspector)
- Dynamic Type support — switch hardcoded `fontSize: 14` to `useFontScale()`
- Honor `prefers-reduced-motion` → disable PulsingOrbs animation

### CI ⬜
- `.github/workflows/ci.yml` *(new)* — run `npm test` + `tsc --noEmit` on every push
- Catches regressions before they hit a build

### Privacy policy update ⬜
- `docs/privacy.md` — add: audio analytics (play/complete), Cloudflare Worker for share links (stores plan JSON only, no PII)

---

## Build cadence

| Build | Milestone | Ship to |
|-------|-----------|---------|
| 44 | 7A.1 dogfood | Internal TestFlight |
| 45 | 7A.2 + 7A.3 | Internal |
| 46 | 7A complete | External TestFlight |
| 47 | 7A bugfix | External |
| 48 | 7B.1 | Internal |
| 49 | 7B.2 + 7B.3 | Internal |
| 50 | 7B complete | External |
| 51 | 7B bugfix | External |
| 52 | 7C.1 (audio infra) | Internal |
| 53 | 7C.2 + 7C.3 | Internal |
| 54 | 7C complete + perf/a11y | External |
| 55 | RC for review | **App Store submission v1.7.0** |

---

## Cost projection for the sprint

| Service | Sprint cost |
|---------|-------------|
| Mapbox Directions API (dev + small user base) | < €5 |
| ElevenLabs (one-time, audio production) | ~€30 |
| Cloudflare R2 (audio hosting) | €0 (under free tier) |
| Cloudflare Workers + KV (share links) | €0 |
| EAS builds (~12 × $1.50) | ~$18 |
| PostHog | €0 (under 1M events/mo) |
| RevenueCat | €0 (under $10k MTR) |
| **Total** | **~€60** |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Mapbox Directions cost spike if planner is run repeatedly | Aggressive `distanceCache` with 30-day TTL; rate-limit to 1 matrix per plan |
| ElevenLabs voice sounds robotic on Irish names | Manual SSML pronunciation overrides per site |
| Universal links not working on iOS | Fallback to custom scheme; AASA file hosted on `docs/.well-known/apple-app-site-association` |
| RevenueCat sandbox flakiness | Don't paywall anything in v1.7.0 — scaffolding only |
| Audio downloads bloat offline pack size | Audio is opt-in per-site, not bundled with map pack |

---

## Definition of Done for Sprint 7

- [ ] Real driving distances in trip planner (cached, offline fallback)
- [ ] "Near me" returns sites for any Irish location
- [ ] At least 1 county fully downloadable for offline use
- [ ] Site detail v2 live for all marquee sites + 100% of NMS sites (with reduced fields)
- [ ] Add-to-trip works from anywhere
- [ ] Plan share links round-trip via Cloudflare Worker
- [ ] 30 audio guides live, playable offline if pack downloaded
- [ ] 20 stories with site deep-links
- [ ] Premium SKU live in App Store Connect (no features paywalled)
- [ ] PostHog funnel populated with real events
- [ ] All 60+ tests passing; CI green
- [ ] v1.7.0 submitted to App Store review

---

## App Store v1.6.0 listing copy (current submission)

### "What's New in This Version"

```
Big update for trip planners and privacy-conscious explorers.

PLAN A TRIP — NOW SMARTER
• Drive-time and visit-time estimates for every day
• Tap "Route" to open a full day's stops in Google or Apple Maps
• Save trips to revisit later — name them, share them, delete them
• Export your itinerary to your calendar (.ics) in one tap
• Smart day caps: trips automatically trim to keep each day under ~250 km so you actually get to enjoy the sites

TIME MACHINE
• New timeline slider on the Explore screen — drag through 10,000 years of Irish prehistory and watch sites filter in real time, from Mesolithic camps to Norman tower houses

PRIVACY FIRST (GDPR)
• On first launch, choose what (if anything) you want to share
• New Settings screen to change your mind any time — separate toggles for analytics and crash reports
• Full privacy policy linked from Settings

POLISH
• Stories tab now supports pull-to-refresh
• Better contrast on subtitles and captions for outdoor readability
• Faster, deduplicated Wikimedia photo loading
• County filter now covers all 26 counties of the Republic
• Fixed: Maps occasionally opening the wrong same-named site
• Fixed: Calendar export failing on some devices
```

### Promotional Text options (170 char max)

**A — practical (167 chars)**
```
Plan multi-day archaeology road trips across Ireland with smart day caps, drive times, calendar export, and offline maps. New: Time Machine timeline + privacy controls.
```

**B — evocative (165 chars)**
```
Drag a slider through 10,000 years of Irish prehistory. Plan smarter trips with drive-time estimates and one-tap calendar export. Now with full GDPR privacy controls.
```

**C — short & punchy (138 chars)**
```
New Time Machine timeline, smarter trip planner with day caps and calendar export, and full privacy controls. Ireland, then and now.
```

### Subtitle suggestions (30 char max)
- `Ireland's archaeology, mapped` (29)
- `10,000 years, one tap away` (26)
- `Discover ancient Ireland` (24)

### Keywords (100 char max)
```
ireland,archaeology,history,celtic,megalith,passage,tomb,ringfort,heritage,prehistoric,trip,planner
```

### Reviewer Notes
```
This update adds a GDPR consent dialog on first launch (required by EU users).
No login required to test. The Trip Planner is on the "Plan" tab — try
"Suggested route" or pick a county and number of days. The new Time Machine
slider is on the Explore tab (toggle the clock icon).

Data source: National Monuments Service (Ireland) public ArcGIS feature
service. Photos via Wikimedia Commons API. No accounts, no ads, no tracking
without consent.
```

---

## Future sprints (parking lot)

- **Sprint 8** — Crowd-sourced accessibility data; user check-ins; visited-sites map
- **Sprint 9** — Android port + Google Play release
- **Sprint 10** — Community: reviews, photos, "I was here" stamps
- **Sprint 11** — AR view at top 10 sites (3D reconstruction overlay)
- **Sprint 12** — Welsh / Scottish / Cornish content expansion (rebrand to "Celtic Cairn"?)
