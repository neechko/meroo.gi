import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Line } from 'react-native-svg';
import { COLORS } from '../theme/tokens';

export function AbyssMeshBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="anemoTop" cx="82%" cy="8%" rx="65%" ry="42%">
            <Stop offset="0%" stopColor="#14B8A6" stopOpacity="0.34" />
            <Stop offset="55%" stopColor="#0D9488" stopOpacity="0.10" />
            <Stop offset="100%" stopColor={COLORS.abyssCanvas} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="hydroMid" cx="12%" cy="46%" rx="60%" ry="38%">
            <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.24" />
            <Stop offset="60%" stopColor="#0F766E" stopOpacity="0.08" />
            <Stop offset="100%" stopColor={COLORS.abyssCanvas} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="emeraldBottom" cx="75%" cy="88%" rx="65%" ry="35%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.22" />
            <Stop offset="100%" stopColor={COLORS.abyssCanvas} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill={COLORS.abyssCanvas} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#anemoTop)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hydroMid)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#emeraldBottom)" />

        {/* Subtle Architectural Hairline Grid */}
        <Line x1="20" y1="0" x2="20" y2="100%" stroke="rgba(94, 234, 212, 0.04)" strokeWidth="1" />
        <Line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(94, 234, 212, 0.03)" strokeWidth="1" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.abyssCanvas,
  },
});