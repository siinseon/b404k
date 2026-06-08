import React, { Component, ReactNode, useState, useCallback } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BootScreen } from './src/screens/BootScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { BookProvider, useBooks } from './src/store/bookStore';
import { SessionProvider, useSessions } from './src/store/sessionStore';
import { Colors, Typography, Spacing, Border } from './src/constants/theme';

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.errorRoot}>
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>SYSTEM ERROR</Text>
          <Text style={styles.errorText}>앱을 다시 시작해 주세요.</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => this.setState({ hasError: false })}
            style={styles.errorBtn}
          >
            <Text style={styles.errorBtnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

function AppContent() {
  const [booted, setBooted] = useState(false);
  const { loaded: booksLoaded } = useBooks();
  const { loaded: sessionsLoaded } = useSessions();

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  if (!booted || !booksLoaded || !sessionsLoaded) {
    return (
      <>
        <StatusBar style="dark" />
        <BootScreen onComplete={handleBootComplete} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <BookProvider>
          <SessionProvider>
            <AppContent />
          </SessionProvider>
        </BookProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    backgroundColor: Colors.body,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorPanel: {
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 2,
    backgroundColor: Colors.lcdBackground,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.statusError,
  },
  errorText: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    color: Colors.lcdTextDim,
  },
  errorBtn: {
    alignSelf: 'flex-start',
    borderWidth: Border.thin,
    borderColor: Colors.border,
    borderRadius: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorBtnText: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.lcdText,
  },
});
