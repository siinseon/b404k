import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Border } from '../constants/theme';
import { useBooks } from '../store/bookStore';
import {
  pickAndParse,
  filterDuplicates,
  ParseResult,
  ImportRow,
} from '../services/importParser';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase =
  | { tag: 'ready' }
  | { tag: 'reading' }
  | { tag: 'preview'; result: ParseResult; unique: ImportRow[]; dupCount: number }
  | { tag: 'importing'; done: number; total: number }
  | { tag: 'complete'; imported: number; duplicates: number; errors: number }
  | { tag: 'error'; message: string };

// ── Sub-components ────────────────────────────────────────────────────────────

/** Status LED strip — READY / READING FILE / IMPORTING / COMPLETE */
function StatusLeds({ phase }: { phase: Phase['tag'] }) {
  const steps: { id: Phase['tag']; label: string }[] = [
    { id: 'ready',     label: 'READY' },
    { id: 'reading',   label: 'READING FILE' },
    { id: 'preview',   label: 'PREVIEW' },
    { id: 'importing', label: 'IMPORTING' },
    { id: 'complete',  label: 'COMPLETE' },
    { id: 'error',     label: 'ERROR' },
  ];
  const ORDER: Phase['tag'][] = ['ready', 'reading', 'preview', 'importing', 'complete', 'error'];
  const currentIdx = ORDER.indexOf(phase);

  return (
    <View style={sl.row}>
      {steps.map(({ id, label }, i) => {
        const idx = ORDER.indexOf(id);
        const isActive = idx === currentIdx;
        const isPast = idx < currentIdx;
        const dotColor = isActive
          ? Colors.accentGreen
          : isPast
          ? Colors.accentGreenDim
          : Colors.metalDark;
        return (
          <View key={id} style={sl.item}>
            <View style={[sl.dot, { backgroundColor: dotColor }]} />
            <Text style={[sl.label, isActive && sl.labelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const sl = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin,
    borderBottomColor: Colors.border,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },
  labelActive: { color: Colors.text },
});

/** Segment progress bar */
function SegBar({ filled, total = 20 }: { filled: number; total?: number }) {
  return (
    <View style={sb.track}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[sb.seg, i < filled && sb.segOn]} />
      ))}
    </View>
  );
}
const sb = StyleSheet.create({
  track: { flexDirection: 'row', gap: 2 },
  seg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.lcdShadow,
    borderRadius: 1,
    opacity: 0.35,
  },
  segOn: { backgroundColor: Colors.lcdText, opacity: 1 },
});

/** Key-value row with dotted separator — inside LCD panels */
function DataRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={dr.row}>
      <Text style={dr.key}>{label}</Text>
      <View style={dr.dots} />
      <Text style={[dr.val, highlight && dr.valHi]} numberOfLines={1}>{value}</Text>
    </View>
  );
}
const dr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  key: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
    width: 110,
  },
  dots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lcdShadow,
    borderStyle: 'dashed',
  },
  val: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.lcdText,
    minWidth: 60,
    textAlign: 'right',
    flexShrink: 1,
  },
  valHi: { color: Colors.accentGreenDim },
});

/** Action button (metallic, full-width) */
function ActionBtn({
  label,
  onPress,
  accent = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={disabled ? undefined : onPress}
      style={[
        btn.outer,
        accent && btn.outerAccent,
        disabled && btn.outerDisabled,
      ]}
    >
      <View style={[btn.face, accent && btn.faceAccent]}>
        <Text style={[btn.label, accent && btn.labelAccent, disabled && btn.labelDisabled]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
const btn = StyleSheet.create({
  outer: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 3,
    backgroundColor: Colors.metalMid,
  },
  outerAccent: {
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    backgroundColor: Colors.metalDark,
  },
  outerDisabled: { opacity: 0.45 },
  face: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    margin: 1,
    borderRadius: 2,
  },
  faceAccent: { backgroundColor: Colors.metalDark },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.text,
  },
  labelAccent: { color: Colors.accentGreen },
  labelDisabled: { color: Colors.textDisabled },
});

/** LCD outer frame */
function LcdFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={lf.outer}>
      <View style={lf.inner}>{children}</View>
    </View>
  );
}
const lf = StyleSheet.create({
  outer: {
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
    overflow: 'hidden',
  },
});

