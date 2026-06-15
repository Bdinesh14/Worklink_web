import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './context/AuthContext';

// Auth & Onboarding Screens
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';

// Hirer (Client) Flow
import { HirerTabNavigator } from './screens/hirer/HirerTabNavigator';
import { PostJobScreen } from './screens/hirer/PostJobScreen';
import { ChatScreen } from './screens/hirer/ChatScreen';

// Worker Flow
import { WorkerTabNavigator } from './screens/worker/WorkerTabNavigator';
import { PostAvailabilityScreen } from './screens/worker/PostAvailabilityScreen';

// Shared Flow
import { FilterScreen } from './screens/FilterScreen';
import { ManageReportsScreen } from './screens/ManageReportsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#F8FAFC' },
            }}
          >
            {/* Auth & Onboarding */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

            {/* Hirer (Client) Flow */}
            <Stack.Screen name="ClientHome" component={HirerTabNavigator} />
            <Stack.Screen name="PostJob" component={PostJobScreen} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />

            {/* Worker Flow */}
            <Stack.Screen name="WorkerHome" component={WorkerTabNavigator} />
            <Stack.Screen name="PostAvailability" component={PostAvailabilityScreen} />

            {/* Shared Screens */}
            <Stack.Screen name="Filter" component={FilterScreen} />
            <Stack.Screen name="ManageReports" component={ManageReportsScreen} />
          </Stack.Navigator>
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
