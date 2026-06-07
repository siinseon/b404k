import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Border, Shadows } from '../constants/theme';
import { useBooks } from '../store/bookStore';
import {
  AladinItem,
  searchByTitle,
  searchByAuthor,
  searchByISBN,
  cleanAuthor,
  pubYear,
} from '../services/aladinApi';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookSearch'>;
type Mode = 'TITLE' | 'AUTHOR' | 'ISBN' | 'MANUAL';

// ── Error message mapper ──────────────────────────────────────────────────────

function describeError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === 'API_KEY_NOT_SET') return 'API KEY NOT SET — src/config.ts 확인';
    if (e.message === 'NETWORK_ERROR') return 'NETWORK ERROR — 연결 상태 확인';
    if (e.message === 'PARSE_ERROR') return 'RESPONSE ERROR — API 응답 파싱 실패';
  }
  return 'UNKNOWN ERROR';
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function ModeBtn({ label, active, onPress }: { label: Mode; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[mb.btn, active && mb.btnActive]}>
      <Text style={[mb.label, active && mb.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const mb = StyleSheet.create({
  btn: {
    flex: 1,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  btnActive: {
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    backgroundColor: Colors.metalDark,
  },
  label: {
    fontFamily: Typography.fontMono, fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, color: Colors.textMuted,
  },
  labelActive: { color: Colors.accentGreen },
});

function LcdInput({
  value, onChangeText, placeholder,
  keyboardType = 'default', onSubmit,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  onSubmit?: () => void;
}) {
  return (
    <View style={li.outer}>
      <View style={li.inner}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.lcdTextDim}
          style={li.input}
          keyboardType={keyboardType}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}
const li = StyleSheet.create({
  outer: {
    flex: 1,
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
    flex: 1,
    borderWidth: Border.thin,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 1,
    backgroundColor: Colors.lcdBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  input: {
    fontFamily: Typography.fontMono, fontSize: 13, color: Colors.lcdText,
    padding: 0, margin: 0,
  },
});

function SearchBtn({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.75}
      style={[sb.outer, loading && { opacity: 0.5 }]}>
      <View style={sb.face}>
        {loading
          ? <ActivityIndicator size="small" color={Colors.lcdText} />
          : <Text style={sb.label}>SEARCH</Text>}
      </View>
    </TouchableOpacity>
  );
}
const sb = StyleSheet.create({
  outer: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
    minWidth: 72,
  },
  face: {
    flex: 1, margin: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  label: {
    fontFamily: Typography.fontMono, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, color: Colors.text,
  },
});

// ── Book cover thumbnail ──────────────────────────────────────────────────────

function CoverThumb({ uri }: { uri?: string }) {
  const [err, setErr] = useState(false);
  if (!uri || err) {
    return (
      <View style={ct.placeholder}>
        <Text style={ct.placeholderIcon}>□</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={ct.image}
      resizeMode="cover"
      onError={() => setErr(true)}
    />
  );
}
const ct = StyleSheet.create({
  image: { width: 44, height: 60, borderRadius: 1, borderWidth: 1, borderColor: Colors.border },
  placeholder: {
    width: 44, height: 60, borderRadius: 1,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.metalMid,
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 18, color: Colors.textDisabled },
});

// ── Saved banner ──────────────────────────────────────────────────────────────

function SavedBanner({ title }: { title: string }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [title]);

  return (
    <Animated.View style={[ban.root, { opacity }]}>
      <Text style={ban.led}>●</Text>
      <Text style={ban.text} numberOfLines={1}>SAVED  {title}</Text>
      <Text style={ban.check}>✓</Text>
    </Animated.View>
  );
}
const ban = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: Spacing.lg, right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.lcdBackground,
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow, borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight, borderRightColor: Colors.lcdHighlight,
    borderRadius: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    zIndex: 100,
  },
  led: { fontSize: 8, color: Colors.accentGreen, lineHeight: 14 },
  text: {
    flex: 1,
    fontFamily: Typography.fontMono, fontSize: 10, fontWeight: '700',
    letterSpacing: 1, color: Colors.lcdText,
  },
  check: {
    fontFamily: Typography.fontMono, fontSize: 12,
    color: Colors.accentGreenDim, fontWeight: '700',
  },
});

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({
  item,
  added,
  onAdd,
}: {
  item: AladinItem;
  added: boolean;
  onAdd: () => void;
}) {
  const author = cleanAuthor(item.author);
  const isbn = item.isbn13 || item.isbn;
  const year = pubYear(item.pubDate);

  return (
    <TouchableOpacity
      onPress={onAdd}
      disabled={added}
      activeOpacity={0.7}
      style={[rr.root, added && rr.rootAdded]}
    >
      <CoverThumb uri={item.cover} />
      <View style={rr.info}>
        <Text style={[rr.title, added && rr.titleAdded]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={rr.author} numberOfLines={1}>{author}</Text>
        <Text style={rr.pub} numberOfLines={1}>
          {item.publisher}{year ? `  ·  ${year}` : ''}
        </Text>
        {isbn ? <Text style={rr.isbn}>ISBN  {isbn}</Text> : null}
      </View>
      <View style={[rr.badge, added && rr.badgeDone]}>
        <Text style={[rr.badgeLabel, added && rr.badgeLabelDone]}>
          {added ? '✓' : 'ADD'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
const rr = StyleSheet.create({
  root: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  rootAdded: { opacity: 0.55 },
  info: { flex: 1, gap: 2 },
  title: {
    fontFamily: Typography.fontMono, fontSize: 11, fontWeight: '700',
    color: Colors.text, lineHeight: 16, letterSpacing: 0.3,
  },
  titleAdded: { color: Colors.textMuted },
  author: { fontFamily: Typography.fontMono, fontSize: 10, color: Colors.textMuted },
  pub: { fontFamily: Typography.fontMono, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.3 },
  isbn: { fontFamily: Typography.fontMono, fontSize: 8, color: Colors.textDisabled, letterSpacing: 0.5, marginTop: 2 },
  badge: {
    minWidth: 36, height: 24, borderRadius: 2,
    borderWidth: Border.thin,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    backgroundColor: Colors.metalMid,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  badgeDone: {
    borderTopColor: Colors.metalShadow, borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight, borderRightColor: Colors.metalHighlight,
    backgroundColor: Colors.metalDark,
  },
  badgeLabel: {
    fontFamily: Typography.fontMono, fontSize: 9, fontWeight: '700',
    letterSpacing: 1, color: Colors.text,
  },
  badgeLabelDone: { color: Colors.accentGreenDim },
});

// ── Manual field ──────────────────────────────────────────────────────────────

function ManualField({
  label, value, onChangeText, placeholder, keyboardType = 'default',
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={mf.wrap}>
      <Text style={mf.label}>{label}</Text>
      <View style={mf.outer}>
        <View style={mf.inner}>
          <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
            placeholderTextColor={Colors.lcdTextDim} style={mf.input}
            keyboardType={keyboardType} autoCorrect={false} />
        </View>
      </View>
    </View>
  );
}
const mf = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  label: { fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1.5, color: Colors.textMuted },
  outer: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow, borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight, borderRightColor: Colors.metalHighlight,
    borderRadius: 2, backgroundColor: Colors.lcdBackground, padding: 1,
  },
  inner: {
    borderWidth: Border.thin,
    borderTopColor: Colors.lcdShadow, borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight, borderRightColor: Colors.lcdHighlight,
    borderRadius: 1, backgroundColor: Colors.lcdBackground,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  input: { fontFamily: Typography.fontMono, fontSize: 13, color: Colors.lcdText, padding: 0, margin: 0 },
});

// ── Result list panel ─────────────────────────────────────────────────────────

function ResultPanel({
  items, error, empty,
  isAdded, onAdd,
}: {
  items: AladinItem[];
  error: string;
  empty: boolean;
  isAdded: (isbn: string) => boolean;
  onAdd: (item: AladinItem) => void;
}) {
  if (error) {
    return (
      <View style={rp.errorStrip}>
        <Text style={rp.errorText}>{error}</Text>
      </View>
    );
  }
  if (empty) {
    return (
      <View style={rp.errorStrip}>
        <Text style={rp.errorText}>NO RESULTS FOUND</Text>
      </View>
    );
  }
  if (items.length === 0) return null;

  return (
    <View style={rp.panel}>
      <View style={rp.header}>
        <Text style={rp.headerText}>RESULTS</Text>
        <Text style={rp.headerCount}>{items.length} FOUND</Text>
      </View>
      {items.map((item, i) => (
        <React.Fragment key={item.isbn13 || item.isbn || i}>
          {i > 0 && <View style={rp.sep} />}
          <ResultRow
            item={item}
            added={isAdded(item.isbn13 || item.isbn)}
            onAdd={() => onAdd(item)}
          />
        </React.Fragment>
      ))}
    </View>
  );
}
const rp = StyleSheet.create({
  panel: {
    borderWidth: Border.regular, ...Shadows.inset,
    borderRadius: 2, backgroundColor: Colors.panel, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.metalMid,
  },
  headerText: { fontFamily: Typography.fontMono, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: Colors.textMuted },
  headerCount: { fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1, color: Colors.textMuted },
  sep: { height: Border.thin, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  errorStrip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.panel, borderWidth: Border.thin, borderColor: Colors.border, borderRadius: 2,
  },
  errorText: { fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1, color: Colors.statusError },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export function BookSearchScreen() {
  const navigation = useNavigation<Nav>();
  const { addBook, books } = useBooks();

  const [mode, setMode] = useState<Mode>('TITLE');

  // Search state (shared across TITLE / AUTHOR / ISBN)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AladinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [empty, setEmpty] = useState(false);

  // Single ISBN result
  const [isbnResult, setIsbnResult] = useState<AladinItem | null>(null);

  // Saved banner
  const [savedTitle, setSavedTitle] = useState('');
  const [bannerKey, setBannerKey] = useState(0);

  // Manual form
  const [mTitle, setMTitle] = useState('');
  const [mAuthor, setMAuthor] = useState('');
  const [mISBN, setMISBN] = useState('');
  const [mPublisher, setMPublisher] = useState('');
  const [mYear, setMYear] = useState('');

  // ── Mode change ─────────────────────────────────────────────────────────────

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setQuery('');
    setResults([]);
    setError('');
    setEmpty(false);
    setIsbnResult(null);
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setEmpty(false);
    setResults([]);
    setIsbnResult(null);

    try {
      if (mode === 'TITLE') {
        const items = await searchByTitle(query.trim());
        setResults(items);
        if (items.length === 0) setEmpty(true);
      } else if (mode === 'AUTHOR') {
        const items = await searchByAuthor(query.trim());
        setResults(items);
        if (items.length === 0) setEmpty(true);
      } else if (mode === 'ISBN') {
        const item = await searchByISBN(query.trim());
        if (item) setIsbnResult(item);
        else setEmpty(true);
      }
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  }, [query, mode]);

  // ── Add book ────────────────────────────────────────────────────────────────

  const isAdded = useCallback(
    (isbn: string) => !!isbn && books.some((b) => b.isbn === isbn),
    [books]
  );

  const showSaved = useCallback((title: string) => {
    setSavedTitle(title);
    setBannerKey((k) => k + 1);
  }, []);

  const addFromAladin = useCallback(
    (item: AladinItem) => {
      const isbn = item.isbn13 || item.isbn || undefined;
      if (isbn && isAdded(isbn)) {
        Alert.alert('이미 추가됨', '이 책은 이미 Archive에 있습니다.');
        return;
      }
      addBook({
        title: item.title,
        author: cleanAuthor(item.author),
        isbn,
        publisher: item.publisher || undefined,
        year: pubYear(item.pubDate) || undefined,
        coverUrl: item.cover || undefined,
        totalPages: item.subInfo?.itemPage ?? undefined,
      });
      showSaved(item.title);
    },
    [addBook, isAdded, showSaved]
  );

  const handleManualAdd = useCallback(() => {
    if (!mTitle.trim()) {
      Alert.alert('오류', '제목을 입력하세요.');
      return;
    }
    addBook({
      title: mTitle.trim(),
      author: mAuthor.trim() || '—',
      isbn: mISBN.trim() || undefined,
      publisher: mPublisher.trim() || undefined,
      year: mYear.trim() || undefined,
      coverUrl: undefined,
    });
    showSaved(mTitle.trim());
    setMTitle(''); setMAuthor(''); setMISBN(''); setMPublisher(''); setMYear('');
  }, [addBook, mTitle, mAuthor, mISBN, mPublisher, mYear, showSaved]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderSearchMode = () => (
    <>
      <View style={styles.searchRow}>
        <LcdInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            mode === 'TITLE' ? 'ENTER TITLE...'
            : mode === 'AUTHOR' ? 'ENTER AUTHOR...'
            : 'ENTER ISBN...'
          }
          keyboardType={mode === 'ISBN' ? 'number-pad' : 'default'}
          onSubmit={handleSearch}
        />
        <SearchBtn onPress={handleSearch} loading={loading} />
      </View>

      {/* ISBN single result */}
      {mode === 'ISBN' && isbnResult && (
        <View style={styles.isbnResultPanel}>
          <View style={styles.isbnCard}>
            <CoverThumb uri={isbnResult.cover} />
            <View style={styles.isbnInfo}>
              <Text style={styles.isbnTitle}>{isbnResult.title}</Text>
              <Text style={styles.isbnAuthor}>{cleanAuthor(isbnResult.author)}</Text>
              <Text style={styles.isbnPub}>{isbnResult.publisher}</Text>
              <Text style={styles.isbnCode}>
                ISBN  {isbnResult.isbn13 || isbnResult.isbn}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => addFromAladin(isbnResult)}
            activeOpacity={0.75}
            style={styles.isbnAddBtn}
          >
            <View style={styles.isbnAddBtnFace}>
              <Text style={styles.isbnAddBtnLabel}>+ ADD TO ARCHIVE</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* List results (TITLE / AUTHOR) */}
      {mode !== 'ISBN' && (
        <ResultPanel
          items={results}
          error={error}
          empty={empty}
          isAdded={(isbn) => isAdded(isbn)}
          onAdd={addFromAladin}
        />
      )}

      {/* ISBN error/empty */}
      {mode === 'ISBN' && (error || empty) && (
        <View style={rp.errorStrip}>
          <Text style={rp.errorText}>
            {error || 'ISBN NOT FOUND IN DATABASE'}
          </Text>
        </View>
      )}
    </>
  );

  const renderManualMode = () => (
    <View style={styles.manualPanel}>
      <ManualField label="TITLE *" value={mTitle} onChangeText={setMTitle} placeholder="책 제목" />
      <ManualField label="AUTHOR" value={mAuthor} onChangeText={setMAuthor} placeholder="저자" />
      <ManualField label="ISBN" value={mISBN} onChangeText={setMISBN} placeholder="ISBN-13" keyboardType="number-pad" />
      <ManualField label="PUBLISHER" value={mPublisher} onChangeText={setMPublisher} placeholder="출판사" />
      <ManualField label="YEAR" value={mYear} onChangeText={setMYear} placeholder="출판 연도" keyboardType="number-pad" />
      <TouchableOpacity onPress={handleManualAdd} activeOpacity={0.75} style={styles.addAccentBtn}>
        <View style={styles.addAccentBtnFace}>
          <Text style={styles.addAccentBtnLabel}>+ ADD TO ARCHIVE</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75} style={styles.backBtn}>
          <View style={styles.backBtnFace}>
            <Text style={styles.backBtnLabel}>◀ BACK</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>BOOK SEARCH</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Mode selector */}
      <View style={styles.modeBar}>
        {(['TITLE', 'AUTHOR', 'ISBN', 'MANUAL'] as Mode[]).map((m) => (
          <ModeBtn key={m} label={m} active={mode === m} onPress={() => switchMode(m)} />
        ))}
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Saved banner — overlays scroll content */}
        {savedTitle ? <SavedBanner key={bannerKey} title={savedTitle} /> : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode !== 'MANUAL' ? renderSearchMode() : renderManualMode()}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin, borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontFamily: Typography.fontMono, fontSize: 11, fontWeight: '700',
    letterSpacing: 3, color: Colors.text,
  },
  backBtn: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight, borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow, borderRightColor: Colors.metalShadow,
    borderRadius: 2, backgroundColor: Colors.metalMid,
  },
  backBtnFace: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, margin: 1 },
  backBtnLabel: {
    fontFamily: Typography.fontMono, fontSize: 10, fontWeight: '700',
    letterSpacing: 1, color: Colors.text,
  },

  modeBar: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin, borderBottomColor: Colors.border,
  },

  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  bottomPad: { height: Spacing.xl },

  searchRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'stretch' },

  // ISBN single result
  isbnResultPanel: { gap: Spacing.sm },
  isbnCard: {
    flexDirection: 'row', gap: Spacing.md,
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow, borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight, borderRightColor: Colors.lcdHighlight,
    borderRadius: 2, padding: Spacing.md,
    backgroundColor: Colors.lcdBackground,
  },
  isbnInfo: { flex: 1, gap: 3 },
  isbnTitle: {
    fontFamily: Typography.fontMono, fontSize: 14, fontWeight: '700',
    color: Colors.lcdText, lineHeight: 20, letterSpacing: 0.3,
  },
  isbnAuthor: { fontFamily: Typography.fontMono, fontSize: 11, color: Colors.lcdTextDim },
  isbnPub: { fontFamily: Typography.fontMono, fontSize: 10, color: Colors.lcdTextDim },
  isbnCode: { fontFamily: Typography.fontMono, fontSize: 9, color: Colors.lcdTextDim, letterSpacing: 0.5, marginTop: 4 },
  isbnAddBtn: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow, borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight, borderRightColor: Colors.metalHighlight,
    borderRadius: 2, backgroundColor: Colors.metalDark,
  },
  isbnAddBtnFace: {
    margin: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: 1, backgroundColor: Colors.metalDark,
  },
  isbnAddBtnLabel: {
    fontFamily: Typography.fontMono, fontSize: 11, fontWeight: '700',
    letterSpacing: 2, color: Colors.accentGreen,
  },

  // Manual form
  manualPanel: {
    borderWidth: Border.regular, ...Shadows.inset,
    borderRadius: 2, backgroundColor: Colors.panel,
    padding: Spacing.md, gap: Spacing.md,
  },
  addAccentBtn: {
    marginTop: Spacing.sm,
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow, borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight, borderRightColor: Colors.metalHighlight,
    borderRadius: 2, backgroundColor: Colors.metalDark,
  },
  addAccentBtnFace: {
    margin: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: 1, backgroundColor: Colors.metalDark,
  },
  addAccentBtnLabel: {
    fontFamily: Typography.fontMono, fontSize: 11, fontWeight: '700',
    letterSpacing: 2, color: Colors.accentGreen,
  },
});