function LcdSep() {
  return <View style={{ height: 1, backgroundColor: Colors.lcdShadow, opacity: 0.5, marginHorizontal: Spacing.md }} />;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ImportScreen() {
  const navigation = useNavigation();
  const { books, importBooks } = useBooks();

  const [phase, setPhase] = useState<Phase>({ tag: 'ready' });

  const handlePickFile = useCallback(async () => {
    setPhase({ tag: 'reading' });
    try {
      const result = await pickAndParse();
      if (!result) {
        setPhase({ tag: 'ready' });
        return;
      }
      const { unique, duplicateCount } = filterDuplicates(result.rows, books);
      setPhase({ tag: 'preview', result, unique, dupCount: duplicateCount });
    } catch {
      setPhase({ tag: 'error', message: 'FILE READ ERROR' });
    }
  }, [books]);

  const handleImport = useCallback(async () => {
    if (phase.tag !== 'preview') return;
    const { unique, result } = phase;

    if (unique.length === 0) {
      setPhase({
        tag: 'complete',
        imported: 0,
        duplicates: phase.dupCount,
        errors: result.errors.length,
      });
      return;
    }

    setPhase({ tag: 'importing', done: 0, total: unique.length });

    try {
      // Batch import (single state update for performance)
      importBooks(
        unique.map((r) => ({
          title: r.title,
          author: r.author,
          publisher: r.publisher,
          isbn: r.isbn,
          totalPages: r.totalPages,
        })),
      );
    } catch {
      setPhase({ tag: 'error', message: 'IMPORT FAILED' });
      return;
    }

    setPhase({
      tag: 'complete',
      imported: unique.length,
      duplicates: phase.dupCount,
      errors: result.errors.length,
    });
  }, [phase, importBooks]);

  const handleReset = useCallback(() => {
    setPhase({ tag: 'ready' });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (phase.tag === 'preview' || phase.tag === 'complete' || phase.tag === 'error') {
          setPhase({ tag: 'ready' });
          return true;
        }
        if (phase.tag === 'reading' || phase.tag === 'importing') return true;
        return false;
      });

      return () => sub.remove();
    }, [phase.tag])
  );

  const currentTag = phase.tag;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>DATA IMPORT</Text>
        <View style={styles.topBarLed}>
          <View
            style={[
              styles.topLed,
              currentTag === 'complete' && styles.topLedGreen,
              (currentTag === 'reading' || currentTag === 'importing') && styles.topLedAmber,
            ]}
          />
        </View>
      </View>

      {/* Status LED strip */}
      <StatusLeds phase={currentTag} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── READY ── */}
        {phase.tag === 'ready' && (
          <>
            <LcdFrame>
              <View style={{ paddingVertical: Spacing.sm }}>
                <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }}>
                  <Text style={styles.lcdCap}>AWAITING INPUT</Text>
                </View>
                <LcdSep />
                <DataRow label="FORMAT  XLSX" value="MICROSOFT EXCEL" />
                <DataRow label="FORMAT  CSV" value="COMMA SEPARATED" />
                <LcdSep />
                <DataRow label="REQUIRED  TITLE" value="제목 / 도서명 / 책제목" />
                <DataRow label="REQUIRED  AUTHOR" value="저자 / 작가 / 글쓴이" />
                <LcdSep />
                <DataRow label="OPTIONAL" value="출판사 / ISBN / 페이지수" />
              </View>
            </LcdFrame>

            <ActionBtn
              label="SELECT FILE  ▶"
              accent
              onPress={handlePickFile}
            />
          </>
        )}

        {/* ── READING FILE ── */}
        {phase.tag === 'reading' && (
          <LcdFrame>
            <View style={styles.loadingBox}>
              <Text style={styles.lcdCap}>READING FILE</Text>
              <ActivityIndicator color={Colors.lcdText} style={{ marginVertical: Spacing.md }} />
              <Text style={styles.lcdDim}>PARSING COLUMNS...</Text>
            </View>
          </LcdFrame>
        )}

        {/* ── PREVIEW ── */}
        {phase.tag === 'preview' && (() => {
          const { result, unique, dupCount } = phase;
          const errCount = result.errors.length;
          const progFill = result.total > 0
            ? Math.round((unique.length / result.total) * 20)
            : 0;
          return (
            <>
              {/* File info */}
              <LcdFrame>
                <View style={{ paddingVertical: Spacing.sm }}>
                  <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }}>
                    <Text style={styles.lcdCap}>FILE LOADED</Text>
                  </View>
                  <LcdSep />
                  <DataRow label="FILENAME" value={result.filename} />
                  <DataRow label="FORMAT" value={result.format} />
                </View>
              </LcdFrame>

              {/* Parse summary */}
              <LcdFrame>
                <View style={{ paddingVertical: Spacing.sm }}>
                  <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }}>
                    <Text style={styles.lcdCap}>PARSE RESULT</Text>
                  </View>
                  <LcdSep />
                  <DataRow label="TOTAL ROWS" value={String(result.total)} />
                  <DataRow label="VALID BOOKS" value={String(result.rows.length)} />
                  <DataRow label="DUPLICATES" value={String(dupCount)} />
                  <DataRow label="ERRORS" value={String(errCount)} />
                  <LcdSep />
                  <DataRow label="TO IMPORT" value={`${unique.length} BOOKS`} highlight />
                  <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs }}>
                    <SegBar filled={progFill} />
                  </View>
                </View>
              </LcdFrame>

              {/* Error list (max 5 shown) */}
              {errCount > 0 && (
                <LcdFrame>
                  <View style={{ paddingVertical: Spacing.sm }}>
                    <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }}>
                      <Text style={styles.lcdCap}>ERRORS  ({errCount})</Text>
                    </View>
                    <LcdSep />
                    {result.errors.slice(0, 5).map((e) => (
                      <View key={e.row} style={styles.errRow}>
                        <Text style={styles.errRowNum}>ROW {String(e.row).padStart(3, '0')}</Text>
                        <Text style={styles.errReason}>{e.reason}</Text>
                      </View>
                    ))}
                    {errCount > 5 && (
                      <View style={{ paddingHorizontal: Spacing.md, paddingTop: 4 }}>
                        <Text style={styles.lcdDim}>... AND {errCount - 5} MORE</Text>
                      </View>
                    )}
                  </View>
                </LcdFrame>
              )}

              {/* Actions */}
              <View style={styles.btnRow}>
                <View style={{ flex: 1 }}>
                  <ActionBtn label="CANCEL" onPress={handleReset} />
                </View>
                <View style={{ flex: 2 }}>
                  <ActionBtn
                    label={`IMPORT  ${unique.length} BOOKS  ▶`}
                    accent
                    disabled={unique.length === 0}
                    onPress={handleImport}
                  />
                </View>
              </View>
            </>
          );
        })()}

        {/* ── IMPORTING ── */}
        {phase.tag === 'importing' && (
          <LcdFrame>
            <View style={styles.loadingBox}>
              <Text style={styles.lcdCap}>IMPORTING</Text>
              <ActivityIndicator color={Colors.lcdText} style={{ marginVertical: Spacing.md }} />
              <Text style={styles.lcdBig}>{phase.done}</Text>
              <Text style={styles.lcdDim}>/ {phase.total} BOOKS</Text>
            </View>
          </LcdFrame>
        )}

        {/* ── COMPLETE ── */}
        {phase.tag === 'complete' && (
          <>
            <LcdFrame>
              <View style={{ paddingVertical: Spacing.sm }}>
                <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }}>
                  <Text style={styles.lcdCap}>TRANSFER COMPLETE</Text>
                </View>
                <LcdSep />
                <View style={styles.completeBig}>
                  <Text style={styles.lcdBig}>{phase.imported}</Text>
                  <Text style={styles.lcdUnit}>BOOKS IMPORTED</Text>
                </View>
                <LcdSep />
                <DataRow label="IMPORTED" value={`${phase.imported} BOOKS`} highlight />
                <DataRow label="DUPLICATES SKIPPED" value={`${phase.duplicates} BOOKS`} />
                <DataRow label="PARSE ERRORS" value={`${phase.errors} ROWS`} />
              </View>
            </LcdFrame>

            <View style={styles.btnRow}>
              <View style={{ flex: 1 }}>
                <ActionBtn label="IMPORT MORE" onPress={handleReset} />
              </View>
              <View style={{ flex: 1 }}>
                <ActionBtn
                  label="DONE  ▶"
                  accent
                  onPress={() => navigation.goBack()}
                />
              </View>
            </View>
          </>
        )}

        {/* ── ERROR ── */}
        {phase.tag === 'error' && (
          <>
            <LcdFrame>
              <View style={{ paddingVertical: Spacing.sm }}>
                <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }}>
                  <Text style={styles.lcdCap}>IMPORT ERROR</Text>
                </View>
                <LcdSep />
                <DataRow label="STATUS" value={phase.message} />
              </View>
            </LcdFrame>

            <ActionBtn
              label="TRY AGAIN  ▶"
              accent
              onPress={handleReset}
            />
          </>
        )}

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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: Spacing.md },
  backIcon: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    color: Colors.textMuted,
  },
  topBarTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: Colors.text,
    flex: 1,
  },
  topBarLed: { alignItems: 'center', justifyContent: 'center' },
  topLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.metalDark,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  topLedGreen: { backgroundColor: Colors.accentGreen },
  topLedAmber: { backgroundColor: Colors.statusWarning },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  bottomPad: { height: Spacing.lg * 2 },

  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // LCD text styles
  lcdCap: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.lcdTextDim,
  },
  lcdBig: {
    fontFamily: Typography.fontMono,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.lcdText,
    lineHeight: 52,
    textAlign: 'center',
  },
  lcdUnit: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.lcdTextDim,
    textAlign: 'center',
    marginTop: 2,
  },
  lcdDim: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
    textAlign: 'center',
  },

  loadingBox: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },

  completeBig: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },

  // Error rows
  errRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  errRowNum: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.lcdTextDim,
    width: 50,
  },
  errReason: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.statusError,
    letterSpacing: 0.5,
  },
});
