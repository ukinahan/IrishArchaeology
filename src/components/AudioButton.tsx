// src/components/AudioButton.tsx
// Compact play/pause control for narration audio. Renders nothing when no
// URL is provided or the audio module isn't available.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, RADII } from '../utils/theme';
import {
  isAudioAvailable,
  pauseAudio,
  playAudio,
  stopAudio,
} from '../services/audioService';
import { track } from '../utils/telemetry';

interface Props {
  url?: string;
  label?: string;
}

export function AudioButton({ url, label = 'Listen' }: Props) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Stop playback when the screen unmounts so audio doesn't continue
      // after the user navigates away.
      stopAudio().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!url) {
      setPlaying(false);
    }
  }, [url]);

  if (!url) return null;

  const onPress = async () => {
    if (!isAudioAvailable()) {
      setUnsupported(true);
      return;
    }
    if (playing) {
      await pauseAudio();
      if (mounted.current) setPlaying(false);
      return;
    }
    setLoading(true);
    track('audio_play', { url });
    const ok = await playAudio(url, (e) => {
      if (!mounted.current) return;
      setPlaying(e.isPlaying);
      if (e.didJustFinish) setPlaying(false);
    });
    if (mounted.current) {
      setLoading(false);
      if (!ok) setUnsupported(true);
    }
  };

  if (unsupported) {
    return (
      <View style={styles.unsupported} accessibilityRole="text">
        <Ionicons name="volume-mute" size={14} color={COLORS.stoneLight} />
        <Text style={styles.unsupportedText}>Audio unavailable on this device.</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause narration' : `${label} narration`}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.forestDark} size="small" />
      ) : (
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={18}
          color={COLORS.forestDark}
        />
      )}
      <Text style={styles.label}>{playing ? 'Pause' : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    borderRadius: RADII.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.forestDark,
  },
  unsupported: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  unsupportedText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.stoneLight,
  },
});
