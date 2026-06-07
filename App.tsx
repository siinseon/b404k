import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BootScreen } from './src/screens/BootScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { BookProvider } from './src/store/bookStore';
import { SessionProvider } from './src/store/sessionStore';
import { Colors } from './src/constants/colors';

export default function App() {
  const [booted, setBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  if (!booted) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={Colors.lcdBackground} />
        <BootScreen onComplete={handleBootComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <BookProvider>
        <SessionProvider>
          <NavigationContainer>
            <StatusBar style="dark" backgroundColor={Colors.panel} />
            <RootNavigator />
          </NavigationContainer>
        </SessionProvider>
      </BookProvider>
    </SafeAreaProvider>
  );
}
