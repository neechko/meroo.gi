import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polygon, Path, Line } from 'react-native-svg';
import { ArrowUpRight, Clock } from 'lucide-react-native';
import { formatIDR, formatEstimatedHours } from '@meroogi/shared';
import {
  COLORS,
  FONTS,
  RADIUS,
  SPACING,
  getServiceElementTheme,
  ElementTheme,
} from '../theme/tokens';
import { CrystalGlass } from './CrystalGlass';
import { ServiceTierItem } from './OrderBottomSheetModal';

export interface ServiceCardItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category_name?: string;
  starting_price: number;
  estimated_hours?: number | null;
  tiers?: ServiceTierItem[];
}

interface ServiceCatalogCardProps {
  item: ServiceCardItem;
  onPress: (item: ServiceCardItem) => void;
}

function ElementalHeaderArt({
  theme,
  estimatedHours,
}: {
  theme: ElementTheme;
  estimatedHours?: number | null;
}) {
  return (
    <LinearGradient
      colors={[theme.tintBg, 'rgba(5, 7, 11, 0.25)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.artStrip}
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 92" style={StyleSheet.absoluteFill}>
        {theme.motif === 'abyss' && (
          <>
            <Circle cx="305" cy="46" r="44" stroke={theme.accent} strokeOpacity="0.32" strokeWidth="1.2" fill="none" />
            <Circle cx="305" cy="46" r="28" stroke={theme.secondary} strokeOpacity="0.38" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            <Polygon points="305,10 336,46 305,82 274,46" stroke={theme.accent} strokeOpacity="0.28" strokeWidth="1" fill="none" />
          </>
        )}
        {theme.motif === 'anemo' && (
          <>
            <Path d="M 180 78 Q 245 20 310 55 T 370 28" stroke={theme.accent} strokeOpacity="0.38" strokeWidth="1.4" fill="none" />
            <Circle cx="308" cy="46" r="34" stroke={theme.accent} strokeOpacity="0.28" strokeWidth="1.2" fill="none" />
            <Line x1="308" y1="6" x2="308" y2="86" stroke={theme.accent} strokeOpacity="0.22" strokeWidth="1" />
            <Line x1="268" y1="46" x2="348" y2="46" stroke={theme.accent} strokeOpacity="0.22" strokeWidth="1" />
          </>
        )}
        {theme.motif === 'celestial' && (
          <>
            <Line x1="215" y1="68" x2="258" y2="28" stroke={theme.accent} strokeOpacity="0.38" strokeWidth="1.2" />
            <Line x1="258" y1="28" x2="305" y2="52" stroke={theme.accent} strokeOpacity="0.38" strokeWidth="1.2" />
            <Line x1="305" y1="52" x2="342" y2="20" stroke={theme.accent} strokeOpacity="0.38" strokeWidth="1.2" />
            <Circle cx="215" cy="68" r="3" fill={theme.accent} fillOpacity="0.7" />
            <Circle cx="258" cy="28" r="4" fill={theme.accent} fillOpacity="0.9" />
            <Circle cx="305" cy="52" r="3.5" fill={theme.secondary} fillOpacity="0.8" />
            <Circle cx="342" cy="20" r="3" fill={theme.accent} fillOpacity="0.9" />
          </>
        )}
        {theme.motif === 'hydro' && (
          <>
            <Polygon points="305,12 342,46 305,80 268,46" stroke={theme.accent} strokeOpacity="0.35" strokeWidth="1.3" fill={theme.tintBg} />
            <Polygon points="305,24 328,46 305,68 282,46" stroke={theme.secondary} strokeOpacity="0.35" strokeWidth="1" fill="none" />
          </>
        )}
      </Svg>

      <View style={styles.artTopRow}>
        <View
          style={[
            styles.elementPill,
            { backgroundColor: theme.tintBg, borderColor: theme.borderTint },
          ]}
        >
          <View style={[styles.elementDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.elementText, { color: theme.accent }]}>
            {theme.label}
          </Text>
        </View>

        <View style={styles.etaChip}>
          <Clock size={11} color={COLORS.frostGlow} strokeWidth={1.7} />
          <Text style={styles.etaChipText}>
            {formatEstimatedHours(estimatedHours)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export function ServiceCatalogCard({ item, onPress }: ServiceCatalogCardProps) {
  const theme = getServiceElementTheme(item.name, item.category_name);
  const tiers = item.tiers ?? [];
  const [previewTierIdx, setPreviewTierIdx] = useState<number>(0);

  const activeTier = tiers[previewTierIdx] ?? null;
  const displayedPrice = activeTier ? activeTier.fixed_price : item.starting_price;
  const displayedEta = activeTier?.estimated_hours ?? item.estimated_hours;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <CrystalGlass
        intensity={58}
        borderRadius={RADIUS.card}
        accentBorderColor={theme.borderTint}
      >
        {item.image_url ? (
          <View style={styles.bannerWrapper}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.bannerImage}
              contentFit="cover"
              transition={250}
            />
            <LinearGradient
              colors={['rgba(5,7,11,0.1)', 'rgba(5,7,11,0.92)']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : (
          <ElementalHeaderArt theme={theme} estimatedHours={item.estimated_hours} />
        )}

        <View style={styles.body}>
          <Text style={styles.categoryOverline}>
            {item.category_name ?? 'LAYANAN'}
          </Text>
          <Text style={styles.title}>{item.name}</Text>

          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {tiers.length > 0 ? (
            <View style={styles.tierGrid}>
              {tiers.slice(0, 4).map((tier, idx) => {
                const selected = idx === previewTierIdx;
                return (
                  <Pressable
                    key={tier.id}
                    onPress={() => setPreviewTierIdx(idx)}
                    style={[
                      styles.tierPill,
                      selected && {
                        backgroundColor: theme.tintBg,
                        borderColor: theme.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierName,
                        selected && { color: COLORS.pureWhite },
                      ]}
                      numberOfLines={1}
                    >
                      {tier.name}
                    </Text>
                    <Text
                      style={[
                        styles.tierPrice,
                        selected && { color: theme.accent },
                      ]}
                    >
                      {formatIDR(tier.fixed_price)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceCaption}>
                {activeTier ? activeTier.name.toUpperCase() : 'MULAI DARI'} •{' '}
                {formatEstimatedHours(displayedEta)}
              </Text>
              <Text style={styles.priceValue}>{formatIDR(displayedPrice)}</Text>
            </View>

            <View style={[styles.orderBtn, { backgroundColor: theme.accent }]}>
              <Text style={styles.orderBtnText}>Order</Text>
              <ArrowUpRight size={15} color={COLORS.abyssInk} strokeWidth={2.4} />
            </View>
          </View>
        </View>
      </CrystalGlass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  pressed: {
    transform: [{ scale: 0.986 }],
    opacity: 0.95,
  },
  artStrip: {
    height: 76,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  artTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  elementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  elementDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  elementText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 7, 11, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  etaChipText: {
    color: COLORS.frostGlow,
    fontFamily: FONTS.mono,
    fontSize: 10.5,
  },
  bannerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: SPACING.lg,
  },
  categoryOverline: {
    color: COLORS.fogVeil,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: COLORS.pureWhite,
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  description: {
    color: COLORS.fogVeil,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  tierGrid: {
    marginTop: SPACING.md,
    gap: 6,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  tierName: {
    flex: 1,
    color: COLORS.frostGlow,
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.5,
    marginRight: 8,
  },
  tierPrice: {
    color: COLORS.moonMist,
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  priceCaption: {
    color: COLORS.fogVeil,
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: 0.9,
    marginBottom: 2,
  },
  priceValue: {
    color: COLORS.pureWhite,
    fontFamily: FONTS.displayBold,
    fontSize: 19,
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  orderBtnText: {
    color: COLORS.abyssInk,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
  },
});