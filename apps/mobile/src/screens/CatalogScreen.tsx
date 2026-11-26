import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { GENSHIN_SERVERS } from '@meroogi/shared';
import { SAGE, FONTS, formatIDR } from '../theme/sage';
import { supabase } from '../lib/supabase';
import { goApi } from '../lib/goApi';
import { useSageFeedback } from '../components/SageFeedback';

interface CartItem {
  serviceId: string;
  serviceName: string;
  tierIds: string[];
  tierNames: string[];
  price: number;
  estimatedHours: number;
  gameUid: string;
  gameServer: string;
  notes: string;
}

interface Props {
  userId: string;
  role?: 'consumer' | 'worker' | 'admin';
  services: any[];
  categories: any[];
  serviceTiers?: any[];
  serviceRatings?: Record<string, { avg: number; count: number }>;
  onOrderCreated: () => void;
}

export function CatalogScreen({
  userId,
  role = 'consumer',
  services,
  categories,
  serviceTiers = [],
  serviceRatings = {},
  onOrderCreated,
}: Props) {
  const insets = useSafeAreaInsets();
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates?.height || 0));
    const s2 = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const { showToast, showDialog } = useSageFeedback();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [bookingService, setBookingService] = useState<any>(null);
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);

  const [gameUid, setGameUid] = useState('');
  const [gameServer, setGameServer] = useState<string>('Asia');
  const [notes, setNotes] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartCheckingOut, setCartCheckingOut] = useState(false);

  const [reviewService, setReviewService] = useState<any>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const filtered = services.filter((s) => {
    const matchCat = selectedCat === 'all' || s.category === selectedCat;
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const activeServiceTiers = bookingService
    ? serviceTiers.filter((t) => t.service_id === bookingService.id)
    : [];

  function openBooking(srv: any) {
    setBookingService(srv);
    setSelectedTierIds([]);
    setGameUid('');
    setGameServer('Asia');
    setNotes('');
    setLoginId('');
    setLoginPass('');
  }

  function toggleTier(tierId: string) {
    setSelectedTierIds((prev) =>
      prev.includes(tierId) ? prev.filter((id) => id !== tierId) : [...prev, tierId]
    );
  }

  function getComputedPrice(): number {
    if (!bookingService) return 0;
    if (selectedTierIds.length > 0) {
      return selectedTierIds.reduce((sum, tid) => {
        const tier = activeServiceTiers.find((t) => t.id === tid);
        return sum + (Number(tier?.fixed_price) || 0);
      }, 0);
    }
    return Number(bookingService.base_price) || 0;
  }

  function getComputedHours(): number {
    if (!bookingService) return 1;
    if (selectedTierIds.length === 0) return bookingService.estimated_hours || 1;
    return selectedTierIds.reduce((sum, tid) => {
      const tier = activeServiceTiers.find((t) => t.id === tid);
      return sum + (tier?.estimated_hours ?? bookingService.estimated_hours ?? 1);
    }, 0);
  }

  function getSelectedTierNames(): string[] {
    return selectedTierIds
      .map((tid) => activeServiceTiers.find((t) => t.id === tid)?.name)
      .filter(Boolean);
  }

  function validateBookingForm(): boolean {
    if (role !== 'consumer') {
      showDialog({
        title: 'Khusus Akun Costumer',
        message: 'Pemesanan layanan hanya tersedia untuk akun Costumer.',
        type: 'error',
      });
      return false;
    }
    if (activeServiceTiers.length > 0 && selectedTierIds.length === 0) {
      showToast('Pilih minimal 1 paket layanan terlebih dahulu.', 'error');
      return false;
    }
    if (!gameUid.trim() || !gameServer.trim()) {
      showToast('Masukkan UID game dan pilih Server terlebih dahulu.', 'error');
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!bookingService || !validateBookingForm()) return;
    const tierNames = selectedTierIds.length > 0 ? getSelectedTierNames() : ['Standard Service'];
    setCart((prev) => [
      ...prev,
      {
        serviceId: bookingService.id,
        serviceName: bookingService.name,
        tierIds: selectedTierIds,
        tierNames,
        price: getComputedPrice(),
        estimatedHours: getComputedHours(),
        gameUid: gameUid.trim(),
        gameServer: gameServer.trim(),
        notes: notes.trim(),
      },
    ]);
    setBookingService(null);
    showToast(`${bookingService.name} ditambahkan ke keranjang!`, 'success');
  }

  async function handleCheckoutDirect() {
    if (!bookingService || !validateBookingForm() || submitting) return;
    setSubmitting(true);
    try {
      const tierNames = selectedTierIds.length > 0 ? getSelectedTierNames() : ['Standard Service'];
      const formattedNotes =
        selectedTierIds.length > 0
          ? `Packages: ${tierNames.join(', ')}. ${notes.trim() ? `Notes: ${notes.trim()}` : ''}`.trim()
          : notes.trim();

      const { data, error } = await supabase
        .from('orders')
        .insert({
          consumer_id: userId,
          service_id: bookingService.id,
          total_price: getComputedPrice(),
          game_uid: gameUid.trim(),
          game_server: gameServer,
          notes: formattedNotes,
          status: 'pending',
          current_percentage: 0,
          total_estimated_hours: getComputedHours(),
        })
        .select()
        .single();

      if (error) throw error;

      // Tutup modal segera setelah order tersimpan agar tidak terjadi double-order saat spam klik
      const hadCreds = Boolean(loginId.trim() && loginPass.trim());
      const credsPayload = {
        game_uid: gameUid.trim(),
        login_identifier: loginId.trim(),
        password: loginPass.trim(),
      };
      setBookingService(null);

      let vaultWarning = false;
      if (hadCreds && data?.id) {
        try {
          await goApi.saveCredentials(data.id, credsPayload);
        } catch {
          vaultWarning = true;
        }
      }

      if (vaultWarning) {
        showToast('Pesanan dibuat, namun Vault gagal tersimpan. Isi ulang di Detail Pesanan.', 'info');
      } else {
        showToast('Pesanan berhasil dibuat!', 'success');
      }
      onOrderCreated();
    } catch (e: any) {
      showToast(e.message || 'Gagal membuat pesanan', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckoutCart() {
    if (cart.length === 0) return;
    if (cart.some((c) => !c.gameUid.trim() || !c.gameServer.trim())) {
      showToast('Lengkapi UID dan Server untuk semua item di keranjang.', 'error');
      return;
    }
    setCartCheckingOut(true);
    try {
      const payload = cart.map((item) => ({
        consumer_id: userId,
        service_id: item.serviceId,
        total_price: item.price,
        total_estimated_hours: item.estimatedHours,
        game_uid: item.gameUid.trim(),
        game_server: item.gameServer.trim(),
        notes: `Packages: ${item.tierNames.join(', ')}. Notes: ${item.notes || ''}`,
        status: 'pending',
        current_percentage: 0,
      }));
      const { error } = await supabase.from('orders').insert(payload);
      if (error) throw error;
      setCart([]);
      setShowCart(false);
      showToast(`${payload.length} pesanan berhasil dibuat dari keranjang!`, 'success');
      onOrderCreated();
    } catch (e: any) {
      showToast(e.message || 'Checkout keranjang gagal', 'error');
    } finally {
      setCartCheckingOut(false);
    }
  }

  async function openServiceReviews(srv: any) {
    setReviewService(srv);
    setLoadingReviews(true);
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, consumer_profile:profiles!reviews_reviewer_id_fkey(full_name)')
        .eq('service_id', srv.id)
        .order('created_at', { ascending: false });
      setReviewsList(data || []);
    } catch {
      setReviewsList([]);
    } finally {
      setLoadingReviews(false);
    }
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);
  const reviewAvg =
    reviewsList.length > 0
      ? reviewsList.reduce((s, r) => s + (r.rating || 0), 0) / reviewsList.length
      : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(46, insets.top + 12) }]}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Katalog Layanan</Text>
          <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
            <FontAwesome5 name="shopping-cart" size={15} color={SAGE.primaryDark} />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color={SAGE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Spiral Abyss, Rawat Akun, Quest..."
            placeholderTextColor={SAGE.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <FontAwesome5 name="times" size={13} color={SAGE.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.catChip, selectedCat === 'all' && styles.catChipActive]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.catText, selectedCat === 'all' && styles.catTextActive]}>Semua</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.slug}
              style={[styles.catChip, selectedCat === c.slug && styles.catChipActive]}
              onPress={() => setSelectedCat(c.slug)}
            >
              <Text style={[styles.catText, selectedCat === c.slug && styles.catTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.srvName}>Layanan tidak ditemukan</Text>
            <Text style={styles.srvDesc}>Coba kata kunci atau kategori lain.</Text>
          </View>
        ) : (
          filtered.map((srv) => {
            const ratingInfo = serviceRatings[srv.id];
            const tiersCount = serviceTiers.filter((t) => t.service_id === srv.id).length;
            return (
              <View key={srv.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Text style={styles.badge}>{srv.category}</Text>
                    {tiersCount > 0 && <Text style={styles.tierCountBadge}>{tiersCount} Paket</Text>}
                  </View>
                  <Text style={styles.est}>~{srv.estimated_hours || 1} Jam</Text>
                </View>

                <Text style={styles.srvName}>{srv.name}</Text>
                <Text style={styles.srvDesc} numberOfLines={2}>
                  {srv.description || 'Layanan joki profesional meroo.gi'}
                </Text>

                <TouchableOpacity style={styles.ratingRow} onPress={() => openServiceReviews(srv)}>
                  <FontAwesome5 name="star" solid size={12} color={ratingInfo ? SAGE.accentWarm : SAGE.border} />
                  <Text style={styles.ratingText}>
                    {ratingInfo
                      ? `${ratingInfo.avg.toFixed(1)} (${ratingInfo.count} ulasan)`
                      : 'Belum ada ulasan • Ketuk untuk lihat'}
                  </Text>
                  <FontAwesome5 name="chevron-right" size={10} color={SAGE.textSecondary} />
                </TouchableOpacity>

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.priceLbl}>Mulai dari</Text>
                    <Text style={styles.priceVal}>{formatIDR(srv.base_price)}</Text>
                  </View>
                  {role === 'consumer' ? (
                    <TouchableOpacity style={styles.orderBtn} onPress={() => openBooking(srv)}>
                      <FontAwesome5 name="shopping-bag" size={13} color="#FFF" />
                      <Text style={styles.orderBtnText}>Pesan</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.orderBtn, { backgroundColor: SAGE.surfaceSoft }]}>
                      <FontAwesome5 name="lock" size={12} color={SAGE.textSecondary} />
                      <Text style={[styles.orderBtnText, { color: SAGE.textSecondary }]}>Khusus Costumer</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Detail Layanan, Multi-Paket, Cart & Pesan Langsung */}
      <Modal visible={!!bookingService} animationType="slide" transparent onRequestClose={() => setBookingService(null)}>
        <View style={[styles.modalBackdrop, { paddingBottom: kbHeight }]}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {bookingService?.name}
                </Text>
                <Text style={styles.metaLine}>
                  Estimasi {getComputedHours()} Jam • {formatIDR(getComputedPrice())}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBookingService(null)} style={styles.modalCloseBtn}>
                <FontAwesome5 name="times" size={16} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
              {!!bookingService?.description && <Text style={styles.srvDesc}>{bookingService.description}</Text>}

              {activeServiceTiers.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={styles.vaultHint}>Pilih Paket (Bisa pilih lebih dari 1):</Text>
                  {activeServiceTiers.map((tier) => {
                    const selected = selectedTierIds.includes(tier.id);
                    return (
                      <TouchableOpacity
                        key={tier.id}
                        style={[styles.tierItem, selected && styles.tierItemActive]}
                        onPress={() => toggleTier(tier.id)}
                      >
                        <FontAwesome5
                          name={selected ? 'check-square' : 'square'}
                          solid={selected}
                          size={16}
                          color={selected ? SAGE.primary : SAGE.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tierName}>{tier.name}</Text>
                          <Text style={styles.tierDesc}>
                            {tier.description || `Est. ${tier.estimated_hours || bookingService?.estimated_hours || 1} Jam`}
                          </Text>
                        </View>
                        <Text style={styles.tierPrice}>{formatIDR(tier.fixed_price || 0)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.vaultHint}>Detail Akun Genshin Impact:</Text>
              <TextInput
                style={styles.input}
                placeholder="Game UID (Contoh: 895533359)"
                placeholderTextColor={SAGE.textSecondary}
                keyboardType="number-pad"
                value={gameUid}
                onChangeText={setGameUid}
              />

              <View style={styles.serverRow}>
                {GENSHIN_SERVERS.map((srv) => {
                  const active = gameServer === srv.id;
                  return (
                    <TouchableOpacity
                      key={srv.id}
                      style={[styles.serverPill, active && styles.serverPillActive]}
                      onPress={() => setGameServer(srv.id)}
                    >
                      <Text style={[styles.serverText, active && { color: '#FFF' }]}>{srv.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Catatan request (misal: resin, build karakter)"
                placeholderTextColor={SAGE.textSecondary}
                value={notes}
                onChangeText={setNotes}
              />

              <Text style={styles.vaultHint}>Opsional — Simpan Login Terenkripsi AES-256 (untuk Pesan Langsung):</Text>
              <TextInput
                style={styles.input}
                placeholder="Email / Username Hoyoverse"
                placeholderTextColor={SAGE.textSecondary}
                autoCapitalize="none"
                value={loginId}
                onChangeText={setLoginId}
              />
              <TextInput
                style={styles.input}
                placeholder="Password Game"
                placeholderTextColor={SAGE.textSecondary}
                secureTextEntry
                value={loginPass}
                onChangeText={setLoginPass}
              />

              <View style={styles.riskBox}>
                <Text style={styles.riskText}>
                  Catatan: Dikerjakan manual 100%, namun kami tidak bertanggung jawab atas tindakan developer game (ban/reset).
                </Text>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.cartAddBtn} onPress={handleAddToCart} disabled={submitting}>
                <FontAwesome5 name="cart-plus" size={14} color={SAGE.primaryDark} />
                <Text style={styles.cartAddText}>Keranjang</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { flex: 1.5 }]} onPress={handleCheckoutDirect} disabled={submitting}>
                <Text style={styles.submitText}>
                  {submitting ? 'Memproses...' : `Pesan (${formatIDR(getComputedPrice())})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Keranjang Belanja */}
      <Modal visible={showCart} animationType="slide" transparent onRequestClose={() => setShowCart(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>Keranjang Belanja ({cart.length})</Text>
              <TouchableOpacity onPress={() => setShowCart(false)} style={styles.modalCloseBtn}>
                <FontAwesome5 name="times" size={16} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <Text style={styles.srvDesc}>Keranjang kamu masih kosong. Pilih layanan dari katalog.</Text>
            ) : (
              <>
                <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
                  {cart.map((item, idx) => (
                    <View key={idx} style={styles.cartItemCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.tierName}>{item.serviceName}</Text>
                        <TouchableOpacity onPress={() => setCart((prev) => prev.filter((_, i) => i !== idx))}>
                          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.danger }}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.tierDesc}>
                        Paket: {item.tierNames.join(', ')} • ~{item.estimatedHours} Jam
                      </Text>
                      <Text style={styles.metaLine}>
                        UID {item.gameUid} ({item.gameServer}) • {formatIDR(item.price)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.cartFooter}>
                  <View>
                    <Text style={styles.priceLbl}>Total Checkout</Text>
                    <Text style={styles.priceVal}>{formatIDR(cartTotal)}</Text>
                  </View>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleCheckoutCart} disabled={cartCheckingOut}>
                    <Text style={styles.submitText}>
                      {cartCheckingOut ? 'Memproses...' : 'Checkout Semua'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Ulasan Layanan */}
      <Modal visible={!!reviewService} animationType="slide" transparent onRequestClose={() => setReviewService(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Ulasan Pelanggan</Text>
                <Text style={styles.metaLine}>{reviewService?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setReviewService(null)} style={styles.modalCloseBtn}>
                <FontAwesome5 name="times" size={16} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.reviewSummaryBox}>
              <Text style={styles.reviewBigScore}>{reviewsList.length > 0 ? reviewAvg.toFixed(1) : '-'}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const cnt = reviewsList.filter((r) => r.rating === star).length;
                  const pct = reviewsList.length > 0 ? (cnt / reviewsList.length) * 100 : 0;
                  return (
                    <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.tierDesc}>{star}★</Text>
                      <View style={styles.starBarBg}>
                        <View style={[styles.starBarFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.tierDesc}>{cnt}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 8 }}>
              {loadingReviews ? (
                <Text style={styles.srvDesc}>Memuat ulasan...</Text>
              ) : reviewsList.length === 0 ? (
                <Text style={styles.srvDesc}>Belum ada ulasan untuk layanan ini.</Text>
              ) : (
                reviewsList.map((rv) => (
                  <View key={rv.id} style={styles.reviewItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.tierName}>{rv.consumer_profile?.full_name || 'Costumer'}</Text>
                      <Text style={styles.ratingText}>{'★'.repeat(rv.rating || 0)}</Text>
                    </View>
                    {!!rv.comment && <Text style={styles.srvDesc}>{rv.comment}</Text>}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingBottom: 14, paddingHorizontal: 18 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 22, color: SAGE.textPrimary },
  cartBtn: { backgroundColor: SAGE.surfaceCard, padding: 10, borderRadius: 16, position: 'relative' },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: SAGE.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontFamily: FONTS.mono, fontSize: 10, color: '#FFF' },
  searchBox: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontFamily: FONTS.body, fontSize: 13, color: SAGE.textPrimary },
  catChip: { backgroundColor: SAGE.surfaceCard, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, marginRight: 8 },
  catChipActive: { backgroundColor: SAGE.primary },
  catText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.textSecondary },
  catTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12, paddingBottom: 112 },
  emptyCard: { backgroundColor: SAGE.surfaceCard, borderRadius: 22, padding: 24, borderWidth: 1, borderColor: SAGE.border, alignItems: 'center' },
  card: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE.border,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    backgroundColor: SAGE.surfaceSoft,
    color: SAGE.primaryDark,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tierCountBadge: {
    backgroundColor: '#FFF7E8',
    color: '#9B6515',
    fontFamily: FONTS.mono,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  est: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary },
  srvName: { fontFamily: FONTS.displayBold, fontSize: 16, color: SAGE.textPrimary, marginTop: 2 },
  srvDesc: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  ratingText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  priceLbl: { fontFamily: FONTS.body, fontSize: 10, color: SAGE.textSecondary },
  priceVal: { fontFamily: FONTS.displayExtra, fontSize: 16, color: SAGE.primaryDark },
  orderBtn: {
    backgroundColor: SAGE.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  orderBtnText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(26,46,41,0.48)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: SAGE.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10 },
  modalTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: SAGE.textPrimary },
  modalCloseBtn: { backgroundColor: SAGE.surfaceSoft, padding: 9, borderRadius: 16 },
  metaLine: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.primaryDark, marginTop: 2 },
  vaultHint: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark, marginTop: 4 },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SAGE.border,
    borderRadius: 14,
    padding: 10,
  },
  tierItemActive: { borderColor: SAGE.primary, backgroundColor: SAGE.surfaceSoft },
  tierName: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textPrimary },
  tierDesc: { fontFamily: FONTS.body, fontSize: 11, color: SAGE.textSecondary },
  tierPrice: { fontFamily: FONTS.mono, fontSize: 12, color: SAGE.primaryDark },
  serverRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  serverPill: { backgroundColor: '#FFF', borderWidth: 1, borderColor: SAGE.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  serverPillActive: { backgroundColor: SAGE.primary, borderColor: SAGE.primary },
  serverText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.textSecondary },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SAGE.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: SAGE.textPrimary,
  },
  riskBox: { backgroundColor: '#FFF7E8', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3D299' },
  riskText: { fontFamily: FONTS.body, fontSize: 11, color: '#9B6515', lineHeight: 16 },
  cartAddBtn: {
    flex: 1,
    backgroundColor: SAGE.surfaceSoft,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cartAddText: { fontFamily: FONTS.displayBold, color: SAGE.primaryDark, fontSize: 13 },
  submitBtn: { backgroundColor: SAGE.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: FONTS.displayBold, color: '#FFF', fontSize: 14 },
  cartItemCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: SAGE.border, gap: 4 },
  cartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: SAGE.border },
  reviewSummaryBox: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SAGE.surfaceSoft, padding: 14, borderRadius: 16 },
  reviewBigScore: { fontFamily: FONTS.displayExtra, fontSize: 34, color: SAGE.primaryDark },
  starBarBg: { flex: 1, height: 6, backgroundColor: '#FFF', borderRadius: 4, overflow: 'hidden' },
  starBarFill: { height: 6, backgroundColor: SAGE.accentWarm, borderRadius: 4 },
  reviewItem: { backgroundColor: '#FFF', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: SAGE.border, gap: 4 },
});
