import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, formatIDR, roleLabel } from '../theme/sage';
import { goApi } from '../lib/goApi';
import { supabase } from '../lib/supabase';
import { BotanicalStemChart, FinanceDonutChart } from '../components/BotanicalStats';
import { SpringTouchable } from '../components/SpringTouchable';
import { useSageFeedback } from '../components/SageFeedback';

interface Props {
  allOrders: any[];
  services: any[];
  onRefresh: () => void;
  onSelectOrder: (order: any) => void;
}

export function AdminScreen({ allOrders, services, onRefresh, onSelectOrder }: Props) {
  const { showToast } = useSageFeedback();
  const [tab, setTab] = useState<'finance' | 'orders' | 'workers' | 'catalog' | 'reviews'>('finance');
  const [finance, setFinance] = useState<any>(null);
  const [wPct, setWPct] = useState('75');
  const [aPct, setAPct] = useState('15');
  const [tPct, setTPct] = useState('10');
  const [savingSplit, setSavingSplit] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSeniority, setInviteSeniority] = useState<'junior' | 'senior' | 'lead'>('junior');
  const [inviteCap, setInviteCap] = useState('3');

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState<'consumer' | 'worker' | 'admin'>('consumer');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editSeniority, setEditSeniority] = useState<'junior' | 'senior' | 'lead'>('junior');
  const [editCap, setEditCap] = useState('3');
  const [savingUser, setSavingUser] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadAdminExtras();
  }, []);

  async function loadAdminExtras() {
    try {
      const [fin, adminUsers, rRes, invList] = await Promise.all([
        goApi.getFinanceSummary().catch(() => null),
        goApi.listAdminUsers().catch(async () => {
          const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          return data || [];
        }),
        supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name)').order('created_at', { ascending: false }),
        goApi.listWorkerInvites().catch(() => []),
      ]);
      if (fin) {
        setFinance(fin);
        setWPct(String(fin.split_ratios?.worker_share_pct ?? 75));
        setAPct(String(fin.split_ratios?.admin_share_pct ?? 15));
        setTPct(String(fin.split_ratios?.studio_treasury_pct ?? 10));
      }
      setUsers(adminUsers || []);
      setReviews(rRes.data || []);
      setInvites(invList || []);
    } catch {}
  }

  function openUserControl(u: any) {
    setEditingUser(u);
    setEditRole((u.role as any) || 'consumer');
    setEditName(u.full_name || '');
    setEditUsername(u.username || '');
    setEditEmail(u.email || '');
    setEditNewPassword('');
    setEditSeniority((u.seniority_level as any) || 'junior');
    setEditCap(String(u.max_capacity || 3));
  }

  async function handleSaveUserControl() {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      await goApi.updateUserAccount(editingUser.id, {
        role: editRole,
        full_name: editName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        ...(editNewPassword.trim() ? { password: editNewPassword.trim() } : {}),
        seniority_level: editSeniority,
        max_capacity: Number(editCap) || 3,
      });
      setEditingUser(null);
      showToast('Akun, role & kredensial pemulihan berhasil diperbarui!', 'success');
      loadAdminExtras();
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui akun user', 'error');
    } finally {
      setSavingUser(false);
    }
  }

  async function handleSaveSplit() {
    const w = Number(wPct) || 0;
    const a = Number(aPct) || 0;
    const t = Number(tPct) || 0;
    if (w + a + t !== 100) {
      showToast('Total persentase Worker + Admin + Kas harus tepat 100%', 'error');
      return;
    }

    setSavingSplit(true);
    try {
      await goApi
        .updateFinanceSettings({
          worker_share_pct: w,
          admin_share_pct: a,
          studio_treasury_pct: t,
        })
        .catch(async () => {
          // Fallback langsung ke Supabase jika Go API lambat di jaringan seluler
          const { error } = await (supabase.from('finance_settings' as any) as any).upsert({
            id: 1,
            worker_share_pct: w,
            admin_share_pct: a,
            studio_treasury_pct: t,
          });
          if (error) throw error;
        });

      setFinance((prev: any) => ({
        ...(prev || {}),
        split_ratios: { worker_share_pct: w, admin_share_pct: a, studio_treasury_pct: t },
      }));
      showToast('Rasio pembagian keuangan berhasil disimpan!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan rasio keuangan', 'error');
    } finally {
      setSavingSplit(false);
    }
  }

  async function handleInviteWorker() {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      showToast('Masukkan alamat Gmail kandidat worker.', 'error');
      return;
    }
    try {
      const cleanEmail = inviteEmail.trim().toLowerCase();
      const capNum = Number(inviteCap) || 3;
      const res: any = await goApi
        .inviteWorker({
          email: cleanEmail,
          seniority_level: inviteSeniority,
          max_capacity: capNum,
        })
        .catch(async () => {
          const { data: existing } = await supabase.from('profiles').select('id').ilike('email', cleanEmail).maybeSingle();
          const st = existing?.id ? 'accepted' : 'pending';
          if (existing?.id) {
            const { error: uErr } = await supabase
              .from('profiles')
              .update({ role: 'worker', seniority_level: inviteSeniority, max_capacity: capNum } as any)
              .eq('id', existing.id);
            if (uErr) throw uErr;
          }
          const { error: iErr } = await (supabase.from('worker_invites' as any) as any).upsert(
            { email: cleanEmail, seniority_level: inviteSeniority, max_capacity: capNum, status: st },
            { onConflict: 'email' }
          );
          if (iErr) throw iErr;
          return { status: st };
        });
      setInviteEmail('');
      showToast(
        res.status === 'accepted'
          ? 'Akun ditemukan & langsung dipromosikan menjadi Worker!'
          : 'Undangan Gmail tersimpan. Otomatis aktif saat login Google.',
        'success'
      );
      loadAdminExtras();
    } catch (e: any) {
      showToast(e.message || 'Gagal mengundang worker', 'error');
    }
  }

  async function handleAutoAssign(orderId: string) {
    try {
      const res: any = await goApi.assignWorker(orderId);
      showToast('Worker prioritas tertinggi ditugaskan (' + res.worker_id.slice(0, 8) + ')', 'success');
      onRefresh();
      loadAdminExtras();
    } catch (e: any) {
      showToast(e.message || 'Tidak ada worker tersedia', 'error');
    }
  }

  async function handleDeleteService(id: string) {
    try {
      await goApi.deleteService(id);
      showToast('Layanan dihapus', 'success');
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal hapus layanan', 'error');
    }
  }

  async function handleDeleteReview(id: string) {
    try {
      await goApi.deleteReview(id);
      showToast('Ulasan dihapus', 'success');
      loadAdminExtras();
    } catch (e: any) {
      showToast(e.message || 'Gagal hapus ulasan', 'error');
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    const uids = Array.isArray(u.game_uids) ? u.game_uids.join(' ').toLowerCase() : '';
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      uids.includes(q)
    );
  });

  // Samakan rumus dengan Web: Omzet Selesai = status 'completed', Dana Tertahan = status 'paid' / 'in_progress'
  const completedOrders = allOrders.filter((o) => o.status === 'completed');
  const activePaidOrders = allOrders.filter((o) => o.status === 'paid' || o.status === 'in_progress');
  const completedGross = completedOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);
  const activeEscrowGross = activePaidOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);

  const displayGross = completedGross;
  const displayWorkerAmt = Math.round(displayGross * ((Number(wPct) || 75) / 100));
  const displayAdminAmt = Math.round(displayGross * ((Number(aPct) || 15) / 100));
  const displayTreasuryAmt = Math.max(0, displayGross - displayWorkerAmt - displayAdminAmt);

  const totalOrd = Math.max(1, allOrders.length);
  const completedCnt = completedOrders.length;
  const activeCnt = activePaidOrders.length;
  const cancelledCnt = allOrders.filter((o) => o.status === 'cancelled').length;

  const weeklyPoints = [
    { label: 'Sen', value: 45 },
    { label: 'Sel', value: 70 },
    { label: 'Rab', value: 60 },
    { label: 'Kam', value: 90 },
    { label: 'Jum', value: 75 },
    { label: 'Sab', value: 100 },
    { label: 'Min', value: 82 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Studio</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {(['finance', 'orders', 'workers', 'catalog', 'reviews'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabChip, tab === t && styles.tabChipActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'finance'
                  ? 'Keuangan & Grafik'
                  : t === 'orders'
                  ? 'Order & Prioritas'
                  : t === 'workers'
                  ? 'User & Worker'
                  : t === 'catalog'
                  ? 'Layanan'
                  : 'Ulasan'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {tab === 'finance' && (
          <>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome5 name="chart-pie" size={16} color={SAGE.primary} />
                <Text style={styles.cardTitle}>Omzet Selesai ({formatIDR(displayGross)})</Text>
              </View>
              <Text style={styles.escrowNote}>
                Dana Order Aktif (Paid/Berjalan): {formatIDR(activeEscrowGross)} â€¢ Total Keseluruhan: {formatIDR(displayGross + activeEscrowGross)}
              </Text>

              <FinanceDonutChart
                gross={displayGross}
                workerAmt={displayWorkerAmt}
                adminAmt={displayAdminAmt}
                treasuryAmt={displayTreasuryAmt}
                workerPct={Number(wPct) || 75}
                adminPct={Number(aPct) || 15}
                treasuryPct={Number(tPct) || 10}
              />

              <Text style={styles.meta}>Atur Persentase Pembagian (Total wajib 100%):</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" value={wPct} onChangeText={setWPct} />
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" value={aPct} onChangeText={setAPct} />
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" value={tPct} onChangeText={setTPct} />
              </View>
              <SpringTouchable style={styles.primaryBtn} onPress={handleSaveSplit} disabled={savingSplit}>
                <Text style={styles.primaryText}>{savingSplit ? 'Menyimpan...' : 'Simpan Rasio Keuangan'}</Text>
              </SpringTouchable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Distribusi Status Pesanan ({allOrders.length})</Text>
              {[
                { label: 'Selesai', count: completedCnt, color: SAGE.success },
                { label: 'Berjalan / Paid', count: activeCnt, color: SAGE.primary },
                { label: 'Dibatalkan', count: cancelledCnt, color: SAGE.danger },
              ].map((st) => (
                <View key={st.label} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.meta}>{st.label}</Text>
                    <Text style={styles.statusCount}>
                      {st.count} order ({Math.round((st.count / totalOrd) * 100)}%)
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: ((st.count / totalOrd) * 100) + '%', backgroundColor: st.color }]} />
                  </View>
                </View>
              ))}
            </View>

            <BotanicalStemChart
              title="Aktivitas Studio Mingguan"
              subtitle="Tracking progres pengerjaan & aliran order"
              points={weeklyPoints}
            />
          </>
        )}

        {tab === 'orders' &&
          allOrders.map((ord) => (
            <View key={ord.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.cardTitle}>{ord.services?.name || 'Order'}</Text>
                <Text style={styles.price}>{formatIDR(ord.total_price)}</Text>
              </View>
              <Text style={styles.meta}>
                UID {ord.game_uid} â€¢ Status: {ord.status.toUpperCase()} ({ord.current_percentage}%)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <SpringTouchable style={styles.primaryBtn} onPress={() => handleAutoAssign(ord.id)}>
                  <FontAwesome5 name="award" size={13} color="#FFF" />
                  <Text style={styles.primaryText}>Auto-Assign Prioritas</Text>
                </SpringTouchable>
                <SpringTouchable style={styles.secondaryBtn} onPress={() => onSelectOrder(ord)}>
                  <Text style={styles.secondaryText}>Detail</Text>
                </SpringTouchable>
              </View>
            </View>
          ))}

        {tab === 'workers' && (
          <>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome5 name="user-plus" size={15} color={SAGE.primary} />
                <Text style={styles.cardTitle}>Undang Worker Resmi via Gmail</Text>
              </View>
              <Text style={styles.meta}>
                Hanya Gmail terdaftar di sini yang otomatis menjadi Worker saat login Google atau registrasi.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="kandidat.worker@gmail.com"
                placeholderTextColor={SAGE.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={inviteEmail}
                onChangeText={setInviteEmail}
              />
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {(['junior', 'senior', 'lead'] as const).map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.lvlChip, inviteSeniority === lvl && styles.lvlChipActive]}
                    onPress={() => setInviteSeniority(lvl)}
                  >
                    <Text style={[styles.lvlText, inviteSeniority === lvl && styles.lvlTextActive]}>{lvl.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[styles.input, { width: 68, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={inviteCap}
                  onChangeText={setInviteCap}
                  placeholder="Max"
                />
              </View>
              <SpringTouchable style={styles.primaryBtn} onPress={handleInviteWorker}>
                <Text style={styles.primaryText}>Kirim Undangan / Aktifkan Worker</Text>
              </SpringTouchable>
            </View>

            {invites.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daftar Undangan Gmail ({invites.length})</Text>
                {invites.map((inv) => (
                  <View key={inv.id} style={styles.inviteRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inviteEmail}>{inv.email}</Text>
                      <Text style={styles.meta}>
                        Seniority: {inv.seniority_level} â€¢ Kapasitas: {inv.max_capacity} order
                      </Text>
                    </View>
                    <Text style={styles.rolePillText}>{inv.status.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionSub}>Direktori & Pemulihan Akun User ({users.length})</Text>
            <View style={styles.searchBox}>
              <FontAwesome5 name="search" size={13} color={SAGE.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari Nama, @username, Email, atau Game UID..."
                placeholderTextColor={SAGE.textSecondary}
                autoCapitalize="none"
                value={userSearch}
                onChangeText={setUserSearch}
              />
            </View>

            {filteredUsers.map((u) => {
              const loadPct = Math.min(100, Math.round(((u.current_active_orders || 0) / Math.max(1, u.max_capacity || 3)) * 100));
              const uids = Array.isArray(u.game_uids) && u.game_uids.length > 0 ? u.game_uids.join(', ') : null;
              return (
                <TouchableOpacity key={u.id} style={styles.rowCard} onPress={() => openUserControl(u)}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.cardTitle}>
                      {u.full_name || 'Tanpa Nama'} {u.username ? '(@' + u.username + ')' : ''}
                    </Text>
                    <Text style={styles.inviteEmail}>{u.email}</Text>
                    {uids && <Text style={styles.meta}>UID Tercatat: {uids}</Text>}
                    {u.role !== 'consumer' && (
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: loadPct + '%', backgroundColor: SAGE.primary }]} />
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{roleLabel(u.role)}</Text>
                    </View>
                    <Text style={styles.manageLink}>Kelola Akun â†’</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {tab === 'catalog' &&
          services.map((s) => (
            <View key={s.id} style={styles.rowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                <Text style={styles.meta}>
                  {formatIDR(s.base_price)} â€¢ {s.category}
                </Text>
              </View>
              <SpringTouchable style={styles.delBtn} onPress={() => handleDeleteService(s.id)}>
                <FontAwesome5 name="trash-alt" size={14} color={SAGE.danger} />
              </SpringTouchable>
            </View>
          ))}

        {tab === 'reviews' &&
          reviews.map((rev) => (
            <View key={rev.id} style={styles.rowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {rev.reviewer?.full_name || 'Costumer'} ({rev.rating}/5)
                </Text>
                <Text style={styles.meta}>{rev.comment || '(Tanpa komentar)'}</Text>
              </View>
              <SpringTouchable style={styles.delBtn} onPress={() => handleDeleteReview(rev.id)}>
                <FontAwesome5 name="trash-alt" size={14} color={SAGE.danger} />
              </SpringTouchable>
            </View>
          ))}
      </ScrollView>

      <Modal visible={!!editingUser} transparent animationType="slide" onRequestClose={() => setEditingUser(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Kontrol & Pemulihan Akun User</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.meta}>Pilih Role Spesifik:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['consumer', 'worker', 'admin'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.lvlChip, editRole === r && styles.lvlChipActive]}
                  onPress={() => setEditRole(r)}
                >
                  <Text style={[styles.lvlText, editRole === r && styles.lvlTextActive]}>{roleLabel(r)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.meta}>Nama Lengkap & Username:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={editName} onChangeText={setEditName} placeholder="Nama" />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={editUsername}
                onChangeText={setEditUsername}
                autoCapitalize="none"
                placeholder="Username"
              />
            </View>

            <Text style={styles.meta}>Email Terdaftar (Bisa diganti jika user kehilangan akses email lama):</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email akun"
            />

            <Text style={styles.meta}>Set Password Baru (Isi jika user lupa password, kosongkan jika tidak diubah):</Text>
            <TextInput
              style={styles.input}
              value={editNewPassword}
              onChangeText={setEditNewPassword}
              placeholder="Password baru minimal 6 karakter..."
              placeholderTextColor={SAGE.textSecondary}
            />

            {editRole !== 'consumer' && (
              <>
                <Text style={styles.meta}>Seniority & Kapasitas Maksimal Worker:</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['junior', 'senior', 'lead'] as const).map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.lvlChip, editSeniority === lvl && styles.lvlChipActive]}
                      onPress={() => setEditSeniority(lvl)}
                    >
                      <Text style={[styles.lvlText, editSeniority === lvl && styles.lvlTextActive]}>{lvl.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                  <TextInput
                    style={[styles.input, { width: 64, textAlign: 'center' }]}
                    keyboardType="numeric"
                    value={editCap}
                    onChangeText={setEditCap}
                  />
                </View>
              </>
            )}

            <TouchableOpacity style={styles.saveFullBtn} onPress={handleSaveUserControl} disabled={savingUser}>
              <Text style={styles.primaryText}>{savingUser ? 'Menyimpan...' : 'Simpan Perubahan Akun'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingTop: 18, paddingBottom: 14, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 21, color: SAGE.textPrimary },
  tabChip: { backgroundColor: SAGE.surfaceCard, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  tabChipActive: { backgroundColor: SAGE.primary },
  tabText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.textSecondary },
  tabTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12, paddingBottom: 124 },
  card: { backgroundColor: SAGE.surfaceCard, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: SAGE.border, gap: 10 },
  rowCard: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: SAGE.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: { fontFamily: FONTS.displayBold, fontSize: 15, color: SAGE.textPrimary },
  escrowNote: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.primaryDark, backgroundColor: SAGE.surfaceSoft, padding: 8, borderRadius: 10 },
  sectionSub: { fontFamily: FONTS.displayBold, fontSize: 14, color: SAGE.textPrimary, marginTop: 4 },
  meta: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary },
  statusCount: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textPrimary },
  barBg: { height: 7, backgroundColor: SAGE.surfaceSoft, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 6 },
  price: { fontFamily: FONTS.displayBold, fontSize: 14, color: SAGE.primaryDark },
  searchBox: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: SAGE.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontFamily: FONTS.body, fontSize: 13, color: SAGE.textPrimary },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SAGE.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: SAGE.textPrimary,
  },
  lvlChip: { flex: 1, backgroundColor: SAGE.surfaceSoft, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  lvlChipActive: { backgroundColor: SAGE.primary },
  lvlText: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.primaryDark },
  lvlTextActive: { color: '#FFF' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: SAGE.border },
  inviteEmail: { fontFamily: FONTS.mono, fontSize: 12, color: SAGE.textPrimary },
  manageLink: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark },
  primaryBtn: {
    flex: 1,
    backgroundColor: SAGE.primary,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveFullBtn: {
    backgroundColor: SAGE.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 13 },
  secondaryBtn: { backgroundColor: SAGE.surfaceSoft, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, justifyContent: 'center' },
  secondaryText: { fontFamily: FONTS.bodyBold, color: SAGE.primaryDark, fontSize: 12 },
  rolePill: { backgroundColor: SAGE.surfaceSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  rolePillText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark },
  delBtn: { backgroundColor: SAGE.dangerSoft, padding: 10, borderRadius: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(26,46,41,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: SAGE.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10 },
});
