import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SAGE } from '../theme/sage';

interface Props {
  percentage: number;
  label?: string;
  size?: number;
}

export function ProgressRing({ percentage, label = 'Progres Aktif', size = 164 }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={SAGE.surfaceSoft}
          strokeWidth={strokeWidth}
          fill={SAGE.surfaceCard}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={SAGE.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.pct}>{clamped}%</Text>
        <Text style={styles.lbl}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  pct: { fontSize: 32, fontWeight: '800', color: SAGE.textPrimary },
  lbl: { fontSize: 11, fontWeight: '600', color: SAGE.textSecondary, marginTop: 2 },
});
