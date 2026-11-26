import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G, Ellipse } from 'react-native-svg';
import { SAGE, FONTS } from '../theme/sage';

interface Props {
  percentage: number;
  subtitle?: string;
  activeCount: number;
  totalCount: number;
  completedCount: number;
}

export function SanctuaryPond({ percentage, subtitle, activeCount, totalCount, completedCount }: Props) {
  const safePct = Math.max(0, Math.min(100, Math.round(percentage || 0)));

  // Animasi interaktif saat disentuh
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0.4)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // Animasi gelombang air berkelanjutan (60fps native driver)
  const waveFrontAnim = useRef(new Animated.Value(0)).current;
  const waveBackAnim = useRef(new Animated.Value(0)).current;
  const waveTideAnim = useRef(new Animated.Value(0)).current;
  const gaugeWaveAnim = useRef(new Animated.Value(0)).current;

  // Animasi biota kolam (koi independen, tanaman air, gelembung)
  const koiPeachAnim = useRef(new Animated.Value(0)).current;
  const koiJadeAnim = useRef(new Animated.Value(0)).current;
  const seaweedAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const frontWaveLoop = Animated.loop(
      Animated.timing(waveFrontAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const backWaveLoop = Animated.loop(
      Animated.timing(waveBackAnim, {
        toValue: 1,
        duration: 3400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const tideLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveTideAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveTideAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const gaugeWaveLoop = Animated.loop(
      Animated.timing(gaugeWaveAnim, {
        toValue: 1,
        duration: 2100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const koiPeachLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(koiPeachAnim, {
          toValue: 1,
          duration: 3100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(koiPeachAnim, {
          toValue: 0,
          duration: 3100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const koiJadeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(koiJadeAnim, {
          toValue: 1,
          duration: 3700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(koiJadeAnim, {
          toValue: 0,
          duration: 3700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const seaweedLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(seaweedAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(seaweedAnim, {
          toValue: -1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const bubbleLoop = Animated.loop(
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 2900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    frontWaveLoop.start();
    backWaveLoop.start();
    tideLoop.start();
    gaugeWaveLoop.start();
    koiPeachLoop.start();
    koiJadeLoop.start();
    seaweedLoop.start();
    bubbleLoop.start();

    return () => {
      frontWaveLoop.stop();
      backWaveLoop.stop();
      tideLoop.stop();
      gaugeWaveLoop.stop();
      koiPeachLoop.stop();
      koiJadeLoop.stop();
      seaweedLoop.stop();
      bubbleLoop.stop();
    };
  }, [waveFrontAnim, waveBackAnim, waveTideAnim, gaugeWaveAnim, koiPeachAnim, koiJadeAnim, seaweedAnim, bubbleAnim]);

  function triggerRipple() {
    rippleScale.setValue(0.4);
    rippleOpacity.setValue(0.65);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.985, duration: 85, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 9 }),
      ]),
      Animated.timing(rippleScale, {
        toValue: 1.7,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }

  // Interpolasi gelombang air seamless (periode 180px & pasang-surut vertikal)
  const frontWaveX = waveFrontAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -180],
  });
  const backWaveX = waveBackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 0],
  });
  const frontTideY = waveTideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, -1.8],
  });
  const backTideY = waveTideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-1.5, 1.5],
  });
  const gaugeWaveX = gaugeWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -112],
  });

  // Gerak masing-masing ikan koi (horizontal + mengayun vertikal)
  const peachX = koiPeachAnim.interpolate({ inputRange: [0, 1], outputRange: [-11, 13] });
  const peachY = koiPeachAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.8, -2.6, 1.8] });

  const jadeX = koiJadeAnim.interpolate({ inputRange: [0, 1], outputRange: [12, -12] });
  const jadeY = koiJadeAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-2.2, 2.5, -2.2] });

  // Gerak tanaman air & gelembung
  const weedRotate = seaweedAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });
  const weedShiftX = seaweedAnim.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });

  const bubbleY = bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [7, -20] });
  const bubbleOpacity = bubbleAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.78, 0.55, 0],
  });

  // Tinggi air pada indikator persentase atas (diameter 112px)
  const waterFillHeight = Math.max(18, Math.round((safePct / 100) * 112));

  return (
    <TouchableOpacity activeOpacity={0.96} onPress={triggerRipple} style={{ width: '100%' }}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Lingkaran Indikator Persentase Atas dengan Permukaan Air Bergelombang */}
        <View style={styles.gaugeCircle}>
          <Animated.View
            style={[
              styles.gaugeWaveContainer,
              {
                height: waterFillHeight + 8,
                transform: [{ translateX: gaugeWaveX }, { translateY: frontTideY }],
              },
            ]}
          >
            <Svg width="224" height={waterFillHeight + 8} viewBox={`0 0 224 ${waterFillHeight + 8}`}>
              <Path
                d={`M 0 7 Q 28 0, 56 7 T 112 7 Q 140 0, 168 7 T 224 7 L 224 ${waterFillHeight + 8} L 0 ${waterFillHeight + 8} Z`}
                fill="#A7CEC0"
              />
              <Path
                d="M 0 7 Q 28 0, 56 7 T 112 7 Q 140 0, 168 7 T 224 7"
                fill="none"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="1.6"
              />
            </Svg>
          </Animated.View>

          <Text style={styles.pctText}>{safePct}%</Text>
          <Text style={styles.subText} numberOfLines={1}>
            {subtitle || activeCount + ' Order Aktif'}
          </Text>
        </View>

        {/* Kapsul Status Tengah */}
        <View style={styles.pillBar}>
          <View style={styles.pillItem}>
            <View style={[styles.dot, { backgroundColor: SAGE.primary }]} />
            <Text style={styles.pillText}>Sedang Joki: {activeCount}</Text>
          </View>
          <View style={styles.pillItem}>
            <View style={[styles.dot, { backgroundColor: SAGE.accentPeach }]} />
            <Text style={styles.pillText}>
              Selesai: {completedCount}/{totalCount}
            </Text>
          </View>
        </View>

        {/* Kolam Air Bawah dengan Gelombang 2 Lapis & Biota Aktif */}
        <View style={styles.bottomPond}>
          {/* Gelombang Belakang (Bergerak ke kanan) */}
          <Animated.View
            style={[
              styles.waveLayer,
              { transform: [{ translateX: backWaveX }, { translateY: backTideY }] },
            ]}
          >
            <Svg width="720" height="80" viewBox="0 0 720 80">
              <Path
                d="M 0 11 Q 45 2, 90 11 T 180 11 Q 225 2, 270 11 T 360 11 Q 405 2, 450 11 T 540 11 Q 585 2, 630 11 T 720 11 L 720 80 L 0 80 Z"
                fill="#89B8A9"
              />
            </Svg>
          </Animated.View>

          {/* Gelombang Depan + Kilau Permukaan Air (Bergerak ke kiri) */}
          <Animated.View
            style={[
              styles.waveLayer,
              { transform: [{ translateX: frontWaveX }, { translateY: frontTideY }] },
            ]}
          >
            <Svg width="720" height="80" viewBox="0 0 720 80">
              <Path
                d="M 0 14 Q 45 5, 90 14 T 180 14 Q 225 5, 270 14 T 360 14 Q 405 5, 450 14 T 540 14 Q 585 5, 630 14 T 720 14 L 720 80 L 0 80 Z"
                fill="#A6CDBE"
              />
              <Path
                d="M 0 14 Q 45 5, 90 14 T 180 14 Q 225 5, 270 14 T 360 14 Q 405 5, 450 14 T 540 14 Q 585 5, 630 14 T 720 14"
                fill="none"
                stroke="rgba(255,255,255,0.82)"
                strokeWidth="2"
              />
            </Svg>
          </Animated.View>

          {/* Riak Sentuhan Interaktif */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.touchRipple,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />

          {/* Tanaman Air Kiri & Kanan yang Melambai */}
          <Animated.View
            style={[
              styles.seaweed,
              {
                left: 22,
                height: 34,
                backgroundColor: '#4E7C6B',
                transform: [{ translateX: weedShiftX }, { rotate: weedRotate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.seaweed,
              {
                left: 33,
                height: 26,
                backgroundColor: '#6F9D8C',
                transform: [{ translateX: weedShiftX }, { rotate: weedRotate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.seaweed,
              {
                right: 22,
                height: 34,
                backgroundColor: '#4E7C6B',
                transform: [{ translateX: weedShiftX }, { rotate: weedRotate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.seaweed,
              {
                right: 33,
                height: 26,
                backgroundColor: '#E3A572',
                transform: [{ translateX: weedShiftX }, { rotate: weedRotate }],
              },
            ]}
          />

          {/* Panggung Biota Kolam (Gelembung + 2 Ikan Koi Independen) */}
          <View style={styles.fishStage}>
            {/* Gelembung Naik */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { opacity: bubbleOpacity, transform: [{ translateY: bubbleY }] },
              ]}
            >
              <Svg width="240" height="58" viewBox="0 0 240 58">
                <Circle cx="118" cy="34" r="3.1" fill="#FFFFFF" />
                <Circle cx="128" cy="24" r="2.1" fill="#FFFFFF" />
                <Circle cx="111" cy="44" r="2.3" fill="#FFFFFF" />
              </Svg>
            </Animated.View>

            {/* Ikan Koi Peach */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: peachX }, { translateY: peachY }] },
              ]}
            >
              <Svg width="240" height="58" viewBox="0 0 240 58">
                <G transform="translate(64, 28) rotate(-3)">
                  <Path d="M -16 0 L -26 -7 Q -21 0 -26 7 Z" fill="#DF8549" />
                  <Ellipse cx="-2" cy="-7" rx="5.5" ry="2.5" transform="rotate(-24 -2 -7)" fill="#F3B384" />
                  <Ellipse cx="-2" cy="7" rx="5.5" ry="2.5" transform="rotate(24 -2 7)" fill="#F3B384" />
                  <Path d="M -17 0 Q -6 -9 12 -4 Q 19 0 12 4 Q -6 9 -17 0 Z" fill="#EB965B" />
                  <Ellipse cx="2" cy="-1" rx="5" ry="2.4" fill="#FFF3E8" opacity={0.9} />
                  <Circle cx="11" cy="-1.4" r="1.3" fill="#1D2F2A" />
                </G>
              </Svg>
            </Animated.View>

            {/* Ikan Koi Sage-Jade */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateX: jadeX }, { translateY: jadeY }] },
              ]}
            >
              <Svg width="240" height="58" viewBox="0 0 240 58">
                <G transform="translate(176, 35) scale(-1, 1) rotate(-3)">
                  <Path d="M -15 0 L -24 -6.5 Q -20 0 -24 6.5 Z" fill="#3B6B5B" />
                  <Ellipse cx="-2" cy="-6.5" rx="5" ry="2.3" transform="rotate(-24 -2 -6.5)" fill="#7EB09E" />
                  <Ellipse cx="-2" cy="6.5" rx="5" ry="2.3" transform="rotate(24 -2 6.5)" fill="#7EB09E" />
                  <Path d="M -16 0 Q -5.5 -8.5 10.5 -3.8 Q 18 0 10.5 3.8 Q -5.5 8.5 -16 0 Z" fill="#497D6B" />
                  <Ellipse cx="1.5" cy="0" rx="4.5" ry="2" fill="#CBE4DA" opacity={0.85} />
                  <Circle cx="9.5" cy="-1.2" r="1.2" fill="#FFFFFF" />
                </G>
              </Svg>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 256,
    borderRadius: 26,
    backgroundColor: '#EFF7F3',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 18,
  },
  gaugeCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#CFE3DA',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeWaveContainer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    width: 224,
  },
  pctText: { fontFamily: FONTS.displayExtra, fontSize: 27, color: '#172B26', lineHeight: 31 },
  subText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: '#2E4A42', marginTop: 2 },
  pillBar: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    gap: 16,
    zIndex: 2,
  },
  pillItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: SAGE.textPrimary },
  bottomPond: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  waveLayer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    width: 720,
    height: 80,
  },
  touchRipple: {
    position: 'absolute',
    width: 96,
    height: 36,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    bottom: 16,
  },
  seaweed: {
    position: 'absolute',
    bottom: 6,
    width: 8,
    borderRadius: 6,
    opacity: 0.88,
  },
  fishStage: {
    width: 240,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
});