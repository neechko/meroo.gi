import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, formatIDR } from '../theme/sage';
import { goApi } from '../lib/goApi';
import { supabase } from '../lib/supabase';
import { pickAndCompressImage } from '../lib/imageCompressor';
import { useSageFeedback } from '../components/SageFeedback';

interface Props {
  userId: string;
  assignedOrders: any[];
  onSelectOrder: (order: any) => void;
  onRefresh: () => void;
  onOptimisticOrderUpdate?: (orderId: string, patch: any) => void;
}

export function WorkerScreen({ assignedOrders, onSelectOrder, onRefresh, onOptimisticOrderUpdate }: Props) {
  const { showToast } = useSageFeedback();
  const [pctMap, setPctMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [ssMap, setSsMap] = useState<Record<string, { url: string; info: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

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

    // Optimistic UI 0ms: langsung perbarui persentase di layar
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
          await supabase
            .from('orders')
            .update({
              current_percentage: pct,
              status: nextStatus,
              ...(pct >= 100 ? { completed_at: new Date().toISOString() } : {}),
            })
            .eq('id', order.id);
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
      <View style={styles.header}>
        <Text style={styles.title}>Worker Workspace ({assignedOrders.length})</Text>
        <Text style={styles.sub}>Update progres + bukti SS terkompresi, checklist & vault</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {assignedOrders.map((ord) => {
          const attached = ssMap[ord.id];
          return (
            <View key={ord.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.name}>{ord.services?.name || 'Tugas Joki'}</Text>
                <Text style={styles.price}>{formatIDR(ord.total_price)}</Text>
              </View>
              <Text style={styles.meta}>
                UID {ord.game_uid} • {ord.game_server} • Saat ini {ord.current_percentage}%
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { width: 78 }]}
                  keyboardType="numeric"
                  placeholder={`${ord.current_percentage}%`}
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

              {/* Lampiran Bukti Screenshot Terkompresi */}
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

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => handlePostProgress(ord)}
                  disabled={busyId === ord.id}
                >
                  <Text style={styles.primaryText}>
                    {busyId === ord.id ? 'Menyimpan...' : 'Kirim Progres'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => onSelectOrder(ord)}>
                  <Text style={styles.secondaryText}>Checklist & Vault</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingTop: 18, paddingBottom: 16, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 21, color: SAGE.textPrimary },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.primaryDark, marginTop: 2 },
  list: { padding: 16, gap: 12, paddingBottom: 124 },
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
  meta: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textSecondary },
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
