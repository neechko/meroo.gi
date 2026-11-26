import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useBlurTarget } from '../context/BlurContext';
import { COLORS, RADIUS } from '../theme/tokens';

interface CrystalGlassProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  active?: boolean;
  accentBorderColor?: string;
  showSpecular?: boolean;
}

export function CrystalGlass({
  children,
  style,
  intensity = 55,
  borderRadius = RADIUS.card,
  active = false,
  accentBorderColor,
  showSpecular = true,
}: CrystalGlassProps) {
  const blurTarget = useBlurTarget();

  const topBorder = active
    ? COLORS.borderActive
    : accentBorderColor ?? COLORS.borderTopSpecular;

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius,
          borderTopColor: topBorder,
          borderLeftColor: active ? COLORS.borderActive : COLORS.borderGlass,
          borderRightColor: COLORS.borderGlass,
          borderBottomColor: 'rgba(255, 255, 255, 0.06)',
        },
        style,
      ]}
    >
      <BlurView
        blurTarget={blurTarget ?? undefined}
        blurMethod="dimezisBlurView"
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={
          active
            ? ['rgba(45, 212, 191, 0.24)', 'rgba(13, 148, 136, 0.08)']
            : ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.02)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {showSpecular ? (
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.55)',
            'rgba(255, 255, 255, 0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.specularLine,
            { left: Math.min(borderRadius, 20), right: Math.min(borderRadius, 20) },
          ]}
        />
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: COLORS.glassFill,
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    height: 1,
    zIndex: 10,
  },
});