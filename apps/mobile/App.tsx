import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView, Image,
  Animated, Easing, LayoutAnimation, Platform, UIManager, useWindowDimensions, Keyboard, KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Updates from 'expo-updates';
import { makeRedirectUri } from 'expo-auth-session';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS } from './src/theme/sage';
import { supabase } from './src/lib/supabase';
import { goApi } from './src/lib/goApi';
import { useReducedMotion } from './src/lib/useReducedMotion';
import { HomeScreen } from './src/screens/HomeScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { WorkerScreen } from './src/screens/WorkerScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { OrderDetailModal } from './src/components/OrderDetailModal';
import { SageFeedbackProvider, useSageFeedback } from './src/components/SageFeedback';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

WebBrowser.maybeCompleteAuthSession();

type TabKey = 'home' | 'catalog' | 'orders' | 'admin' | 'worker' | 'profile';

function parseOAuthCallback(url: string) {
  const normalized = url.replace('#', '?');
  const query = normalized.split('?')[1] || '';
  const params = new URLSearchParams(query);
  return {
    code: params.get('code') || undefined,
    access_token: params.get('access_token') || undefined,
    refresh_token: params.get('refresh_token') || undefined,
    error_description: params.get('error_description') || undefined,
  };
}

function normalizeRole(raw: any): 'consumer' | 'worker' | 'admin' {
  return raw === 'admin' || raw === 'worker' || raw === 'consumer' ? raw : 'consumer';
}

function WallpaperLoadingScreen() {
  return (
    <View style={styles.splashContainer}>
      <StatusBar style="dark" />
      <Image source={require('./assets/splash-wallpaper.jpg')} style={styles.splashImage} resizeMode="cover" />
      <View style={styles.splashBadge}>
        <ActivityIndicator size="small" color={SAGE.primaryDark} />
        <Text style={styles.splashText}>Memuat meroo.gi...</Text>
      </View>
    </View>
  );
}

