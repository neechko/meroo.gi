export const BRAND = {
  name: 'meroo.gi',
  tagline: 'Genshin Impact Boosting & Account Care',
  domain: 'meroo.gi',
} as const;

export const GENSHIN_SERVERS = [
  { id: 'Asia', label: 'Asia (UID 8...)' },
  { id: 'America', label: 'America (UID 6...)' },
  { id: 'Europe', label: 'Europe (UID 7...)' },
  { id: 'TW, HK, MO', label: 'TW, HK, MO (UID 9...)' },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu Pembayaran',
  paid: 'Dibayar (Menunggu Worker)',
  in_progress: 'Sedang Dikerjakan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};