import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, TextInput, Image,
  StyleSheet, Share, Platform,
  Animated, Easing, LayoutAnimation, UIManager, PanResponder, Keyboard,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, CHECKLIST_PRESETS, formatIDR } from '../theme/sage';
import { goApi } from '../lib/goApi';
import { supabase } from '../lib/supabase';
import { useSageFeedback } from './SageFeedback';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  visible: boolean;
  order: any;
  userId: string;
  role: 'consumer' | 'worker' | 'admin';
  onClose: () => void;
  onRefresh: () => void;
}

type SectionKey = 'checklist' | 'vault' | 'progress' | 'chat';

export function OrderDetailModal({ visible, order, userId, role, onClose, onRefresh }: Props) {
  const { showToast, showDialog } = useSageFeedback();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checklists, setChecklists] = useState<any[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [customCadence, setCustomCadence] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const [vault, setVault] = useState<any>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [verifCode, setVerifCode] = useState('');

  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptRender, setReceiptRender] = useState(false);

  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomRender, setZoomRender] = useState(false);
  const [activeZoomUri, setActiveZoomUri] = useState<string | null>(null);

  const [progressList, setProgressList] = useState<any[]>([]);
  const [editingProgId, setEditingProgId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState('');
  const [editNote, setEditNote] = useState('');

  const [messages, setMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');

  const [renderModal, setRenderModal] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    checklist: false,
    vault: false,
    progress: false,
    chat: false,
  });

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const sectionOffsets = useRef<Record<SectionKey, number>>({
    checklist: 60,
    vault: 280,
    progress: 520,
    chat: 760,
  });

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(560)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const chevronAnims = useRef<Record<SectionKey, Animated.Value>>({
    checklist: new Animated.Value(0),
    vault: new Animated.Value(0),
    progress: new Animated.Value(0),
    chat: new Animated.Value(0),
  }).current;
  const receiptAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(0)).current;

  const checklistCacheRef = useRef<Record<string, any[]>>({});
  const reqSeqRef = useRef(0);

  const isStaff = role === 'worker' || role === 'admin';
  const isOwner = order?.consumer_id === userId;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function focusSection(key: SectionKey, toEnd = false) {
    setTimeout(() => {
      if (toEnd) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } else {
        const y = Math.max(0, (sectionOffsets.current[key] || 0) - 12);
        scrollViewRef.current?.scrollTo({ y, animated: true });
      }
    }, 160);
  }

  const detailPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 6 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          sheetAnim.setValue(gs.dy);
          backdropAnim.setValue(Math.max(0, 1 - gs.dy / 480));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.65) {
          handleAnimatedClose();
        } else {
          Animated.parallel([
            Animated.spring(sheetAnim, { toValue: 0, speed: 22, bounciness: 6, useNativeDriver: true }),
            Animated.timing(backdropAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(520);
      cardAnims.forEach((a) => a.setValue(0));

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          speed: 18,
          bounciness: 5,
          useNativeDriver: true,
        }),
        Animated.stagger(
          65,
          cardAnims.map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              speed: 18,
              bounciness: 6,
              useNativeDriver: true,
            })
          )
        ),
      ]).start();
    } else if (renderModal) {
      setKeyboardHeight(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: 560,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRenderModal(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (showReceiptModal) {
      setReceiptRender(true);
      receiptAnim.setValue(0);
      Animated.spring(receiptAnim, {
        toValue: 1,
        speed: 20,
        bounciness: 7,
        useNativeDriver: true,
      }).start();
    } else if (receiptRender) {
      Animated.timing(receiptAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setReceiptRender(false);
      });
    }
  }, [showReceiptModal]);

  useEffect(() => {
    if (zoomImage) {
      setActiveZoomUri(zoomImage);
      setZoomRender(true);
      zoomAnim.setValue(0);
      Animated.spring(zoomAnim, {
        toValue: 1,
        speed: 22,
        bounciness: 6,
        useNativeDriver: true,
      }).start();
    } else if (zoomRender) {
      Animated.timing(zoomAnim, {
        toValue: 0,
        duration: 170,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setZoomRender(false);
          setActiveZoomUri(null);
        }
      });
    }
  }, [zoomImage]);

  function handleAnimatedClose() {
    Keyboard.dismiss();
    setKeyboardHeight(0);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: 560,
        duration: 220,
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

  function toggleSection(key: SectionKey) {
    const nextClosed = !collapsed[key];
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.84 },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    Animated.timing(chevronAnims[key], {
      toValue: nextClosed ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setCollapsed((prev) => ({ ...prev, [key]: nextClosed }));
  }

  useEffect(() => {
    if (visible && order?.id) {
      const cacheKey = order.id + ':' + selectedDate;
      if (checklistCacheRef.current[cacheKey]) {
        setChecklists(checklistCacheRef.current[cacheKey]);
      }
      loadAll();
    }
  }, [visible, order?.id, selectedDate]);

  async function loadAll() {
    if (!order?.id) return;
    const seq = ++reqSeqRef.current;
    const cacheKey = order.id + ':' + selectedDate;

    try {
      const [clRes, vlt, progRes, msgRes] = await Promise.all([
        (supabase.from('order_checklists' as any) as any)
          .select('*')
          .eq('order_id', order.id)
          .eq('task_date', selectedDate)
          .order('created_at', { ascending: true }),
        goApi.getCredentials(order.id).catch(() => null),
        supabase.from('progress_updates').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
        supabase.from('messages').select('*, sender:profiles(full_name, role)').eq('order_id', order.id).order('created_at', { ascending: true }),
      ]);

      if (seq !== reqSeqRef.current) return;

      if (!clRes.error && Array.isArray(clRes.data)) {
        checklistCacheRef.current[cacheKey] = clRes.data;
        setChecklists(clRes.data);
      }

      if (vlt !== null) {
        setVault(vlt);
        if (vlt?.login_identifier) setLoginId(vlt.login_identifier);
      }
      if (!progRes.error && Array.isArray(progRes.data)) {
        setProgressList(progRes.data);
      }
      if (!msgRes.error && Array.isArray(msgRes.data)) {
        setMessages(msgRes.data);
      }
    } catch {}
  }

  function updateChecklistState(updater: (prev: any[]) => any[]) {
    const cacheKey = order.id + ':' + selectedDate;
    setChecklists((prev) => {
      const next = updater(prev);
      checklistCacheRef.current[cacheKey] = next;
      return next;
    });
  }

  function shiftDate(days: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const nextDate = d.toISOString().slice(0, 10);
    const nextKey = order.id + ':' + nextDate;
    setChecklists(checklistCacheRef.current[nextKey] || []);
    setSelectedDate(nextDate);
  }

  async function handleOpenReceipt() {
    try {
      const rcp = await goApi.getReceipt(order.id);
      setReceiptData(rcp);
      setShowReceiptModal(true);
    } catch {
      const fallbackText =
        '====================================\n' +
        '       MEROO.GI STUDIO RECEIPT      \n' +
        '====================================\n' +
        'No. Struk : INV-' + order.id.slice(0, 8).toUpperCase() + '\n' +
        'Layanan   : ' + (order.services?.name || 'Joki Genshin Impact') + '\n' +
        'Game UID  : ' + order.game_uid + ' (' + order.game_server + ')\n' +
        'Status    : ' + order.status.toUpperCase() + ' (' + order.current_percentage + '%)\n' +
        'Total     : ' + formatIDR(order.total_price) + '\n' +
        '====================================';
      setReceiptData({
        receipt_number: 'INV-' + order.id.slice(0, 8).toUpperCase(),
        printable_text: fallbackText,
      });
      setShowReceiptModal(true);
    }
  }

  async function handleDownloadOrShareReceipt() {
    if (!receiptData?.printable_text) return;
    try {
      await Share.share({
        title: receiptData.receipt_number + '.txt',
        message: receiptData.printable_text,
      });
    } catch (e: any) {
      showToast(e.message || 'Gagal membagikan struk', 'error');
    }
  }

  function handleCancelOrder() {
    showDialog({
      title: 'Batalkan Pesanan?',
      message: 'Pesanan akan dibatalkan dan kredensial vault dihapus otomatis.',
      type: 'error',
      cancelText: 'Tutup',
      confirmText: 'Ya, Batalkan',
      onConfirm: async () => {
        try {
          await goApi.cancelOrder(order.id, 'Dibatalkan oleh Costumer via Aplikasi');
          showToast('Pesanan berhasil dibatalkan', 'success');
          onRefresh();
          handleAnimatedClose();
        } catch (e: any) {
          showToast(e.message || 'Gagal membatalkan', 'error');
        }
      },
    });
  }

  async function handleSaveVault() {
    if (!loginId.trim() || !loginPass.trim()) {
      showToast('Isi email/username login dan password game.', 'error');
      return;
    }
    try {
      await goApi.saveCredentials(order.id, {
        game_uid: order.game_uid || '-',
        login_identifier: loginId.trim(),
        password: loginPass.trim(),
      });
      setLoginPass('');
      Keyboard.dismiss();
      showToast('Kredensial terenkripsi AES-256 tersimpan!', 'success');
      loadAll();
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan vault', 'error');
    }
  }

  async function handleRequestCode() {
    try {
      await goApi.requestVerificationCode(order.id);
      showToast('Permintaan kode 2FA dikirim ke Costumer.', 'success');
      loadAll();
    } catch (e: any) {
      showToast(e.message || 'Gagal meminta kode', 'error');
    }
  }

  async function handleSubmitCode() {
    if (!verifCode.trim()) return;
    try {
      await goApi.submitVerificationCode(order.id, verifCode.trim());
      setVerifCode('');
      Keyboard.dismiss();
      showToast('Kode verifikasi dikirim ke Worker.', 'success');
      loadAll();
    } catch (e: any) {
      showToast(e.message || 'Gagal mengirim kode', 'error');
    }
  }

  async function handleAddPreset(preset: typeof CHECKLIST_PRESETS[number]) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const tempId = 'temp-' + Date.now();
    const newItem = {
      id: tempId,
      order_id: order.id,
      task_date: selectedDate,
      cadence: preset.cadence,
      task_key: preset.task_key,
      task_label: preset.task_label,
      target_detail: preset.default_detail,
      is_done: false,
    };
    updateChecklistState((prev) => [...prev, newItem]);

    const { data, error } = await (supabase.from('order_checklists' as any) as any)
      .insert({
        order_id: order.id,
        task_date: selectedDate,
        cadence: preset.cadence,
        task_key: preset.task_key,
        task_label: preset.task_label,
        target_detail: preset.default_detail,
      })
      .select()
      .single();

    if (error) {
      updateChecklistState((prev) => prev.filter((c) => c.id !== tempId));
      showToast('Gagal menambah checklist: ' + error.message, 'error');
      return;
    }
    if (data) {
      updateChecklistState((prev) => prev.map((c) => (c.id === tempId ? data : c)));
    }
  }

  async function handleAddCustomTask() {
    if (!customTask.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const label = customTask.trim();
    const tempId = 'temp-' + Date.now();
    setCustomTask('');
    updateChecklistState((prev) => [
      ...prev,
      { id: tempId, order_id: order.id, task_date: selectedDate, cadence: customCadence, task_label: label, is_done: false },
    ]);

    const { data, error } = await (supabase.from('order_checklists' as any) as any)
      .insert({
        order_id: order.id,
        task_date: selectedDate,
        cadence: customCadence,
        task_key: 'custom',
        task_label: label,
      })
      .select()
      .single();

    if (error) {
      updateChecklistState((prev) => prev.filter((c) => c.id !== tempId));
      showToast('Gagal menambah checklist: ' + error.message, 'error');
      return;
    }
    if (data) {
      updateChecklistState((prev) => prev.map((c) => (c.id === tempId ? data : c)));
    }
  }

  async function handleToggleCheck(item: any) {
    const nextDone = !item.is_done;
    updateChecklistState((prev) => prev.map((c) => (c.id === item.id ? { ...c, is_done: nextDone } : c)));
    const { error } = await (supabase.from('order_checklists' as any) as any)
      .update({
        is_done: nextDone,
        completed_by: nextDone ? userId : null,
        completed_at: nextDone ? new Date().toISOString() : null,
      })
      .eq('id', item.id);
    if (error) {
      showToast('Gagal ceklis: ' + error.message, 'error');
      loadAll();
    }
  }

  function handleConfirmDeleteCheck(item: any) {
    showDialog({
      title: 'Hapus Item Checklist?',
      message: 'Hapus "' + item.task_label + '" dari daftar checklist tanggal ' + selectedDate + '?',
      type: 'error',
      cancelText: 'Batal',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        updateChecklistState((prev) => prev.filter((c) => c.id !== item.id));
        const { error } = await (supabase.from('order_checklists' as any) as any).delete().eq('id', item.id);
        if (error) {
          showToast('Gagal menghapus: ' + error.message, 'error');
          loadAll();
        } else {
          showToast('Item checklist dihapus.', 'success');
        }
      },
    });
  }

  async function handleSaveProgressEdit(progId: string) {
    try {
      await goApi.editProgress(order.id, progId, Number(editPct) || 0, editNote);
      setEditingProgId(null);
      Keyboard.dismiss();
      showToast('Koreksi progres disimpan', 'success');
      loadAll();
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal edit progres', 'error');
    }
  }

  async function handleSendChat() {
    if (!chatText.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const text = chatText.trim();
    setChatText('');
    setMessages((prev) => [
      ...prev,
      { id: 'msg-' + Date.now(), content: text, sender: { full_name: 'Saya' } },
    ]);
    focusSection('chat', true);
    await supabase.from('messages').insert({
      order_id: order.id,
      sender_id: userId,
      content: text,
    });
  }

  if (!order) return null;

  const getCardAnimStyle = (idx: number) => ({
    opacity: cardAnims[idx],
    transform: [
      {
        translateY: cardAnims[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  const getChevronStyle = (key: SectionKey) => ({
    transform: [
      {
        rotate: chevronAnims[key].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-90deg'],
        }),
      },
    ],
  });

  return (
    <Modal visible={renderModal} transparent animationType="none" statusBarTranslucent={false} onRequestClose={handleAnimatedClose}>
      <Animated.View style={[styles.modalBackdrop, { opacity: backdropAnim }]}>
        {/* Kontainer luar mengecil sebesar keyboardHeight agar ScrollView tidak pernah tertutup keyboard */}
        <Animated.View style={[styles.sheetWrapper, { paddingBottom: keyboardHeight, transform: [{ translateY: sheetAnim }] }]}>
          <View style={styles.container}>
            <View {...detailPanResponder.panHandlers} style={styles.headerWrap}>
              <View style={styles.sheetDragPill} />
              <View style={styles.header}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.headerTitle} numberOfLines={1}>{order.services?.name || 'Detail Pesanan'}</Text>
                  <Text style={styles.headerSub}>UID {order.game_uid} • {order.game_server} • {order.status.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={handleAnimatedClose} style={styles.closeBtn}>
                  <FontAwesome5 name="times" size={17} color={SAGE.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}
            >
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.receiptBtn} onPress={handleOpenReceipt}>
                  <FontAwesome5 name="print" size={14} color="#FFF" />
                  <Text style={styles.receiptBtnText}>Lihat & Download Struk ({formatIDR(order.total_price)})</Text>
                </TouchableOpacity>
                {isOwner && (order.status === 'pending' || order.status === 'paid') && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
                    <FontAwesome5 name="times-circle" size={14} color={SAGE.danger} />
                    <Text style={styles.cancelBtnText}>Batalkan</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Panel 1: Kalender & Checklist */}
              <Animated.View
                onLayout={(e) => { sectionOffsets.current.checklist = e.nativeEvent.layout.y; }}
                style={[styles.card, getCardAnimStyle(0)]}
              >
                <TouchableOpacity activeOpacity={0.75} style={styles.cardHeadToggle} onPress={() => toggleSection('checklist')}>
                  <View style={styles.cardHead}>
                    <FontAwesome5 name="calendar-alt" size={15} color={SAGE.primary} />
                    <Text style={styles.cardTitle}>Kalender & Checklist Joki</Text>
                  </View>
                  <Animated.View style={[styles.chevronBadge, getChevronStyle('checklist')]}>
                    <FontAwesome5 name="chevron-down" size={12} color={SAGE.primaryDark} />
                  </Animated.View>
                </TouchableOpacity>

                {!collapsed.checklist && (
                  <View style={{ gap: 8 }}>
                    <View style={styles.dateBar}>
                      <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateArrow}>
                        <FontAwesome5 name="chevron-left" size={14} color={SAGE.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.dateText}>{selectedDate}</Text>
                      <TouchableOpacity onPress={() => shiftDate(1)} style={styles.dateArrow}>
                        <FontAwesome5 name="chevron-right" size={14} color={SAGE.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    {checklists.length === 0 ? (
                      <Text style={styles.emptyHint}>Belum ada checklist pada tanggal ini. Pilih preset di bawah untuk menambahkan.</Text>
                    ) : (
                      checklists.map((item) => (
                        <View key={item.id} style={styles.checkRow}>
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                            onPress={() => handleToggleCheck(item)}
                          >
                            <FontAwesome5
                              name={item.is_done ? 'check-square' : 'square'}
                              size={19}
                              color={item.is_done ? SAGE.primary : SAGE.textSecondary}
                              solid={item.is_done}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.checkLabel, item.is_done && styles.checkDone]}>{item.task_label}</Text>
                              <Text style={styles.checkMeta}>
                                [{item.cadence.toUpperCase()}] {item.target_detail || 'Sesuai request'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.delCheckBtn} onPress={() => handleConfirmDeleteCheck(item)}>
                            <FontAwesome5 name="trash-alt" size={13} color={SAGE.danger} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}

                    <View style={styles.staffBox}>
                      <Text style={styles.subLabel}>Tambah Target / Checklist Harian & Mingguan:</Text>
                      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                        {CHECKLIST_PRESETS.map((p) => (
                          <TouchableOpacity key={p.task_key} style={styles.presetChip} onPress={() => handleAddPreset(p)}>
                            <FontAwesome5 name="plus" size={10} color={SAGE.primaryDark} />
                            <Text style={styles.presetText}>{p.task_label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <View style={styles.customRow}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Request khusus / build karakter..."
                          placeholderTextColor={SAGE.textSecondary}
                          value={customTask}
                          onChangeText={setCustomTask}
                          onFocus={() => focusSection('checklist')}
                        />
                        <TouchableOpacity
                          style={styles.cadenceBtn}
                          onPress={() =>
                            setCustomCadence((c) => (c === 'daily' ? 'weekly' : c === 'weekly' ? 'monthly' : 'daily'))
                          }
                        >
                          <Text style={styles.cadenceText}>{customCadence}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomTask}>
                          <FontAwesome5 name="plus" size={14} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </Animated.View>

              {/* Panel 2: Encrypted Vault */}
              <Animated.View
                onLayout={(e) => { sectionOffsets.current.vault = e.nativeEvent.layout.y; }}
                style={[styles.card, getCardAnimStyle(1)]}
              >
                <TouchableOpacity activeOpacity={0.75} style={styles.cardHeadToggle} onPress={() => toggleSection('vault')}>
                  <View style={styles.cardHead}>
                    <FontAwesome5 name="lock" size={15} color={SAGE.primary} />
                    <Text style={styles.cardTitle}>Vault Akun Terenkripsi & 2FA</Text>
                  </View>
                  <Animated.View style={[styles.chevronBadge, getChevronStyle('vault')]}>
                    <FontAwesome5 name="chevron-down" size={12} color={SAGE.primaryDark} />
                  </Animated.View>
                </TouchableOpacity>

                {!collapsed.vault && (
                  <View style={{ gap: 8 }}>
                    <Text style={styles.subLabel}>
                      Teridentifikasi via UID {order.game_uid}. Password otomatis terhapus begitu order selesai/batal.
                    </Text>

                    {isOwner && order.status !== 'completed' && order.status !== 'cancelled' && (
                      <View style={{ gap: 8, marginTop: 4 }}>
                        <TextInput
                          style={styles.input}
                          placeholder="Email / Username Hoyoverse"
                          placeholderTextColor={SAGE.textSecondary}
                          value={loginId}
                          onChangeText={setLoginId}
                          onFocus={() => focusSection('vault')}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder={vault?.has_password ? '•••••••• (Isi ulang jika ingin ubah)' : 'Password Akun Game'}
                          placeholderTextColor={SAGE.textSecondary}
                          secureTextEntry
                          value={loginPass}
                          onChangeText={setLoginPass}
                          onFocus={() => focusSection('vault')}
                        />
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveVault}>
                          <Text style={styles.primaryBtnText}>Simpan Kredensial Terenkripsi</Text>
                        </TouchableOpacity>

                        {vault?.verification_status === 'waiting_code' && (
                          <View style={styles.verifBox}>
                            <Text style={styles.verifAlert}>Worker meminta kode verifikasi login (2FA)!</Text>
                            <View style={styles.customRow}>
                              <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Masukkan kode 6 digit..."
                                placeholderTextColor={SAGE.textSecondary}
                                value={verifCode}
                                onChangeText={setVerifCode}
                                onFocus={() => focusSection('vault')}
                              />
                              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitCode}>
                                <Text style={styles.primaryBtnText}>Kirim Kode</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {isStaff && (
                      <View style={{ gap: 6, marginTop: 4 }}>
                        {vault?.configured ? (
                          <View style={styles.secretBox}>
                            <Text style={styles.secretLine}>Login ID: {vault.login_identifier}</Text>
                            <Text style={styles.secretLine}>Password: {vault.password || '(Terkunci / Selesai)'}</Text>
                            <Text style={styles.secretLine}>
                              Status Verifikasi: {vault.verification_status}
                              {vault.verification_code ? ' → KODE: ' + vault.verification_code : ''}
                            </Text>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={handleRequestCode}>
                              <FontAwesome5 name="key" size={13} color={SAGE.primaryDark} />
                              <Text style={styles.secondaryBtnText}>Minta Kode Verifikasi ke Costumer</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={styles.emptyHint}>Costumer belum mengisi kredensial login di Vault.</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>

              {/* Panel 3: Riwayat Progres */}
              <Animated.View
                onLayout={(e) => { sectionOffsets.current.progress = e.nativeEvent.layout.y; }}
                style={[styles.card, getCardAnimStyle(2)]}
              >
                <TouchableOpacity activeOpacity={0.75} style={styles.cardHeadToggle} onPress={() => toggleSection('progress')}>
                  <View style={styles.cardHead}>
                    <FontAwesome5 name="chart-line" size={15} color={SAGE.primary} />
                    <Text style={styles.cardTitle}>Riwayat Progres ({order.current_percentage}%)</Text>
                  </View>
                  <Animated.View style={[styles.chevronBadge, getChevronStyle('progress')]}>
                    <FontAwesome5 name="chevron-down" size={12} color={SAGE.primaryDark} />
                  </Animated.View>
                </TouchableOpacity>

                {!collapsed.progress && (
                  <View style={{ gap: 6 }}>
                    {progressList.length === 0 ? (
                      <Text style={styles.emptyHint}>Belum ada riwayat update progres pada pesanan ini.</Text>
                    ) : (
                      progressList.map((p) => (
                        <View key={p.id} style={styles.progItem}>
                          {editingProgId === p.id ? (
                            <View style={{ gap: 6 }}>
                              <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={editPct}
                                onChangeText={setEditPct}
                                onFocus={() => focusSection('progress')}
                              />
                              <TextInput
                                style={styles.input}
                                value={editNote}
                                onChangeText={setEditNote}
                                onFocus={() => focusSection('progress')}
                              />
                              <TouchableOpacity style={styles.primaryBtn} onPress={() => handleSaveProgressEdit(p.id)}>
                                <Text style={styles.primaryBtnText}>Simpan Koreksi Progres</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={{ gap: 6 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.progPct}>{p.percentage}% — {p.notes || 'Update progres'}</Text>
                                  <Text style={styles.checkMeta}>{new Date(p.created_at).toLocaleString('id-ID')}</Text>
                                </View>
                                {isStaff && (
                                  <TouchableOpacity
                                    onPress={() => {
                                      setEditingProgId(p.id);
                                      setEditPct(String(p.percentage));
                                      setEditNote(p.notes || '');
                                    }}
                                    style={styles.editIconBtn}
                                  >
                                    <FontAwesome5 name="edit" size={14} color={SAGE.primaryDark} />
                                  </TouchableOpacity>
                                )}
                              </View>
                              {!!p.screenshot_url && (
                                <TouchableOpacity onPress={() => setZoomImage(p.screenshot_url)}>
                                  <Image source={{ uri: p.screenshot_url }} style={styles.progScreenshot} resizeMode="cover" />
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </Animated.View>

              {/* Panel 4: Chat Pesanan */}
              <Animated.View
                onLayout={(e) => { sectionOffsets.current.chat = e.nativeEvent.layout.y; }}
                style={[styles.card, getCardAnimStyle(3)]}
              >
                <TouchableOpacity activeOpacity={0.75} style={styles.cardHeadToggle} onPress={() => toggleSection('chat')}>
                  <View style={styles.cardHead}>
                    <FontAwesome5 name="comments" size={15} color={SAGE.primary} />
                    <Text style={styles.cardTitle}>Diskusi Pesanan ({messages.length})</Text>
                  </View>
                  <Animated.View style={[styles.chevronBadge, getChevronStyle('chat')]}>
                    <FontAwesome5 name="chevron-down" size={12} color={SAGE.primaryDark} />
                  </Animated.View>
                </TouchableOpacity>

                {!collapsed.chat && (
                  <View style={{ gap: 8 }}>
                    {messages.map((m) => (
                      <View key={m.id} style={styles.msgBubble}>
                        <Text style={styles.msgSender}>{m.sender?.full_name || 'Pengguna'}</Text>
                        <Text style={styles.msgBody}>{m.content}</Text>
                      </View>
                    ))}
                    <View style={[styles.customRow, { marginTop: 4 }]}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Tulis pesan untuk order ini..."
                        placeholderTextColor={SAGE.textSecondary}
                        value={chatText}
                        onChangeText={setChatText}
                        onFocus={() => focusSection('chat', true)}
                      />
                      <TouchableOpacity style={styles.addBtn} onPress={handleSendChat}>
                        <FontAwesome5 name="paper-plane" size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            </ScrollView>

            {/* Modal Struk Resmi */}
            <Modal visible={receiptRender} transparent animationType="none" onRequestClose={() => setShowReceiptModal(false)}>
              <Animated.View style={[styles.receiptOverlay, { opacity: receiptAnim }]}>
                <Animated.View
                  style={[
                    styles.receiptPaper,
                    {
                      transform: [
                        {
                          scale: receiptAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                        {
                          translateY: receiptAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [24, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.receiptBrand}>meroo.gi • Struk Resmi</Text>
                    <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                      <FontAwesome5 name="times" size={18} color={SAGE.textPrimary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.receiptNo}>{receiptData?.receipt_number}</Text>
                  <View style={styles.receiptDivider} />
                  <Text style={styles.receiptMono}>{receiptData?.printable_text}</Text>
                  <View style={styles.receiptDivider} />
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleDownloadOrShareReceipt}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FontAwesome5 name="download" size={14} color="#FFF" />
                      <Text style={styles.primaryBtnText}>Simpan / Bagikan Struk</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </Modal>

            {/* Modal Zoom Screenshot */}
            <Modal visible={zoomRender} transparent animationType="none" onRequestClose={() => setZoomImage(null)}>
              <Animated.View style={[styles.zoomOverlay, { opacity: zoomAnim }]}>
                <TouchableOpacity style={styles.zoomTouchArea} activeOpacity={1} onPress={() => setZoomImage(null)}>
                  {activeZoomUri && (
                    <Animated.Image
                      source={{ uri: activeZoomUri }}
                      style={[
                        styles.zoomImg,
                        {
                          transform: [
                            {
                              scale: zoomAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.88, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </Modal>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 38, 33, 0.35)' },
  sheetWrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  headerWrap: {
    backgroundColor: SAGE.bgHeader,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetDragPill: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(26,46,41,0.22)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    backgroundColor: SAGE.bgHeader,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: SAGE.textPrimary },
  headerSub: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.primaryDark, marginTop: 2 },
  closeBtn: { backgroundColor: SAGE.surfaceCard, padding: 10, borderRadius: 20 },
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  actionRow: { flexDirection: 'row', gap: 8 },
  receiptBtn: {
    flex: 1,
    backgroundColor: SAGE.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  receiptBtnText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 12 },
  cancelBtn: {
    backgroundColor: SAGE.dangerSoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelBtnText: { fontFamily: FONTS.bodyBold, color: SAGE.danger, fontSize: 12 },
  card: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE.border,
    gap: 10,
  },
  cardHeadToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chevronBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: SAGE.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONTS.displayBold, fontSize: 15, color: SAGE.textPrimary },
  subLabel: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SAGE.surfaceSoft,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateArrow: { padding: 4 },
  dateText: { fontFamily: FONTS.mono, fontSize: 14, color: SAGE.textPrimary },
  emptyHint: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary, fontStyle: 'italic', paddingVertical: 6 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: SAGE.border,
  },
  delCheckBtn: { backgroundColor: SAGE.dangerSoft, padding: 8, borderRadius: 10 },
  checkLabel: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textPrimary },
  checkDone: { textDecorationLine: 'line-through', color: SAGE.textSecondary },
  checkMeta: { fontFamily: FONTS.body, fontSize: 11, color: SAGE.textSecondary, marginTop: 2 },
  staffBox: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: SAGE.border },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: SAGE.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  presetText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark },
  customRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SAGE.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: SAGE.textPrimary,
  },
  cadenceBtn: { backgroundColor: SAGE.surfaceSoft, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12 },
  cadenceText: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.primaryDark, textTransform: 'uppercase' },
  addBtn: { backgroundColor: SAGE.primary, padding: 11, borderRadius: 12 },
  primaryBtn: { backgroundColor: SAGE.primary, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { fontFamily: FONTS.bodyBold, color: '#FFF', fontSize: 13 },
  secondaryBtn: {
    backgroundColor: SAGE.surfaceSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  secondaryBtnText: { fontFamily: FONTS.bodyBold, color: SAGE.primaryDark, fontSize: 12 },
  verifBox: { backgroundColor: '#FFF7E8', padding: 10, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#F3D299' },
  verifAlert: { fontFamily: FONTS.bodyBold, fontSize: 12, color: '#9B6515' },
  secretBox: { backgroundColor: SAGE.surfaceSoft, padding: 12, borderRadius: 14, gap: 4 },
  secretLine: { fontFamily: FONTS.mono, fontSize: 12, color: SAGE.textPrimary },
  progItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SAGE.border },
  progPct: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textPrimary },
  progScreenshot: { width: '100%', height: 150, borderRadius: 14, marginTop: 4 },
  editIconBtn: { backgroundColor: SAGE.surfaceSoft, padding: 8, borderRadius: 10 },
  msgBubble: { backgroundColor: SAGE.surfaceSoft, padding: 10, borderRadius: 12 },
  msgSender: { fontFamily: FONTS.bodyBold, fontSize: 11, color: SAGE.primaryDark },
  msgBody: { fontFamily: FONTS.body, fontSize: 13, color: SAGE.textPrimary, marginTop: 2 },
  receiptOverlay: { flex: 1, backgroundColor: 'rgba(26,46,41,0.55)', justifyContent: 'center', padding: 20 },
  receiptPaper: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: SAGE.border,
    gap: 10,
  },
  receiptBrand: { fontFamily: FONTS.displayExtra, fontSize: 16, color: SAGE.primaryDark },
  receiptNo: { fontFamily: FONTS.mono, fontSize: 12, color: SAGE.textSecondary },
  receiptDivider: { height: 1, backgroundColor: SAGE.border, marginVertical: 4 },
  receiptMono: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.textPrimary, lineHeight: 17 },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)' },
  zoomTouchArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  zoomImg: { width: '100%', height: '80%' },
});