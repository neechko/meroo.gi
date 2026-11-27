import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  categories?: any[];
  serviceTiers?: any[];
  onRefresh: () => void;
  onSelectOrder: (order: any) => void;
}

type AdminTab = 'finance' | 'orders' | 'workers' | 'catalog' | 'reviews';
type CatalogSubTab = 'services' | 'packages' | 'categories';
type SeniorityLevel = 'junior' | 'mid' | 'senior';

function normalizeSeniorityClient(raw: any): SeniorityLevel {
  if (raw === 'mid') return 'mid';
  if (raw === 'senior' || raw === 'lead') return 'senior';
  return 'junior';
}

export function AdminScreen({
  allOrders,
  services,
  categories = [],
  serviceTiers = [],
  onRefresh,
  onSelectOrder,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showToast, showDialog } = useSageFeedback();
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates?.height || 0));
    const s2 = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const [tab, setTab] = useState<AdminTab>('finance');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [catalogSubTab, setCatalogSubTab] = useState<CatalogSubTab>('services');

  const [finance, setFinance] = useState<any>(null);
  const [wPct, setWPct] = useState('75');
  const [aPct, setAPct] = useState('15');
  const [tPct, setTPct] = useState('10');
  const [savingSplit, setSavingSplit] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSeniority, setInviteSeniority] = useState<SeniorityLevel>('junior');
  const [inviteCap, setInviteCap] = useState('3');

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState<'consumer' | 'worker' | 'admin'>('consumer');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editSeniority, setEditSeniority] = useState<SeniorityLevel>('junior');
  const [editCap, setEditCap] = useState('3');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editOnLeave, setEditOnLeave] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const [assignModalOrder, setAssignModalOrder] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Service CRUD modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [srvName, setSrvName] = useState('');
  const [srvCategory, setSrvCategory] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState('50000');
  const [srvHours, setSrvHours] = useState('2');
  const [srvActive, setSrvActive] = useState(true);
  const [savingCatalog, setSavingCatalog] = useState(false);

  // Package (service_tiers) CRUD modal
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [pkgServiceId, setPkgServiceId] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPrice, setPkgPrice] = useState('25000');
  const [pkgHours, setPkgHours] = useState('1');
  const [pkgActive, setPkgActive] = useState(true);

  // Category CRUD modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catActive, setCatActive] = useState(true);

  // Reviews + Edit Review modal
  const [reviews, setReviews] = useState<any[]>([]);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');

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
        supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name), service:services(name)')
          .order('created_at', { ascending: false }),
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
    setEditSeniority(normalizeSeniorityClient(u.seniority_level));
    setEditCap(String(u.max_capacity || 3));
    setEditAvailable(u.is_available ?? true);
    setEditOnLeave(u.is_on_leave ?? false);
  }

  async function handleSaveUserControl() {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      await goApi
        .updateUserAccount(editingUser.id, {
          role: editRole,
          full_name: editName.trim(),
          username: editUsername.trim(),
          email: editEmail.trim(),
          ...(editNewPassword.trim() ? { password: editNewPassword.trim() } : {}),
          seniority_level: editSeniority,
          max_capacity: Number(editCap) || 3,
          is_available: editAvailable,
          is_on_leave: editOnLeave,
        })
        .catch(async () => {
          const { error } = await supabase
            .from('profiles')
            .update({
              role: editRole,
              full_name: editName.trim(),
              username: editUsername.trim().replace(/^@/, '').toLowerCase() || null,
              seniority_level: editSeniority,
              max_capacity: Number(editCap) || 3,
              is_available: editAvailable,
              is_on_leave: editOnLeave,
            } as any)
            .eq('id', editingUser.id);
          if (error) throw error;
        });

      setEditingUser(null);
      showToast('Akun, role & status worker berhasil diperbarui!', 'success');
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

  async function openAssignPicker(order: any) {
    setAssignModalOrder(order);
    setLoadingCandidates(true);
    try {
      const list = await goApi.getWorkerCandidates(order.id);
      setCandidates(list || []);
    } catch {
      const staff = users.filter((u) => u.role === 'worker' || u.role === 'admin');
      const ranked = staff
        .map((w) => {
          const cap = Math.max(1, Number(w.max_capacity) || 3);
          const active = Number(w.current_active_orders) || 0;
          const loadRatio = active / cap;
          const eligible = (w.is_available ?? true) && !w.is_on_leave && active < cap;
          const score = Math.round(((1 - loadRatio) * 50 + (Number(w.average_rating) || 4) * 4) * 100) / 100;
          return {
            worker: w,
            eligible,
            reason: !w.is_available || w.is_on_leave ? 'Offline / Cuti' : active >= cap ? 'Penuh' : 'Siap ditugaskan',
            priority_score: score,
            load_ratio: Math.round(loadRatio * 100) / 100,
          };
        })
        .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.priority_score - a.priority_score);
      setCandidates(ranked);
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function handleAssignWorker(orderId: string, workerId?: string) {
    try {
      const res: any = await goApi.assignWorker(orderId, workerId).catch(async () => {
        let pickedId = workerId;
        if (!pickedId) {
          const { data: staff } = await supabase
            .from('profiles')
            .select('id, seniority_level, max_capacity, current_active_orders, is_available, is_on_leave, average_rating')
            .in('role', ['worker', 'admin']);
          const eligible = (staff || [])
            .filter((w: any) => (w.is_available ?? true) && !w.is_on_leave && (w.current_active_orders || 0) < (w.max_capacity || 3))
            .sort((a: any, b: any) => {
              const aLoad = (a.current_active_orders || 0) / Math.max(1, a.max_capacity || 3);
              const bLoad = (b.current_active_orders || 0) / Math.max(1, b.max_capacity || 3);
              if (aLoad !== bLoad) return aLoad - bLoad;
              return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
            });
          if (eligible.length === 0) {
            throw new Error('Tidak ada worker yang tersedia atau kapasitas penuh.');
          }
          pickedId = eligible[0].id;
        }
        const { error } = await supabase
          .from('orders')
          .update({ worker_id: pickedId, status: 'in_progress' })
          .eq('id', orderId);
        if (error) throw error;
        return { worker_id: pickedId };
      });
      setAssignModalOrder(null);
      showToast('Worker ditugaskan (' + String(res.worker_id || '').slice(0, 8) + ')', 'success');
      onRefresh();
      loadAdminExtras();
    } catch (e: any) {
      showToast(e.message || 'Gagal menugaskan worker', 'error');
    }
  }

  // ===== SERVICES CRUD =====
  function openServiceModal(srv?: any) {
    if (srv) {
      setEditingService(srv);
      setSrvName(srv.name || '');
      setSrvCategory(srv.category || categories[0]?.slug || '');
      setSrvDesc(srv.description || '');
      setSrvPrice(String(srv.base_price || 0));
      setSrvHours(String(srv.estimated_hours || 1));
      setSrvActive(srv.is_active ?? true);
    } else {
      setEditingService(null);
      setSrvName('');
      setSrvCategory(categories[0]?.slug || '');
      setSrvDesc('');
      setSrvPrice('50000');
      setSrvHours('2');
      setSrvActive(true);
    }
    setServiceModalOpen(true);
  }

  async function handleSaveService() {
    if (!srvName.trim() || !srvCategory) {
      showToast('Nama layanan dan kategori wajib diisi.', 'error');
      return;
    }
    setSavingCatalog(true);
    const payload = {
      name: srvName.trim(),
      category: srvCategory,
      description: srvDesc.trim(),
      base_price: Math.max(0, Number(srvPrice) || 0),
      estimated_hours: Math.max(1, Number(srvHours) || 1),
      is_active: srvActive,
    };
    try {
      if (editingService) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingService.id);
        if (error) throw error;
        showToast('Layanan diperbarui!', 'success');
      } else {
        const { error } = await supabase.from('services').insert([payload]);
        if (error) throw error;
        showToast('Layanan ditambahkan!', 'success');
      }
      setServiceModalOpen(false);
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan layanan', 'error');
    } finally {
      setSavingCatalog(false);
    }
  }

  async function handleToggleServiceActive(srv: any) {
    const { error } = await supabase.from('services').update({ is_active: !srv.is_active }).eq('id', srv.id);
    if (error) showToast(error.message, 'error');
    else onRefresh();
  }

  function handleDeleteService(srv: any) {
    showDialog({
      title: 'Hapus Layanan?',
      message: `Hapus layanan "${srv.name}"? Jika sudah memiliki order, layanan akan dinonaktifkan agar riwayat transaksi tetap aman.`,
      type: 'error',
      cancelText: 'Batal',
      confirmText: 'Hapus',
      onConfirm: async () => {
        try {
          await goApi.deleteService(srv.id).catch(async () => {
            const { error } = await supabase.from('services').delete().eq('id', srv.id);
            if (error) throw error;
          });
          showToast('Layanan dihapus', 'success');
          onRefresh();
        } catch (e: any) {
          showToast(e.message || 'Gagal hapus layanan', 'error');
        }
      },
    });
  }

  // ===== PACKAGES (SERVICE TIERS) CRUD =====
  function openPkgModal(pkg?: any) {
    if (pkg) {
      setEditingPkg(pkg);
      setPkgServiceId(pkg.service_id || services[0]?.id || '');
      setPkgName(pkg.name || '');
      setPkgDesc(pkg.description || '');
      setPkgPrice(String(pkg.fixed_price || 0));
      setPkgHours(String(pkg.estimated_hours || 1));
      setPkgActive(pkg.is_active ?? true);
    } else {
      setEditingPkg(null);
      setPkgServiceId(services[0]?.id || '');
      setPkgName('');
      setPkgDesc('');
      setPkgPrice('25000');
      setPkgHours('1');
      setPkgActive(true);
    }
    setPkgModalOpen(true);
  }

  async function handleSavePkg() {
    if (!pkgServiceId || !pkgName.trim()) {
      showToast('Pilih layanan dan isi nama paket.', 'error');
      return;
    }
    setSavingCatalog(true);
    const payload = {
      service_id: pkgServiceId,
      name: pkgName.trim(),
      description: pkgDesc.trim() || null,
      fixed_price: Math.max(0, Number(pkgPrice) || 0),
      estimated_hours: Math.max(1, Number(pkgHours) || 1),
      is_active: pkgActive,
    };
    try {
      if (editingPkg) {
        const { error } = await supabase.from('service_tiers').update(payload).eq('id', editingPkg.id);
        if (error) throw error;
        showToast('Paket diperbarui!', 'success');
      } else {
        const { error } = await supabase.from('service_tiers').insert([payload]);
        if (error) throw error;
        showToast('Paket ditambahkan!', 'success');
      }
      setPkgModalOpen(false);
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan paket', 'error');
    } finally {
      setSavingCatalog(false);
    }
  }

  async function handleDeletePkg(pkg: any) {
    const { error } = await supabase.from('service_tiers').delete().eq('id', pkg.id);
    if (error) showToast(error.message, 'error');
    else {
      showToast('Paket dihapus', 'success');
      onRefresh();
    }
  }

  // ===== CATEGORIES CRUD =====
  function openCatModal(cat?: any) {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name || '');
      setCatSlug(cat.slug || '');
      setCatDesc(cat.description || '');
      setCatActive(cat.is_active ?? true);
    } else {
      setEditingCat(null);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setCatActive(true);
    }
    setCatModalOpen(true);
  }

  async function handleSaveCat() {
    const slug = catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!catName.trim() || !slug) {
      showToast('Nama dan slug kategori wajib diisi.', 'error');
      return;
    }
    setSavingCatalog(true);
    const payload = {
      name: catName.trim(),
      slug,
      description: catDesc.trim() || null,
      is_active: catActive,
    };
    try {
      if (editingCat) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCat.id);
        if (error) throw error;
        showToast('Kategori diperbarui!', 'success');
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
        showToast('Kategori ditambahkan!', 'success');
      }
      setCatModalOpen(false);
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan kategori', 'error');
    } finally {
      setSavingCatalog(false);
    }
  }

  async function handleDeleteCat(cat: any) {
    const linked = services.filter((s) => s.category === cat.slug);
    if (linked.length > 0) {
      showToast(`Masih ada ${linked.length} layanan di kategori ini.`, 'error');
      return;
    }
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) showToast(error.message, 'error');
    else {
      showToast('Kategori dihapus', 'success');
      onRefresh();
    }
  }

  // ===== REVIEWS MODERATION =====
  async function handleSaveReviewEdit() {
    if (!editingReview) return;
    try {
      await goApi.updateReview(editingReview.id, { rating: revRating, comment: revComment.trim() }).catch(async () => {
        const { error } = await supabase
          .from('reviews')
          .update({ rating: revRating, comment: revComment.trim() })
          .eq('id', editingReview.id);
        if (error) throw error;
      });
      setEditingReview(null);
      showToast('Ulasan diperbarui!', 'success');
      loadAdminExtras();
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui ulasan', 'error');
    }
  }

  async function handleDeleteReview(id: string) {
    try {
      await goApi.deleteReview(id).catch(async () => {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) throw error;
      });
      showToast('Ulasan dihapus', 'success');
      loadAdminExtras();
      onRefresh();
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

  const filteredAdminOrders = allOrders.filter((o) => {
    if (orderStatusFilter === 'pending') return o.status === 'pending';
    if (orderStatusFilter === 'active') return o.status === 'paid' || o.status === 'in_progress';
    if (orderStatusFilter === 'completed') return o.status === 'completed';
    if (orderStatusFilter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  // Omzet Selesai = status 'completed', Dana Tertahan = status 'paid' / 'in_progress'
  const completedOrders = allOrders.filter((o) => o.status === 'completed');
  const activePaidOrders = allOrders.filter((o) => o.status === 'paid' || o.status === 'in_progress');
  const pendingOrders = allOrders.filter((o) => o.status === 'pending');
  const completedGross = completedOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);
  const activeEscrowGross = activePaidOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);

  const displayGross = completedGross;
  const displayWorkerAmt = Math.round(displayGross * ((Number(wPct) || 75) / 100));
  const displayAdminAmt = Math.round(displayGross * ((Number(aPct) || 15) / 100));
  const displayTreasuryAmt = Math.max(0, displayGross - displayWorkerAmt - displayAdminAmt);

  const totalOrd = Math.max(1, allOrders.length);
  const completedCnt = completedOrders.length;
  const activeCnt = activePaidOrders.length;
  const pendingCnt = pendingOrders.length;
  const cancelledCnt = allOrders.filter((o) => o.status === 'cancelled').length;

  // Hitung aktivitas 7 hari terakhir secara dinamis dari allOrders
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const weeklyCounts: Record<string, number> = {};
  const today = new Date();
  const weeklyDays: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    weeklyDays.push(key);
    weeklyCounts[key] = 0;
  }
  for (const o of allOrders) {
    if (!o.created_at) continue;
    const key = String(o.created_at).slice(0, 10);
    if (weeklyCounts[key] !== undefined) weeklyCounts[key] += 1;
  }
  const maxDayCnt = Math.max(1, ...Object.values(weeklyCounts));
  const weeklyPoints = weeklyDays.map((key) => {
    const d = new Date(key + 'T00:00:00Z');
    return {
      label: dayNames[d.getUTCDay()],
      value: Math.round((weeklyCounts[key] / maxDayCnt) * 100),
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(46, insets.top + 12) }]}>
        <Text style={styles.title}>Admin Studio</Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator style={{ marginTop: 10, flexGrow: 0, borderRadius: 16 }} contentContainerStyle={styles.tabScroll}>
          {(
            [
              { key: 'finance', label: 'Keuangan & Grafik' },
              { key: 'orders', label: `Order (${allOrders.length})` },
              { key: 'workers', label: `User & Worker (${users.length})` },
              { key: 'catalog', label: 'Layanan & Paket' },
              { key: 'reviews', label: `Ulasan (${reviews.length})` },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabChip, tab === t.key && styles.tabChipActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
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
                Dana Order Aktif (Paid/Berjalan): {formatIDR(activeEscrowGross)} • Total Keseluruhan: {formatIDR(displayGross + activeEscrowGross)}
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

              <Text style={styles.meta}>Atur Persentase Pembagian (Worker / Admin / Kas = 100%):</Text>
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
                { label: 'Menunggu Bayar (Pending)', count: pendingCnt, color: SAGE.accentWarm },
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
                    <View style={[styles.barFill, { width: `${(st.count / totalOrd) * 100}%`, backgroundColor: st.color }]} />
                  </View>
                </View>
              ))}
            </View>

            <BotanicalStemChart
              title="Aktivitas Order 7 Hari Terakhir"
              subtitle="Jumlah pesanan masuk per hari secara real-time"
              points={weeklyPoints}
            />
          </>
        )}

        {tab === 'orders' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
              {(
                [
                  { k: 'all', l: `Semua (${allOrders.length})` },
                  { k: 'pending', l: `Pending (${pendingCnt})` },
                  { k: 'active', l: `Aktif (${activeCnt})` },
                  { k: 'completed', l: `Selesai (${completedCnt})` },
                  { k: 'cancelled', l: `Batal (${cancelledCnt})` },
                ] as const
              ).map((f) => (
                <TouchableOpacity
                  key={f.k}
                  style={[styles.subFilterChip, orderStatusFilter === f.k && styles.subFilterChipActive]}
                  onPress={() => setOrderStatusFilter(f.k)}
                >
                  <Text style={[styles.subFilterText, orderStatusFilter === f.k && { color: '#FFF' }]}>{f.l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredAdminOrders.map((ord) => {
              const isLocked = ord.status === 'completed' || ord.status === 'cancelled';
              const isOverdue =
                !!ord.expected_completion_at &&
                !isLocked &&
                Date.now() > new Date(ord.expected_completion_at).getTime();

              return (
                <View key={ord.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                      {ord.services?.name || 'Order'}
                    </Text>
                    <Text style={styles.price}>{formatIDR(ord.total_price)}</Text>
                  </View>
                  <Text style={styles.meta}>
                    Costumer: {ord.consumer?.full_name || '-'} • Worker: {ord.worker?.full_name || 'Belum ditugaskan'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.meta}>
                      UID {ord.game_uid} • {ord.status.toUpperCase()} ({ord.current_percentage || 0}%)
                    </Text>
                    {isOverdue && <Text style={styles.overduePill}>OVERDUE</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {!isLocked && (
                      <>
                        <SpringTouchable style={styles.primaryBtn} onPress={() => handleAssignWorker(ord.id)}>
                          <FontAwesome5 name="award" size={12} color="#FFF" />
                          <Text style={styles.primaryText}>Auto-Assign</Text>
                        </SpringTouchable>
                        <SpringTouchable style={styles.secondaryBtn} onPress={() => openAssignPicker(ord)}>
                          <Text style={styles.secondaryText}>{ord.worker_id ? 'Ganti Worker' : 'Pilih Worker'}</Text>
                        </SpringTouchable>
                      </>
                    )}
                    <SpringTouchable style={styles.secondaryBtn} onPress={() => onSelectOrder(ord)}>
                      <Text style={styles.secondaryText}>Detail</Text>
                    </SpringTouchable>
                  </View>
                </View>
              );
            })}
          </>
        )}

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
                {(['junior', 'mid', 'senior'] as const).map((lvl) => (
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
                        Seniority: {inv.seniority_level} • Kapasitas: {inv.max_capacity} order
                      </Text>
                    </View>
                    <Text style={styles.rolePillText}>{inv.status.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionSub}>Direktori & Kontrol Akun User ({users.length})</Text>
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
                      <>
                        <Text style={styles.meta}>
                          {String(u.seniority_level || 'junior').toUpperCase()} • Beban {u.current_active_orders || 0}/{u.max_capacity || 3} •{' '}
                          {u.is_on_leave ? 'CUTI' : u.is_available === false ? 'OFFLINE' : 'ONLINE'}
                        </Text>
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${loadPct}%`, backgroundColor: SAGE.primary }]} />
                        </View>
                      </>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{roleLabel(u.role)}</Text>
                    </View>
                    <Text style={styles.manageLink}>Kelola →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {tab === 'catalog' && (
          <>
            <View style={styles.subTabBar}>
              {(
                [
                  { k: 'services', l: `Layanan (${services.length})` },
                  { k: 'packages', l: `Paket (${serviceTiers.length})` },
                  { k: 'categories', l: `Kategori (${categories.length})` },
                ] as const
              ).map((st) => (
                <TouchableOpacity
                  key={st.k}
                  style={[styles.subTabBtn, catalogSubTab === st.k && styles.subTabBtnActive]}
                  onPress={() => setCatalogSubTab(st.k)}
                >
                  <Text style={[styles.subTabText, catalogSubTab === st.k && { color: '#FFF' }]}>{st.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {catalogSubTab === 'services' && (
              <>
                <TouchableOpacity style={styles.saveFullBtn} onPress={() => openServiceModal()}>
                  <Text style={styles.primaryText}>+ Tambah Layanan Baru</Text>
                </TouchableOpacity>
                {services.map((s) => (
                  <View key={s.id} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.cardTitle, { flex: 1 }]}>{s.name}</Text>
                      <Text style={[styles.statusBadge, !s.is_active && styles.statusBadgeOff]}>
                        {s.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </Text>
                    </View>
                    <Text style={styles.meta}>
                      {formatIDR(s.base_price)} • {s.category} • ~{s.estimated_hours || 1} Jam
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleToggleServiceActive(s)}>
                        <Text style={styles.secondaryText}>{s.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => openServiceModal(s)}>
                        <Text style={styles.secondaryText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteService(s)}>
                        <FontAwesome5 name="trash-alt" size={14} color={SAGE.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {catalogSubTab === 'packages' && (
              <>
                <TouchableOpacity style={styles.saveFullBtn} onPress={() => openPkgModal()}>
                  <Text style={styles.primaryText}>+ Tambah Paket (Tier) Baru</Text>
                </TouchableOpacity>
                {serviceTiers.map((pkg) => {
                  const parent = services.find((s) => s.id === pkg.service_id);
                  return (
                    <View key={pkg.id} style={styles.rowCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{pkg.name}</Text>
                        <Text style={styles.meta}>
                          {parent?.name || 'Layanan'} • {formatIDR(pkg.fixed_price)} • ~{pkg.estimated_hours || 1} Jam
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => openPkgModal(pkg)}>
                        <Text style={styles.secondaryText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtn} onPress={() => handleDeletePkg(pkg)}>
                        <FontAwesome5 name="trash-alt" size={14} color={SAGE.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}

            {catalogSubTab === 'categories' && (
              <>
                <TouchableOpacity style={styles.saveFullBtn} onPress={() => openCatModal()}>
                  <Text style={styles.primaryText}>+ Tambah Kategori Baru</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <View key={cat.id} style={styles.rowCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{cat.name}</Text>
                      <Text style={styles.meta}>
                        slug: {cat.slug} • {cat.is_active ? 'Aktif' : 'Nonaktif'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => openCatModal(cat)}>
                      <Text style={styles.secondaryText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteCat(cat)}>
                      <FontAwesome5 name="trash-alt" size={14} color={SAGE.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'reviews' &&
          reviews.map((rev) => (
            <View key={rev.id} style={styles.rowCard}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.cardTitle}>
                  {rev.reviewer?.full_name || 'Costumer'} ({rev.rating}/5 ★)
                </Text>
                {!!rev.service?.name && <Text style={styles.inviteEmail}>{rev.service.name}</Text>}
                <Text style={styles.meta}>{rev.comment || '(Tanpa komentar)'}</Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setEditingReview(rev);
                  setRevRating(rev.rating || 5);
                  setRevComment(rev.comment || '');
                }}
              >
                <FontAwesome5 name="edit" size={13} color={SAGE.primaryDark} />
              </TouchableOpacity>
              <SpringTouchable style={styles.delBtn} onPress={() => handleDeleteReview(rev.id)}>
                <FontAwesome5 name="trash-alt" size={14} color={SAGE.danger} />
              </SpringTouchable>
            </View>
          ))}
      </ScrollView>

      {/* Modal Pilih Worker Prioritas */}
      <Modal visible={!!assignModalOrder} transparent animationType="slide" onRequestClose={() => setAssignModalOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Pilih Worker (Skor Prioritas)</Text>
              <TouchableOpacity onPress={() => setAssignModalOrder(null)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 8 }}>
              {loadingCandidates ? (
                <Text style={styles.meta}>Menghitung skor prioritas worker...</Text>
              ) : candidates.length === 0 ? (
                <Text style={styles.meta}>Tidak ada worker terdaftar.</Text>
              ) : (
                candidates.map((c) => {
                  const w = c.worker;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      disabled={!c.eligible}
                      style={[styles.candidateRow, !c.eligible && { opacity: 0.55 }]}
                      onPress={() => handleAssignWorker(assignModalOrder.id, w.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                          {w.full_name} [{String(w.seniority_level || 'junior').toUpperCase()}]
                        </Text>
                        <Text style={styles.meta}>
                          Beban {w.current_active_orders || 0}/{w.max_capacity || 3} • Rating {Number(w.average_rating || 0).toFixed(1)}★ • {c.reason}
                        </Text>
                      </View>
                      <Text style={styles.rolePillText}>Skor {c.priority_score}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Kontrol & Pemulihan Akun User */}
      <Modal visible={!!editingUser} transparent animationType="slide" onRequestClose={() => setEditingUser(null)}>
        <View style={[styles.modalBackdrop, { paddingBottom: kbHeight }]}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Kontrol & Pemulihan Akun User</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 450 }} contentContainerStyle={{ gap: 10 }}>
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

              <Text style={styles.meta}>Email Terdaftar:</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Email akun"
              />

              <Text style={styles.meta}>Set Password Baru (kosongkan jika tidak diubah):</Text>
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
                    {(['junior', 'mid', 'senior'] as const).map((lvl) => (
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
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.lvlChip, editAvailable && styles.lvlChipActive]}
                      onPress={() => setEditAvailable((v) => !v)}
                    >
                      <Text style={[styles.lvlText, editAvailable && styles.lvlTextActive]}>
                        {editAvailable ? 'AVAILABLE: YA' : 'AVAILABLE: TIDAK'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.lvlChip, editOnLeave && { backgroundColor: SAGE.danger }]}
                      onPress={() => setEditOnLeave((v) => !v)}
                    >
                      <Text style={[styles.lvlText, editOnLeave && { color: '#FFF' }]}>
                        {editOnLeave ? 'STATUS: CUTI' : 'STATUS: AKTIF'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveFullBtn} onPress={handleSaveUserControl} disabled={savingUser}>
              <Text style={styles.primaryText}>{savingUser ? 'Menyimpan...' : 'Simpan Perubahan Akun'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah / Edit Layanan */}
      <Modal visible={serviceModalOpen} transparent animationType="slide" onRequestClose={() => setServiceModalOpen(false)}>
        <View style={[styles.modalBackdrop, { paddingBottom: kbHeight }]}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}</Text>
              <TouchableOpacity onPress={() => setServiceModalOpen(false)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 8 }}>
              <TextInput style={styles.input} value={srvName} onChangeText={setSrvName} placeholder="Nama Layanan" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.slug}
                    style={[styles.subFilterChip, { marginRight: 6 }, srvCategory === c.slug && styles.subFilterChipActive]}
                    onPress={() => setSrvCategory(c.slug)}
                  >
                    <Text style={[styles.subFilterText, srvCategory === c.slug && { color: '#FFF' }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={styles.input} value={srvDesc} onChangeText={setSrvDesc} placeholder="Deskripsi layanan..." multiline />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" value={srvPrice} onChangeText={setSrvPrice} placeholder="Harga (IDR)" />
                <TextInput style={[styles.input, { width: 90 }]} keyboardType="numeric" value={srvHours} onChangeText={setSrvHours} placeholder="Jam" />
              </View>
              <TouchableOpacity
                style={[styles.lvlChip, srvActive && styles.lvlChipActive]}
                onPress={() => setSrvActive((v) => !v)}
              >
                <Text style={[styles.lvlText, srvActive && styles.lvlTextActive]}>
                  {srvActive ? 'TAMPIL DI KATALOG (AKTIF)' : 'DISEMBUNYIKAN (NONAKTIF)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.saveFullBtn} onPress={handleSaveService} disabled={savingCatalog}>
              <Text style={styles.primaryText}>{savingCatalog ? 'Menyimpan...' : 'Simpan Layanan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah / Edit Paket (Tier) */}
      <Modal visible={pkgModalOpen} transparent animationType="slide" onRequestClose={() => setPkgModalOpen(false)}>
        <View style={[styles.modalBackdrop, { paddingBottom: kbHeight }]}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{editingPkg ? 'Edit Paket' : 'Tambah Paket Baru'}</Text>
              <TouchableOpacity onPress={() => setPkgModalOpen(false)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 8 }}>
              <Text style={styles.meta}>Pilih Layanan Induk:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {services.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.subFilterChip, { marginRight: 6 }, pkgServiceId === s.id && styles.subFilterChipActive]}
                    onPress={() => setPkgServiceId(s.id)}
                  >
                    <Text style={[styles.subFilterText, pkgServiceId === s.id && { color: '#FFF' }]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={styles.input} value={pkgName} onChangeText={setPkgName} placeholder="Nama Paket (cth: Floor 12)" />
              <TextInput style={styles.input} value={pkgDesc} onChangeText={setPkgDesc} placeholder="Deskripsi singkat paket" />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" value={pkgPrice} onChangeText={setPkgPrice} placeholder="Harga Tetap (IDR)" />
                <TextInput style={[styles.input, { width: 90 }]} keyboardType="numeric" value={pkgHours} onChangeText={setPkgHours} placeholder="Jam" />
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveFullBtn} onPress={handleSavePkg} disabled={savingCatalog}>
              <Text style={styles.primaryText}>{savingCatalog ? 'Menyimpan...' : 'Simpan Paket'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah / Edit Kategori */}
      <Modal visible={catModalOpen} transparent animationType="slide" onRequestClose={() => setCatModalOpen(false)}>
        <View style={[styles.modalBackdrop, { paddingBottom: kbHeight }]}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}</Text>
              <TouchableOpacity onPress={() => setCatModalOpen(false)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={catName}
              onChangeText={(v) => {
                setCatName(v);
                if (!editingCat) {
                  setCatSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
                }
              }}
              placeholder="Nama Kategori"
            />
            <TextInput style={styles.input} value={catSlug} onChangeText={setCatSlug} autoCapitalize="none" placeholder="slug_kategori" />
            <TextInput style={styles.input} value={catDesc} onChangeText={setCatDesc} placeholder="Deskripsi kategori" />
            <TouchableOpacity style={styles.saveFullBtn} onPress={handleSaveCat} disabled={savingCatalog}>
              <Text style={styles.primaryText}>{savingCatalog ? 'Menyimpan...' : 'Simpan Kategori'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Edit Ulasan (Admin) */}
      <Modal visible={!!editingReview} transparent animationType="slide" onRequestClose={() => setEditingReview(null)}>
        <View style={[styles.modalBackdrop, { paddingBottom: kbHeight }]}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Edit Ulasan Pelanggan</Text>
              <TouchableOpacity onPress={() => setEditingReview(null)}>
                <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRevRating(star)} style={{ padding: 4 }}>
                  <FontAwesome5 name="star" solid size={22} color={star <= revRating ? SAGE.accentWarm : SAGE.border} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} value={revComment} onChangeText={setRevComment} placeholder="Komentar ulasan..." multiline />
            <TouchableOpacity style={styles.saveFullBtn} onPress={handleSaveReviewEdit}>
              <Text style={styles.primaryText}>Simpan Perubahan Ulasan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingBottom: 14, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 21, color: SAGE.textPrimary },
  tabScroll: { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 16, padding: 4, gap: 4 },
  tabChip: { backgroundColor: 'transparent', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
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
  overduePill: { fontFamily: FONTS.mono, fontSize: 9, color: SAGE.danger, backgroundColor: SAGE.dangerSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  subFilterChip: { backgroundColor: SAGE.surfaceCard, borderWidth: 1, borderColor: SAGE.border, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  subFilterChipActive: { backgroundColor: SAGE.primary, borderColor: SAGE.primary },
  subFilterText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.textSecondary },
  subTabBar: { flexDirection: 'row', backgroundColor: SAGE.surfaceCard, borderRadius: 14, padding: 4, gap: 4, borderWidth: 1, borderColor: SAGE.border },
  subTabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  subTabBtnActive: { backgroundColor: SAGE.primary },
  subTabText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.textSecondary },
  statusBadge: { fontFamily: FONTS.mono, fontSize: 10, color: SAGE.success, backgroundColor: SAGE.successSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeOff: { color: SAGE.danger, backgroundColor: SAGE.dangerSoft },
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
    marginTop: 4,
  },
  primaryText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 13 },
  secondaryBtn: { backgroundColor: SAGE.surfaceSoft, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontFamily: FONTS.bodyBold, color: SAGE.primaryDark, fontSize: 12 },
  rolePill: { backgroundColor: SAGE.surfaceSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  rolePillText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark },
  delBtn: { backgroundColor: SAGE.dangerSoft, padding: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  candidateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: SAGE.border, gap: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(26,46,41,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: SAGE.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10 },
});
