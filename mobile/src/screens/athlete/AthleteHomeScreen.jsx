/**
 * AthleteHomeScreen — today's schedule, upcoming practices, conflict alerts
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getSportTheme} from '../../lib/sportThemes';
import {eventsAPI, complianceAPI, scheduleAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import CARABar from '../../components/CARABar';
import SectionHeader from '../../components/SectionHeader';

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function AthleteHomeScreen({navigation}) {
  const {user, school} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [caraHours, setCaraHours] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const load = useCallback(async () => {
    try {
      const [todayRes, upRes, caraRes, blocksRes] = await Promise.allSettled([
        eventsAPI.getEvents({date: todayStr, userId: user?.id}),
        eventsAPI.getEvents({from: tomorrowStr, limit: 5, userId: user?.id}),
        complianceAPI.getAthleteCARA(user?.id, undefined),
        scheduleAPI.getBlocks({userId: user?.id, from: todayStr}),
      ]);

      if (todayRes.status === 'fulfilled') {
        setTodayEvents(todayRes.value.data?.events || todayRes.value.data || []);
      }
      if (upRes.status === 'fulfilled') {
        setUpcomingEvents(upRes.value.data?.events || upRes.value.data || []);
      }
      if (caraRes.status === 'fulfilled') {
        setCaraHours(caraRes.value.data?.totalHours || caraRes.value.data?.hours || 0);
      }
      if (blocksRes.status === 'fulfilled') {
        // Look for events that overlap with schedule blocks
        const blocks = blocksRes.value.data || [];
        setConflicts(blocks.filter(b => b.hasConflict || b.conflictType));
      }
    } catch {
      // Mock data fallback
      setTodayEvents([
        {id: '1', title: 'Practice', startTime: `${todayStr}T15:00:00`, endTime: `${todayStr}T17:00:00`, location: 'Main Field'},
      ]);
      setUpcomingEvents([
        {id: '2', title: 'Film Session', startTime: `${tomorrowStr}T09:00:00`, location: 'Film Room'},
        {id: '3', title: 'Game', startTime: `${tomorrowStr}T18:00:00`, location: 'Home Arena'},
      ]);
      setCaraHours(14.5);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, todayStr, tomorrowStr]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }>
      {/* Welcome */}
      <View style={[styles.welcome, {borderLeftColor: theme.primary}]}>
        <Text style={styles.sportBadge}>
          {theme.icon} {user?.sport || 'Athletics'}
        </Text>
        <Text style={styles.greeting}>
          Hey, {user?.name?.split(' ')[0] || 'Athlete'} 👋
        </Text>
        {school && <Text style={styles.schoolName}>{school.name}</Text>}
      </View>

      {/* CARA Hours */}
      <Card>
        <Text style={styles.caraTitle}>My CARA Hours This Week</Text>
        <CARABar used={caraHours} limit={20} accentColor={theme.primary} />
        <Text style={styles.caraNote}>
          {20 - caraHours > 0
            ? `${(20 - caraHours).toFixed(1)}h remaining this week`
            : 'You have reached the weekly CARA limit.'}
        </Text>
      </Card>

      {/* Conflict Alerts */}
      {conflicts.length > 0 && (
        <>
          <SectionHeader title="⚠️ Conflict Alerts" />
          {conflicts.map((c, i) => (
            <Card key={i} style={styles.conflictCard}>
              <Text style={styles.conflictTitle}>{c.title || 'Schedule Conflict'}</Text>
              <Text style={styles.conflictDesc}>{c.conflictType || c.description}</Text>
            </Card>
          ))}
        </>
      )}

      {/* Today's Schedule */}
      <SectionHeader title="Today's Schedule" />
      {todayEvents.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            {loading ? 'Loading…' : 'Nothing scheduled for today 🙌'}
          </Text>
        </Card>
      ) : (
        todayEvents.map((evt, i) => (
          <Card key={evt.id || i}>
            <View style={styles.eventRow}>
              <View style={[styles.eventDot, {backgroundColor: theme.primary}]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={styles.eventTime}>
                  {formatTime(evt.startTime)}
                  {evt.endTime ? ` – ${formatTime(evt.endTime)}` : ''}
                </Text>
                {evt.location && (
                  <Text style={styles.eventLocation}>📍 {evt.location}</Text>
                )}
              </View>
              {evt.isVoluntary && (
                <View style={[styles.voluntaryBadge, {backgroundColor: theme.primary + '20'}]}>
                  <Text style={[styles.voluntaryText, {color: theme.primary}]}>
                    Voluntary
                  </Text>
                </View>
              )}
            </View>
          </Card>
        ))
      )}

      {/* Upcoming */}
      <SectionHeader
        title="Coming Up"
        actionLabel="View All"
        onAction={() => navigation.navigate('My Schedule')}
      />
      {upcomingEvents.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No upcoming events.</Text>
        </Card>
      ) : (
        upcomingEvents.slice(0, 4).map((evt, i) => (
          <Card key={evt.id || i}>
            <View style={styles.eventRow}>
              <View style={styles.upcomingDate}>
                <Text style={styles.upcomingDay}>
                  {new Date(evt.startTime).toLocaleDateString('en-US', {weekday: 'short'})}
                </Text>
                <Text style={[styles.upcomingNum, {color: theme.primary}]}>
                  {new Date(evt.startTime).getDate()}
                </Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={styles.eventTime}>{formatTime(evt.startTime)}</Text>
                {evt.location && (
                  <Text style={styles.eventLocation}>📍 {evt.location}</Text>
                )}
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SPACING.md, paddingBottom: SPACING.xxl},
  welcome: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.md,
    marginBottom: SPACING.md,
  },
  sportBadge: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: 2,
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '700',
  },
  schoolName: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  caraTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  caraNote: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 4,
  },
  conflictCard: {
    borderColor: COLORS.warning + '60',
    backgroundColor: COLORS.warningMuted,
    marginBottom: SPACING.sm,
  },
  conflictTitle: {
    color: COLORS.warning,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  conflictDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: SPACING.sm,
  },
  eventInfo: {flex: 1},
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '600',
  },
  eventTime: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 2,
  },
  eventLocation: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 1,
  },
  voluntaryBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  voluntaryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  upcomingDate: {
    width: 36,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  upcomingDay: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  upcomingNum: {
    fontSize: FONT.lg,
    fontWeight: '800',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: FONT.sm,
  },
});
