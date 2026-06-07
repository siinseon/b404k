import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Border, Shadows } from '../constants/theme';
import { useSessions } from '../store/sessionStore';
import {
  computeReadingStatistics,
  fmtHM,
  fmtHMDisplay,
  WeekBucket,
  BookBreakdown,
  CalendarMonth,
} from '../utils/statsCalculator';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Stats'>;

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sh.row}>
      <Text style={sh.label}>{label}</Text>
      <View style={sh.rule} />
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: {
    fontFamily: Typography.fontMono, fontSize: 9, fontWeight: '700',
    letterSpacing: 2, color: Colors.textMuted,
  },
  rule: { flex: 1, height: 1, backgroundColor: Colors.border },
});

// ── Headline stat card ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <View style={sc.outer}>
      <View style={sc.inner}>
        <Text style={sc.label}>{label}</Text>
        <Text style={[sc.value, accent && sc.valueAccent]}>{value}</Text>
        {sub ? <Text style={sc.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}
const sc = StyleSheet.create({
  outer: {
    flex: 1,
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 2,
    padding: 2,
    backgroundColor: Colors.lcdBackground,
  },
  inner: {
    borderWidth: Border.thin,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 1,
    backgroundColor: Colors.lcdBackground,
    padding: Spacing.md,
    gap: 2,
  },
  label: {
    fontFamily: Typography.fontMono, fontSize: 8, letterSpacing: 1.5,
    color: Colors.lcdTextDim,
  },
  value: {
    fontFamily: Typography.fontMono, fontSize: 22, fontWeight: '700',
    letterSpacing: 1, color: Colors.lcdText, lineHeight: 28,
  },
  valueAccent: { color: Colors.lcdText },
  sub: {
    fontFamily: Typography.fontMono, fontSize: 8, letterSpacing: 1,
    color: Colors.lcdTextDim,
  },
});

// ── Weekly bar chart ──────────────────────────────────────────────────────────

type WeekMode = 'PAGES' | 'TIME' | 'SESSIONS';

function WeeklyChart({ data }: { data: WeekBucket[] }) {
  const [mode, setMode] = useState<WeekMode>('PAGES');
  const { width } = useWindowDimensions();

  const getValue = (b: WeekBucket) => {
    if (mode === 'PAGES') return b.pages;
    if (mode === 'TIME') return b.timeMin;
    return b.sessionCount;
  };

  const getLabel = (b: WeekBucket) => {
    const v = getValue(b);
    if (v === 0) return '';
    if (mode === 'TIME') return fmtHM(v);
    return String(v);
  };

  const values = data.map(getValue);
  const maxVal = Math.max(...values, 1);
  const BAR_MAX_H = 80;

  return (
    <View style={wc.panel}>
      {/* Mode toggle */}
      <View style={wc.modeRow}>
        {(['PAGES', 'TIME', 'SESSIONS'] as WeekMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            activeOpacity={0.75}
            style={[wc.modeBtn, mode === m && wc.modeBtnActive]}
          >
            <Text style={[wc.modeBtnLabel, mode === m && wc.modeBtnLabelActive]}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bars */}
      <View style={wc.chartArea}>
        {data.map((bucket, i) => {
          const val = getValue(bucket);
          const barH = maxVal > 0 ? Math.max((val / maxVal) * BAR_MAX_H, val > 0 ? 4 : 0) : 0;
          return (
            <View key={i} style={wc.barCol}>
              {/* Value label above bar */}
              <Text style={wc.barTopLabel} numberOfLines={1}>
                {getLabel(bucket)}
              </Text>
              {/* Bar container */}
              <View style={[wc.barTrack, { height: BAR_MAX_H }]}>
                <View style={[wc.bar, { height: barH }]} />
              </View>
              {/* Week date label */}
              <Text style={wc.barBottomLabel} numberOfLines={1}>
                {bucket.label.slice(0, 5)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const wc = StyleSheet.create({
  panel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: {
    borderWidth: Border.thin,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  modeBtnActive: {
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    backgroundColor: Colors.metalDark,
  },
  modeBtnLabel: {
    fontFamily: Typography.fontMono, fontSize: 8, fontWeight: '700',
    letterSpacing: 1.5, color: Colors.textMuted,
  },
  modeBtnLabelActive: { color: Colors.accentGreen },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  barTopLabel: {
    fontFamily: Typography.fontMono, fontSize: 7, color: Colors.lcdText,
    letterSpacing: 0.3, height: 12,
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: Colors.metalMid,
    borderRadius: 1,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: Colors.lcdText,
    borderRadius: 1,
    minHeight: 0,
  },
  barBottomLabel: {
    fontFamily: Typography.fontMono, fontSize: 7, color: Colors.textMuted,
    letterSpacing: 0.3, textAlign: 'center',
  },
});

// ── Calendar heatmap ──────────────────────────────────────────────────────────

function CalendarHeatmap({ data }: { data: CalendarMonth }) {
  const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  // Build grid rows: each row = one week
  const grid: (typeof data.days[0] | null)[][] = [];
  let row: (typeof data.days[0] | null)[] = Array(data.leadingBlanks).fill(null);

  for (const day of data.days) {
    row.push(day);
    if (row.length === 7) {
      grid.push(row);
      row = [];
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    grid.push(row);
  }

  const maxPages = Math.max(...data.days.map((d) => d.pages), 1);

  function getCellColor(day: typeof data.days[0] | null) {
    if (!day || day.isFuture) return Colors.metalMid;
    if (!day.hasSession) return Colors.panel;
    const intensity = day.pages / maxPages;
    if (intensity > 0.75) return Colors.lcdText;
    if (intensity > 0.4) return Colors.lcdTextDim;
    return Colors.lcdShadow;
  }

  return (
    <View style={cal.panel}>
      <Text style={cal.monthLabel}>{data.label}</Text>

      {/* Day-of-week header */}
      <View style={cal.headerRow}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={cal.headerCell}>
            <Text style={cal.headerLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {grid.map((week, wi) => (
        <View key={wi} style={cal.weekRow}>
          {week.map((day, di) => (
            <View
              key={di}
              style={[
                cal.cell,
                { backgroundColor: getCellColor(day) },
                day?.isToday && cal.cellToday,
              ]}
            >
              {day ? (
                <Text style={[cal.cellDay, day.isToday && cal.cellDayToday]}>
                  {day.dayOfMonth}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={cal.legend}>
        <Text style={cal.legendLabel}>LESS</Text>
        {[Colors.panel, Colors.lcdShadow, Colors.lcdTextDim, Colors.lcdText].map((c, i) => (
          <View key={i} style={[cal.legendDot, { backgroundColor: c }]} />
        ))}
        <Text style={cal.legendLabel}>MORE</Text>
      </View>
    </View>
  );
}
const cal = StyleSheet.create({
  panel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  monthLabel: {
    fontFamily: Typography.fontMono, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, color: Colors.text,
  },
  headerRow: { flexDirection: 'row', gap: 3 },
  headerCell: { flex: 1, alignItems: 'center' },
  headerLabel: {
    fontFamily: Typography.fontMono, fontSize: 7, letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  weekRow: { flexDirection: 'row', gap: 3 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cellToday: {
    borderColor: Colors.accentGreen,
    borderWidth: Border.regular,
  },
  cellDay: {
    fontFamily: Typography.fontMono, fontSize: 7, color: Colors.textMuted,
  },
  cellDayToday: { color: Colors.accentGreen },
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
    justifyContent: 'flex-end',
  },
  legendDot: {
    width: 10, height: 10, borderRadius: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  legendLabel: {
    fontFamily: Typography.fontMono, fontSize: 7, color: Colors.textDisabled,
    letterSpacing: 0.5,
  },
});

// ── Book breakdown chart ──────────────────────────────────────────────────────

function BookChart({ data }: { data: BookBreakdown[] }) {
  const maxPages = Math.max(...data.map((b) => b.totalPages), 1);

  if (data.length === 0) {
    return (
      <View style={bk.emptyPanel}>
        <Text style={bk.emptyText}>NO DATA</Text>
      </View>
    );
  }

  return (
    <View style={bk.panel}>
      {data.slice(0, 8).map((book, i) => {
        const fillPct = book.totalPages / maxPages;
        const SEGS = 12;
        const filledSegs = Math.max(Math.round(fillPct * SEGS), book.totalPages > 0 ? 1 : 0);

        return (
          <React.Fragment key={book.bookId}>
            {i > 0 && <View style={bk.sep} />}
            <View style={bk.row}>
              <View style={bk.info}>
                <Text style={bk.title} numberOfLines={1}>{book.bookTitle}</Text>
                <Text style={bk.meta}>
                  {book.sessionCount} sess · {fmtHM(book.totalTimeMin)}
                </Text>
              </View>
              <View style={bk.barArea}>
                <View style={bk.segRow}>
                  {Array.from({ length: SEGS }).map((_, si) => (
                    <View
                      key={si}
                      style={[bk.seg, si < filledSegs && bk.segOn]}
                    />
                  ))}
                </View>
                <Text style={bk.pageCount}>{book.totalPages} pp</Text>
              </View>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}
const bk = StyleSheet.create({
  panel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    overflow: 'hidden',
  },
  emptyPanel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontMono, fontSize: 10, letterSpacing: 2, color: Colors.textDisabled,
  },
  sep: { height: Border.thin, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  info: { width: 100, gap: 2 },
  title: {
    fontFamily: Typography.fontMono, fontSize: 10, fontWeight: '700',
    color: Colors.text, letterSpacing: 0.3,
  },
  meta: {
    fontFamily: Typography.fontMono, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5,
  },
  barArea: { flex: 1, gap: 3 },
  segRow: { flexDirection: 'row', gap: 2 },
  seg: {
    flex: 1, height: 10, backgroundColor: Colors.metalMid, borderRadius: 1,
  },
  segOn: { backgroundColor: Colors.lcdText },
  pageCount: {
    fontFamily: Typography.fontMono, fontSize: 8, fontWeight: '700',
    color: Colors.lcdText, letterSpacing: 0.5, alignSelf: 'flex-end',
  },
});

// ── Secondary stats table ─────────────────────────────────────────────────────

function StatsTable({
  rows,
}: {
  rows: { key: string; val: string }[];
}) {
  return (
    <View style={st.panel}>
      {rows.map(({ key, val }, i) => (
        <React.Fragment key={key}>
          {i > 0 && <View style={st.sep} />}
          <View style={st.row}>
            <Text style={st.key}>{key}</Text>
            <View style={st.dots} />
            <Text style={st.val} numberOfLines={1}>{val}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
const st = StyleSheet.create({
  panel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  key: {
    fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1.5, color: Colors.textMuted,
  },
  dots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
    marginHorizontal: Spacing.sm,
    height: 1,
  },
  val: {
    fontFamily: Typography.fontMono, fontSize: 11, fontWeight: '700', color: Colors.text,
    flexShrink: 1,
  },
  sep: { height: Border.thin, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export function StatsScreen() {
  const navigation = useNavigation<Nav>();
  const { sessions, loaded } = useSessions();

  const stats = useMemo(() => computeReadingStatistics(sessions), [sessions]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          style={styles.backBtn}
        >
          <View style={styles.backBtnFace}>
            <Text style={styles.backBtnLabel}>◀ BACK</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>STATISTICS</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Headline 4-grid ── */}
        <SectionHeader label="OVERVIEW" />
        {!loaded && (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyText}>LOADING...</Text>
          </View>
        )}
        {loaded && sessions.length === 0 && (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyText}>NO SESSION DATA</Text>
          </View>
        )}
        <View style={styles.cardRow}>
          <StatCard
            label="TOTAL BOOKS"
            value={String(stats.totalBooks)}
            sub="IN ARCHIVE"
          />
          <StatCard
            label="TOTAL PAGES"
            value={String(stats.totalPages)}
            sub="ALL TIME"
          />
        </View>
        <View style={styles.cardRow}>
          <StatCard
            label="READING TIME"
            value={fmtHMDisplay(stats.totalTimeMin)}
            sub={fmtHM(stats.totalTimeMin)}
          />
          <StatCard
            label="STREAK"
            value={`${stats.streak}D`}
            sub={`BEST: ${stats.longestStreak}D`}
            accent
          />
        </View>

        {/* ── Secondary stats ── */}
        <SectionHeader label="AVERAGES" />
        <StatsTable
          rows={[
            { key: 'SESSIONS', val: String(stats.totalSessions) },
            { key: 'ACTIVE DAYS', val: String(stats.activeDays) },
            { key: 'AVG PP / SESSION', val: String(stats.avgPagesPerSession) },
            { key: 'AVG TIME / SESSION', val: fmtHM(stats.avgTimePerSessionMin) },
            { key: 'AVG PP / ACTIVE DAY', val: String(stats.avgPagesPerDay) },
          ]}
        />

        {/* ── Weekly trend chart ── */}
        <SectionHeader label="WEEKLY TREND" />
        {loaded ? <WeeklyChart data={stats.weeklyTrend} /> : null}

        {/* ── Calendar heatmap ── */}
        <SectionHeader label="MONTHLY CALENDAR" />
        {loaded ? <CalendarHeatmap data={stats.currentMonth} /> : null}

        {/* ── Book breakdown ── */}
        <SectionHeader label="BY BOOK" />
        {loaded ? <BookChart data={stats.bookBreakdown} /> : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.body },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 11, fontWeight: '700', letterSpacing: 3, color: Colors.text,
  },
  topBarSpacer: { width: 70 },
  backBtn: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2, backgroundColor: Colors.metalMid,
  },
  backBtnFace: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, margin: 1 },
  backBtnLabel: {
    fontFamily: Typography.fontMono, fontSize: 10, fontWeight: '700', letterSpacing: 1, color: Colors.text,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  bottomPad: { height: Spacing.xl },

  cardRow: { flexDirection: 'row', gap: Spacing.sm },
  emptyPanel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textDisabled,
  },
});
