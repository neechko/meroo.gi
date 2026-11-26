import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SAGE } from '../theme/sage';

interface CounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

export function AnimatedCounter({ value, suffix = '', prefix = '', duration = 850, style }: CounterProps) {
  const target = Math.max(0, Math.round(value || 0));
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const startVal = prevTargetRef.current;
    prevTargetRef.current = target;
    anim.setValue(startVal);

    const id = anim.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });

    Animated.timing(anim, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      anim.removeListener(id);
    };
  }, [target, duration, anim]);

  return (
    <Text style={style}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
}

interface ProgressBarProps {
  percentage: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  isActive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedProgressBar({
  percentage,
  height = 8,
  trackColor = SAGE.surfaceSoft,
  fillColor = SAGE.primary,
  isActive = false,
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const widthAnim = useRef(new Animated.Value(0)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  useEffect(() => {
    if (!isActive || clamped <= 0 || clamped >= 100) {
      flowAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, clamped, flowAnim]);

  const widthPercent = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const flowX = flowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 220],
  });

  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: trackColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthPercent,
            height,
            borderRadius: height,
            backgroundColor: fillColor,
          },
        ]}
      >
        {isActive && clamped > 0 && clamped < 100 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.innerFlow,
              {
                height,
                transform: [{ translateX: flowX }],
              },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

interface StaggerProps {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function StaggerItem({ index, children, style }: StaggerProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index, 8) * 50;
    Animated.spring(anim, {
      toValue: 1,
      delay,
      speed: 20,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [index, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}

interface PulseDotProps {
  color?: string;
  size?: number;
  active?: boolean;
}

export function LivePulseDot({ color = SAGE.primary, size = 8, active = true }: PulseDotProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.65, 0.15, 0],
  });

  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      {active && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          }}
        />
      )}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

interface SpinButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function SpinTouchable({ onPress, style, children }: SpinButtonProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    spin.setValue(0);
    Animated.parallel([
      Animated.timing(spin, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.9, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 10, useNativeDriver: true }),
      ]),
    ]).start();
    onPress?.();
  }

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[style, { transform: [{ scale }, { rotate }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    overflow: 'hidden',
  },
  innerFlow: {
    width: 44,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});