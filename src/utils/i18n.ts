// src/utils/i18n.ts
// Tiny i18n util — no dependency on react-i18next. Picks a locale from
// expo-localization at app start (defaulting to en, falling back to en for
// any unsupported locale) and exposes a `t(key)` function.
//
// We currently ship English ('en') and Irish ('ga'). Users can switch by
// setting their device language to Irish (Gaeilge). A future in-app
// override could persist a chosen locale in AsyncStorage.
import { getLocales } from 'expo-localization';

type Locale = 'en' | 'ga';
type Messages = Record<string, string>;

const en: Messages = {
  // Tab labels
  'tab.explore': 'Explore',
  'tab.map': 'Map',
  'tab.saved': 'Saved',
  'tab.stories': 'Stories',
  'tab.plan': 'Plan',

  // Common buttons
  'common.save': 'Save',
  'common.unsave': 'Unsave',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.download': 'Download',
  'common.keep': 'Keep',
  'common.retry': 'Retry',
  'common.close': 'Close',
  'common.share': 'Share',
  'common.directions': 'Directions',
  'common.openMap': 'Open in map',

  // Empty states
  'empty.saved.title': 'No saved sites yet',
  'empty.saved.body': 'Tap the heart on any site to save it here for later.',
  'empty.stories.title': 'No stories yet',
  'empty.stories.body': 'Stories appear here as the content team adds them.',
  'empty.results.title': 'No matches',
  'empty.results.body': 'Try a different filter or zoom out on the map.',
  'empty.location.title': 'Location turned off',
  'empty.location.body': 'Turn on location to see what\'s nearby.',

  // Periods (display labels)
  'period.stone_age': 'Stone Age',
  'period.bronze_age': 'Bronze Age',
  'period.iron_age': 'Iron Age',
  'period.early_christian': 'Early Christian',
  'period.early_medieval': 'Early Medieval',
  'period.medieval': 'Medieval',
  'period.post_medieval': 'Post Medieval',

  // A11y labels
  'a11y.save': 'Save site',
  'a11y.unsave': 'Remove from saved',
  'a11y.openSite': 'Open site details',
  'a11y.playAudio': 'Play audio narration',
  'a11y.refreshLocation': 'Refresh my location',

  // Offline pack
  'offline.downloadTitle': 'Download offline map?',
  'offline.downloadBody': 'Caches the Ireland overview map (~50–150 MB) so you can browse without a signal.',
  'offline.readyTitle': 'Offline map ready',
  'offline.readyBody': 'The Ireland overview map is downloaded. Delete it to free up disk space?',
};

const ga: Messages = {
  // Cluiche tabaí
  'tab.explore': 'Taiscéal',
  'tab.map': 'Léarscáil',
  'tab.saved': 'Sábháilte',
  'tab.stories': 'Scéalta',
  'tab.plan': 'Pleanáil',

  'common.save': 'Sábháil',
  'common.unsave': 'Dí-shábháil',
  'common.cancel': 'Cealaigh',
  'common.delete': 'Scrios',
  'common.download': 'Íoslódáil',
  'common.keep': 'Coimeád',
  'common.retry': 'Bain triail eile as',
  'common.close': 'Dún',
  'common.share': 'Roinn',
  'common.directions': 'Treoracha',
  'common.openMap': 'Oscail sa léarscáil',

  'empty.saved.title': 'Níl aon suíomh sábháilte',
  'empty.saved.body': 'Tapáil an croí ar aon suíomh chun é a shábháil anseo.',
  'empty.stories.title': 'Níl aon scéal fós',
  'empty.stories.body': 'Beidh scéalta ar fáil anseo nuair a chuirfear leo iad.',
  'empty.results.title': 'Aon torthaí',
  'empty.results.body': 'Triail scagaire eile nó déan súmáil amach ar an léarscáil.',
  'empty.location.title': 'Suíomh múchta',
  'empty.location.body': 'Cas suíomh ar siúl chun suíomhanna in aice leat a fheiceáil.',

  'period.stone_age': 'An Chlochaois',
  'period.bronze_age': 'Cré-umhaois',
  'period.iron_age': 'Iarnaois',
  'period.early_christian': 'Luath-Chríostaí',
  'period.early_medieval': 'Luathmheánaoiseach',
  'period.medieval': 'Meánaoiseach',
  'period.post_medieval': 'Iar-Mheánaoiseach',

  'a11y.save': 'Sábháil suíomh',
  'a11y.unsave': 'Bain ón liosta sábháilte',
  'a11y.openSite': 'Oscail sonraí an tsuímh',
  'a11y.playAudio': 'Seinn an guthú',
  'a11y.refreshLocation': 'Athnuaigh mo shuíomh',

  'offline.downloadTitle': 'Íoslódáil léarscáil oifige?',
  'offline.downloadBody': 'Cuireann sé léarscáil bhunúsach na hÉireann i dtaisce (~50–150 MB) ionas gur féidir leat é a úsáid as líne.',
  'offline.readyTitle': 'Léarscáil oifige réidh',
  'offline.readyBody': 'Tá léarscáil na hÉireann íoslódáilte. Scrios chun spás a shaoradh?',
};

const messages: Record<Locale, Messages> = { en, ga };

let currentLocale: Locale = 'en';

function detectLocale(): Locale {
  try {
    const locales = getLocales();
    const primary = locales?.[0]?.languageCode?.toLowerCase();
    if (primary === 'ga') return 'ga';
    return 'en';
  } catch {
    return 'en';
  }
}

// Lazy-init on first use to avoid running expo-localization at module-load
// time during unit tests.
let initialised = false;
function ensureInit(): void {
  if (initialised) return;
  initialised = true;
  currentLocale = detectLocale();
}

export function t(key: string): string {
  ensureInit();
  return messages[currentLocale][key] ?? messages.en[key] ?? key;
}

export function getLocale(): Locale {
  ensureInit();
  return currentLocale;
}

/** Test-only: override the active locale. */
export function __setLocaleForTesting(locale: Locale): void {
  currentLocale = locale;
  initialised = true;
}
