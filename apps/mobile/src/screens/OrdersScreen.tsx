import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, formatIDR } from '../theme/sage';
import { SpringTouchable } from '../components/SpringTouchable';
import {
  AnimatedCounter,
  AnimatedProgressBar,
  LivePulseDot,
  StaggerItem,
} from '../components/MotionPrimitives';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  function selectFilter(next: 'all' | 'active' | 'completed' | 'cancelled') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(next);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pesanan Saya ({orders.length})</Text>
        <Text style={styles.sub}>Ketuk pesanan untuk kalender checklist, vault, atau struk</Text>

        <View style={styles.segmentRow}>
          {(
            [
              { key: 'all', label: 'Semua', count: counts.all },
              { key: 'active', label: 'Aktif', count: counts.active },
              { key: 'completed', label: 'Selesai', count: counts.completed },
              { key: 'cancelled', label: 'Batal', count: counts.cancelled },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <SpringTouchable
                key={tab.key}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => selectFilter(tab.key)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                  {`${tab.label} (${tab.count})`}
                </Text>
              </SpringTouchable>
            );
          })}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((ord, idx) => {
          const isRunning = ord.status === 'paid' || ord.status === 'in_progress';
          return (
            <StaggerItem key={ord.id} index={idx}>
              <SpringTouchable style={styles.card} onPress={() => onSelectOrder(ord)}>
                <View style={styles.row}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <LivePulseDot color={isRunning ? SAGE.primary : SAGE.accentPeach} size={6} active={isRunning} />
                    <Text style={styles.name} numberOfLines={1}>{ord.services?.name || 'Layanan Joki'}</Text>
                  </View>
                  <Text style={styles.status}>{ord.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.meta}>
                  {`UID ${ord.game_uid} \u2022 Server ${ord.game_server}`}
                </Text>
                <AnimatedProgressBar percentage={ord.current_percentage || 0} height={8} isActive={isRunning} />
                <View style={styles.row}>
                  <Text style={styles.price}>{formatIDR(ord.total_price)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AnimatedCounter
                      value={ord.current_percentage || 0}
                      prefix="Progres "
                      suffix="%"
                      duration={900}
                      style={styles.detailLink}
                    />
                    <FontAwesome5 name="chevron-right" size={12} color={SAGE.primaryDark} />
                  </View>
                </View>
              </SpringTouchable>
            </StaggerItem>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 22, color: SAGE.textPrimary },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.primaryDark, marginTop: 2 },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
    marginTop: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: SAGE.primary,
  },
  segmentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: SAGE.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  list: { padding: 16, gap: 12, paddingBottom: 124 },
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
  price: { fontFamily: FONTS.displayBold, fontSize: 14, color: SAGE.textPrimary },
  detailLink: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.primaryDark },
});