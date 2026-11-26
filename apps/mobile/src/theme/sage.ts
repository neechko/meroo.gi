export const SAGE = {
  bgTop: '#E7F3EE',
  bgCanvas: '#DCEAE4',
  bgLagoon: '#B8DDD0',
  bgLagoonDeep: '#97C6B7',
  bgHeader: '#9BC4B8',
  surfaceCard: '#FAFDFB',
  surfaceGlass: 'rgba(250, 253, 251, 0.88)',
  surfaceSoft: '#E6F2ED',
  surfaceMint: '#D4EAE1',
  primary: '#4A8B7C',
  primaryDark: '#2C5E53',
  primaryLight: '#76B2A4',
  accentPeach: '#EE9B7A',
  accentWarm: '#E5A95C',
  accentSky: '#7FB7BE',
  textPrimary: '#1A2E29',
  textSecondary: '#5D7871',
  border: '#CBE0D7',
  danger: '#C9544D',
  dangerSoft: '#FBECEB',
  success: '#3A8865',
  successSoft: '#E2F3EB',
} as const;

export const FONTS = {
  displaySemi: 'Outfit_600SemiBold',
  displayBold: 'Outfit_700Bold',
  displayExtra: 'Outfit_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  mono: 'JetBrainsMono_600SemiBold',
} as const;

export const CHECKLIST_PRESETS = [
  { cadence: 'daily', task_key: 'resin_200', task_label: 'Resin 200/200', default_detail: 'Habiskan Original / Condensed Resin' },
  { cadence: 'daily', task_key: 'commission', task_label: 'Daily Commission (4/4)', default_detail: 'Klaim hadiah harian Katheryne' },
  { cadence: 'daily', task_key: 'anecdote', task_label: 'Anekdot & Ekspedisi', default_detail: 'Klaim & kirim ulang ekspedisi' },
  { cadence: 'daily', task_key: 'build_char', task_label: 'Build Karakter / Artefak / Talent', default_detail: 'Farming sesuai target build' },
  { cadence: 'weekly', task_key: 'weekly_boss', task_label: 'Weekly Boss & Trounce Domain', default_detail: '3x diskon resin mingguan' },
  { cadence: 'monthly', task_key: 'spiral_abyss', task_label: 'Spiral Abyss / Imaginarium Theater', default_detail: 'Full star sesuai target paket' },
] as const;

export function formatIDR(amount: number): string {
  return 'Rp ' + Math.round(amount || 0).toLocaleString('id-ID');
}

export function roleLabel(role?: string): string {
  if (role === 'admin') return 'Admin';
  if (role === 'worker') return 'Worker';
  return 'Costumer';
}
