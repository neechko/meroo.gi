import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, formatIDR } from '../theme/sage';

interface Props {
  orders: any[];
  onSelectOrder: (order: any) => void;
}

export function OrdersScreen({ orders, onSelectOrder }: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const counts = {
    all: orders.length,
    active: orders.filter((o) => o.status === 'paid' || o.status === 'in_progress' || o.status === 'pending').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const filtered = orders.filter((o) => {
    if (filter === 'active') return o.status === 'paid' || o.status === 'in_progress' || o.status === 'pending';
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pesanan Saya ({orders.length})</Text>
        <Text style={styles.sub}>Ketuk pesanan untuk kalender checklist, vault, atau struk</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {(
            [
              { key: 'all', label: `Semua (${counts.all})` },
              { key: 'active', label: `Aktif (${counts.active})` },
              { key: 'completed', label: `Selesai (${counts.completed})` },
              { key: 'cancelled', label: `Batal (${counts.cancelled})` },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.chip, filter === tab.key && styles.chipActive]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[styles.chipText, filter === tab.key && styles.chipTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((ord) => (
          <TouchableOpacity key={ord.id} style={styles.card} onPress={() => onSelectOrder(ord)}>
            <View style={styles.row}>
              <Text style={styles.name}>{ord.services?.name || 'Layanan Joki'}</Text>
              <Text style={styles.status}>{ord.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.meta}>
              UID {ord.game_uid} • Server {ord.game_server}
            </Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${Math.min(100, ord.current_percentage || 0)}%` }]} />
            </View>
            <View style={styles.row}>
              <Text style={styles.price}>{formatIDR(ord.total_price)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.detailLink}>Detail & Struk ({ord.current_percentage}%)</Text>
                <FontAwesome5 name="chevron-right" size={12} color={SAGE.primaryDark} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 22, color: SAGE.textPrimary },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.primaryDark, marginTop: 2 },
  chip: { backgroundColor: SAGE.surfaceCard, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 14, marginRight: 8 },
  chipActive: { backgroundColor: SAGE.primary },
  chipText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.textSecondary },
  chipTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12, paddingBottom: 112 },
  card: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE.border,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: FONTS.displayBold, fontSize: 16, color: SAGE.textPrimary },
  status: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: SAGE.primaryDark,
    backgroundColor: SAGE.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  meta: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary },
  barBg: { height: 7, backgroundColor: SAGE.surfaceSoft, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 7, backgroundColor: SAGE.primary },
  price: { fontFamily: FONTS.displayBold, fontSize: 14, color: SAGE.textPrimary },
  detailLink: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.primaryDark },
});
