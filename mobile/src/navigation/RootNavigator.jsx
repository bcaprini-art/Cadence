/**
 * Root Navigator — switches between Auth stack and main app tabs
 * based on authentication state.
 */
import React from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../context/AuthContext';
import {COLORS} from '../lib/colors';

import AuthNavigator from './AuthNavigator';
import CoachTabNavigator from './CoachTabNavigator';
import AthleteTabNavigator from './AthleteTabNavigator';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  const isCoach =
    user.role === 'COACH' || user.role === 'coach';

  return isCoach ? <CoachTabNavigator /> : <AthleteTabNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
