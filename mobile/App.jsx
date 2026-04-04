/**
 * Cadence Mobile — Root App Component
 */
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'react-native';
import {AuthProvider} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const COLORS = {
  background: '#0a0f1e',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.background}
          />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
