import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Border, Shadows } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useSessions } from '../store/sessionStore';
import { useBooks } from '../store/bookStore';
import { computeStreak, fmtHM } from '../utils/statsCalculator';
import { sessionPages } from '../utils/sessionMetrics';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const PROG_SEGS = 12;
const SPEAKER_HOLES = 54;
const DISC_DOTS = 16;

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '--.--.--';
  const [y, m, d] = dateStr.split('-');
  return `${String(y).slice(2)}.${m ?? '--'}.${d ?? '--'}`;
}

function DeviceButton({
  label,
  sub,
  onPress,
  wide = false,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[db.outer, wide && db.outerWide]}
    >
      <View style={db.face}>
        <Text style={db.label} numberOfLines={1}>{label}</Text>
        {sub ? <Text style={db.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const db = StyleSheet.create({
  outer: {
    minWidth: 76,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 22,
    backgroundColor: Colors.metalMid,
  },
  outerWide: {
    minWidth: 108,
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.metalLight,
  },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.text,
  },
  sub: {
    marginTop: 1,
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
});

function LcdStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={ls.cell}>
      <Text style={ls.value} numberOfLines={1}>{value}</Text>
      <Text style={ls.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const ls = StyleSheet.create({
  cell: {
    flex: 1,
    borderWidth: Border.thin,
    borderColor: Colors.lcdShadow,
    backgroundColor: 'rgba(56, 69, 47, 0.06)',
    paddingVertical: 5,
    paddingHorizontal: 5,
    minWidth: 0,
  },
  value: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.lcdText,
    lineHeight: 15,
    textAlign: 'center',
  },
  label: {
    marginTop: 1,
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 0.8,
    color: Colors.lcdTextDim,
    textAlign: 'center',
  },
});

function DirectionPad({
  onAdd,
  onMonitor,
  onArchive,
  onLog,
  onSession,
}: {
  onAdd: () => void;
  onMonitor: () => void;
  onArchive: () => void;
  onLog: () => void;
  onSession: () => void;
}) {
  return (
    <View style={dp.outerRing}>
      <View style={dp.innerRing}>
        <TouchableOpacity activeOpacity={0.75} onPress={onMonitor} style={[dp.dirBtn, dp.upBtn]}>
          <Text style={dp.dirIcon}>▲</Text>
          <Text style={dp.dirLabel}>MON</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} onPress={onLog} style={[dp.dirBtn, dp.leftBtn]}>
          <Text style={dp.dirIcon}>◀</Text>
          <Text style={dp.dirLabel}>LOG</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} onPress={onArchive} style={[dp.dirBtn, dp.rightBtn]}>
          <Text style={dp.dirIcon}>▶</Text>
          <Text style={dp.dirLabel}>ARC</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} onPress={onSession} style={[dp.dirBtn, dp.downBtn]}>
          <Text style={dp.dirIcon}>▼</Text>
          <Text style={dp.dirLabel}>REC</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.72} onPress={onAdd} style={dp.centerBtn}>
          <Text style={dp.centerIcon}>＋</Text>
          <Text style={dp.centerLabel}>ADD</Text>
          <Text style={dp.centerSub}>BOOK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dp = StyleSheet.create({
  outerRing: {
    width: 214,
    height: 214,
    borderRadius: 107,
    borderWidth: Border.thick,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    backgroundColor: Colors.metalMid,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  innerRing: {
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    backgroundColor: Colors.metalLight,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 50,
  },
  upBtn: { top: 8, left: 65 },
  leftBtn: { top: 69, left: 7 },
  rightBtn: { top: 69, right: 7 },
  downBtn: { bottom: 8, left: 65 },
  dirIcon: {
    fontFamily: Typography.fontMono,
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  dirLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  centerBtn: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    fontFamily: Typography.fontMono,
    fontSize: 20,
    color: Colors.lcdText,
    lineHeight: 22,
  },
  centerLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.text,
  },
  centerSub: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1.2,
    color: Colors.textMuted,
  },
});

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { sessions, stats, loaded: sessionsLoaded } = useSessions();
  const { books, loaded: booksLoaded } = useBooks();
  const loaded = sessionsLoaded && booksLoaded;

  const activeBooks = useMemo(() => books.filter((b) => b.status === 'ING'), [books]);

  const { currentBook, currentPage, lastLogDate, progressPct, bookId } = useMemo(() => {
    const pool = activeBooks.length > 0
      ? activeBooks
      : [...books].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 1);

    if (pool.length === 0) {
      return { currentBook: null, currentPage: 0, lastLogDate: null, progressPct: null, bookId: null };
    }

    const ranked = pool.map((book) => {
      const bookSessions = sessions.filter((s) => s.bookId === book.id);
      const latestSession = bookSessions[0] ?? null;
      return { book, latestSession, bookSessions };
    }).sort((a, b) => {
      const aDate = a.latestSession?.savedAt ?? a.book.updatedAt;
      const bDate = b.latestSession?.savedAt ?? b.book.updatedAt;
      return bDate - aDate;
    });

    const { book, latestSession, bookSessions } = ranked[0];
    const curPage = latestSession?.currentPage
      ?? bookSessions.reduce((max, s) => Math.max(max, s.endPage ?? 0), 0);
    const pct = book.totalPages && curPage
      ? Math.min(100, Math.round((curPage / book.totalPages) * 100))
      : null;

    return {
      currentBook: book,
      currentPage: curPage,
      lastLogDate: latestSession?.date ?? null,
      progressPct: pct,
      bookId: book.id,
    };
  }, [activeBooks, books, sessions]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const todayPages = stats.todayPages;
  const totalPages = stats.totalPages;
  const recentSession = sessions[0] ?? null;
  const recentPages = recentSession ? sessionPages(recentSession) : 0;
  const filledSegs = progressPct != null
    ? Math.round((progressPct / 100) * PROG_SEGS)
    : 0;

  const goAdd = () => navigation.navigate('BookSearch');
  const goSession = () => navigation.navigate('Session', bookId ? { bookId } : undefined);
  const goMonitor = () => navigation.navigate('MainTabs', { screen: 'Monitor' });
  const goArchive = () => navigation.navigate('MainTabs', { screen: 'Archive' });
  const goLog = () => navigation.navigate('MainTabs', { screen: 'Log' });
  const goStats = () => navigation.navigate('Stats');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.device}>
          <View style={styles.topHardware}>
            <Text style={styles.brand}>B404K</Text>
            <View style={styles.powerBlock}>
              <Text style={styles.powerText}>POWER</Text>
              <View style={[styles.powerLed, loaded && styles.powerLedOn]} />
            </View>
          </View>

          <View style={styles.speakerGrid}>
            {Array.from({ length: SPEAKER_HOLES }).map((_, i) => (
              <View key={i} style={styles.speakerHole} />
            ))}
          </View>

          <View style={styles.discArea}>
            <View style={styles.discCircle}>
              <Text style={styles.discLabel}>Bookman</Text>
              <Text style={styles.discSub}>PERSONAL READING DEVICE</Text>
              <View style={styles.discDots}>
                {Array.from({ length: DISC_DOTS }).map((_, i) => (
                  <View key={i} style={[styles.discDot, i < Math.min(books.length, DISC_DOTS) && styles.discDotOn]} />
                ))}
              </View>
            </View>

            <View style={styles.lcdFrame}>
              <View style={styles.lcdInner}>
                <View style={styles.lcdTopRow}>
                  <Text style={styles.lcdTiny}>WELCOME TO</Text>
                  <Text style={styles.lcdTiny}>MDLP</Text>
                </View>
                <Text style={styles.lcdTitle}>BOOK RIG</Text>
                <Text style={styles.lcdSubtitle}>PERSONAL READING DEVICE</Text>
                <View style={styles.lcdRule} />

                <Text style={styles.lcdSection}>NOW READING</Text>
                <Text style={styles.lcdBookTitle} numberOfLines={2}>
                  {!loaded ? 'INITIALIZING READING SYSTEM...' : currentBook?.title ?? 'INSERT BOOK. PRESS ADD.'}
                </Text>
                <Text style={styles.lcdAuthor} numberOfLines={1}>
                  {!loaded ? 'PLEASE WAIT' : currentBook?.author ?? 'NO ACTIVE BOOK'}
                </Text>

                <View style={styles.lcdMetaRow}>
                  <Text style={styles.lcdMeta}>PAGE {currentPage > 0 ? currentPage : '--'}</Text>
                  <Text style={styles.lcdMeta}>LAST {fmtDate(lastLogDate)}</Text>
                </View>

                <View style={styles.lcdProgressRow}>
                  <View style={styles.lcdProgressTrack}>
                    {Array.from({ length: PROG_SEGS }).map((_, i) => (
                      <View key={i} style={[styles.lcdSeg, i < filledSegs && styles.lcdSegOn]} />
                    ))}
                  </View>
                  <Text style={styles.lcdPct}>{progressPct != null ? `${progressPct}%` : '---'}</Text>
                </View>

                <View style={styles.lcdStatsGrid}>
                  <LcdStat label="TODAY" value={loaded ? String(todayPages) : '--'} />
                  <LcdStat label="WEEK" value={loaded ? String(stats.weekPages) : '--'} />
                  <LcdStat label="TOTAL" value={loaded ? String(totalPages) : '--'} />
                </View>
                <View style={styles.lcdStatsGrid}>
                  <LcdStat label="TIME" value={loaded ? fmtHM(stats.totalTimeMin) : '--'} />
                  <LcdStat label="STREAK" value={loaded ? `${streak}D` : '--'} />
                  <LcdStat label="BOOKS" value={loaded ? String(books.length) : '--'} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statusStrip}>
            <View style={styles.statusItem}>
              <View style={[styles.statusLed, activeBooks.length > 0 && styles.statusLedGreen]} />
              <Text style={styles.statusText}>ACTIVE {activeBooks.length}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusLed, stats.todaySessions > 0 && styles.statusLedRed]} />
              <Text style={styles.statusText}>REC {stats.todaySessions}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusLed, sessions.length > 0 && styles.statusLedAmber]} />
              <Text style={styles.statusText}>LOG {sessions.length}</Text>
            </View>
          </View>

          <View style={styles.smallButtonsRow}>
            <DeviceButton label="MENU" sub="STATS" onPress={goStats} />
            <DeviceButton label="MONITOR" sub="SIGNAL" onPress={goMonitor} wide />
            <DeviceButton label="BACK" sub="LOG" onPress={goLog} />
          </View>

          <DirectionPad
            onAdd={goAdd}
            onMonitor={goMonitor}
            onArchive={goArchive}
            onLog={goLog}
            onSession={goSession}
          />

          <View style={styles.transportRow}>
            <DeviceButton label="LOG" sub={recentSession ? `${recentPages}PP` : 'EMPTY'} onPress={goLog} />
            <DeviceButton label="SESSION" sub="REC" onPress={goSession} wide />
            <DeviceButton label="ARCHIVE" sub={`${books.length} FILES`} onPress={goArchive} />
          </View>

          <View style={styles.footerPlate}>
            <Text style={styles.footerText}>COMPACT BOOK RIG</Text>
            <Text style={styles.footerText}>v1.0  NET-RD</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#10100F',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  device: {
    flex: 1,
    minHeight: 760,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 18,
    backgroundColor: Colors.body,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  topHardware: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: Typography.fontMono,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 3,
    color: Colors.text,
  },
  powerBlock: {
    alignItems: 'center',
    gap: 4,
  },
  powerText: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.text,
  },
  powerLed: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: Border.thin,
    borderColor: Colors.metalShadow,
    backgroundColor: Colors.metalDark,
  },
  powerLedOn: {
    backgroundColor: Colors.accentGreen,
  },
  speakerGrid: {
    width: 185,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginLeft: Spacing.xs,
    marginTop: -2,
  },
  speakerHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#202020',
  },
  discArea: {
    minHeight: 336,
    position: 'relative',
    justifyContent: 'center',
  },
  discCircle: {
    position: 'absolute',
    left: -84,
    top: 12,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#1E1E1D',
    borderWidth: Border.regular,
    borderTopColor: '#565653',
    borderLeftColor: '#565653',
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    paddingTop: 74,
    paddingLeft: 108,
  },
  discLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -1,
    color: '#DADAD4',
  },
  discSub: {
    marginTop: 2,
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: '#B8B8B0',
  },
  discDots: {
    width: 58,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 24,
  },
  discDot: {
    width: 9,
    height: 9,
    borderRadius: 1,
    backgroundColor: '#380B0B',
  },
  discDotOn: {
    backgroundColor: '#D71919',
  },
  lcdFrame: {
    width: '72%',
    minHeight: 270,
    alignSelf: 'flex-start',
    marginLeft: Spacing.lg,
    borderWidth: Border.thick,
    borderTopColor: '#1B1B1A',
    borderLeftColor: '#1B1B1A',
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: 14,
    padding: 7,
    backgroundColor: '#262625',
  },
  lcdInner: {
    flex: 1,
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 4,
    backgroundColor: Colors.lcdBackground,
    padding: Spacing.md,
    gap: 5,
  },
  lcdTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lcdTiny: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
  },
  lcdTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.lcdText,
    lineHeight: 30,
  },
  lcdSubtitle: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.lcdText,
  },
  lcdRule: {
    height: 1,
    backgroundColor: Colors.lcdTextDim,
    opacity: 0.6,
    marginVertical: 4,
  },
  lcdSection: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.lcdTextDim,
  },
  lcdBookTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: Colors.lcdText,
    lineHeight: 17,
  },
  lcdAuthor: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.lcdTextDim,
  },
  lcdMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  lcdMeta: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 0.7,
    color: Colors.lcdTextDim,
  },
  lcdProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  lcdProgressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  lcdSeg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.lcdShadow,
    opacity: 0.45,
  },
  lcdSegOn: {
    backgroundColor: Colors.lcdText,
    opacity: 1,
  },
  lcdPct: {
    width: 36,
    fontFamily: Typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    color: Colors.lcdText,
  },
  lcdStatsGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 3,
    backgroundColor: Colors.panel,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
    backgroundColor: Colors.metalDark,
  },
  statusLedGreen: {
    backgroundColor: Colors.accentGreen,
  },
  statusLedRed: {
    backgroundColor: Colors.statusError,
  },
  statusLedAmber: {
    backgroundColor: Colors.statusWarning,
  },
  statusText: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  smallButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerPlate: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.text,
    textDecorationLine: 'underline',
  },
});
