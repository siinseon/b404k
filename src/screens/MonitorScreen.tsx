import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LcdPanel } from '../components/LcdPanel';
import { Colors, Typography, Spacing, Border } from '../constants/theme';
import { useSessions } from '../store/sessionStore';
import { useBooks } from '../store/bookStore';
import { computeStreak } from '../utils/statsCalculator';
import { ReadingSession } from '../types/session';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTimeLabel(min: number) {
  if (min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtTimeClock(min: number) {
  if (min <= 0) return '--:--';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function dateStr(offsetDays: number) {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthPrefix() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function last7Days(sessions: ReadingSession[]) {
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i;
    const ds = dateStr(offset);
    const d = new Date(Date.now() - offset * 86400000);
    const pages = sessions
      .filter((s) => s.date === ds)
      .reduce((sum, s) => sum + Math.max(0, s.endPage - s.startPage), 0);
    const isToday = offset === 0;
    return { label: days[d.getDay()], pages, isToday };
  });
}

function mostByPages(sessions: ReadingSession[], key: keyof ReadingSession) {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    const k = String(s[key]);
    if (!k) continue;
    map[k] = (map[k] ?? 0) + Math.max(0, s.endPage - s.startPage);
  }
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? '—';
}

// ── Instrument sub-components ─────────────────────────────────────────────────

/** Horizontal segment gauge — N segments */
function SegGauge({
  filled,
  total = 12,
  height = 8,
  warn = false,
}: {
  filled: number;
  total?: number;
  height?: number;
  warn?: boolean;
}) {
  return (
    <View style={[sg.track, { height }]}>
      {Array.from({ length: total }).map((_, i) => {
        const on = i < filled;
        const isWarnZone = warn && i >= total - 2;
        return (
          <View
            key={i}
            style={[
              sg.seg,
              { height },
              on && (isWarnZone ? sg.segWarn : sg.segOn),
            ]}
          />
        );
      })}
    </View>
  );
}
const sg = StyleSheet.create({
  track: { flexDirection: 'row', gap: 2 },
  seg: { flex: 1, backgroundColor: Colors.lcdShadow, borderRadius: 1, opacity: 0.35 },
  segOn: { backgroundColor: Colors.lcdText, opacity: 1 },
  segWarn: { backgroundColor: Colors.statusWarning, opacity: 1 },
});

/** Vertical VU-meter column — 10 segments, fills from bottom */
function VuBar({
  pages,
  maxPages,
  label,
  isToday,
}: {
  pages: number;
  maxPages: number;
  label: string;
  isToday: boolean;
}) {
  const ROWS = 10;
  const filled = maxPages > 0 ? Math.round((pages / maxPages) * ROWS) : 0;
  return (
    <View style={vu.col}>
      <View style={vu.stack}>
        {Array.from({ length: ROWS }).map((_, i) => {
          const rowFromBottom = ROWS - 1 - i; // 0 = top, ROWS-1 = bottom
          const isOn = rowFromBottom < filled;
          const isPeak = isOn && rowFromBottom >= ROWS - 2; // top 2 = amber
          return (
            <View
              key={i}
              style={[
                vu.seg,
                isOn && vu.segOn,
                isPeak && vu.segPeak,
              ]}
            />
          );
        })}
      </View>
      <Text style={[vu.label, isToday && vu.labelToday]}>{label}</Text>
      {pages > 0 && <Text style={vu.value}>{pages}</Text>}
    </View>
  );
}
const vu = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', gap: 4 },
  stack: { gap: 2, width: '100%', alignItems: 'stretch' },
  seg: {
    height: 10,
    backgroundColor: Colors.lcdShadow,
    borderRadius: 1,
    opacity: 0.3,
  },
  segOn: { backgroundColor: Colors.lcdText, opacity: 1 },
  segPeak: { backgroundColor: Colors.statusWarning, opacity: 1 },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 0.5,
    color: Colors.textDisabled,
  },
  labelToday: { color: Colors.lcdText },
  value: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    color: Colors.lcdText,
  },
});

/** Analysis module row: LABEL ·········· VALUE  [gauge] */
function AnalysisRow({
  label,
  value,
  gaugeSegs,
  totalSegs = 12,
  warn = false,
}: {
  label: string;
  value: string;
  gaugeSegs?: number;
  totalSegs?: number;
  warn?: boolean;
}) {
  return (
    <View style={ar.row}>
      <Text style={ar.label}>{label}</Text>
      <View style={ar.dots} />
      <Text style={ar.value} numberOfLines={1}>{value}</Text>
      {gaugeSegs != null && (
        <SegGauge filled={gaugeSegs} total={totalSegs} height={7} warn={warn} />
      )}
    </View>
  );
}
const ar = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
    width: 130,
  },
  dots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  value: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.text,
    minWidth: 52,
    textAlign: 'right',
  },
});

// ── Section header (matches Home style) ──────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={hdr.row}>
      <Text style={hdr.label}>{label}</Text>
      <View style={hdr.rule} />
    </View>
  );
}
const hdr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  rule: { flex: 1, height: 1, backgroundColor: Colors.border },
});