function MainApp() {
  const reducedMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { showToast, showDialog } = useSageFeedback();
  const [session, setSession] = useState<any>(null);
  const [booting, setBooting] = useState(true);
  const [role, setRole] = useState<'consumer' | 'worker' | 'admin'>('consumer');
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const [services, setServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [serviceTiers, setServiceTiers] = useState<any[]>([]);
  const [serviceRatings, setServiceRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const pagerRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const tabBarHideAnim = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const oauthLockRef = useRef(false);
  const lastSyncedUserRef = useRef<string | null>(null);

  const navItems: { key: TabKey; label: string; iconName: string }[] = [
    { key: 'home', label: 'Beranda', iconName: 'home' },
    { key: 'catalog', label: 'Katalog', iconName: 'compass' },
    { key: 'orders', label: 'Pesanan', iconName: 'clipboard-list' },
    ...(role === 'admin'
      ? [
          { key: 'admin' as TabKey, label: 'Admin', iconName: 'chart-pie' },
          { key: 'worker' as TabKey, label: 'Worker', iconName: 'sliders-h' },
        ]
      : role === 'worker'
      ? [{ key: 'worker' as TabKey, label: 'Worker', iconName: 'sliders-h' }]
      : []),
    { key: 'profile', label: 'Akun', iconName: 'user' },
  ];

  function goToTab(nextTab: TabKey) {
    const idx = navItems.findIndex((item) => item.key === nextTab);
    if (idx < 0) return;
    setActiveTab(nextTab);
    pagerRef.current?.scrollTo({ x: idx * screenWidth, animated: !reducedMotion });
  }

  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      Animated.timing(tabBarHideAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    const s2 = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      Animated.spring(tabBarHideAnim, {
        toValue: 0,
        speed: 22,
        bounciness: 5,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [tabBarHideAnim]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setBooting(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        lastSyncedUserRef.current = null;
        setSession(null);
        setAuthLoading(false);
        return;
      }
      if (sess?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        setSession((prev: any) => (prev?.access_token === sess.access_token && prev?.user?.id === sess.user.id ? prev : sess));
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (uid) {
      if (lastSyncedUserRef.current !== uid) {
        lastSyncedUserRef.current = uid;
        syncWorkspace(uid);
      }
    } else {
      setRole('consumer');
      setProfile(null);
      setActiveTab('home');
    }
  }, [session?.user?.id]);

  async function syncWorkspace(forcedUserId?: string) {
    const uid = forcedUserId || session?.user?.id;
    if (!uid) return;

    const [profRes, srvRes, catRes, tierRes, revRes, ordRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('services').select('*').order('base_price', { ascending: true }),
      supabase.from('categories').select('*').order('name', { ascending: true }),
      supabase.from('service_tiers').select('*').order('fixed_price', { ascending: true }),
      supabase.from('reviews').select('service_id, rating'),
      supabase
        .from('orders')
        .select(
          '*, services(name, category, estimated_hours), consumer:profiles!orders_consumer_id_fkey(full_name, phone), worker:profiles!orders_worker_id_fkey(full_name, phone)'
        )
        .order('created_at', { ascending: false }),
    ]);

    if (profRes.data) {
      const nextRole = normalizeRole(profRes.data.role);
      setRole(nextRole);
      setProfile(profRes.data);
      if (nextRole === 'consumer' && (activeTab === 'admin' || activeTab === 'worker')) {
        setActiveTab('home');
      }
    }

    const rawServices = (srvRes.data || []).filter((s: any) => !s.deleted_at);
    setAllServices(rawServices);
    setServices(rawServices.filter((s: any) => s.is_active !== false));

    const rawCats = catRes.data || [];
    setAllCategories(rawCats);
    setCategories(rawCats.filter((c: any) => c.is_active !== false));

    setServiceTiers(tierRes.data || []);

    const ratingAcc: Record<string, { sum: number; count: number }> = {};
    for (const r of revRes.data || []) {
      if (!r.service_id || !r.rating) continue;
      if (!ratingAcc[r.service_id]) ratingAcc[r.service_id] = { sum: 0, count: 0 };
      ratingAcc[r.service_id].sum += Number(r.rating);
      ratingAcc[r.service_id].count += 1;
    }
    const ratingSummary: Record<string, { avg: number; count: number }> = {};
    for (const [sid, v] of Object.entries(ratingAcc)) {
      ratingSummary[sid] = { avg: v.sum / v.count, count: v.count };
    }
    setServiceRatings(ratingSummary);

    let nextOrders = ordRes.data || [];
    if (ordRes.error) {
      const fallbackOrd = await supabase
        .from('orders')
        .select('*, services(name, category, estimated_hours)')
        .order('created_at', { ascending: false });
      nextOrders = fallbackOrd.data || [];
    }
    setOrders(nextOrders);
    setSelectedOrder((prev: any) => {
      if (!prev) return null;
      const updated = nextOrders.find((o: any) => o.id === prev.id);
      return updated || prev;
    });

    goApi
      .getMe()
      .then((me) => {
        if (me?.role) setRole(normalizeRole(me.role));
        if (me?.profile) setProfile(me.profile);
      })
      .catch(() => {});
  }

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      showToast('Masukkan email atau username beserta password.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      let targetEmail = identifier.trim();
      if (!targetEmail.includes('@')) {
        const resolved = await goApi.resolveIdentifier(targetEmail);
        targetEmail = resolved.email;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: targetEmail, password });
      if (error) throw error;
    } catch (e: any) {
      showDialog({ title: 'Gagal Masuk', message: e.message || 'Periksa kembali email/username & password.', type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!identifier.trim()) {
      showToast('Masukkan email atau username akun kamu terlebih dahulu.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      let targetEmail = identifier.trim();
      if (!targetEmail.includes('@')) {
        const resolved = await goApi.resolveIdentifier(targetEmail);
        targetEmail = resolved.email;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail);
      if (error) throw error;
      showDialog({
        title: 'Link Reset Terkirim',
        message: `Link reset password sudah dikirim ke ${targetEmail}. Silakan cek inbox atau folder spam.`,
        type: 'success',
      });
      setAuthMode('login');
    } catch (e: any) {
      showDialog({ title: 'Gagal Reset Password', message: e.message || 'Pastikan email terdaftar.', type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister() {
    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim() || password.length < 6) {
      showToast('Isi Nama, Username, Email & Password min. 6 karakter.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      const cleanUsername = regUsername.trim().replace(/^@/, '').toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password,
        options: {
          data: {
            full_name: regFullName.trim(),
            username: cleanUsername,
            phone: regPhone.trim() || null,
          },
        },
      });
      if (error) throw error;
      if (data.session?.user?.id) {
        await supabase
          .from('profiles')
          .update({
            username: cleanUsername,
            ...(regPhone.trim() ? { phone: regPhone.trim(), contact_info: regPhone.trim() } : {}),
          } as any)
          .eq('id', data.session.user.id);
      }
      if (!data.session) {
        showDialog({
          title: 'Pendaftaran Berhasil',
          message: 'Akun dibuat. Silakan masuk menggunakan Email atau Username kamu.',
          type: 'success',
        });
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAuthMode('login');
        setIdentifier(cleanUsername);
      }
    } catch (e: any) {
      showDialog({ title: 'Gagal Mendaftar', message: e.message || 'Pendaftaran tidak dapat diproses.', type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (oauthLockRef.current || authLoading) return;
    oauthLockRef.current = true;
    setAuthLoading(true);

    try {
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('URL Google OAuth tidak tersedia');

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type === 'success' && res.url) {
        const parsed = parseOAuthCallback(res.url);
        if (parsed.error_description) {
          throw new Error(decodeURIComponent(parsed.error_description));
        }
        if (parsed.code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(parsed.code);
          if (exErr) throw exErr;
        } else if (parsed.access_token && parsed.refresh_token) {
          const { error: sessErr } = await supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          });
          if (sessErr) throw sessErr;
        } else {
          throw new Error(`Redirect URL (${redirectTo}) belum ditambahkan di Supabase Auth.`);
        }
      } else {
        showToast('Login Google dibatalkan.', 'info');
      }
    } catch (e: any) {
      showDialog({
        title: 'Login Google Gagal',
        message: e.message || 'Pastikan Redirect URL sudah terdaftar di Supabase Auth.',
        type: 'error',
      });
    } finally {
      oauthLockRef.current = false;
      setAuthLoading(false);
    }
  }

  if (booting) {
    return <WallpaperLoadingScreen />;
  }

  if (!session?.user) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.loginWrap}>
          <StatusBar style="dark" />
          <View style={styles.loginCard}>
            <Text style={styles.brand}>meroo.gi</Text>
            <Text style={styles.loginSub}>Studio Joki & Rawat Akun Genshin Impact</Text>

            <View style={styles.authSwitch}>
              <TouchableOpacity
                style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setAuthMode('login');
                }}
              >
                <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>Masuk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authTab, authMode === 'register' && styles.authTabActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setAuthMode('register');
                }}
              >
                <Text style={[styles.authTabText, authMode === 'register' && styles.authTabTextActive]}>Daftar Akun</Text>
              </TouchableOpacity>
            </View>

            {authMode === 'login' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email atau Username"
                  placeholderTextColor={SAGE.textSecondary}
                  autoCapitalize="none"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={SAGE.textSecondary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={{ alignSelf: 'flex-end' }}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setAuthMode('forgot');
                  }}
                >
                  <Text style={styles.forgotLink}>Lupa Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={authLoading}>
                  <Text style={styles.loginBtnText}>{authLoading ? 'Memproses...' : 'Masuk'}</Text>
                </TouchableOpacity>
              </>
            ) : authMode === 'forgot' ? (
              <>
                <Text style={styles.forgotHint}>
                  Masukkan email atau username terdaftar untuk menerima link reset password.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email atau Username"
                  placeholderTextColor={SAGE.textSecondary}
                  autoCapitalize="none"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
                <TouchableOpacity style={styles.loginBtn} onPress={handleForgotPassword} disabled={authLoading}>
                  <Text style={styles.loginBtnText}>{authLoading ? 'Mengirim...' : 'Kirim Link Reset Password'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 4 }}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setAuthMode('login');
                  }}
                >
                  <Text style={styles.forgotLink}>← Kembali ke Masuk</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nama Lengkap"
                  placeholderTextColor={SAGE.textSecondary}
                  value={regFullName}
                  onChangeText={setRegFullName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username (contoh: ayla_gi)"
                  placeholderTextColor={SAGE.textSecondary}
                  autoCapitalize="none"
                  value={regUsername}
                  onChangeText={setRegUsername}
                />
                <TextInput
                  style={styles.input}
                  placeholder="No. WhatsApp (contoh: 0812xxx)"
                  placeholderTextColor={SAGE.textSecondary}
                  keyboardType="phone-pad"
                  value={regPhone}
                  onChangeText={setRegPhone}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Alamat Email"
                  placeholderTextColor={SAGE.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={regEmail}
                  onChangeText={setRegEmail}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min. 6 karakter)"
                  placeholderTextColor={SAGE.textSecondary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.loginBtn} onPress={handleRegister} disabled={authLoading}>
                  <Text style={styles.loginBtnText}>{authLoading ? 'Mendaftarkan...' : 'Buat Akun Costumer'}</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={authLoading}>
              <FontAwesome5 name="google" size={15} color={SAGE.primaryDark} />
              <Text style={styles.googleBtnText}>
                {authLoading ? 'Menghubungkan Google...' : 'Lanjutkan dengan Google'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const myOrders =
    role === 'admin'
      ? orders
      : orders.filter((o) => o.consumer_id === session.user.id || o.worker_id === session.user.id);
  const workerOrders =
    role === 'admin' ? orders : orders.filter((o) => o.worker_id === session.user.id);

  const tabBarOuterWidth = Math.max(0, screenWidth - 32);
  const singlePillWidth = Math.max(0, tabBarOuterWidth - 12) / navItems.length;
  const pillTranslateX = scrollX.interpolate({
    inputRange: navItems.map((_, idx) => idx * screenWidth),
    outputRange: navItems.map((_, idx) => idx * singlePillWidth),
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: SAGE.bgCanvas }}>
      <StatusBar style="dark" />

      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        // Horizontal gestures belong to the screen's filters; navigation uses the bottom tabs.
        scrollEnabled={false}
        nestedScrollEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, screenWidth));
          const next = navItems[idx]?.key;
          if (next && next !== activeTab) {
            setActiveTab(next);
          }
        }}
        style={{ flex: 1 }}
      >
        {navItems.map((item) => (
          <View key={item.key} style={{ width: screenWidth, flex: 1 }}>
            {item.key === 'home' && (
              <HomeScreen
                profile={profile}
                role={role}
                orders={myOrders}
                onRefresh={() => syncWorkspace()}
                onSelectOrder={setSelectedOrder}
                onGoCatalog={() => goToTab('catalog')}
                onGoProfile={() => goToTab('profile')}
              />
            )}
            {item.key === 'catalog' && (
              <CatalogScreen
                userId={session.user.id}
                role={role}
                services={services}
                categories={categories}
                serviceTiers={serviceTiers.filter((t) => t.is_active !== false)}
                serviceRatings={serviceRatings}
                onOrderCreated={() => {
                  syncWorkspace();
                  goToTab('orders');
                }}
              />
            )}
            {item.key === 'orders' && (
              <OrdersScreen orders={myOrders} onSelectOrder={setSelectedOrder} onGoCatalog={() => goToTab('catalog')} />
            )}
            {item.key === 'admin' && role === 'admin' && (
              <AdminScreen
                allOrders={orders}
                services={allServices}
                categories={allCategories}
                serviceTiers={serviceTiers}
                onRefresh={() => syncWorkspace()}
                onSelectOrder={setSelectedOrder}
              />
            )}
            {item.key === 'worker' && (role === 'worker' || role === 'admin') && (
              <WorkerScreen
                userId={session.user.id}
                profile={profile}
                assignedOrders={workerOrders}
                onSelectOrder={setSelectedOrder}
                onRefresh={() => syncWorkspace()}
                onProfileUpdated={(patch) => setProfile((prev: any) => ({ ...(prev || {}), ...patch }))}
                onOptimisticOrderUpdate={(oid, patch) =>
                  setOrders((prev) => prev.map((o) => (o.id === oid ? { ...o, ...patch } : o)))
                }
              />
            )}
            {item.key === 'profile' && (
              <ProfileScreen
                profile={profile}
                role={role}
                onGoWorker={() => goToTab('worker')}
                onGoAdmin={() => goToTab('admin')}
                onProfileUpdated={(patch) => setProfile((prev: any) => ({ ...(prev || {}), ...patch }))}
              />
            )}
          </View>
        ))}
      </Animated.ScrollView>

      <Animated.View
        pointerEvents={keyboardVisible ? 'none' : 'auto'}
        style={[
          styles.tabBar,
          {
            bottom: Math.max(12, insets.bottom + 6),
            opacity: tabBarHideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateY: tabBarHideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 110] }) }],
          },
        ]}
      >
        {singlePillWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeTabPill,
              {
                width: singlePillWidth,
                transform: [{ translateX: pillTranslateX }],
              },
            ]}
          />
        )}

        {navItems.map(({ key, label, iconName }, idx) => {
          const active = activeTab === key;
          const iconScale = scrollX.interpolate({
            inputRange: [(idx - 1) * screenWidth, idx * screenWidth, (idx + 1) * screenWidth],
            outputRange: [0.92, 1.14, 0.92],
            extrapolate: 'clamp',
          });
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              style={styles.tabItem}
              onPress={() => goToTab(key)}
            >
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <FontAwesome5 name={iconName} size={14} color={active ? '#FFF' : SAGE.textSecondary} />
              </Animated.View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      <OrderDetailModal
        visible={!!selectedOrder}
        order={selectedOrder}
        userId={session.user.id}
        role={role}
        onClose={() => setSelectedOrder(null)}
        onRefresh={() => syncWorkspace()}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return <WallpaperLoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <SageFeedbackProvider>
        <MainApp />
      </SageFeedbackProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#F6F3FA', alignItems: 'center', justifyContent: 'flex-end' },
  splashImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  splashBadge: {
    marginBottom: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: SAGE.border,
  },
  splashText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textPrimary },
  loginWrap: { flexGrow: 1, backgroundColor: SAGE.bgCanvas, justifyContent: 'center', padding: 20 },
  loginCard: { backgroundColor: SAGE.surfaceCard, borderRadius: 28, padding: 24, borderWidth: 1.5, borderColor: SAGE.border, gap: 11 },
  brand: { fontFamily: FONTS.displayExtra, fontSize: 30, color: SAGE.textPrimary },
  loginSub: { fontFamily: FONTS.body, fontSize: 13, color: SAGE.textSecondary, marginBottom: 4 },
  authSwitch: { flexDirection: 'row', backgroundColor: SAGE.surfaceSoft, borderRadius: 16, padding: 4 },
  authTab: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },
  authTabActive: { backgroundColor: SAGE.primary },
  authTabText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textSecondary },
  authTabTextActive: { color: '#FFF' },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SAGE.border,
    borderRadius: 14,
    padding: 12,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: SAGE.textPrimary,
  },
  loginBtn: { backgroundColor: SAGE.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 2 },
  loginBtnText: { fontFamily: FONTS.displayBold, color: '#FFF', fontSize: 15 },
  forgotLink: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.primaryDark },
  forgotHint: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary, lineHeight: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: SAGE.border },
  dividerText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: SAGE.textSecondary },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: SAGE.border,
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleBtnText: { fontFamily: FONTS.displayBold, fontSize: 14, color: SAGE.textPrimary },
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: SAGE.border,
    shadowColor: SAGE.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  activeTabPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 20,
    backgroundColor: SAGE.primary,
  },
  tabItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 9, minHeight: 48, borderRadius: 20, gap: 3 },
  tabLabel: { fontFamily: FONTS.bodyBold, fontSize: 10, color: SAGE.textSecondary, maxWidth: '100%', textAlign: 'center' },
  tabLabelActive: { color: '#FFF' },
});
