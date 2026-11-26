export interface ChecklistPreset {
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  task_key: string;
  task_label: string;
  default_detail: string;
}

export const GENSHIN_CHECKLIST_PRESETS: ChecklistPreset[] = [
  { cadence: 'daily', task_key: 'resin_200', task_label: 'Resin 200/200', default_detail: 'Habiskan Original Resin / Condensed' },
  { cadence: 'daily', task_key: 'commission', task_label: 'Daily Commission (4/4)', default_detail: 'Klaim hadiah Katheryne' },
  { cadence: 'daily', task_key: 'anecdote', task_label: 'Anekdot & Ekspedisi', default_detail: 'Klaim & kirim ulang ekspedisi' },
  { cadence: 'daily', task_key: 'build_char', task_label: 'Build Karakter / Artefak / Talent', default_detail: 'Sesuai catatan target karakter' },
  { cadence: 'weekly', task_key: 'weekly_boss', task_label: 'Weekly Boss & Trounce Domain', default_detail: '3x diskon resin mingguan' },
  { cadence: 'monthly', task_key: 'spiral_abyss', task_label: 'Spiral Abyss / Imaginarium Theater', default_detail: 'Full star sesuai target paket' },
];
