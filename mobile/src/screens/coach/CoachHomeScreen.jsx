/**
 * CoachHomeScreen — welcome banner, quick stats, upcoming events, quick actions
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getSportTheme} from '../../lib/sportThemes';
import {eventsAPI, complianceAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CoachHomeScreen({navigation}) {
  const {user, school} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({athletes: 0, warnings: 0});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const [evRes, compRes] = await Promise.allSettled([
        eventsAPI.getEvents({from: now, limit: 5}),
        complianceAPI.getSummary(user?.teamId, undefined),
      ]);

      if (evRes.status === 'fulfilled') {
        setEvents(evRes.value.data?.events || evRes.value.data || []);
      }
      if (compRes.status === 'fulfilled') {
        const d = compRes.value.data;
        setStats({
          athletes: d?.totalAthletes || 0,
          warnings: d?.warnings?.length || 0,
        });
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const quickActions = [
    {
      label: 'Find Best Times',
      icon: '🔍',
      onPress: () => navigation.navigate('Schedule'),
    },
    {
      label: 'View Roster',
      icon: '👥',
      onPress: () => navigation.navigate('Roster'),
    },
    {
      label: 'Compliance',
      icon: '📊',
      onPress: () => navigation.navigate('Compliance'),
    },
    {
      label: 'Availability',
      icon: '📅',
      onPress: () => navigation.navigate('Availability'),
    },
  ];

  return (
    <ScreenWrapper
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }>
      {/* Welcome Banner */}
      <View style={[styles.banner, {borderLeftColor: theme.primary}]}>
        <Text style={styles.bannerSport}>
          {theme.icon} {user?.sport || 'Athletics'}
        </Text>
        <Text style={styles.bannerGreeting}>
          Welcome back, {user?.name?.split(' ')[0] || 'Coach'}
        </Text>
        {school && (
          <Text style={styles.bannerSchool}>{school.name}</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, {flex: 1, marginRight: SPACING.sm}]}>
          <Text style={[styles.statNumber, {color: theme.primary}]}>
            {stats.athletes}
          </Text>
          <Text style={styles.statLabel}>Athletes</Text>
        </Card>
        <Card
          style={[
            styles.statCard,
            {flex: 1},
            stats.warnings > 0 && styles.warningCard,
          ]}>
          <Text
            style={[
              styles.statNumber,
              {color: stats.warnings > 0 ? COLORS.warning : COLORS.textMuted},
            ]}>
            {stats.warnings}
          </Text>
          <Text style={styles.statLabel}>CARA Warnings</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.actionsGrid}>
        {quickActions.map(a => (
          <TouchableOpacity
            key={a.label}
            style={[styles.actionBtn, {borderColor: theme.primary + '40'}]}
            onPress={a.onPress}
            activeOpacity={0.8}>
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={[styles.actionLabel, {color: theme.primary}]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming Events */}
      <SectionHeader title="Upcoming Events" />
      {loading ? (
        <Card>
          <Text style={styles.loadingText}>Loading events…</Text>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No upcoming events scheduled.</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Schedule')}
            style={[styles.emptyBtn, {borderColor: theme.primary}]}>
            <Text style={[styles.emptyBtnText, {color: theme.primary}]}>
              + Schedule an Event
            </Text>
          </TouchableOpacity>
        </Card>
      ) : (
        events.map((evt, idx) => (
          <Card key={evt.id || idx}>
            <View style={styles.eventRow}>
              <View
                style={[
                  styles.eventDot,
                  {backgroundColor: theme.primary},
                ]}
              />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{evt.title || evt.name}</Text>
                <Text style={styles.eventTime}>{formatDate(evt.startTime || evt.start)}</Text>
                {evt.location && (
                  <Text style={styles.eventLocation}>📍 {evt.location}</Text>
                )}
              </View>
              {evt.isVoluntary && (
                <View style={styles.voluntaryBadge}>
                  <Text style={styles.voluntaryText}>Voluntary</Text>
                </View>
              )}
            </View>
          </Card>
        ))
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.md,
    marginBottom: SPACING.lg,
  },
  bannerSport: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: 2,
  },
  bannerGreeting: {
    color: COLORS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '700',
  },
  bannerSchool: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statNumber: {
    fontSize: FONT.xxxl,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 2,
  },
  warningCard: {
    borderColor: COLORS.warning + '60',
    backgroundColor: COLORS.warningMuted,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  actionIcon: {fontSize: 24, marginBottom: 4},
  actionLabel: {
    fontSize: FONT.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: FONT.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: FONT.sm,
    marginBottom: SPACING.md,
  },
  emptyBtn: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  emptyBtnText: {
    fontSize: FONT.sm,
    fontWeight: '600',
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
    backgroundColor: COLORS.greenMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  voluntaryText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '600',
  },
});
