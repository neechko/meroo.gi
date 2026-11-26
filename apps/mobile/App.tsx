import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView,
  Animated, Easing, LayoutAnimation, Platform, UIManager, useWindowDimensions, Keyboard, KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useFonts } from 'expo-font';
import { Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS } from './src/theme/sage';
import { supabase } from './src/lib/supabase';
import { goApi } from './src/lib/goApi';
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

type TabKey = 'home' | 'catalog' | 'orders' | 'studio' | 'profile';

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

function MainApp() {
  const { width: screenWidth } = useWindowDimensions();
  const { showToast, showDialog } = useSageFeedback();
  const [session, setSession] = useState<any>(null);
  const [booting, setBooting] = useState(true);
  const [role, setRole] = useState<'consumer' | 'worker' | 'admin'>('consumer');
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [studioMode, setStudioMode] = useState<'worker' | 'admin'>('admin');

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Horizontal Swipe Pager & 1:1 Tab Bar Pill Sync
  const pagerRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const studioSlideX = useRef(new Animated.Value(0)).current;
  const studioOpacity = useRef(new Animated.Value(1)).current;
  const tabBarHideAnim = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  const oauthLockRef = useRef(false);
  const lastSyncedUserRef = useRef<string | null>(null);

  const isStaff = role === 'worker' || role === 'admin';
  const navItems: { key: TabKey; label: string; iconName: string }[] = [
    { key: 'home', label: 'Beranda', iconName: 'home' },
    { key: 'catalog', label: 'Katalog', iconName: 'compass' },
    { key: 'orders', label: 'Pesanan', iconName: 'clipboard-list' },
    ...(isStaff ? [{ key: 'studio' as TabKey, label: role === 'admin' ? 'Studio' : 'Worker', iconName: 'sliders-h' }] : []),
    { key: 'profile', label: 'Akun', iconName: 'user' },
  ];

  function goToTab(nextTab: TabKey) {
    const idx = navItems.findIndex((item) => item.key === nextTab);
    if (idx < 0) return;
    setActiveTab(nextTab);
    pagerRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
  }

  function switchStudioMode(nextMode: 'worker' | 'admin') {
    if (nextMode === studioMode) return;
    const direction = nextMode === 'worker' ? 1 : -1;
    studioSlideX.setValue(direction * 34);
    studioOpacity.setValue(0.25);

    Animated.parallel([
      Animated.spring(studioSlideX, {
        toValue: 0,
        speed: 24,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.timing(studioOpacity, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setStudioMode(nextMode);
  }

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

    const [profRes, srvRes, catRes, ordRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('services').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('is_active', true),
      supabase.from('orders').select('*, services(name)').order('created_at', { ascending: false }),
    ]);

    if (profRes.data) {
      const nextRole = normalizeRole(profRes.data.role);
      setRole(nextRole);
      setProfile(profRes.data);
      if (nextRole === 'worker') setStudioMode('worker');
      if (nextRole === 'consumer' && activeTab === 'studio') {
        setActiveTab('home');
      }
    }

    setServices(srvRes.data || []);
    setCategories(catRes.data || []);
    setOrders(ordRes.data || []);

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
          data: { full_name: regFullName.trim(), username: cleanUsername },
        },
      });
      if (error) throw error;
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
          throw new Error(`Redirect URL (${redirectTo}) belum ditambahkan di Supabase Auth â†’ URL Configuration.`);
        }
      } else {
        showToast('Login Google dibatalkan.', 'info');
      }
    } catch (e: any) {
      showDialog({
        title: 'Login Google Gagal',
        message: e.message || 'Pastikan Redirect URL exp://** sudah terdaftar di Supabase Auth.',
        type: 'error',
      });
    } finally {
      oauthLockRef.current = false;
      setAuthLoading(false);
    }
  }

  if (booting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={SAGE.primary} />
      </View>
    );
  }

  if (!session?.user) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.loginWrap}>
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
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={authLoading}>
                <Text style={styles.loginBtnText}>{authLoading ? 'Memproses...' : 'Masuk'}</Text>
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
      </ScrollView></KeyboardAvoidingView>
    );
  }

  const myOrders =
    role === 'admin'
      ? orders
      : orders.filter((o) => o.consumer_id === session.user.id || o.worker_id === session.user.id);
  const workerOrders =
    role === 'admin' ? orders : orders.filter((o) => o.worker_id === session.user.id);

  // Hitung lebar tiap tab dan posisi kapsul hijau 1:1 mengikuti scrollX jari
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

      {/* Swipeable Horizontal Pager: Geser jari ke kiri/kanan untuk pindah halaman */}
      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
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
                services={services}
                categories={categories}
                onOrderCreated={() => syncWorkspace()}
              />
            )}
            {item.key === 'orders' && (
              <OrdersScreen orders={myOrders} onSelectOrder={setSelectedOrder} />
            )}
            {item.key === 'studio' && isStaff && (
              <View style={{ flex: 1 }}>
                {role === 'admin' && (
                  <View style={styles.modeSwitcher}>
                    <TouchableOpacity
                      style={[styles.modePill, studioMode === 'admin' && styles.modePillActive]}
                      onPress={() => switchStudioMode('admin')}
                    >
                      <Text style={[styles.modeText, studioMode === 'admin' && styles.modeTextActive]}>Admin & Keuangan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modePill, studioMode === 'worker' && styles.modePillActive]}
                      onPress={() => switchStudioMode('worker')}
                    >
                      <Text style={[styles.modeText, studioMode === 'worker' && styles.modeTextActive]}>Worker Workspace</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Animated.View
                  style={{
                    flex: 1,
                    opacity: studioOpacity,
                    transform: [{ translateX: studioSlideX }],
                  }}
                >
                  {studioMode === 'admin' && role === 'admin' ? (
                    <AdminScreen
                      allOrders={orders}
                      services={services}
                      onRefresh={() => syncWorkspace()}
                      onSelectOrder={setSelectedOrder}
                    />
                  ) : (
                    <WorkerScreen
                      userId={session.user.id}
                      assignedOrders={workerOrders}
                      onSelectOrder={setSelectedOrder}
                      onRefresh={() => syncWorkspace()}
                      onOptimisticOrderUpdate={(oid, patch) =>
                        setOrders((prev) => prev.map((o) => (o.id === oid ? { ...o, ...patch } : o)))
                      }
                    />
                  )}
                </Animated.View>
              </View>
            )}
            {item.key === 'profile' && (
              <ProfileScreen
                profile={profile}
                role={role}
                onGoWorker={() => {
                  setStudioMode('worker');
                  goToTab('studio');
                }}
                onGoAdmin={() => {
                  setStudioMode('admin');
                  goToTab('studio');
                }}
                onProfileUpdated={(patch) => setProfile((prev: any) => ({ ...(prev || {}), ...patch }))}
              />
            )}
          </View>
        ))}
      </Animated.ScrollView>

      {/* Bottom Tab Bar dengan Kapsul Hijau Meluncur 1:1 Mengikuti Geseran Jari */}
      <Animated.View pointerEvents={keyboardVisible ? 'none' : 'auto'} style={[styles.tabBar, { opacity: tabBarHideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateY: tabBarHideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 110] }) }] }]}>
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
              style={styles.tabItem}
              onPress={() => goToTab(key)}
            >
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <FontAwesome5 name={iconName} size={15} color={active ? '#FFF' : SAGE.textSecondary} />
              </Animated.View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
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
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={SAGE.primary} />
      </View>
    );
  }

  return (
    <SageFeedbackProvider>
      <MainApp />
    </SageFeedbackProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: SAGE.bgCanvas, alignItems: 'center', justifyContent: 'center' },
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
  modeSwitcher: {
    backgroundColor: SAGE.bgHeader,
    paddingTop: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 8,
  },
  modePill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.65)', paddingVertical: 8, borderRadius: 14, alignItems: 'center' },
  modePillActive: { backgroundColor: SAGE.primaryDark },
  modeText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.textPrimary },
  modeTextActive: { color: '#FFF' },
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
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 20, gap: 3 },
  tabLabel: { fontFamily: FONTS.bodyBold, fontSize: 10, color: SAGE.textSecondary },
  tabLabelActive: { color: '#FFF' },
});