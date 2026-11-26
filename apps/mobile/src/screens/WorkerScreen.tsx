import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, formatIDR } from '../theme/sage';
import { goApi } from '../lib/goApi';
import { supabase } from '../lib/supabase';
import { pickAndCompressImage } from '../lib/imageCompressor';
import { useSageFeedback } from '../components/SageFeedback';

interface Props {
  userId: string;
  profile?: any;
  assignedOrders: any[];
  onSelectOrder: (order: any) => void;
  onRefresh: () => void;
  onProfileUpdated?: (patch: any) => void;
  onOptimisticOrderUpdate?: (orderId: string, patch: any) => void;
}

export function WorkerScreen({
  userId,
  profile,
  assignedOrders,
  onSelectOrder,
  onRefresh,
  onProfileUpdated,
  onOptimisticOrderUpdate,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showToast } = useSageFeedback();
  const [filter, setFilter] = useState<'active' | 'history'>('active');
  const [pctMap, setPctMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [ssMap, setSsMap] = useState<Record<string, { url: string; info: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const activeOrders = assignedOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const historyOrders = assignedOrders.filter((o) => o.status === 'completed' || o.status === 'cancelled');
  const visibleOrders = filter === 'active' ? activeOrders : historyOrders;

  const isAvailable = profile?.is_available ?? true;
  const isOnLeave = profile?.is_on_leave ?? false;

  async function handleToggleAvailability(patch: { is_available?: boolean; is_on_leave?: boolean }) {
    setTogglingStatus(true);
    onProfileUpdated?.(patch);
    try {
      const { error } = await supabase.from('profiles').update(patch as any).eq('id', userId);
      if (error) throw error;
      showToast('Status ketersediaan diperbarui.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui status', 'error');
      onRefresh();
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleAttachScreenshot(orderId: string) {
    try {
      const res = await pickAndCompressImage({
        folder: 'progress',
        maxWidth: 960,
        quality: 0.65,
      });
      if (!res) return;
      setSsMap((prev) => ({
        ...prev,
        [orderId]: {
          url: res.publicUrl,
          info: `SS dikompres: ${res.originalKB} KB → ${res.compressedKB} KB (-${res.savedPct}%)`,
        },
      }));
      showToast(`Bukti SS siap (${res.compressedKB} KB)`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal memilih screenshot', 'error');
    }
  }

  async function handlePostProgress(order: any) {
    const rawPct = pctMap[order.id];
    const pct = Math.max(0, Math.min(100, Number(rawPct !== undefined && rawPct !== '' ? rawPct : order.current_percentage)));
    const note = (noteMap[order.id] || '').trim() || 'Update progres pengerjaan';
    const ssUrl = ssMap[order.id]?.url || '';
    const nextStatus = pct >= 100 ? 'completed' : 'in_progress';

    if (onOptimisticOrderUpdate) {
      onOptimisticOrderUpdate(order.id, { current_percentage: pct, status: nextStatus });
    }
    setBusyId(order.id);

    try {
      await goApi
        .postProgress(order.id, { percentage: pct, notes: note, screenshot_url: ssUrl })
        .catch(async () => {
          const { error: pErr } = await supabase.from('progress_updates').insert({
            order_id: order.id,
            percentage: pct,
            notes: note,
            screenshot_url: ssUrl,
          });
          if (pErr) throw pErr;
          const { error: oErr } = await supabase
            .from('orders')
            .update({
              current_percentage: pct,
              status: nextStatus,
              ...(pct >= 100 ? { completed_at: new Date().toISOString() } : {}),
            })
            .eq('id', order.id);
          if (oErr) throw oErr;
        });

      setNoteMap((m) => ({ ...m, [order.id]: '' }));
      setSsMap((s) => {
        const copy = { ...s };
        delete copy[order.id];
        return copy;
      });
      showToast(`Progres ${pct}% tersimpan instan!`, 'success');
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan progres', 'error');
      onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(46, insets.top + 12) }]}>
        <Text style={styles.title}>Worker Workspace ({activeOrders.length} Aktif)</Text>
        <Text style={styles.sub}>Update progres + SS terkompresi, checklist harian & vault</Text>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'active' && styles.segmentBtnActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.segmentText, filter === 'active' && styles.segmentTextActive]}>
              Aktif ({activeOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'history' && styles.segmentBtnActive]}
            onPress={() => setFilter('history')}
          >
            <Text style={[styles.segmentText, filter === 'history' && styles.segmentTextActive]}>
              Selesai / Batal ({historyOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        <View style={styles.statusCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              Status: {isOnLeave ? 'Sedang Cuti' : isAvailable ? 'Siap Terima Order' : 'Sedang Penuh / Offline'}
            </Text>
            <Text style={styles.meta}>
              Beban: {profile?.current_active_orders ?? activeOrders.length}/{profile?.max_capacity ?? 3} order • Rating:{' '}
              {Number(profile?.average_rating || 0).toFixed(1)}★
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              disabled={togglingStatus}
              style={[styles.miniToggle, isAvailable && !isOnLeave && styles.miniToggleOn]}
              onPress={() => handleToggleAvailability({ is_available: !isAvailable, is_on_leave: false })}
            >
              <Text style={[styles.miniToggleText, isAvailable && !isOnLeave && { color: '#FFF' }]}>
                {isAvailable ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={togglingStatus}
              style={[styles.miniToggle, isOnLeave && styles.miniToggleLeave]}
              onPress={() => handleToggleAvailability({ is_on_leave: !isOnLeave })}
            >
              <Text style={[styles.miniToggleText, isOnLeave && { color: '#FFF' }]}>Cuti</Text>
            </TouchableOpacity>
          </View>
        </View>

        {visibleOrders.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.name}>Belum ada tugas di daftar ini</Text>
            <Text style={styles.meta}>Tugas baru akan muncul di sini setelah ditugaskan oleh Admin.</Text>
          </View>
        ) : (
          visibleOrders.map((ord) => {
            const attached = ssMap[ord.id];
            const isOverdue =
              !!ord.expected_completion_at &&
              ord.status !== 'completed' &&
              ord.status !== 'cancelled' &&
              Date.now() > new Date(ord.expected_completion_at).getTime();
            const isLocked = ord.status === 'completed' || ord.status === 'cancelled';

            return (
              <View key={ord.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{ord.services?.name || 'Tugas Joki'}</Text>
                    <Text style={styles.meta}>
                      Costumer: {ord.consumer?.full_name || '-'} {ord.consumer?.phone ? `(${ord.consumer.phone})` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.price}>{formatIDR(ord.total_price)}</Text>
                    {isOverdue && <Text style={styles.overduePill}>OVERDUE</Text>}
                  </View>
                </View>

                <Text style={styles.meta}>
                  UID {ord.game_uid} • {ord.game_server} • Progres {ord.current_percentage || 0}% ({ord.status.toUpperCase()})
                </Text>

                {!!ord.notes && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteBoxText}>Catatan: {ord.notes}</Text>
                  </View>
                )}

                {!isLocked && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {[25, 50, 75, 100].map((preset) => (
                        <TouchableOpacity
                          key={preset}
                          style={[
                            styles.pctChip,
                            Number(pctMap[ord.id]) === preset && styles.pctChipActive,
                          ]}
                          onPress={() => setPctMap((m) => ({ ...m, [ord.id]: String(preset) }))}
                        >
                          <Text
                            style={[
                              styles.pctChipText,
                              Number(pctMap[ord.id]) === preset && { color: '#FFF' },
                            ]}
                          >
                            {preset}%
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[styles.input, { width: 78 }]}
                        keyboardType="numeric"
                        placeholder={`${ord.current_percentage || 0}%`}
                        placeholderTextColor={SAGE.textSecondary}
                        value={pctMap[ord.id] ?? ''}
                        onChangeText={(v) => setPctMap((m) => ({ ...m, [ord.id]: v }))}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Catatan progres..."
                        placeholderTextColor={SAGE.textSecondary}
                        value={noteMap[ord.id] ?? ''}
                        onChangeText={(v) => setNoteMap((m) => ({ ...m, [ord.id]: v }))}
                      />
                    </View>

                    <TouchableOpacity style={styles.ssAttachBtn} onPress={() => handleAttachScreenshot(ord.id)}>
                      <FontAwesome5 name="image" size={14} color={SAGE.primaryDark} />
                      <Text style={styles.ssAttachText}>
                        {attached ? attached.info : 'Lampirkan Bukti Screenshot (Auto-Compress)'}
                      </Text>
                    </TouchableOpacity>

                    {attached && (
                      <View style={styles.previewRow}>
                        <Image source={{ uri: attached.url }} style={styles.previewThumb} />
                        <TouchableOpacity
                          onPress={() =>
                            setSsMap((s) => {
                              const c = { ...s };
                              delete c[ord.id];
                              return c;
                            })
                          }
                        >
                          <Text style={styles.removeSsText}>Hapus SS</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {!isLocked && (
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => handlePostProgress(ord)}
                      disabled={busyId === ord.id}
                    >
                      <Text style={styles.primaryText}>
                        {busyId === ord.id ? 'Menyimpan...' : 'Kirim Progres'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => onSelectOrder(ord)}>
                    <Text style={styles.secondaryText}>Checklist, Chat & Vault</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  title: { fontFamily: FONTS.displayExtra, fontSize: 21, color: SAGE.textPrimary },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.primaryDark, marginTop: 2 },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginTop: 10,
  },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: SAGE.primary },
  segmentText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.textSecondary },
  segmentTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12, paddingBottom: 124 },
  statusCard: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: SAGE.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textPrimary },
  miniToggle: { backgroundColor: SAGE.surfaceSoft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  miniToggleOn: { backgroundColor: SAGE.primary },
  miniToggleLeave: { backgroundColor: SAGE.danger },
  miniToggleText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.textSecondary },
  card: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE.border,
    gap: 8,
  },
  name: { fontFamily: FONTS.displayBold, fontSize: 15, color: SAGE.textPrimary },
  price: { fontFamily: FONTS.displayBold, fontSize: 13, color: SAGE.primaryDark },
  overduePill: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: SAGE.danger,
    backgroundColor: SAGE.dangerSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meta: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary },
  noteBox: { backgroundColor: SAGE.surfaceSoft, padding: 9, borderRadius: 10 },
  noteBoxText: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textPrimary },
  pctChip: { flex: 1, backgroundColor: SAGE.surfaceSoft, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  pctChipActive: { backgroundColor: SAGE.primary },
  pctChipText: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.primaryDark },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SAGE.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: SAGE.textPrimary,
  },
  ssAttachBtn: {
    backgroundColor: SAGE.surfaceSoft,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: SAGE.border,
  },
  ssAttachText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark, flex: 1 },
  previewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 6, borderRadius: 12 },
  previewThumb: { width: 84, height: 48, borderRadius: 8 },
  removeSsText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.danger, paddingHorizontal: 10 },
  primaryBtn: { flex: 1, backgroundColor: SAGE.primary, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  primaryText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 12 },
  secondaryBtn: { flex: 1, backgroundColor: SAGE.surfaceSoft, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  secondaryText: { fontFamily: FONTS.bodyBold, color: SAGE.primaryDark, fontSize: 12 },
});
