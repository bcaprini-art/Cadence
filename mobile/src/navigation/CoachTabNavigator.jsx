/**
 * Coach Bottom Tab Navigator
 * Tabs: Home | Availability | Schedule | Roster | Compliance
 */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {COLORS} from '../lib/colors';
import {useAuth} from '../context/AuthContext';
import {getSportTheme} from '../lib/sportThemes';

import CoachHomeScreen from '../screens/coach/CoachHomeScreen';
import TeamAvailabilityScreen from '../screens/coach/TeamAvailabilityScreen';
import ScheduleEventScreen from '../screens/coach/ScheduleEventScreen';
import RosterScreen from '../screens/coach/RosterScreen';
import ComplianceScreen from '../screens/coach/ComplianceScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

// Simple text-based tab icons (no vector-icons dependency at runtime)
import {Text} from 'react-native';

const Tab = createBottomTabNavigator();

function TabIcon({label, focused, color}) {
  const icons = {
    Home: '⌂',
    Availability: '📅',
    Schedule: '➕',
    Roster: '👥',
    Compliance: '📊',
    Profile: '👤',
  };
  return (
    <Text style={{fontSize: 20, opacity: focused ? 1 : 0.5}}>
      {icons[label] || '•'}
    </Text>
  );
}

export default function CoachTabNavigator() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const activeColor = theme.primary;

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({focused, color}) => (
          <TabIcon label={route.name} focused={focused} color={color} />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
      })}>
      <Tab.Screen name="Home" component={CoachHomeScreen} />
      <Tab.Screen name="Availability" component={TeamAvailabilityScreen} />
      <Tab.Screen name="Schedule" component={ScheduleEventScreen} />
      <Tab.Screen name="Roster" component={RosterScreen} />
      <Tab.Screen name="Compliance" component={ComplianceScreen} />
    </Tab.Navigator>
  );
}
