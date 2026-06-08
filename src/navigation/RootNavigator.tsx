import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabNavigator, RootTabParamList } from './BottomTabNavigator';
import { BookSearchScreen } from '../screens/BookSearchScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ImportScreen } from '../screens/ImportScreen';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  BookSearch: undefined;
  Session: { bookId?: string } | undefined;
  Stats: undefined;
  Import: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="BookSearch" component={BookSearchScreen} />
      <Stack.Screen name="Session" component={SessionScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Import" component={ImportScreen} />
    </Stack.Navigator>
  );
}
