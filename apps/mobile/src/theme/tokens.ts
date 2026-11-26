export const COLORS = {
  // Base Deep Obsidian Canvas
  abyssCanvas: '#05070B',
  obsidianSurface: '#0A0E15',
  deepSheet: '#080C12',

  // True Translucent Glass Layers (Membiaskan cahaya latar secara nyata)
  glassFill: 'rgba(255, 255, 255, 0.055)',
  glassFillElevated: 'rgba(255, 255, 255, 0.095)',
  glassActiveTint: 'rgba(45, 212, 191, 0.18)',

  // Specular Hairline Borders (Tanpa shadow murahan)
  borderTopSpecular: 'rgba(255, 255, 255, 0.34)',
  borderGlass: 'rgba(255, 255, 255, 0.13)',
  borderActive: 'rgba(45, 212, 191, 0.65)',

  // Typography Scale
  iceHighlight: '#F8FAFC',
  frostGlow: '#E2E8F0',
  moonMist: '#5EEAD4',
  fogVeil: '#8B9BB0',
  pureWhite: '#FFFFFF',

  // Brand Chromatic Accents
  anemoEmerald: '#14B8A6',
  anemoBright: '#2DD4BF',
  primogemGold: '#FBBF24',
  electroViolet: '#818CF8',
  hydroCyan: '#38BDF8',
  abyssInk: '#03201E',
} as const;

export type ElementMotif = 'abyss' | 'anemo' | 'celestial' | 'hydro';

export interface ElementTheme {
  motif: ElementMotif;
  label: string;
  accent: string;
  secondary: string;
  tintBg: string;
  borderTint: string;
}

export function getServiceElementTheme(name: string, category?: string): ElementTheme {
  const key = `${name} ${category ?? ''}`.toLowerCase();

  if (key.includes('abyss') || key.includes('theater') || key.includes('imaginarium')) {
    return {
      motif: 'abyss',
      label: 'ABYSSAL TIER',
      accent: '#A78BFA',
      secondary: '#F472B6',
      tintBg: 'rgba(139, 92, 246, 0.14)',
      borderTint: 'rgba(167, 139, 250, 0.35)',
    };
  }

  if (key.includes('quest') || key.includes('archon') || key.includes('story')) {
    return {
      motif: 'celestial',
      label: 'CELESTIAL ARCHON',
      accent: '#FBBF24',
      secondary: '#FB923C',
      tintBg: 'rgba(251, 191, 36, 0.13)',
      borderTint: 'rgba(251, 191, 36, 0.35)',
    };
  }

  if (key.includes('eksplor') || key.includes('oculus') || key.includes('map') || key.includes('natlan') || key.includes('fontaine')) {
    return {
      motif: 'anemo',
      label: 'WORLD EXPLORATION',
      accent: '#2DD4BF',
      secondary: '#34D399',
      tintBg: 'rgba(45, 212, 191, 0.14)',
      borderTint: 'rgba(45, 212, 191, 0.35)',
    };
  }

  return {
    motif: 'hydro',
    label: 'COMBAT & FARMING',
    accent: '#38BDF8',
    secondary: '#2DD4BF',
    tintBg: 'rgba(56, 189, 248, 0.14)',
    borderTint: 'rgba(56, 189, 248, 0.35)',
  };
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#FBBF24',
  paid: '#38BDF8',
  in_progress: '#2DD4BF',
  completed: '#34D399',
  cancelled: '#FB7185',
};

export const FONTS = {
  display: 'Outfit_600SemiBold',
  displayBold: 'Outfit_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const RADIUS = {
  badge: 7,
  input: 12,
  card: 20,
  modal: 28,
  pill: 999,
  circle: 9999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;