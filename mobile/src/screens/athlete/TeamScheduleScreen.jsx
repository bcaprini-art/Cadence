/**
 * TeamScheduleScreen — upcoming team events for athletes
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getSportTheme} from '../../lib/sportThemes';
import {eventsAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';

const EVENT_TYPE_COLORS = {
  Practice: '#22c55e',
  Game: '#ef4444',
  'Film Session': '#8B5CF6',
  Meeting: '#3B82F6',
  Travel: '#F59E0B',
  Other: '#64748b',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString('en-US', {weekday: 'short'}),
    date: d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
    time: d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}),
  };
}

export default function TeamScheduleScreen() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const res = await eventsAPI.getEvents({
        from: now,
        teamId: user?.teamId,
        limit: 30,
      });
      setEvents(res.data?.events || res.data || []);
    } catch {
      // Mock data
      const base = new Date();
      const addDays = (n) => {
        const d = new Date(base);
        d.setDate(d.getDate() + n);
        return d.toISOString();
      };
      setEvents([
        {id: '1', title: 'Practice', type: 'Practice', startTime: addDays(1), endTime: addDays(1), location: 'Main Field', isVoluntary: false},
        {id: '2', title: 'Film Session', type: 'Film Session', startTime: addDays(2), location: 'Film Room', isVoluntary: false},
        {id: '3', title: 'Scrimmage', type: 'Game', startTime: addDays(3), location: 'Home Arena', isVoluntary: false},
        {id: '4', title: 'Optional Weights', type: 'Practice', startTime: addDays(4), location: 'Weight Room', isVoluntary: true},
        {id: '5', title: 'Away Game vs State', type: 'Game', startTime: addDays(6), location: 'State Arena', isVoluntary: false},
        {id: '6', title: 'Team Meeting', type: 'Meeting', startTime: addDays(7), location: 'Meeting Room B', isVoluntary: false},
      ]);
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

  const filters = ['all', 'Practice', 'Game', 'Meeting', 'Film Session'];
  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  const renderEvent = ({item, index}) => {
    const {day, date, time} = formatDateTime(item.startTime) || {};
    const typeColor = EVENT_TYPE_COLORS[item.type] || theme.primary;
    const prev = filtered[index - 1];
    const prevDate = prev ? new Date(prev.startTime).toDateString() : null;
    const thisDate = new Date(item.startTime).toDateString();
    const showDateHeader = prevDate !== thisDate;

    return (
      <>
        {showDateHeader && (
          <Text style={styles.dateHeader}>
            {new Date(item.startTime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        )}
        <Card style={styles.eventCard}>
          <View style={styles.eventRow}>
            {/* Time column */}
            <View style={styles.timeCol}>
              <Text style={styles.timeText}>{time}</Text>
            </View>

            {/* Color bar */}
            <View style={[styles.colorBar, {backgroundColor: typeColor}]} />

            {/* Details */}
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <View style={styles.eventMeta}>
                <View style={[styles.typeBadge, {backgroundColor: typeColor + '20'}]}>
                  <Text style={[styles.typeText, {color: typeColor}]}>{item.type}</Text>
                </View>
                {item.isVoluntary && (
                  <View style={styles.voluntaryBadge}>
                    <Text style={styles.voluntaryText}>Voluntary</Text>
                  </View>
                )}
              </View>
              {item.location && (
                <Text style={styles.location}>📍 {item.location}</Text>
              )}
            </View>
          </View>
        </Card>
      </>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Team Schedule</Text>
        <Text style={styles.subtitle}>
          {theme.icon} {user?.sport || 'Athletics'} · Upcoming Events
        </Text>

        {/* Filter pills */}
        <FlatList
          horizontal
          data={filters}
          keyExtractor={f => f}
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          renderItem={({item: f}) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === f && {
                  backgroundColor: theme.primary + '25',
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => setFilter(f)}>
              <Text
                style={[
                  styles.filterText,
                  filter === f && {color: theme.primary},
                ]}>
                {f === 'all' ? 'All' : f}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id || String(Math.random())}
        renderItem={renderEvent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading
                ? 'Loading schedule…'
                : filter === 'all'
                ? 'No upcoming team events.'
                : `No upcoming ${filter} events.`}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.background},
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACING.sm,
  },
  filterScroll: {marginTop: SPACING.xs},
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  dateHeader: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  eventCard: {marginBottom: SPACING.sm},
  eventRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeCol: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  colorBar: {
    width: 3,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
  },
  eventDetails: {flex: 1},
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: 3,
  },
  typeBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  voluntaryBadge: {
    backgroundColor: COLORS.greenMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  voluntaryText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '600',
  },
  location: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
  },
  empty: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    textAlign: 'center',
  },
});
