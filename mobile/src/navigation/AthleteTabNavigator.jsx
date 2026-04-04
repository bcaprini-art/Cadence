/**
 * Athlete Bottom Tab Navigator
 * Tabs: Home | My Schedule | Team
 */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {COLORS} from '../lib/colors';
import {useAuth} from '../context/AuthContext';
import {getSportTheme} from '../lib/sportThemes';

import AthleteHomeScreen from '../screens/athlete/AthleteHomeScreen';
import MyScheduleScreen from '../screens/athlete/MyScheduleScreen';
import TeamScheduleScreen from '../screens/athlete/TeamScheduleScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabIcon({label, focused}) {
  const icons = {
    Home: '⌂',
    'My Schedule': '🗓',
    Team: '👥',
    Profile: '👤',
  };
  return (
    <Text style={{fontSize: 20, opacity: focused ? 1 : 0.5}}>
      {icons[label] || '•'}
    </Text>
  );
}

export default function AthleteTabNavigator() {
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
      <Tab.Screen name="Home" component={AthleteHomeScreen} />
      <Tab.Screen name="My Schedule" component={MyScheduleScreen} />
      <Tab.Screen name="Team" component={TeamScheduleScreen} />
    </Tab.Navigator>
  );
}
