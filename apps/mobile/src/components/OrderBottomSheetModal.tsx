import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
} from 'react-native';
import { X, Check, ShieldCheck } from 'lucide-react-native';
import { formatIDR, formatEstimatedHours } from '@meroogi/shared';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { ServiceCardItem } from './ServiceCatalogCard';

const GAME_SERVERS = ['Asia', 'America', 'Europe', 'TW, HK, MO'] as const;
type GameServer = (typeof GAME_SERVERS)[number];

export interface ServiceTierItem {
  id: string;
  name: string;
  description: string | null;
  fixed_price: number;
  estimated_hours: number | null;
}

interface OrderBottomSheetModalProps {
  visible: boolean;
  service: ServiceCardItem | null;
  tiers: ServiceTierItem[];
  onClose: () => void;
  onOrderSuccess: () => void;
}

export function OrderBottomSheetModal({
  visible,
  service,
  tiers,
  onClose,
  onOrderSuccess,
}: OrderBottomSheetModalProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [gameUid, setGameUid] = useState('');
  const [gameServer, setGameServer] = useState<GameServer>('Asia');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [renderModal, setRenderModal] = useState(visible);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(480)).current;

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(460);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          speed: 19,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (renderModal) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: 480,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRenderModal(false);
      });
    }
  }, [visible]);

  function handleAnimatedClose() {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: 480,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setRenderModal(false);
        onClose();
      }
    });
  }

  useEffect(() => {
    if (tiers.length > 0) {
      setSelectedTierId(tiers[0].id);
    } else {
      setSelectedTierId(null);
    }
  }, [tiers, service]);

  if (!service) return null;

  const activeTier = tiers.find((t) => t.id === selectedTierId) ?? null;
  const totalPrice = activeTier ? activeTier.fixed_price : service.starting_price;
  const etaHours = activeTier?.estimated_hours ?? service.estimated_hours;

  async function handleCreateOrder() {
    if (!service) return;

    const cleanUid = gameUid.trim();
    if (!/^\d{9,10}$/.test(cleanUid)) {
      Alert.alert(
        'UID Tidak Valid',
        'Masukkan 9â€“10 digit angka Genshin Impact UID kamu.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        Alert.alert(
          'Masuk Terlebih Dahulu',
          'Silakan masuk atau daftar akun di tab Akun sebelum membuat pesanan.'
        );
        setSubmitting(false);
        return;
      }

      const formattedNotes = [
        activeTier ? `[Paket: ${activeTier.name}]` : null,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join(' ');

      const { error } = await supabase.from('orders').insert({
        consumer_id: userId,
        service_id: service.id,
        game_uid: cleanUid,
        game_server: gameServer,
        notes: formattedNotes || null,
        total_price: totalPrice,
        status: 'pending',
        current_percentage: 0,
      });

      if (error) throw error;

      Alert.alert(
        'Pesanan Dibuat',
        `Order ${service.name} untuk UID ${cleanUid} (${gameServer}) berhasil dibuat.`
      );
      setGameUid('');
      setNotes('');
      onOrderSuccess();
      handleAnimatedClose();
    } catch (err: any) {
      Alert.alert(
        'Gagal Membuat Pesanan',
        err?.message ?? 'Terjadi kesalahan saat menyimpan pesanan.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={renderModal}
      transparent
      animationType="none"
      onRequestClose={handleAnimatedClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kvWrapper}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleAnimatedClose} />
        </Animated.View>

        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: sheetAnim }] }]}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>KONFIGURASI PESANAN</Text>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {service.name}
              </Text>
            </View>
            <Pressable onPress={handleAnimatedClose} style={styles.closeBtn}>
              <X size={18} color={COLORS.frostGlow} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {tiers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PILIH PAKET LAYANAN</Text>
                {tiers.map((tier) => {
                  const isSelected = tier.id === selectedTierId;
                  return (
                    <Pressable
                      key={tier.id}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSelectedTierId(tier.id);
                      }}
                      style={[
                        styles.tierCard,
                        isSelected && styles.tierCardSelected,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tierName}>{tier.name}</Text>
                        {tier.description ? (
                          <Text style={styles.tierDesc} numberOfLines={2}>
                            {tier.description}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.tierRight}>
                        <Text style={styles.tierPrice}>
                          {formatIDR(tier.fixed_price)}
                        </Text>
                        {isSelected && (
                          <Check size={15} color={COLORS.anemoBright} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GENSHIN IMPACT UID</Text>
              <TextInput
                value={gameUid}
                onChangeText={setGameUid}
                placeholder="Contoh: 812345678"
                placeholderTextColor={COLORS.fogVeil}
                keyboardType="number-pad"
                maxLength={10}
                style={styles.input}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SERVER</Text>
              <View style={styles.serverRow}>
                {GAME_SERVERS.map((srv: GameServer) => {
                  const active = gameServer === srv;
                  return (
                    <Pressable
                      key={srv}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setGameServer(srv);
                      }}
                      style={[
                        styles.serverPill,
                        active && styles.serverPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.serverText,
                          active && styles.serverTextActive,
                        ]}
                      >
                        {srv}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CATATAN / TARGET KARAKTER</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Misal: Fokus Floor 12, resin jangan dipakai..."
                placeholderTextColor={COLORS.fogVeil}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />
            </View>

            <View style={styles.guaranteeBox}>
              <ShieldCheck size={16} color={COLORS.anemoBright} />
              <Text style={styles.guaranteeText}>
                100% dikerjakan manual tanpa bot/cheat. Jadwal login diatur lewat chat setelah order dibuat.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footerBar}>
            <View>
              <Text style={styles.totalCaption}>
                ESTIMASI {formatEstimatedHours(etaHours).toUpperCase()}
              </Text>
              <Text style={styles.totalAmount}>{formatIDR(totalPrice)}</Text>
            </View>

            <Pressable
              onPress={handleCreateOrder}
              disabled={submitting}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.9 },
                submitting && { opacity: 0.6 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.abyssInk} size="small" />
              ) : (
                <Text style={styles.ctaText}>Buat Pesanan</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(3, 5, 9, 0.85)',
  },
  sheetContainer: {
    backgroundColor: COLORS.deepSheet,
    borderTopLeftRadius: RADIUS.modal,
    borderTopRightRadius: RADIUS.modal,
    borderTopWidth: 1,
    borderColor: COLORS.borderActive,
    maxHeight: '90%',
    paddingTop: SPACING.sm,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  eyebrow: {
    color: COLORS.moonMist,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sheetTitle: {
    color: COLORS.pureWhite,
    fontFamily: FONTS.displayBold,
    fontSize: 21,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.circle,
    backgroundColor: COLORS.glassFillElevated,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    color: COLORS.moonMist,
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    letterSpacing: 1.3,
    marginBottom: SPACING.sm,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glassFill,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  tierCardSelected: {
    backgroundColor: COLORS.glassActiveTint,
    borderColor: COLORS.borderActive,
  },
  tierName: {
    color: COLORS.pureWhite,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  },
  tierDesc: {
    color: COLORS.fogVeil,
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 2,
  },
  tierRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tierPrice: {
    color: COLORS.moonMist,
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
  },
  input: {
    backgroundColor: COLORS.glassFill,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    color: COLORS.pureWhite,
    fontFamily: FONTS.mono,
    fontSize: 14,
  },
  textArea: {
    fontFamily: FONTS.body,
    minHeight: 74,
    textAlignVertical: 'top',
  },
  serverRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  serverPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.glassFill,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  serverPillActive: {
    backgroundColor: COLORS.glassActiveTint,
    borderColor: COLORS.borderActive,
  },
  serverText: {
    color: COLORS.fogVeil,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
  },
  serverTextActive: {
    color: COLORS.pureWhite,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.md,
    borderRadius: RADIUS.input,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.22)',
  },
  guaranteeText: {
    flex: 1,
    color: COLORS.frostGlow,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGlass,
    backgroundColor: COLORS.abyssCanvas,
  },
  totalCaption: {
    color: COLORS.fogVeil,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  totalAmount: {
    color: COLORS.pureWhite,
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: COLORS.anemoBright,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 24,
    paddingVertical: 13,
    minWidth: 150,
    alignItems: 'center',
  },
  ctaText: {
    color: COLORS.abyssInk,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  },
});