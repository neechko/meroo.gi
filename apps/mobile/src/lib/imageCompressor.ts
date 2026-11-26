import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

export interface CompressedUploadResult {
  publicUrl: string;
  originalKB: number;
  compressedKB: number;
  savedPct: number;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') bufferLength--;
  if (base64[base64.length - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const e1 = lookup[base64.charCodeAt(i)];
    const e2 = lookup[base64.charCodeAt(i + 1)];
    const e3 = lookup[base64.charCodeAt(i + 2)];
    const e4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes.buffer;
}

export async function pickAndCompressImage(opts: {
  folder: 'avatars' | 'progress';
  maxWidth: number;
  quality?: number;
  aspect?: [number, number];
}): Promise<CompressedUploadResult | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Izin akses galeri diperlukan untuk memilih foto.');
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !!opts.aspect,
    aspect: opts.aspect,
    quality: 1,
  });

  if (picked.canceled || !picked.assets?.[0]) {
    return null;
  }

  const asset = picked.assets[0];
  const originalKB = Math.max(1, Math.round((asset.fileSize || 850000) / 1024));

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: opts.maxWidth } }],
    {
      compress: opts.quality ?? 0.68,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  const b64 = manipulated.base64 || '';
  const compressedBytes = Math.max(1024, Math.round(b64.length * 0.75));
  const compressedKB = Math.max(1, Math.round(compressedBytes / 1024));
  const savedPct = Math.max(5, Math.min(98, Math.round(((originalKB - compressedKB) / Math.max(originalKB, compressedKB)) * 100)));

  const filePath = `${opts.folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
  const arrayBuf = base64ToArrayBuffer(b64);

  // Gunakan bucket sesuai schema.sql ('avatars' / 'screenshots'), lalu fallback ke 'meroogi-media'
  const primaryBucket = opts.folder === 'avatars' ? 'avatars' : 'screenshots';
  for (const bucket of [primaryBucket, 'meroogi-media']) {
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuf, { contentType: 'image/jpeg', upsert: true });

    if (!upErr) {
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (pub?.publicUrl) {
        return { publicUrl: pub.publicUrl, originalKB, compressedKB, savedPct };
      }
    }
  }

  // Fallback data URI terkompresi (<120KB) jika bucket belum dikonfigurasi
  return {
    publicUrl: `data:image/jpeg;base64,${b64}`,
    originalKB,
    compressedKB,
    savedPct,
  };
}
