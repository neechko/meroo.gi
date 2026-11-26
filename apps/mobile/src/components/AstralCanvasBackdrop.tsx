import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import { useBlurTarget } from '../context/BlurContext';
import { COLORS } from '../theme/tokens';

export function AstralCanvasBackdrop() {
  const blurTargetRef = useBlurTarget();

  return (
    <BlurTargetView
      ref={blurTargetRef}
      style={styles.canvas}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="auroraTeal" cx="85%" cy="10%" rx="72%" ry="44%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.58" />
            <Stop offset="45%" stopColor="#0D9488" stopOpacity="0.24" />
            <Stop offset="100%" stopColor={COLORS.abyssCanvas} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="auroraViolet" cx="10%" cy="38%" rx="68%" ry="40%">
            <Stop offset="0%" stopColor="#818CF8" stopOpacity="0.46" />
            <Stop offset="50%" stopColor="#4F46E5" stopOpacity="0.18" />
            <Stop offset="100%" stopColor={COLORS.abyssCanvas} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="auroraGold" cx="82%" cy="68%" rx="65%" ry="36%">
            <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.34" />
            <Stop offset="55%" stopColor="#D97706" stopOpacity="0.10" />
            <Stop offset="100%" stopColor={COLORS.abyssCanvas} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="auroraCyanLow" cx="22%" cy="92%" rx="70%" ry="35%">
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.44" />
            <Stop offset="100%" stopColor={COLORS.abyssCanvas} stopOpacity="0" />
          </RadialGradient>

          <SvgLinearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
            <Stop offset="50%" stopColor="#818CF8" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#FBBF24" stopOpacity="0.25" />
          </SvgLinearGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill={COLORS.abyssCanvas} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#auroraTeal)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#auroraViolet)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#auroraGold)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#auroraCyanLow)" />

        {/* Glowing Light Ribbons & Astrolabe Rings for Glass Refraction */}
        <Path
          d="M -40 190 Q 140 90 290 210 T 460 150"
          stroke="url(#ribbonGrad)"
          strokeWidth="28"
          fill="none"
        />
        <Path
          d="M -30 520 Q 170 420 310 540 T 460 470"
          stroke="url(#ribbonGrad)"
          strokeWidth="22"
          fill="none"
        />
        <Circle
          cx="310"
          cy="115"
          r="135"
          stroke="rgba(94, 234, 212, 0.16)"
          strokeWidth="1.2"
          fill="none"
        />
        <Circle
          cx="310"
          cy="115"
          r="92"
          stroke="rgba(251, 191, 36, 0.15)"
          strokeWidth="1"
          strokeDasharray="6 6"
          fill="none"
        />
      </Svg>
    </BlurTargetView>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.abyssCanvas,
  },
});