import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SpringTouchable({ children, onPress, disabled, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(target: number) {
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      speed: 28,
      bounciness: 8,
    }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(0.965)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
