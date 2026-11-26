import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, formatIDR, roleLabel } from '../theme/sage';
import { SanctuaryPond } from '../components/SanctuaryPond';
import { SpringTouchable } from '../components/SpringTouchable';
import {
  AnimatedCounter,
  AnimatedProgressBar,
  LivePulseDot,
  SpinTouchable,
  StaggerItem,
} from '../components/MotionPrimitives';

interface Props {
  profile: any;
  role: 'consumer' | 'worker' | 'admin';
  orders: any[];
  onRefresh: () => void;
  onSelectOrder: (order: any) => void;
  onGoCatalog: () => void;
  onGoProfile?: () => void;
}

export function HomeScreen({ profile, role, orders, onRefresh, onSelectOrder, onGoCatalog, onGoProfile }: Props) {
  const insets = useSafeAreaInsets();
  const [showGuide, setShowGuide] = useState(false);

  const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'paid' || o.status === 'in_progress');
  const inProgressOrders = activeOrders.filter((o) => o.status === 'in_progress' || (o.current_percentage || 0) > 0);
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const featured = inProgressOrders[0] || activeOrders[0] || orders[0];

  const isOverdue = (ord: any) =>
    !!ord?.expected_completion_at &&
    ord.status !== 'completed' &&
    ord.status !== 'cancelled' &&
    Date.now() > new Date(ord.expected_completion_at).getTime();

  const displayPct =
    inProgressOrders.length > 0
      ? Math.round(inProgressOrders.reduce((acc, o) => acc + (o.current_percentage || 0), 0) / inProgressOrders.length)
      : orders.length > 0
      ? Math.round((completedCount / orders.length) * 100)
      : 0;

  const pondSubtitle =
    inProgressOrders.length > 0
      ? `${inProgressOrders.length} Sedang Dikerjakan`
      : orders.length > 0
      ? `Total Selesai (${completedCount}/${orders.length})`
      : 'Belum Ada Order';

  const initials = (profile?.full_name || 'M').slice(0, 1).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(46, insets.top + 12) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <SpringTouchable style={styles.userLeft} onPress={onGoProfile}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          )}
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>meroo.gi</Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleLabel(role)}</Text>
              </View>
            </View>
            <Text style={styles.subBrand}>Halo, {profile?.full_name || 'Traveler'}</Text>
          </View>
        </SpringTouchable>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SpringTouchable style={styles.refreshBtn} onPress={() => setShowGuide(true)}>
            <FontAwesome5 name="question-circle" size={15} color={SAGE.primaryDark} />
          </SpringTouchable>
          <SpinTouchable style={styles.refreshBtn} onPress={onRefresh}>
            <FontAwesome5 name="sync-alt" size={15} color={SAGE.primaryDark} />
          </SpinTouchable>
        </View>
      </View>

      <StaggerItem index={0}>
        <SanctuaryPond
          percentage={displayPct}
          subtitle={pondSubtitle}
          activeCount={activeOrders.length}
          totalCount={orders.length}
          completedCount={completedCount}
        />
      </StaggerItem>

      <StaggerItem index={1}>
        {featured ? (
          <SpringTouchable style={styles.activeCard} onPress={() => onSelectOrder(featured)}>
            <View style={styles.activeBadge}>
              <FontAwesome5 name="leaf" size={15} color={SAGE.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <LivePulseDot
                  color={featured.status === 'in_progress' || featured.status === 'paid' ? SAGE.primary : SAGE.accentPeach}
                  size={6}
                  active={featured.status === 'in_progress' || featured.status === 'paid'}
                />
                <Text style={styles.activeTitle} numberOfLines={1}>{featured.services?.name || 'Pesanan Aktif'}</Text>
                {isOverdue(featured) && <Text style={styles.overdueBadge}>OVERDUE</Text>}
              </View>
              <Text style={styles.activeSub} numberOfLines={1}>
                {`UID ${featured.game_uid} \u2022 ${featured.status.toUpperCase()} \u2022 ${formatIDR(featured.total_price)}`}
              </Text>
            </View>
            <FontAwesome5 name="arrow-right" size={15} color={SAGE.primaryDark} />
          </SpringTouchable>
        ) : (
          <SpringTouchable style={styles.ctaBtn} onPress={onGoCatalog}>
            <Text style={styles.ctaText}>Pilih Layanan di Katalog</Text>
          </SpringTouchable>
        )}
      </StaggerItem>

      <StaggerItem index={2}>
        <Text style={styles.sectionTitle}>Pantauan Pesanan Terbaru</Text>
      </StaggerItem>

      {orders.slice(0, 4).map((ord, idx) => {
        const isRunning = ord.status === 'paid' || ord.status === 'in_progress';
        return (
          <StaggerItem key={ord.id} index={idx + 3}>
            <SpringTouchable style={styles.orderRow} onPress={() => onSelectOrder(ord)}>
              <View style={styles.pctBadge}>
                <AnimatedCounter value={ord.current_percentage || 0} suffix="%" duration={850} style={styles.pctBadgeText} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.orderName} numberOfLines={1}>{ord.services?.name || 'Layanan'}</Text>
                  {isOverdue(ord) && <Text style={styles.overdueBadge}>OVERDUE</Text>}
                </View>
                <Text style={styles.orderMeta}>
                  {`UID ${ord.game_uid} \u2022 ${ord.game_server}`}
                </Text>
                <AnimatedProgressBar percentage={ord.current_percentage || 0} height={6} isActive={isRunning} />
              </View>
              <Text style={styles.orderPrice}>{formatIDR(ord.total_price)}</Text>
            </SpringTouchable>
          </StaggerItem>
        );
      })}

      <Modal visible={showGuide} transparent animationType="slide" onRequestClose={() => setShowGuide(false)}>
        <View style={styles.guideBackdrop}>
          <View style={[styles.guideCard, { paddingBottom: Math.max(20, insets.bottom + 14) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.guideTitle}>Cara Order & Ketentuan Layanan</Text>
              <TouchableOpacity onPress={() => setShowGuide(false)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
              {[
                { no: '01', t: 'Pilih Layanan & Paket', d: 'Di tab Katalog, pilih layanan dan kombinasikan satu atau beberapa paket (tier) dalam satu order.' },
                { no: '02', t: 'Isi UID, Server & Catatan', d: 'Masukkan UID Genshin, pilih Server (Asia/America/Europe/TW), dan tambahkan catatan target karakter/resin.' },
                { no: '03', t: 'Keranjang atau Pesan Langsung', d: 'Masukkan beberapa layanan ke Keranjang untuk checkout sekaligus, atau langsung buat pesanan + simpan Vault AES-256.' },
                { no: '04', t: 'Pantau Progres, Checklist & Chat', d: 'Worker mengerjakan order sesuai deadline. Pantau checklist harian, screenshot progres, dan kode 2FA di Detail Pesanan.' },
                { no: '05', t: 'Selesai & Beri Ulasan', d: 'Setelah progres 100%, kredensial vault terhapus otomatis dan kamu dapat memberi rating serta ulasan.' },
              ].map((s) => (
                <View key={s.no} style={styles.guideStep}>
                  <Text style={styles.guideNo}>{s.no}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideStepTitle}>{s.t}</Text>
                    <Text style={styles.guideStepDesc}>{s.d}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerTitle}>Disclaimer Layanan Joki</Text>
                <Text style={styles.disclaimerText}>
                  Layanan ini 100% dikerjakan manual tanpa bot/cheat dan tidak berafiliasi dengan developer game. Kami menjaga keamanan maksimal, namun risiko kebijakan pihak game tetap ditanggung pengguna.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  content: { padding: 18, paddingTop: 50, paddingBottom: 124, gap: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#FFFFFF' },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: SAGE.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: { fontFamily: FONTS.displayExtra, fontSize: 18, color: '#FFF' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: FONTS.displayExtra, fontSize: 23, color: SAGE.textPrimary, letterSpacing: -0.5 },
  rolePill: { backgroundColor: SAGE.surfaceCard, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  rolePillText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark },
  subBrand: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: SAGE.textSecondary, marginTop: 1 },
  refreshBtn: {
    backgroundColor: SAGE.surfaceCard,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  activeCard: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: SAGE.border,
  },
  activeBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: SAGE.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: { fontFamily: FONTS.displayBold, fontSize: 15, color: SAGE.textPrimary },
  activeSub: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary, marginTop: 2 },
  ctaBtn: { backgroundColor: SAGE.primary, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  ctaText: { fontFamily: FONTS.displayBold, color: '#FFF', fontSize: 15 },
  sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 16, color: SAGE.textPrimary, marginTop: 4 },
  orderRow: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: SAGE.border,
  },
  pctBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: SAGE.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctBadgeText: { fontFamily: FONTS.mono, fontSize: 12, color: SAGE.primaryDark },
  orderName: { fontFamily: FONTS.bodyBold, fontSize: 14, color: SAGE.textPrimary, flexShrink: 1 },
  orderMeta: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary },
  orderPrice: { fontFamily: FONTS.displayBold, fontSize: 14, color: SAGE.primaryDark },
  overdueBadge: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: SAGE.danger,
    backgroundColor: SAGE.dangerSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  guideBackdrop: { flex: 1, backgroundColor: 'rgba(26,46,41,0.48)', justifyContent: 'flex-end' },
  guideCard: { backgroundColor: SAGE.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12 },
  guideTitle: { fontFamily: FONTS.displayBold, fontSize: 17, color: SAGE.textPrimary },
  guideStep: { flexDirection: 'row', gap: 10, backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: SAGE.border },
  guideNo: { fontFamily: FONTS.mono, fontSize: 12, color: SAGE.primaryDark, backgroundColor: SAGE.surfaceSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  guideStepTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textPrimary },
  guideStepDesc: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary, marginTop: 2, lineHeight: 17 },
  disclaimerBox: { backgroundColor: '#FFF7E8', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F3D299', gap: 4 },
  disclaimerTitle: { fontFamily: FONTS.bodyBold, fontSize: 12, color: '#9B6515' },
  disclaimerText: { fontFamily: FONTS.body, fontSize: 11, color: '#7D5312', lineHeight: 16 },
});