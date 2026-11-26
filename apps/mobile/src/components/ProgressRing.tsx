import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SAGE } from '../theme/sage';

interface Props {
  percentage: number;
  label?: string;
  size?: number;
}

export function ProgressRing({ percentage, label = 'Progres Aktif', size = 164 }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const [animPct, setAnimPct] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      setAnimPct(value);
    });
    Animated.timing(anim, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [clamped, anim]);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animPct / 100) * circumference;

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
        <Text style={styles.pct}>{Math.round(animPct)}%</Text>
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