// ── Main screen ───────────────────────────────────────────────────────────────

const WEEK_REF   = 300;   // pages/week reference max for primary bar
const EFF_REF    = 100;   // pages/hour reference max
const GAUGE_SEGS = 12;

export function MonitorScreen() {
  const { sessions, stats } = useSessions();
  const { books } = useBooks();

  const preCount  = useMemo(() => books.filter((b) => b.status === 'PRE').length,  [books]);
  const ingCount  = useMemo(() => books.filter((b) => b.status === 'ING').length,  [books]);
  const doneCount = useMemo(() => books.filter((b) => b.status === 'DONE').length, [books]);

  const streak    = useMemo(() => computeStreak(sessions), [sessions]);
  const weekDays  = useMemo(() => last7Days(sessions), [sessions]);
  const maxDay    = useMemo(() => Math.max(...weekDays.map((d) => d.pages), 1), [weekDays]);

  // ── Derived metrics ───────────────────────────────────────────────────────
  const effPph = stats.totalTimeMin > 0
    ? Math.round((stats.totalPages / stats.totalTimeMin) * 60)
    : 0;

  const avgSessionMin = stats.totalSessions > 0
    ? Math.round(stats.totalTimeMin / stats.totalSessions)
    : 0;

  const thisMonthBooks = useMemo(() => {
    const pfx = monthPrefix();
    return new Set(sessions.filter((s) => s.date.startsWith(pfx)).map((s) => s.bookId)).size;
  }, [sessions]);

  const mostAuthor   = useMemo(() => mostByPages(sessions, 'bookAuthor'), [sessions]);

  // ── Gauge fills ───────────────────────────────────────────────────────────
  const weekBarFill  = Math.round((Math.min(stats.weekPages, WEEK_REF) / WEEK_REF) * 20);
  const effFill      = Math.round((Math.min(effPph, EFF_REF) / EFF_REF) * GAUGE_SEGS);
  const avgFill      = Math.round((Math.min(avgSessionMin, 90) / 90) * GAUGE_SEGS);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>MONITOR</Text>
        <View style={styles.topBarLeds}>
          {[
            { label: 'SIG',  on: sessions.length > 0,        color: Colors.accentGreen },
            { label: 'REC',  on: stats.todaySessions > 0,    color: Colors.statusError },
            { label: 'PEAK', on: effPph > 60,                color: Colors.statusWarning },
          ].map(({ label, on, color }) => (
            <View key={label} style={styles.topLedWrap}>
              <View style={[styles.topLed, { backgroundColor: on ? color : Colors.metalDark }]} />
              <Text style={styles.topLedLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── CH-A · PRIMARY READOUT ── */}
        <SectionHeader label="CH-A  PRIMARY" />
        <LcdPanel padding={Spacing.md}>
          <View style={styles.primaryTopRow}>
            <Text style={styles.lcdCap}>THIS WEEK</Text>
            <Text style={styles.lcdCap}>{fmtTimeClock(stats.weekTimeMin)}</Text>
          </View>
          <Text style={styles.lcdBig}>{stats.weekPages > 0 ? stats.weekPages : '—'}</Text>
          <Text style={styles.lcdUnit}>PAGES</Text>
          <View style={{ marginTop: Spacing.sm }}>
            <SegGauge filled={weekBarFill} total={20} height={10} warn />
          </View>
          <View style={styles.primaryFootRow}>
            <Text style={styles.lcdSub}>SESSIONS  {stats.totalSessions}</Text>
            <Text style={styles.lcdSub}>BOOKS  {stats.uniqueBookCount}</Text>
          </View>
        </LcdPanel>

        {/* ── CH-B · CHANNEL METERS ── */}
        <SectionHeader label="CH-B  CHANNEL" />
        <View style={styles.gaugeGrid}>
          {[
            { ch: 'BOOKS',  val: String(stats.uniqueBookCount),       sub: 'TOTAL' },
            { ch: 'PAGES',  val: String(stats.totalPages),            sub: 'TOTAL' },
            { ch: 'TIME',   val: fmtTimeLabel(stats.totalTimeMin),    sub: 'ACCUM' },
            { ch: 'STREAK', val: streak > 0 ? `${streak}D` : '—',    sub: 'DAYS'  },
          ].map(({ ch, val, sub }) => (
            <View key={ch} style={styles.gaugeCell}>
              <LcdPanel padding={Spacing.sm}>
                <Text style={styles.gaugeCh}>{ch}</Text>
                <Text style={styles.gaugeVal} numberOfLines={1} adjustsFontSizeToFit>{val}</Text>
                <Text style={styles.gaugeSub}>{sub}</Text>
              </LcdPanel>
            </View>
          ))}
        </View>

        {/* ── CH-C · ANALYSIS MODULE ── */}
        <SectionHeader label="CH-C  ANALYSIS" />
        <View style={styles.analysisPanel}>
          <View style={styles.analysisPanelInner}>
            <AnalysisRow
              label="READING EFFICIENCY"
              value={effPph > 0 ? `${effPph} pp/h` : '—'}
              gaugeSegs={effFill}
              totalSegs={GAUGE_SEGS}
              warn
            />
            <View style={styles.analysisSep} />
            <AnalysisRow
              label="AVG SESSION"
              value={fmtTimeLabel(avgSessionMin)}
              gaugeSegs={avgFill}
              totalSegs={GAUGE_SEGS}
            />
            <View style={styles.analysisSep} />
            <AnalysisRow
              label="THIS MONTH"
              value={thisMonthBooks > 0 ? `${thisMonthBooks} titles` : '—'}
            />
            <View style={styles.analysisSep} />
            <AnalysisRow
              label="MOST READ AUTHOR"
              value={mostAuthor}
            />
            <View style={styles.analysisSep} />
            <AnalysisRow
              label="MOST READ CATEGORY"
              value="—"
            />
            <View style={styles.analysisSep} />
            <AnalysisRow label="PRE  (읽을 예정)"  value={`${preCount} books`} />
            <View style={styles.analysisSep} />
            <AnalysisRow label="ING  (읽는 중)"    value={`${ingCount} books`} gaugeSegs={ingCount > 0 ? Math.min(ingCount, GAUGE_SEGS) : 0} totalSegs={GAUGE_SEGS} />
            <View style={styles.analysisSep} />
            <AnalysisRow label="DONE  (완독)"      value={`${doneCount} books`} />
          </View>
        </View>

        {/* ── CH-D · 7-DAY LOG ── */}
        <SectionHeader label="CH-D  7-DAY LOG" />
        <View style={styles.vuPanel}>
          <View style={styles.vuMeter}>
            {weekDays.map(({ label, pages, isToday }) => (
              <VuBar
                key={label + String(isToday)}
                pages={pages}
                maxPages={maxDay}
                label={label}
                isToday={isToday}
              />
            ))}
          </View>
        </View>

        {/* ── CH-E · STATUS MATRIX ── */}
        <SectionHeader label="CH-E  STATUS" />
        <View style={styles.statusPanel}>
          {[
            { label: 'INPUT',   on: sessions.length > 0 },
            { label: 'OUTPUT',  on: stats.totalPages > 0 },
            { label: 'TODAY',   on: stats.todaySessions > 0 },
            { label: 'ACTIVE',  on: stats.uniqueBookCount > 0 },
            { label: 'STREAK',  on: streak > 0 },
            { label: 'PEAK',    on: effPph > 60 },
          ].map(({ label, on }) => (
            <View key={label} style={styles.statusCell}>
              <View style={[styles.statusLed, on && styles.statusLedOn]} />
              <Text style={[styles.statusLabel, on && styles.statusLabelOn]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.body },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: Colors.text,
  },
  topBarLeds: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  topLedWrap: { alignItems: 'center', gap: 3 },
  topLed: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  topLedLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  bottomPad: { height: Spacing.lg },

  // ── CH-A PRIMARY ─────────────────────────────────────────────────────────

  primaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  lcdCap: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.lcdTextDim,
  },
  lcdBig: {
    fontFamily: Typography.fontMono,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.lcdText,
    lineHeight: 52,
  },
  lcdUnit: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.lcdTextDim,
  },
  primaryFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  lcdSub: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
  },

  // ── CH-B CHANNEL GRID ────────────────────────────────────────────────────

  gaugeGrid: { flexDirection: 'row', gap: Spacing.sm },
  gaugeCell: { flex: 1 },
  gaugeCh: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
    marginBottom: 2,
  },
  gaugeVal: {
    fontFamily: Typography.fontMono,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.lcdText,
    letterSpacing: 0.5,
  },
  gaugeSub: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
    marginTop: 2,
  },

  // ── CH-C ANALYSIS MODULE ─────────────────────────────────────────────────

  analysisPanel: {
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 2,
    padding: 2,
    backgroundColor: Colors.lcdBackground,
  },
  analysisPanelInner: {
    borderWidth: Border.thin,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 1,
    backgroundColor: Colors.lcdBackground,
    overflow: 'hidden',
  },
  analysisSep: {
    height: 1,
    backgroundColor: Colors.lcdShadow,
    opacity: 0.5,
    marginHorizontal: Spacing.md,
  },

  // ── CH-D VU METER ────────────────────────────────────────────────────────

  vuPanel: {
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 2,
    padding: 2,
    backgroundColor: Colors.lcdBackground,
  },
  vuMeter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.lcdBackground,
    borderRadius: 1,
  },

  // ── CH-E STATUS MATRIX ───────────────────────────────────────────────────

  statusPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: 3,
    backgroundColor: Colors.metalMid,
    padding: Spacing.md,
    gap: Spacing.md,
    justifyContent: 'space-around',
  },
  statusCell: { alignItems: 'center', gap: 4, minWidth: 40 },
  statusLed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.metalDark,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  statusLedOn: { backgroundColor: Colors.accentGreen },
  statusLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },
  statusLabelOn: { color: Colors.textMuted },
});
