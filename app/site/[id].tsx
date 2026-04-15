// app/site/[id].tsx  —  Site detail route
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSiteStore } from '@/store/useSiteStore';
import { SiteCard } from '@/components/SiteCard';
import { COLORS, FONTS } from '@/utils/theme';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const site = useSiteStore((s) => s.allSites.find((s) => s.id === id));

  if (!site) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Site not found</Text>
      </View>
    );
  }

  return <SiteCard site={site} />;
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forestDark,
  },
  notFoundText: { color: COLORS.stoneLight, fontSize: FONTS.sizes.lg },
});
