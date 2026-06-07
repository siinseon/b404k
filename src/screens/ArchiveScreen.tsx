import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LcdPanel } from '../components/LcdPanel';
import { Colors, Typography, Spacing, Border, Shadows } from '../constants/theme';
import { useBooks } from '../store/bookStore';
import { Book, BookStatus } from '../types/book';
import { RootStackParamList } from '../navigation/RootNavigator';

type ArchiveNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

function formatDate(ts: number) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${yy}/${mm}/${dd}`;
}

function CoverThumb({ uri }: { uri?: string }) {
  const [err, setErr] = useState(false);
  if (!uri || err) {
    return (
      <View style={brow.coverPlaceholder}>
        <Text style={brow.coverPlaceholderIcon}>□</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={brow.coverImage}
      resizeMode="cover"
      onError={() => setErr(true)}
    />
  );
}

const STATUS_CYCLE: BookStatus[] = ['PRE', 'ING', 'DONE'];
const STATUS_COLOR: Record<BookStatus, string> = {
  PRE: Colors.textDisabled,
  ING: Colors.accentGreen,
  DONE: Colors.lcdText,
};

function BookRow({
  book,
  onRemove,
  onLog,
  onStatusChange,
}: {
  book: Book;
  onRemove: () => void;
  onLog: () => void;
  onStatusChange: (s: BookStatus) => void;
}) {
  const handleRemove = () => {
    Alert.alert(
      'REMOVE BOOK',
      `"${book.title}" 을 Archive에서 제거합니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '제거', style: 'destructive', onPress: onRemove },
      ]
    );
  };

  return (
    <View style={brow.root}>
      <CoverThumb uri={book.coverUrl} />
      <View style={brow.center}>
        <Text style={brow.title} numberOfLines={1}>{book.title}</Text>
        <Text style={brow.author} numberOfLines={1}>{book.author}</Text>
        {book.publisher ? (
          <Text style={brow.publisher} numberOfLines={1}>{book.publisher}</Text>
        ) : null}
        <View style={brow.metaRow}>
          {book.isbn && <Text style={brow.meta}>ISBN {book.isbn}</Text>}
          {book.year && <Text style={brow.meta}>·  {book.year}</Text>}
          <Text style={[brow.meta, { marginLeft: 'auto' }]}>ADDED {formatDate(book.addedAt)}</Text>
        </View>
        {/* Status mini-selector */}
        <View style={brow.statusRow}>
          {STATUS_CYCLE.map((s) => {
            const active = book.status === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => onStatusChange(s)}
                activeOpacity={0.7}
                style={[brow.statusBtn, active && { borderColor: STATUS_COLOR[s] }]}
              >
                <View style={[brow.statusLed, active && { backgroundColor: STATUS_COLOR[s] }]} />
                <Text style={[brow.statusLabel, active && { color: STATUS_COLOR[s] }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {/* Action buttons */}
      <View style={brow.actions}>
        <TouchableOpacity onPress={onLog} activeOpacity={0.75} style={brow.logBtn}>
          <Text style={brow.logBtnIcon}>●</Text>
          <Text style={brow.logBtnLabel}>LOG</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRemove} activeOpacity={0.75} style={brow.removeBtn}>
          <Text style={brow.removeBtnLabel}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const brow = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  coverImage: {
    width: 36,
    height: 50,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coverPlaceholder: {
    width: 36,
    height: 50,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.metalMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderIcon: {
    fontSize: 14,
    color: Colors.textDisabled,
  },
  center: { flex: 1, gap: 2 },
  publisher: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  author: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 2,
  },
  meta: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    color: Colors.textDisabled,
    letterSpacing: 0.5,
  },
  actions: {
    gap: Spacing.xs,
    alignItems: 'center',
  },
  logBtn: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: 2,
    backgroundColor: Colors.metalDark,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  logBtnIcon: {
    fontSize: 6,
    color: Colors.statusError,
    lineHeight: 8,
  },
  logBtnLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.accentGreen,
  },
  removeBtn: {
    borderWidth: Border.thin,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
    width: 36,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusLed: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.metalDark,
  },
  statusLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 7,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

const STATUS_GROUPS: { status: BookStatus; label: string; ledColor: string }[] = [
  { status: 'ING',  label: 'ING',  ledColor: Colors.accentGreen },
  { status: 'PRE',  label: 'PRE',  ledColor: Colors.textDisabled },
  { status: 'DONE', label: 'DONE', ledColor: Colors.lcdText },
];

export function ArchiveScreen() {
  const navigation = useNavigation<ArchiveNav>();
  const { books, removeBook, updateBookStatus, loaded } = useBooks();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>ARCHIVE</Text>
        <View style={styles.topBarRight}>
          <View style={[styles.led, books.length > 0 && styles.ledOn]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header LCD */}
        <LcdPanel padding={Spacing.md}>
          <View style={styles.lcdRow}>
            <Text style={styles.lcdCap}>ARCHIVE</Text>
            <Text style={styles.lcdValue}>
              {String(books.length).padStart(3, '0')} FILES
            </Text>
          </View>
          <Text style={styles.lcdSub}>
            {loaded
              ? books.length === 0
                ? 'NO MEDIA LOADED'
                : 'MEDIA READY'
              : 'LOADING...'}
          </Text>
        </LcdPanel>

        {/* IMPORT DATA button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Import')}
          style={styles.importBtn}
        >
          <View style={styles.importBtnFace}>
            <Text style={styles.importBtnIcon}>⬇</Text>
            <Text style={styles.importBtnLabel}>IMPORT DATA</Text>
            <Text style={styles.importBtnSub}>XLSX / CSV</Text>
          </View>
        </TouchableOpacity>

        {/* Storage bar */}
        <View style={styles.storagePanel}>
          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>SLOTS USED</Text>
            <View style={styles.storageTrack}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.storageSeg,
                    i < Math.min(books.length, 20) && styles.storageSegOn,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.storageCount}>{books.length}</Text>
          </View>
        </View>

        {/* Status-grouped book list */}
        {!loaded && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>LOADING...</Text>
          </View>
        )}

        {loaded && books.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>□</Text>
            <Text style={styles.emptyText}>NO BOOKS IN ARCHIVE</Text>
            <Text style={styles.emptyHint}>USE BOOK SEARCH TO ADD</Text>
          </View>
        )}

        {loaded && STATUS_GROUPS.map(({ status, label, ledColor }) => {
          const group = books.filter((b) => b.status === status);
          return (
            <React.Fragment key={status}>
              {/* Group header */}
              <View style={styles.groupHeader}>
                <View style={[styles.groupLed, { backgroundColor: group.length > 0 ? ledColor : Colors.metalDark }]} />
                <Text style={styles.groupLabel}>{label}</Text>
                <Text style={styles.groupCount}>({group.length})</Text>
                <View style={styles.groupRule} />
              </View>

              {/* Group books */}
              {group.length === 0 ? (
                <View style={styles.groupEmpty}>
                  <Text style={styles.groupEmptyText}>EMPTY</Text>
                </View>
              ) : (
                <View style={styles.listPanel}>
                  {group.map((book, i) => (
                    <React.Fragment key={book.id}>
                      {i > 0 && <View style={styles.listDivider} />}
                      <BookRow
                        book={book}
                        onRemove={() => removeBook(book.id)}
                        onLog={() => navigation.navigate('Session', { bookId: book.id })}
                        onStatusChange={(s) => updateBookStatus(book.id, s)}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
            </React.Fragment>
          );
        })}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.body,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  led: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.statusInactive,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  ledOn: { backgroundColor: Colors.accentGreen },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  bottomPad: { height: Spacing.lg },

  lcdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  lcdCap: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.lcdTextDim,
  },
  lcdValue: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.lcdText,
  },
  lcdSub: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.lcdTextDim,
    marginTop: Spacing.xs,
  },

  // IMPORT DATA button
  importBtn: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 3,
    backgroundColor: Colors.metalMid,
  },
  importBtnFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    margin: 1,
    borderRadius: 2,
  },
  importBtnIcon: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    color: Colors.lcdText,
  },
  importBtnLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.text,
    flex: 1,
  },
  importBtnSub: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.textMuted,
  },

  storagePanel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  storageLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    width: 72,
  },
  storageTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  storageSeg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.metalMid,
    borderRadius: 1,
  },
  storageSegOn: { backgroundColor: Colors.lcdText },
  storageCount: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    width: 20,
    textAlign: 'right',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: Colors.border },

  // Status group headers
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  groupLed: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.metalShadow,
  },
  groupLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.text,
  },
  groupCount: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textMuted,
  },
  groupRule: { flex: 1, height: 1, backgroundColor: Colors.border },
  groupEmpty: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  groupEmptyText: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 2,
    color: Colors.textDisabled,
  },

  listPanel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    overflow: 'hidden',
  },
  listColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.metalMid,
    gap: Spacing.sm,
  },
  colHeaderText: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },
  listDivider: { height: Border.thin, backgroundColor: Colors.border },

  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 28,
    color: Colors.textDisabled,
    lineHeight: 36,
  },
  emptyText: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textDisabled,
  },
  emptyHint: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.textDisabled,
  },
});
