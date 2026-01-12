import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

import DashboardScreen from '../../screens/DashboardScreen';
import TransactionScreen from '../../screens/TransactionScreen';
import AddTransactionScreen from '../../screens/AddTransactionScreen';
import DebugScreen from '../../screens/DebugScreen';
import PartnerSettingsScreen from '../../screens/PartnerSettingsScreen';
import { Colors, Shadows } from '../theme';

const Tab = createBottomTabNavigator();

interface AppNavigatorProps {
  accessToken: string;
  userEmail: string;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ accessToken, userEmail }) => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'Transactions') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            } else if (route.name === 'Add') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Partner') {
              iconName = focused ? 'people' : 'people-outline';
            } else {
              iconName = 'ellipse-outline';
            }

            return (
              <View style={focused ? styles.activeIconContainer : undefined}>
                <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Transactions" component={TransactionScreen} />
        <Tab.Screen name="Add" component={AddTransactionScreen} />
        <Tab.Screen name="Partner">
          {() => <PartnerSettingsScreen accessToken={accessToken} userEmail={userEmail} />}
        </Tab.Screen>
        <Tab.Screen name="Debug" component={DebugScreen} options={{ tabBarButton: () => null, }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    ...Shadows.lg,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  activeIconContainer: {
    backgroundColor: Colors.primaryLight + '20',
    padding: 8,
    borderRadius: 12,
    marginTop: -4,
  },
});

export default AppNavigator;
