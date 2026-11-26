import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS, roleLabel } from '../theme/sage';
import { supabase } from '../lib/supabase';
import { goApi } from '../lib/goApi';
import { pickAndCompressImage } from '../lib/imageCompressor';
import { useSageFeedback } from '../components/SageFeedback';

interface Props {
  profile: any;
  role: 'consumer' | 'worker' | 'admin';
  onGoWorker: () => void;
  onGoAdmin: () => void;
  onProfileUpdated: (patch: any) => void;
}

export function ProfileScreen({ profile, role, onGoWorker, onGoAdmin, onProfileUpdated }: Props) {
  const { showToast } = useSageFeedback();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [contactInfo, setContactInfo] = useState(profile?.contact_info || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setUsername(profile?.username || '');
    setContactInfo(profile?.contact_info || '');
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.id, profile?.full_name, profile?.username, profile?.avatar_url, profile?.contact_info]);

  async function handlePickAvatar() {
    setUploadingAvatar(true);
    try {
      const res = await pickAndCompressImage({
        folder: 'avatars',
        maxWidth: 420,
        quality: 0.72,
        aspect: [1, 1],
      });
      if (!res) return;

      setAvatarUrl(res.publicUrl);
      setCompressionInfo(`Dikompres otomatis: ${res.originalKB} KB → ${res.compressedKB} KB (hemat ${res.savedPct}%)`);

      // Optimistic update ke state global + simpan ke backend
      onProfileUpdated({ avatar_url: res.publicUrl });
      await goApi.updateMyProfile({ avatar_url: res.publicUrl }).catch(async () => {
        if (profile?.id) {
          await supabase.from('profiles').update({ avatar_url: res.publicUrl } as any).eq('id', profile.id);
        }
      });
      showToast('Foto profil diperbarui & dikompres hemat ruang!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal mengunggah foto profil', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    if (!fullName.trim()) {
      showToast('Nama lengkap tidak boleh kosong.', 'error');
      return;
    }
    setSaving(true);
    const patch = {
      full_name: fullName.trim(),
      username: username.trim().replace(/^@/, '').toLowerCase(),
      contact_info: contactInfo.trim(),
      avatar_url: avatarUrl,
    };
    // Optimistic UI: langsung tampilkan perubahan tanpa menunggu network
    onProfileUpdated(patch);

    try {
      await goApi.updateMyProfile(patch).catch(async () => {
        if (profile?.id) {
          await supabase.from('profiles').update(patch as any).eq('id', profile.id);
        }
      });
      showToast('Profil berhasil disimpan!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  }

  const initials = (fullName || profile?.email || 'M').slice(0, 1).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil & Akun Saya</Text>
        <Text style={styles.sub}>Kelola foto profil, username login, & kontak</Text>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.card}>
          {/* Avatar + Tombol Upload Kompresi */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <FontAwesome5 name="camera" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.roleBadge}>ROLE: {roleLabel(role).toUpperCase()}</Text>
              <Text style={styles.email}>{profile?.email}</Text>
              <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
                <Text style={styles.changePhotoLink}>
                  {uploadingAvatar ? 'Mengompres & mengunggah...' : 'Ganti Foto Profil (Auto-Compress)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {compressionInfo && (
            <View style={styles.compressBanner}>
              <FontAwesome5 name="compress-arrows-alt" size={12} color={SAGE.primaryDark} />
              <Text style={styles.compressText}>{compressionInfo}</Text>
            </View>
          )}

          <Text style={styles.label}>Nama Tampilan</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nama lengkap kamu"
            placeholderTextColor={SAGE.textSecondary}
          />

          <Text style={styles.label}>Username (untuk login cepat selain email)</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="username_kamu"
            placeholderTextColor={SAGE.textSecondary}
          />

          <Text style={styles.label}>Kontak WhatsApp / Discord (Opsional)</Text>
          <TextInput
            style={styles.input}
            value={contactInfo}
            onChangeText={setContactInfo}
            placeholder="Contoh: WA 0812xxx / Discord @user"
            placeholderTextColor={SAGE.textSecondary}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            <FontAwesome5 name="check" size={14} color="#FFF" />
            <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Profil'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {(role === 'worker' || role === 'admin') && (
            <TouchableOpacity style={styles.shortcutBtn} onPress={onGoWorker}>
              <FontAwesome5 name="wrench" size={15} color={SAGE.primaryDark} />
              <Text style={styles.shortcutText}>Buka Worker Workspace</Text>
            </TouchableOpacity>
          )}

          {role === 'admin' && (
            <TouchableOpacity style={styles.shortcutBtn} onPress={onGoAdmin}>
              <FontAwesome5 name="shield-alt" size={15} color={SAGE.primaryDark} />
              <Text style={styles.shortcutText}>Buka Admin Studio & Keuangan</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}>
            <FontAwesome5 name="sign-out-alt" size={15} color={SAGE.danger} />
            <Text style={styles.logoutText}>Keluar Akun</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAGE.bgCanvas },
  header: { backgroundColor: SAGE.bgHeader, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 18 },
  title: { fontFamily: FONTS.displayExtra, fontSize: 22, color: SAGE.textPrimary },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.primaryDark, marginTop: 2 },
  body: { padding: 16, gap: 14, paddingBottom: 124 },
  card: { backgroundColor: SAGE.surfaceCard, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: SAGE.border, gap: 10 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: SAGE.primary },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: SAGE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: FONTS.displayExtra, fontSize: 28, color: '#FFF' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: SAGE.primaryDark,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SAGE.surfaceSoft,
    color: SAGE.primaryDark,
    fontFamily: FONTS.mono,
    fontSize: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  email: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: SAGE.textPrimary },
  changePhotoLink: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.primaryDark },
  compressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SAGE.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  compressText: { fontFamily: FONTS.mono, fontSize: 11, color: SAGE.primaryDark, flex: 1 },
  label: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.textSecondary, marginTop: 2 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SAGE.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: SAGE.textPrimary,
  },
  saveBtn: {
    backgroundColor: SAGE.primary,
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: { fontFamily: FONTS.displayBold, fontSize: 14, color: '#FFF' },
  shortcutBtn: {
    backgroundColor: SAGE.surfaceSoft,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shortcutText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: SAGE.primaryDark },
  logoutBtn: {
    backgroundColor: SAGE.dangerSoft,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: SAGE.danger },
});
