import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

type OrderFilter = 'all' | 'active' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface Props {
  orders: any[];
  onSelectOrder: (order: any) => void;
  onGoCatalog?: () => void;
}

export function OrdersScreen({ orders, onSelectOrder, onGoCatalog }: Props) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<OrderFilter>('all');

  const counts = {
    all: orders.length,
    active: orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    in_progress: orders.filter((o) => o.status === 'in_progress' || o.status === 'paid').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const filtered = orders.filter((o) => {
    if (filter === 'active') return o.status !== 'completed' && o.status !== 'cancelled';
    if (filter === 'pending') return o.status === 'pending';
    if (filter === 'in_progress') return o.status === 'in_progress' || o.status === 'paid';
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  function selectFilter(next: OrderFilter) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(next);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(46, insets.top + 12) }]}>
        <Text style={styles.title}>Pesanan Saya ({orders.length})</Text>
        <Text style={styles.sub}>Ketuk pesanan untuk kalender checklist, vault, tracking, atau struk</Text>

        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator style={{ marginTop: 12, flexGrow: 0, borderRadius: 16 }} contentContainerStyle={styles.segmentRow}>
          {(
            [
              { key: 'all', label: 'Semua', count: counts.all },
              { key: 'active', label: 'Aktif', count: counts.active },
              { key: 'pending', label: 'Pending', count: counts.pending },
              { key: 'in_progress', label: 'Berjalan', count: counts.in_progress },
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
        </ScrollView>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <FontAwesome5 name="clipboard-list" size={28} color={SAGE.primary} />
            <Text style={styles.emptyTitle}>Belum ada pesanan di filter ini</Text>
            <Text style={styles.emptySub}>Jelajahi katalog layanan joki & rawat akun meroo.gi.</Text>
            {onGoCatalog && (
              <TouchableOpacity style={styles.emptyBtn} onPress={onGoCatalog}>
                <Text style={styles.emptyBtnText}>Buka Katalog Layanan</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((ord, idx) => {
            const isRunning = ord.status === 'paid' || ord.status === 'in_progress';
            const isOverdue =
              !!ord.expected_completion_at &&
              ord.status !== 'completed' &&
              ord.status !== 'cancelled' &&
              Date.now() > new Date(ord.expected_completion_at).getTime();

            return (
              <StaggerItem key={ord.id} index={idx}>
                <SpringTouchable style={styles.card} onPress={() => onSelectOrder(ord)}>
                  <View style={styles.row}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <LivePulseDot color={isRunning ? SAGE.primary : SAGE.accentPeach} size={6} active={isRunning} />
                      <Text style={styles.name} numberOfLines={1}>
                        {ord.services?.name || 'Layanan Joki'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isOverdue && <Text style={styles.overduePill}>OVERDUE</Text>}
                      <Text style={[styles.status, ord.status === 'cancelled' && styles.statusCancelled]}>
                        {ord.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {`#${ord.id.slice(0, 8)} \u2022 UID ${ord.game_uid} \u2022 ${ord.game_server}`}
                  </Text>
                  <AnimatedProgressBar percentage={ord.current_percentage || 0} height={8} isActive={isRunning} />
                  {ord.status === 'cancelled' && !!ord.cancel_reason && (
                    <View style={styles.cancelBox}>
                      <Text style={styles.cancelText} numberOfLines={2}>
                        Alasan batal: {ord.cancel_reason}
                      </Text>
                    </View>
                  )}
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
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingBottom: 14, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 22, color: SAGE.textPrimary },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.primaryDark, marginTop: 2 },
  segmentRow: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  emptyCard: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: SAGE.border,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontFamily: FONTS.displayBold, fontSize: 16, color: SAGE.textPrimary, marginTop: 4 },
  emptySub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: SAGE.primary, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 11, marginTop: 6 },
  emptyBtnText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 13 },
  card: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE.border,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: FONTS.displayBold, fontSize: 16, color: SAGE.textPrimary, flexShrink: 1 },
  status: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: SAGE.primaryDark,
    backgroundColor: SAGE.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusCancelled: {
    color: SAGE.danger,
    backgroundColor: SAGE.dangerSoft,
  },
  overduePill: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: SAGE.danger,
    backgroundColor: SAGE.dangerSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cancelBox: { backgroundColor: SAGE.dangerSoft, padding: 8, borderRadius: 10 },
  cancelText: { fontFamily: FONTS.body, fontSize: 11, color: SAGE.danger },
  meta: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary },
  price: { fontFamily: FONTS.displayBold, fontSize: 14, color: SAGE.textPrimary },
  detailLink: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.primaryDark },
});
