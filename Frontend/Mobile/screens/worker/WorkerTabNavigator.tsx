import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Home, Briefcase, FileText, MessageSquare, User } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

import { WorkerHomeScreen } from './WorkerHomeScreen';
import { MyJobRequestsScreen } from './MyJobRequestsScreen';
import { WorkerApplicationsScreen } from './WorkerApplicationsScreen';
import { ChatListScreen } from '../hirer/ChatListScreen';
import { WorkerProfileScreen } from './WorkerProfileScreen';

const Tab = createBottomTabNavigator();

export const WorkerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.success, // Worker active tint matches success (green)
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const size = 22;
          if (route.name === 'Home') return <Home size={size} color={color} fill={focused ? color : 'transparent'} />;
          if (route.name === 'MyJobRequests') return <Briefcase size={size} color={color} fill={focused ? color : 'transparent'} />;
          if (route.name === 'Applications') return <FileText size={size} color={color} />;
          if (route.name === 'Chat') return <MessageSquare size={size} color={color} fill={focused ? color : 'transparent'} />;
          if (route.name === 'Profile') return <User size={size} color={color} fill={focused ? color : 'transparent'} />;
          return <Home size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={WorkerHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="MyJobRequests" component={MyJobRequestsScreen} options={{ title: 'My Job Request' }} />
      <Tab.Screen name="Applications" component={WorkerApplicationsScreen} options={{ title: 'Applications' }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="Profile" component={WorkerProfileScreen} options={{ title: 'Profile' }} />
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
