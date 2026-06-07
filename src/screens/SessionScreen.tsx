import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Border } from '../constants/theme';
import { useBooks } from '../store/bookStore';
import { useSessions } from '../store/sessionStore';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BookStatus } from '../types/book';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Session'>;
type Route = RouteProp<RootStackParamList, 'Session'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={sl.row}>
      <Text style={sl.text}>{text}</Text>
      <View style={sl.rule} />
    </View>
  );
}
const sl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  text: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  rule: { flex: 1, height: 1, backgroundColor: Colors.border },
});

/** Status selector — 3 physical LED buttons */
function StatusSelector({
  value,
  onChange,
}: {
  value: BookStatus;
  onChange: (s: BookStatus) => void;
}) {
  const OPTIONS: { key: BookStatus; label: string; sub: string }[] = [
    { key: 'PRE',  label: 'PRE',  sub: '읽을 예정' },
    { key: 'ING',  label: 'ING',  sub: '읽는 중' },
    { key: 'DONE', label: 'DONE', sub: '완독' },
  ];
  return (
    <View style={ss.row}>
      {OPTIONS.map(({ key, label, sub }) => {
        const active = value === key;
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.7}
            onPress={() => onChange(key)}
            style={[ss.btn, active && ss.btnActive]}
          >
            <View style={[ss.face, active && ss.faceActive]}>
              <View style={[ss.led, active && ss.ledActive]} />
              <Text style={[ss.label, active && ss.labelActive]}>{label}</Text>
              <Text style={[ss.sub, active && ss.subActive]}>{sub}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const ss = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  btn: {
    flex: 1,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 3,
    backgroundColor: Colors.metalMid,
    minHeight: 64,
  },
  btnActive: {
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    backgroundColor: Colors.metalDark,
  },
  face: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    margin: 1,
    borderRadius: 2,
    paddingVertical: Spacing.sm,
  },
  faceActive: { backgroundColor: Colors.metalDark },
  led: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.metalDark,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  ledActive: { backgroundColor: Colors.accentGreen },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  labelActive: { color: Colors.accentGreen },
  sub: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
  subActive: { color: Colors.accentGreenDim },
});

/** LCD text field */
function LcdField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'numeric';
  multiline?: boolean;
  numberOfLines?: number;
  hint?: string;
}) {
  return (
    <View style={lf.wrap}>
      <View style={lf.labelRow}>
        <Text style={lf.label}>{label}</Text>
        {hint ? <Text style={lf.hint}>{hint}</Text> : null}
      </View>
      <View style={lf.outer}>
        <View style={lf.inner}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.lcdTextDim}
            style={[lf.input, multiline && { height: numberOfLines * 22, textAlignVertical: 'top' }]}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );
}
const lf = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },
  hint: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },
  outer: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: 2,
    backgroundColor: Colors.lcdBackground,
    padding: 1,
  },
  inner: {
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 1,
    backgroundColor: Colors.lcdBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    color: Colors.lcdText,
    padding: 0,
    margin: 0,
  },
});

