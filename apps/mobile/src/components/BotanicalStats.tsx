import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Ellipse, Circle, G } from 'react-native-svg';
import { SAGE, FONTS, formatIDR } from '../theme/sage';

interface BarPoint {
  label: string;
  value: number;
}

export function BotanicalStemChart({ title, subtitle, points }: { title: string; subtitle: string; points: BarPoint[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
      <View style={styles.chartRow}>
        {points.map((pt, idx) => {
          const stemH = Math.max(18, Math.round((pt.value / 100) * 84));
          return (
            <View key={idx} style={styles.col}>
              <Svg width={34} height={94} viewBox="0 0 34 94">
                <Line x1={17} y1={90} x2={17} y2={90 - stemH} stroke={SAGE.primary} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={17} cy={90 - stemH} r={3.5} fill={SAGE.accentPeach} />
                {stemH > 26 && (
                  <Ellipse cx={11} cy={90 - stemH * 0.45} rx={5} ry={2.6} fill={SAGE.primaryLight} transform={`rotate(-28 11 ${90 - stemH * 0.45})`} />
                )}
                {stemH > 46 && (
                  <Ellipse cx={23} cy={90 - stemH * 0.72} rx={5} ry={2.6} fill={SAGE.primary} transform={`rotate(28 23 ${90 - stemH * 0.72})`} />
                )}
              </Svg>
              <Text style={styles.dayLbl}>{pt.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function FinanceDonutChart({
  gross,
  workerAmt,
  adminAmt,
  treasuryAmt,
  workerPct,
  adminPct,
  treasuryPct,
}: {
  gross: number;
  workerAmt: number;
  adminAmt: number;
  treasuryAmt: number;
  workerPct: number;
  adminPct: number;
  treasuryPct: number;
}) {
  const size = 132;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  const wLen = (workerPct / 100) * circ;
  const aLen = (adminPct / 100) * circ;
  const tLen = (treasuryPct / 100) * circ;

  return (
    <View style={styles.donutWrap}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={SAGE.surfaceSoft} strokeWidth={stroke} fill="transparent" />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={SAGE.primary}
              strokeWidth={stroke}
              strokeDasharray={`${wLen} ${circ}`}
              fill="transparent"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={SAGE.accentPeach}
              strokeWidth={stroke}
              strokeDasharray={`${aLen} ${circ}`}
              strokeDashoffset={-wLen}
              fill="transparent"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={SAGE.accentWarm}
              strokeWidth={stroke}
              strokeDasharray={`${tLen} ${circ}`}
              strokeDashoffset={-(wLen + aLen)}
              fill="transparent"
            />
          </G>
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutLbl}>Omzet</Text>
          <Text style={styles.donutVal}>{gross >= 1000 ? `${Math.round(gross / 1000)}rb` : gross}</Text>
        </View>
      </View>

      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: SAGE.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.legTitle}>Worker ({workerPct}%)</Text>
            <Text style={styles.legAmt}>{formatIDR(workerAmt)}</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: SAGE.accentPeach }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.legTitle}>Admin ({adminPct}%)</Text>
            <Text style={styles.legAmt}>{formatIDR(adminAmt)}</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: SAGE.accentWarm }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.legTitle}>Kas Studio ({treasuryPct}%)</Text>
            <Text style={styles.legAmt}>{formatIDR(treasuryAmt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE.border,
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 15, color: SAGE.textPrimary },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: SAGE.textSecondary, marginTop: 2, marginBottom: 8 },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: SAGE.border,
    paddingBottom: 6,
  },
  col: { alignItems: 'center', flex: 1 },
  dayLbl: { fontFamily: FONTS.mono, fontSize: 10, color: SAGE.textSecondary, marginTop: 4 },
  donutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: SAGE.surfaceSoft,
    padding: 14,
    borderRadius: 20,
  },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutLbl: { fontFamily: FONTS.bodyMedium, fontSize: 10, color: SAGE.textSecondary },
  donutVal: { fontFamily: FONTS.displayExtra, fontSize: 16, color: SAGE.textPrimary },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legTitle: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: SAGE.textSecondary },
  legAmt: { fontFamily: FONTS.displayBold, fontSize: 13, color: SAGE.textPrimary },
});
