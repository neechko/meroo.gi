export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEstimatedHours(hours: number | null | undefined): string {
  if (!hours || hours <= 0) return 'Fleksibel';
  if (hours < 24) return `${hours} Jam`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} Hari ${remHours} Jam` : `${days} Hari`;
}