/** Book selector (Discman track-style) */
function BookSelector({
  bookIndex,
  books,
  onPrev,
  onNext,
}: {
  bookIndex: number;
  books: { id: string; title: string; author: string; status: BookStatus }[];
  onPrev: () => void;
  onNext: () => void;
}) {
  const book = books[bookIndex];
  return (
    <View style={bs.outer}>
      <View style={bs.inner}>
        <View style={bs.topRow}>
          <Text style={bs.trackLabel}>BOOK</Text>
          <Text style={bs.trackNum}>
            {String(bookIndex + 1).padStart(2, '0')} / {String(books.length).padStart(2, '0')}
          </Text>
        </View>
        <View style={bs.display}>
          <TouchableOpacity
            onPress={onPrev}
            disabled={books.length <= 1}
            activeOpacity={0.7}
            style={[bs.navBtn, books.length <= 1 && { opacity: 0.3 }]}
          >
            <View style={bs.navBtnFace}>
              <Text style={bs.navBtnIcon}>◀◀</Text>
            </View>
          </TouchableOpacity>
          <View style={bs.titleArea}>
            {book ? (
              <>
                <Text style={bs.title} numberOfLines={2}>{book.title}</Text>
                <Text style={bs.author} numberOfLines={1}>{book.author}</Text>
                <View style={bs.statusBadge}>
                  <Text style={bs.statusText}>{book.status}</Text>
                </View>
              </>
            ) : (
              <Text style={bs.noBook}>NO BOOK SELECTED</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onNext}
            disabled={books.length <= 1}
            activeOpacity={0.7}
            style={[bs.navBtn, books.length <= 1 && { opacity: 0.3 }]}
          >
            <View style={bs.navBtnFace}>
              <Text style={bs.navBtnIcon}>▶▶</Text>
            </View>
          </TouchableOpacity>
        </View>
        {books.length > 1 && (
          <View style={bs.dotRow}>
            {books.map((_, i) => (
              <View key={i} style={[bs.dot, i === bookIndex && bs.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
const bs = StyleSheet.create({
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
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 1,
    backgroundColor: Colors.lcdBackground,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trackLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.lcdTextDim,
  },
  trackNum: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
  },
  display: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  navBtn: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
  },
  navBtnFace: {
    margin: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  navBtnIcon: { fontFamily: Typography.fontMono, fontSize: 10, color: Colors.text },
  titleArea: { flex: 1, gap: 3 },
  title: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lcdText,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  author: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: Colors.lcdTextDim,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: Border.thin,
    borderColor: Colors.lcdShadow,
    borderRadius: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  statusText: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.lcdTextDim,
  },
  noBook: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    color: Colors.lcdTextDim,
    letterSpacing: 1,
  },
  dotRow: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lcdShadow,
  },
  dotActive: { backgroundColor: Colors.lcdText },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export function SessionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const bookId = route.params?.bookId;

  const { books, updateBookStatus } = useBooks();
  const { addSession } = useSessions();

  const [bookIndex, setBookIndex] = useState(0);
  const [bookInitialized, setBookInitialized] = useState(false);

  // Pre-select book from navigation params
  useEffect(() => {
    if (bookInitialized || books.length === 0) return;
    if (bookId) {
      const idx = books.findIndex((b) => b.id === bookId);
      if (idx >= 0) setBookIndex(idx);
    }
    setBookInitialized(true);
  }, [books, bookId, bookInitialized]);

  const selectedBook = books[bookIndex];

  // Derive initial status from selected book
  const [status, setStatus] = useState<BookStatus>(selectedBook?.status ?? 'ING');

  // Sync status when book changes
  useEffect(() => {
    if (selectedBook) setStatus(selectedBook.status);
  }, [bookIndex, selectedBook?.id]);

  // Form fields
  const [date, setDate] = useState(todayISO());
  const [currentPage, setCurrentPage] = useState('');
  const [timeH, setTimeH] = useState('');
  const [timeM, setTimeM] = useState('');
  const [memo, setMemo] = useState('');

  const handlePrev = useCallback(() => {
    setBookIndex((i) => (i > 0 ? i - 1 : books.length - 1));
  }, [books.length]);

  const handleNext = useCallback(() => {
    setBookIndex((i) => (i < books.length - 1 ? i + 1 : 0));
  }, [books.length]);

  const handleSave = useCallback(() => {
    if (!selectedBook) {
      Alert.alert('오류', 'Archive에 책이 없습니다. 먼저 책을 추가하세요.');
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('오류', '날짜 형식을 확인하세요. (YYYY-MM-DD)');
      return;
    }

    const totalMin = (parseInt(timeH || '0', 10) * 60) + parseInt(timeM || '0', 10);
    const cp = currentPage.trim() ? parseInt(currentPage, 10) : undefined;

    // Update book status
    updateBookStatus(selectedBook.id, status);

    // Save session record
    addSession({
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      bookAuthor: selectedBook.author,
      date,
      bookStatus: status,
      currentPage: cp && !isNaN(cp) ? cp : undefined,
      readingTimeMin: totalMin,
      memo: memo.trim() || undefined,
    });

    Alert.alert(
      'SAVED',
      `기록이 저장되었습니다.\n상태: ${status}${cp ? `  /  PAGE: ${cp}` : ''}`,
      [{ text: '확인', onPress: () => navigation.goBack() }]
    );
  }, [
    selectedBook, date, status, currentPage, timeH, timeM, memo,
    addSession, updateBookStatus, navigation,
  ]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75} style={styles.backBtn}>
          <View style={styles.backBtnFace}>
            <Text style={styles.backBtnLabel}>◀ BACK</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>REC SESSION</Text>
        <View style={styles.recIndicator}>
          <View style={styles.recLed} />
          <Text style={styles.recLabel}>REC</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── BOOK ── */}
          <SectionLabel text="BOOK" />
          {books.length === 0 ? (
            <View style={styles.noBookWarn}>
              <Text style={styles.noBookText}>NO BOOKS IN ARCHIVE</Text>
              <Text style={styles.noBookHint}>ADD BOOKS VIA BOOK SEARCH</Text>
            </View>
          ) : (
            <BookSelector
              bookIndex={bookIndex}
              books={books}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          )}

          {/* ── STATUS ── */}
          <SectionLabel text="STATUS" />
          <StatusSelector value={status} onChange={setStatus} />

          {/* ── DATE ── */}
          <SectionLabel text="DATE" />
          <LcdField
            label="DATE"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            hint="YYYY-MM-DD"
          />

          {/* ── CURRENT PAGE (선택) ── */}
          <SectionLabel text="CURRENT PAGE  (OPTIONAL)" />
          <LcdField
            label="CURRENT PAGE"
            value={currentPage}
            onChangeText={(t) => setCurrentPage(t.replace(/\D/g, ''))}
            placeholder="—"
            keyboardType="number-pad"
            hint="입력하지 않아도 됩니다"
          />

          {/* ── READING TIME ── */}
          <SectionLabel text="READING TIME  (OPTIONAL)" />
          <View style={styles.timeRow}>
            <View style={styles.timeCell}>
              <LcdField
                label="HOURS"
                value={timeH}
                onChangeText={(t) => setTimeH(t.replace(/\D/g, '').slice(0, 2))}
                placeholder="0"
                keyboardType="number-pad"
                hint="H"
              />
            </View>
            <View style={styles.timeSep}>
              <Text style={styles.timeSepText}>:</Text>
            </View>
            <View style={styles.timeCell}>
              <LcdField
                label="MINUTES"
                value={timeM}
                onChangeText={(t) => setTimeM(t.replace(/\D/g, '').slice(0, 2))}
                placeholder="00"
                keyboardType="number-pad"
                hint="M"
              />
            </View>
          </View>

          {/* ── MEMO ── */}
          <SectionLabel text="MEMO  (OPTIONAL)" />
          <LcdField
            label="MEMO"
            value={memo}
            onChangeText={setMemo}
            placeholder="Optional note..."
            multiline
            numberOfLines={4}
          />

          {/* ── SAVE ── */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.75}
            style={styles.saveBtn}
          >
            <View style={styles.saveBtnFace}>
              <View style={styles.saveLed} />
              <Text style={styles.saveBtnLabel}>SAVE LOG</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.body },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.regular,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: Colors.text,
  },
  backBtn: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
  },
  backBtnFace: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, margin: 1 },
  backBtnLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.text,
  },
  recIndicator: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  recLed: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  recLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.statusError,
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  bottomPad: { height: 80 },

  noBookWarn: {
    borderWidth: Border.thin,
    borderColor: Colors.border,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  noBookText: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textDisabled,
  },
  noBookHint: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },

  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs },
  timeCell: { flex: 1 },
  timeSep: { paddingBottom: Spacing.sm, alignItems: 'center', width: 20 },
  timeSepText: {
    fontFamily: Typography.fontMono,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMuted,
    lineHeight: 28,
  },

  saveBtn: {
    marginTop: Spacing.md,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: 3,
    backgroundColor: Colors.metalDark,
  },
  saveBtnFace: {
    margin: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    borderRadius: 2,
    backgroundColor: Colors.metalDark,
  },
  saveLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
  },
  saveBtnLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    color: Colors.accentGreen,
  },
});
