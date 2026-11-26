import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, formatIDR } from '../theme/sage';
import { supabase } from '../lib/supabase';
import { goApi } from '../lib/goApi';
import { useSageFeedback } from '../components/SageFeedback';

interface Props {
  userId: string;
  services: any[];
  categories: any[];
  onOrderCreated: () => void;
}

export function CatalogScreen({ userId, services, categories, onOrderCreated }: Props) {
  const { showToast } = useSageFeedback();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [bookingService, setBookingService] = useState<any>(null);

  const [gameUid, setGameUid] = useState('');
  const [gameServer, setGameServer] = useState('Asia');
  const [notes, setNotes] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = services.filter((s) => {
    const matchCat = selectedCat === 'all' || s.category === selectedCat;
    const matchQ = !query.trim() || s.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  async function handleCheckout() {
    if (!gameUid.trim()) {
      showToast('Masukkan UID game terlebih dahulu.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          consumer_id: userId,
          service_id: bookingService.id,
          total_price: bookingService.base_price,
          game_uid: gameUid.trim(),
          game_server: gameServer,
          notes: notes.trim(),
          status: 'paid',
          total_estimated_hours: bookingService.estimated_hours || 1,
        })
        .select()
        .single();

      if (error) throw error;

      if (loginId.trim() && loginPass.trim() && data?.id) {
        await goApi.saveCredentials(data.id, {
          game_uid: gameUid.trim(),
          login_identifier: loginId.trim(),
          password: loginPass.trim(),
        });
      }

      setBookingService(null);
      setGameUid('');
      setNotes('');
      setLoginId('');
      setLoginPass('');
      showToast('Pesanan berhasil dibuat!', 'success');
      onOrderCreated();
    } catch (e: any) {
      showToast(e.message || 'Gagal membuat pesanan', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Katalog Layanan</Text>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color={SAGE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Spiral Abyss, Rawat Akun, Quest..."
            placeholderTextColor={SAGE.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
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
        {filtered.map((srv) => (
          <View key={srv.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.badge}>{srv.category}</Text>
              <Text style={styles.est}>~{srv.estimated_hours || 1} Jam</Text>
            </View>
            <Text style={styles.srvName}>{srv.name}</Text>
            <Text style={styles.srvDesc} numberOfLines={2}>
              {srv.description || 'Layanan joki profesional meroo.gi'}
            </Text>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.priceLbl}>Mulai dari</Text>
                <Text style={styles.priceVal}>{formatIDR(srv.base_price)}</Text>
              </View>
              <TouchableOpacity style={styles.orderBtn} onPress={() => setBookingService(srv)}>
                <FontAwesome5 name="shopping-bag" size={13} color="#FFF" />
                <Text style={styles.orderBtnText}>Pesan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!bookingService} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>{bookingService?.name}</Text>
              <TouchableOpacity onPress={() => setBookingService(null)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.priceVal}>{formatIDR(bookingService?.base_price || 0)}</Text>

            <TextInput style={styles.input} placeholder="Game UID (Contoh: 895533359)" placeholderTextColor={SAGE.textSecondary} value={gameUid} onChangeText={setGameUid} />
            <TextInput style={styles.input} placeholder="Server (Asia / America / Europe)" placeholderTextColor={SAGE.textSecondary} value={gameServer} onChangeText={setGameServer} />
            <TextInput style={styles.input} placeholder="Catatan request (misal: resin, build karakter)" placeholderTextColor={SAGE.textSecondary} value={notes} onChangeText={setNotes} />
            <Text style={styles.vaultHint}>Opsional — Simpan Login Terenkripsi AES-256:</Text>
            <TextInput style={styles.input} placeholder="Email / Username Hoyoverse" placeholderTextColor={SAGE.textSecondary} value={loginId} onChangeText={setLoginId} />
            <TextInput style={styles.input} placeholder="Password Game" placeholderTextColor={SAGE.textSecondary} secureTextEntry value={loginPass} onChangeText={setLoginPass} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleCheckout} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Memproses...' : 'Konfirmasi & Buat Pesanan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 22, color: SAGE.textPrimary, marginBottom: 10 },
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
  card: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE.border,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: {
    backgroundColor: SAGE.surfaceSoft,
    color: SAGE.primaryDark,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  est: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary },
  srvName: { fontFamily: FONTS.displayBold, fontSize: 16, color: SAGE.textPrimary, marginTop: 2 },
  srvDesc: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary, lineHeight: 18 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(26,46,41,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: SAGE.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10 },
  modalTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: SAGE.textPrimary },
  vaultHint: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark, marginTop: 4 },
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
  submitBtn: { backgroundColor: SAGE.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitText: { fontFamily: FONTS.displayBold, color: '#FFF', fontSize: 14 },
});
