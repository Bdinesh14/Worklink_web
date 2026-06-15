import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Home, Briefcase, FileText, MessageSquare, User } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

import { HirerHomeScreen } from './HirerHomeScreen';
import { MyJobsScreen } from './MyJobsScreen';
import { ApplicationsScreen } from './ApplicationsScreen';
import { ChatListScreen } from './ChatListScreen';
import { HirerProfileScreen } from './HirerProfileScreen';

const Tab = createBottomTabNavigator();

export const HirerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const size = 22;
          if (route.name === 'Home') return <Home size={size} color={color} fill={focused ? color : 'transparent'} />;
          if (route.name === 'MyJobs') return <Briefcase size={size} color={color} fill={focused ? color : 'transparent'} />;
          if (route.name === 'Applications') return <FileText size={size} color={color} />;
          if (route.name === 'Chat') return <MessageSquare size={size} color={color} fill={focused ? color : 'transparent'} />;
          if (route.name === 'Profile') return <User size={size} color={color} fill={focused ? color : 'transparent'} />;
          return <Home size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HirerHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="MyJobs" component={MyJobsScreen} options={{ title: 'My Jobs' }} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} options={{ title: 'Applications' }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="Profile" component={HirerProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
