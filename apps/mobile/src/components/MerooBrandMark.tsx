import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';
import { COLORS, FONTS } from '../theme/tokens';

export function MerooBrandMark() {
  return (
    <View style={styles.row}>
      <View style={styles.emblem}>
        <Svg width={28} height={28} viewBox="0 0 32 32">
          <Polygon
            points="16,2 28,9 28,23 16,30 4,23 4,9"
            stroke={COLORS.anemoBright}
            strokeWidth="1.5"
            fill="rgba(45, 212, 191, 0.14)"
          />
          <Polygon
            points="16,7 24,16 16,25 8,16"
            stroke={COLORS.primogemGold}
            strokeWidth="1.3"
            fill="rgba(251, 191, 36, 0.10)"
          />
          <Line x1="16" y1="2" x2="16" y2="30" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
          <Circle cx="16" cy="16" r="2.5" fill={COLORS.pureWhite} />
        </Svg>
      </View>

      <View>
        <View style={styles.badgeRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.subLabel}>TEYVAT ATELIER • LIVE</Text>
        </View>
        <Text style={styles.title}>
          meroo<Text style={styles.titleDot}>.gi</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  emblem: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: COLORS.anemoBright,
  },
  subLabel: {
    color: COLORS.moonMist,
    fontFamily: FONTS.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.pureWhite,
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    letterSpacing: -0.7,
    lineHeight: 27,
  },
  titleDot: {
    color: COLORS.primogemGold,
  },
});