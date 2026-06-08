import React from 'react';
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
import { Colors, Typography, Spacing, Border } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useBooks } from '../store/bookStore';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const SPEAKER_HOLES = 44;
const RED_DOTS = 16;
const LCD_SEGMENTS = 11;

function Screw({ style }: { style: object }) {
  return (
    <View style={[styles.screw, style]}>
      <View style={styles.screwSlot} />
    </View>
  );
}

function RoundButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity activeOpacity={0.72} onPress={onPress} style={[styles.roundButton, style]}>
      <View style={styles.roundButtonFace}>
        <Text style={styles.roundButtonText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SmallDiscButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity activeOpacity={0.72} onPress={onPress} style={[styles.smallDiscButton, style]}>
      <Text style={styles.smallDiscButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function DPad({
  onUp,
  onLeft,
  onRight,
  onDown,
  onEnter,
}: {
  onUp: () => void;
  onLeft: () => void;
  onRight: () => void;
  onDown: () => void;
  onEnter: () => void;
}) {
  return (
    <View style={styles.dpadOuter}>
      <View style={styles.dpadBezel}>
        <TouchableOpacity activeOpacity={0.72} onPress={onUp} style={[styles.dpadZone, styles.dpadUp]}>
          <Text style={styles.dpadArrow}>▲</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.72} onPress={onLeft} style={[styles.dpadZone, styles.dpadLeft]}>
          <Text style={styles.dpadArrow}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.72} onPress={onRight} style={[styles.dpadZone, styles.dpadRight]}>
          <Text style={styles.dpadArrow}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.72} onPress={onDown} style={[styles.dpadZone, styles.dpadDown]}>
          <Text style={styles.dpadArrow}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.72} onPress={onEnter} style={styles.enterButton}>
          <View style={styles.enterButtonFace}>
            <Text style={styles.enterText}>ENTER</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { books, loaded } = useBooks();

  const goBookSearch = () => navigation.navigate('BookSearch');
  const goSession = () => navigation.navigate('Session');
  const goMonitor = () => navigation.navigate('MainTabs', { screen: 'Monitor' });
  const goArchive = () => navigation.navigate('MainTabs', { screen: 'Archive' });
  const goLog = () => navigation.navigate('MainTabs', { screen: 'Log' });
  const goStats = () => navigation.navigate('Stats');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.device}>
          <Screw style={styles.screwTopLeft} />
          <Screw style={styles.screwTopRight} />
          <Screw style={styles.screwBottomLeft} />
          <Screw style={styles.screwBottomRight} />

          <View style={styles.brushedLines}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={i} style={styles.brushedLine} />
            ))}
          </View>

          <View style={styles.header}>
            <Text style={styles.brand}>B404K</Text>
            <View style={styles.power}>
              <Text style={styles.powerText}>POWER</Text>
              <View style={[styles.powerLed, loaded && styles.powerLedOn]} />
            </View>
          </View>

          <View style={styles.speaker}>
            {Array.from({ length: SPEAKER_HOLES }).map((_, i) => (
              <View key={i} style={styles.speakerHole} />
            ))}
          </View>

          <View style={styles.disc}>
            <Text style={styles.discLogo}>Bookman</Text>
            <Text style={styles.discMark}>COMPACT{'\n'}DIGITAL BOOK</Text>
            <View style={styles.redDotGrid}>
              {Array.from({ length: RED_DOTS }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.redDot,
                    i < Math.min(books.length, RED_DOTS) && styles.redDotOn,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.lcdFrame}>
            <View style={styles.lcd}>
              <Text style={styles.lcdTiny}>WELCOME TO</Text>
              <Text style={styles.lcdTitle}>B404K</Text>
              <Text style={styles.lcdSubtitle}>Reading Not Found</Text>
              <View style={styles.lcdRule} />
              <Text style={styles.lcdStatus}>INITIALIZING</Text>
              <Text style={styles.lcdStatus}>READING SYSTEM...</Text>
              <View style={styles.lcdProgress}>
                <View style={styles.lcdSegments}>
                  {Array.from({ length: LCD_SEGMENTS }).map((_, i) => (
                    <View key={i} style={[styles.lcdSegment, i < 10 && styles.lcdSegmentOn]} />
                  ))}
                </View>
                <Text style={styles.lcdPercent}>100%</Text>
              </View>
            </View>
          </View>

          <View style={styles.sideTransportLabel}>
            <Text style={styles.sideTransportText}>▸▌▌</Text>
            <Text style={styles.sideTransportPlus}>＋</Text>
          </View>
          <Text style={styles.repeatText}>REPEAT</Text>
          <Text style={styles.holdText}>HOLD</Text>

          <SmallDiscButton label="◀◀" onPress={goLog} style={styles.skipBackTop} />
          <SmallDiscButton label="◀◀" onPress={goMonitor} style={styles.skipBackMid} />
          <SmallDiscButton label="▶▶" onPress={goArchive} style={styles.skipNextMid} />
          <SmallDiscButton label="■" onPress={goSession} style={styles.stopButton} />

          <TouchableOpacity activeOpacity={0.72} onPress={goSession} style={styles.volumeButton}>
            <View style={styles.volumeFace}>
              <Text style={styles.volumeText}>＋</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.72} onPress={goArchive} style={styles.holdSwitch}>
            <View style={styles.holdKnob} />
          </TouchableOpacity>

          <RoundButton label="MENU" onPress={goStats} style={styles.menuButton} />
          <RoundButton label="BACK" onPress={goLog} style={styles.backButton} />

          <DPad
            onUp={goMonitor}
            onLeft={goLog}
            onRight={goArchive}
            onDown={goSession}
            onEnter={goBookSearch}
          />

          <Text style={styles.leftBottomLabel}>MDLP</Text>
          <Text style={styles.rightBottomLabel}>NetMD</Text>
          <Text style={styles.footerBrand}>B404K</Text>
          <Text style={styles.footerVersion}>v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  device: {
    width: '100%',
    maxWidth: 392,
    minHeight: 846,
    borderRadius: 11,
    borderWidth: Border.regular,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EFEFEA',
    borderRightColor: '#777772',
    borderBottomColor: '#555551',
    backgroundColor: '#D4D2CA',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  brushedLines: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.22,
  },
  brushedLine: {
    height: 1,
    marginTop: 42,
    marginHorizontal: 22,
    backgroundColor: '#FFFFFF',
  },
  screw: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderTopColor: '#5B5B57',
    borderLeftColor: '#6A6A66',
    borderRightColor: '#F8F8F4',
    borderBottomColor: '#FFFFFF',
    backgroundColor: '#B8B7B0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  screwSlot: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#4A4A47',
    transform: [{ rotate: '35deg' }],
  },
  screwTopLeft: { top: 10, left: 10 },
  screwTopRight: { top: 10, right: 10 },
  screwBottomLeft: { bottom: 10, left: 10 },
  screwBottomRight: { bottom: 10, right: 10 },
  header: {
    position: 'absolute',
    top: 25,
    left: 30,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 4,
  },
  brand: {
    fontFamily: Typography.fontMono,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#2B2B2A',
  },
  power: {
    alignItems: 'center',
    gap: 4,
  },
  powerText: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
  powerLed: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#222222',
    backgroundColor: '#7EA64F',
  },
  powerLedOn: {
    backgroundColor: '#8DFF57',
  },
  speaker: {
    position: 'absolute',
    top: 108,
    left: 42,
    width: 170,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    zIndex: 5,
  },
  speakerHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#141414',
  },
  disc: {
    position: 'absolute',
    left: -112,
    top: 182,
    width: 440,
    height: 440,
    borderRadius: 220,
    borderWidth: Border.regular,
    borderTopColor: '#4B4B49',
    borderLeftColor: '#3A3A38',
    borderRightColor: '#E9E9E4',
    borderBottomColor: '#F8F8F4',
    backgroundColor: '#222220',
    zIndex: 1,
  },
  discLogo: {
    position: 'absolute',
    top: 92,
    left: 146,
    fontFamily: Typography.fontMono,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#D9D9D2',
  },
  discMark: {
    position: 'absolute',
    left: 148,
    bottom: 76,
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#E2E2DC',
    lineHeight: 10,
  },
  redDotGrid: {
    position: 'absolute',
    left: 146,
    bottom: 36,
    width: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  redDot: {
    width: 7,
    height: 7,
    backgroundColor: '#3A0505',
  },
  redDotOn: {
    backgroundColor: '#D71010',
  },
  lcdFrame: {
    position: 'absolute',
    top: 298,
    left: 35,
    width: 198,
    height: 216,
    borderRadius: 12,
    borderWidth: 5,
    borderTopColor: '#151515',
    borderLeftColor: '#151515',
    borderRightColor: '#444441',
    borderBottomColor: '#555550',
    backgroundColor: '#232321',
    padding: 7,
    zIndex: 6,
  },
  lcd: {
    flex: 1,
    borderRadius: 5,
    borderWidth: Border.regular,
    borderTopColor: '#7C886E',
    borderLeftColor: '#7C886E',
    borderRightColor: '#D7E5BE',
    borderBottomColor: '#D7E5BE',
    backgroundColor: Colors.lcdBackground,
    paddingHorizontal: 13,
    paddingTop: 14,
  },
  lcdTiny: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.lcdText,
  },
  lcdTitle: {
    marginTop: 2,
    fontFamily: Typography.fontMono,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 31,
    color: Colors.lcdText,
  },
  lcdSubtitle: {
    marginTop: 1,
    fontFamily: Typography.fontMono,
    fontSize: 11,
    letterSpacing: 0.2,
    color: Colors.lcdText,
  },
  lcdRule: {
    height: 1,
    backgroundColor: Colors.lcdTextDim,
    marginTop: 14,
    marginBottom: 15,
    opacity: 0.62,
  },
  lcdStatus: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.lcdText,
    lineHeight: 13,
  },
  lcdProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    gap: 10,
  },
  lcdSegments: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  lcdSegment: {
    flex: 1,
    height: 11,
    borderWidth: 1,
    borderColor: Colors.lcdTextDim,
    backgroundColor: 'transparent',
  },
  lcdSegmentOn: {
    backgroundColor: Colors.lcdText,
  },
  lcdPercent: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: Colors.lcdText,
  },
  sideTransportLabel: {
    position: 'absolute',
    top: 238,
    right: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 6,
  },
  sideTransportText: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    color: '#111111',
  },
  sideTransportPlus: {
    fontFamily: Typography.fontMono,
    fontSize: 17,
    color: '#111111',
  },
  repeatText: {
    position: 'absolute',
    top: 289,
    right: 25,
    fontFamily: Typography.fontMono,
    fontSize: 8,
    color: '#111111',
    zIndex: 6,
  },
  holdText: {
    position: 'absolute',
    top: 494,
    right: 42,
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: '#F0F0EA',
    zIndex: 6,
  },
  smallDiscButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: Border.regular,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#F5F5F0',
    borderRightColor: '#6F6F6A',
    borderBottomColor: '#565652',
    backgroundColor: '#D7D7D1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  smallDiscButtonText: {
    fontFamily: Typography.fontMono,
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },
  skipBackTop: { top: 284, right: 78 },
  skipBackMid: { top: 359, right: 110 },
  skipNextMid: { top: 359, right: 48 },
  stopButton: { top: 431, right: 78 },
  volumeButton: {
    position: 'absolute',
    top: 242,
    right: 19,
    width: 34,
    height: 60,
    borderRadius: 18,
    borderWidth: Border.regular,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#F5F5F0',
    borderRightColor: '#60605C',
    borderBottomColor: '#50504C',
    backgroundColor: '#30302F',
    padding: 3,
    zIndex: 9,
    transform: [{ rotate: '-33deg' }],
  },
  volumeFace: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#D5D5CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeText: {
    fontFamily: Typography.fontMono,
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
  },
  holdSwitch: {
    position: 'absolute',
    top: 520,
    right: 37,
    width: 32,
    height: 68,
    borderRadius: 18,
    borderWidth: Border.regular,
    borderTopColor: '#090909',
    borderLeftColor: '#090909',
    borderRightColor: '#5A5A57',
    borderBottomColor: '#686864',
    backgroundColor: '#111111',
    padding: 4,
    zIndex: 8,
    transform: [{ rotate: '28deg' }],
  },
  holdKnob: {
    width: 22,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#333331',
    borderWidth: 1,
    borderTopColor: '#5B5B57',
    borderLeftColor: '#4A4A47',
    borderRightColor: '#111111',
    borderBottomColor: '#000000',
  },
  roundButton: {
    position: 'absolute',
    width: 68,
    height: 58,
    borderRadius: 28,
    borderWidth: Border.regular,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#F5F5F0',
    borderRightColor: '#696965',
    borderBottomColor: '#555551',
    backgroundColor: '#BEBDB7',
    padding: 3,
    zIndex: 9,
  },
  roundButtonFace: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: '#D8D7D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#222222',
  },
  menuButton: {
    top: 591,
    left: 30,
  },
  backButton: {
    top: 591,
    right: 30,
  },
  dpadOuter: {
    position: 'absolute',
    top: 586,
    left: '50%',
    marginLeft: -92,
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#F2F2EC',
    borderRightColor: '#676762',
    borderBottomColor: '#555550',
    backgroundColor: '#BBBAB4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  dpadBezel: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: Border.regular,
    borderTopColor: '#656560',
    borderLeftColor: '#777771',
    borderRightColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    backgroundColor: '#D1D0C9',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadZone: {
    position: 'absolute',
    width: 62,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadUp: { top: 8, left: 49 },
  dpadLeft: { top: 57, left: 8 },
  dpadRight: { top: 57, right: 8 },
  dpadDown: { bottom: 8, left: 49 },
  dpadArrow: {
    fontFamily: Typography.fontMono,
    fontSize: 18,
    color: '#5A5A55',
  },
  enterButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: Border.regular,
    borderTopColor: '#5C5C58',
    borderLeftColor: '#6B6B66',
    borderRightColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    backgroundColor: '#AFAEA8',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButtonFace: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    borderWidth: Border.thin,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#F5F5F0',
    borderRightColor: '#777772',
    borderBottomColor: '#666661',
    backgroundColor: '#D4D3CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterText: {
    fontFamily: Typography.fontMono,
    fontSize: 12,
    color: '#222222',
  },
  leftBottomLabel: {
    position: 'absolute',
    left: 43,
    bottom: 71,
    fontFamily: Typography.fontMono,
    fontSize: 16,
    color: '#222222',
    textDecorationLine: 'underline',
    zIndex: 5,
  },
  rightBottomLabel: {
    position: 'absolute',
    right: 43,
    bottom: 71,
    fontFamily: Typography.fontMono,
    fontSize: 16,
    color: '#222222',
    textDecorationLine: 'underline',
    zIndex: 5,
  },
  footerBrand: {
    position: 'absolute',
    right: 34,
    bottom: 32,
    fontFamily: Typography.fontMono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#222222',
    zIndex: 5,
  },
  footerVersion: {
    position: 'absolute',
    right: 34,
    bottom: 17,
    fontFamily: Typography.fontMono,
    fontSize: 8,
    color: '#333333',
    zIndex: 5,
  },
});
