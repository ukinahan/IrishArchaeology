// src/components/PeriodFilterBar.tsx
import { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Period, PERIOD_ICONS, PERIOD_LABELS } from '../data/sites';
import { COLORS, FONTS, RADII } from '../utils/theme';

const PERIODS: Period[] = [
  'mesolithic',
  'neolithic',
  'bronze_age',
  'iron_age',
  'early_christian',
  'early_medieval',
  'medieval',
  'post_medieval',
];

type Item = { key: Period | 'all'; label: string; icon?: string };

const ITEMS: Item[] = [
  { key: 'all', label: 'All Periods' },
  ...PERIODS.map<Item>((p) => ({ key: p, label: PERIOD_LABELS[p], icon: PERIOD_ICONS[p] })),
];

interface Props {
  active: Period | null;
  onChange: (period: Period | null) => void;
}

export function PeriodFilterBar({ active, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const activeLabel = active === null ? 'All Periods' : PERIOD_LABELS[active];
  const activeIcon = active === null ? null : PERIOD_ICONS[active];

  const handleSelect = (key: Period | 'all') => {
    setOpen(false);
    onChange(key === 'all' ? null : key);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Period:</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpen(true)}
        accessibilityLabel="Select period"
        accessibilityRole="button"
      >
        <View style={styles.dropdownInner}>
          {activeIcon && <Text style={styles.icon}>{activeIcon}</Text>}
          <Text style={styles.dropdownText}>{activeLabel}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={COLORS.stoneLight} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Period</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.parchment} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ITEMS}
              keyExtractor={(it) => it.key}
              renderItem={({ item }) => {
                const isActive =
                  item.key === 'all' ? active === null : active === item.key;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => handleSelect(item.key)}
                  >
                    <View style={styles.modalItemLeft}>
                      {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
                      <Text
                        style={[styles.modalItemText, isActive && styles.modalItemTextActive]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark" size={18} color={COLORS.forestDark} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight, fontWeight: '600' },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.forestMid,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    borderRadius: RADII.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdownText: { fontSize: FONTS.sizes.sm, color: COLORS.parchment, fontWeight: '600' },
  icon: { fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.forestDark,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.forestLight,
  },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.parchment },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.forestLight,
  },
  modalItemActive: { backgroundColor: COLORS.gold },
  modalItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalItemText: { fontSize: FONTS.sizes.md, color: COLORS.parchment },
  modalItemTextActive: { color: COLORS.forestDark, fontWeight: '700' },
});
