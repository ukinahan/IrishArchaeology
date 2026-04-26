// src/services/audioService.ts
// Lightweight narration audio player. Uses expo-av if installed; otherwise
// silently no-ops so the rest of the app keeps building until the package
// is added.
//
// Wire-up: `npx expo install expo-av`. No manual config required for mp3
// streaming over HTTPS.
let av: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  av = require('expo-av');
} catch {
  av = null;
}

interface SoundLike {
  unloadAsync: () => Promise<unknown>;
  playAsync: () => Promise<unknown>;
  pauseAsync: () => Promise<unknown>;
  setOnPlaybackStatusUpdate?: (cb: (status: any) => void) => void;
}

let current: SoundLike | null = null;
let currentUrl: string | null = null;

export interface PlaybackEvent {
  isPlaying: boolean;
  isLoaded: boolean;
  positionMillis: number;
  durationMillis: number | null;
  didJustFinish: boolean;
}

export type PlaybackListener = (e: PlaybackEvent) => void;

export const isAudioAvailable = (): boolean => av !== null;

/**
 * Stop and unload any currently-playing narration.
 */
export async function stopAudio(): Promise<void> {
  if (current) {
    try {
      await current.unloadAsync();
    } catch {
      /* ignore */
    }
  }
  current = null;
  currentUrl = null;
}

/**
 * Plays the given mp3 URL. If the same URL is already playing, this is a
 * no-op. If a different URL is playing, it's stopped first.
 */
export async function playAudio(
  url: string,
  onUpdate?: PlaybackListener,
): Promise<boolean> {
  if (!av) return false;
  if (currentUrl === url && current) {
    try {
      await current.playAsync();
      return true;
    } catch {
      /* fall through to reload */
    }
  }
  await stopAudio();

  try {
    await av.Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const { sound } = await av.Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true },
      (status: any) => {
        if (!onUpdate) return;
        onUpdate({
          isPlaying: !!status?.isPlaying,
          isLoaded: !!status?.isLoaded,
          positionMillis: status?.positionMillis ?? 0,
          durationMillis: status?.durationMillis ?? null,
          didJustFinish: !!status?.didJustFinish,
        });
      },
    );
    current = sound;
    currentUrl = url;
    return true;
  } catch {
    return false;
  }
}

export async function pauseAudio(): Promise<void> {
  if (current) {
    try {
      await current.pauseAsync();
    } catch {
      /* ignore */
    }
  }
}
