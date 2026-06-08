import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { LogScreen } from '../screens/LogScreen';
import { MonitorScreen } from '../screens/MonitorScreen';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { Colors, Typography, Spacing, Border, Shadows } from '../constants/theme';

export type RootTabParamList = {
  Home: undefined;
  Log: undefined;
  Monitor: undefined;
  Archive: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: '▶',
  Log: '≡',
  Monitor: '◈',
  Archive: '□',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              style={[
                styles.tabItem,
                isFocused ? styles.tabItemActive : styles.tabItemInactive,
              ]}
            >
              <View style={[styles.tabBevel, isFocused && styles.tabBevelActive]}>
                <Text
                  style={[
                    styles.tabIcon,
                    isFocused ? styles.tabIconActive : styles.tabIconInactive,
                  ]}
                >
                  {TAB_ICONS[route.name] ?? '○'}
                </Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {String(label).toUpperCase()}
                </Text>
              </View>
              {isFocused && <View style={styles.tabActiveLed} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        props.state.routes[props.state.index].name === 'Home'
          ? null
          : <CustomTabBar {...props} />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Monitor" component={MonitorScreen} />
      <Tab.Screen name="Archive" component={ArchiveScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: Colors.panel,
    borderTopWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderBottomColor: Colors.border,
    shadowColor: Colors.metalShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {},
  tabItemInactive: {
    opacity: 0.65,
  },
  tabBevel: {
    width: '100%',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: Border.thin,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
    gap: 3,
  },
  tabBevelActive: {
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    backgroundColor: Colors.metalDark,
  },
  tabIcon: {
    fontSize: 14,
    lineHeight: 18,
  },
  tabIconActive: {
    color: Colors.accentGreen,
  },
  tabIconInactive: {
    color: Colors.textMuted,
  },
  tabLabel: {
    ...Typography.tabLabel,
  },
  tabLabelActive: {
    color: Colors.accentGreen,
  },
  tabLabelInactive: {
    color: Colors.textMuted,
  },
  tabActiveLed: {
    position: 'absolute',
    top: 3,
    right: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accentGreen,
  },
});
