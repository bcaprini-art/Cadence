/**
 * RosterScreen — athlete list with CARA meters
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getSportTheme} from '../../lib/sportThemes';
import {rosterAPI, complianceAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import CARABar from '../../components/CARABar';

const CARA_LIMIT = 20;

function getInitials(name) {
  return (name || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function RosterScreen() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [athletes, setAthletes] = useState([]);
  const [caraMap, setCaraMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [rosterRes, compRes] = await Promise.allSettled([
        rosterAPI.getRoster(user?.teamId),
        complianceAPI.getSummary(user?.teamId, undefined),
      ]);

      let athleteList = [];
      if (rosterRes.status === 'fulfilled') {
        athleteList = rosterRes.value.data?.athletes || rosterRes.value.data || [];
        setAthletes(athleteList);
      }

      if (compRes.status === 'fulfilled') {
        const d = compRes.value.data;
        const map = {};
        (d?.athletes || []).forEach(a => {
          map[a.userId || a.id] = a.totalHours ?? a.caraHours ?? 0;
        });
        setCaraMap(map);
      }
    } catch {
      // Fallback mock
      setAthletes([
        {id: '1', name: 'Alex Johnson', position: 'Forward', year: 'Jr'},
        {id: '2', name: 'Sam Martinez', position: 'Guard', year: 'Sr'},
        {id: '3', name: 'Jordan Chen', position: 'Center', year: 'So'},
        {id: '4', name: 'Taylor Brooks', position: 'Guard', year: 'Fr'},
        {id: '5', name: 'Casey Rivera', position: 'Forward', year: 'Jr'},
      ]);
      setCaraMap({'1': 18.5, '2': 16, '3': 19.5, '4': 12, '5': 14});
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

  const filtered = athletes.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const renderAthlete = ({item}) => {
    const hours = caraMap[item.id] ?? 0;
    const pct = (hours / CARA_LIMIT) * 100;
    const isWarning = pct >= 75 && pct < 90;
    const isDanger = pct >= 90;

    return (
      <Card style={styles.athleteCard}>
        <View style={styles.athleteRow}>
          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              {backgroundColor: theme.primary + '30', borderColor: theme.primary + '60'},
            ]}>
            <Text style={[styles.avatarText, {color: theme.primary}]}>
              {getInitials(item.name)}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.athleteInfo}>
            <Text style={styles.athleteName}>{item.name}</Text>
            <Text style={styles.athleteMeta}>
              {[item.position, item.year, item.number ? `#${item.number}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.statusArea}>
            {isDanger && (
              <View style={[styles.badge, {backgroundColor: COLORS.dangerMuted}]}>
                <Text style={[styles.badgeText, {color: COLORS.danger}]}>⚠️ Limit</Text>
              </View>
            )}
            {isWarning && !isDanger && (
              <View style={[styles.badge, {backgroundColor: COLORS.warningMuted}]}>
                <Text style={[styles.badgeText, {color: COLORS.warning}]}>Near</Text>
              </View>
            )}
          </View>
        </View>

        <CARABar
          used={hours}
          limit={CARA_LIMIT}
          accentColor={theme.primary}
          style={{marginTop: SPACING.sm}}
        />
      </Card>
    );
  };

  return (
    <ScreenWrapper scrollable={false} style={{padding: 0}}>
      <View style={styles.header}>
        <Text style={styles.title}>Roster</Text>
        <Text style={styles.subtitle}>
          {athletes.length} athlete{athletes.length !== 1 ? 's' : ''}
          {' · '}
          {theme.icon} {user?.sport || 'Team'}
        </Text>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search athletes…"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id || item.name}
        renderItem={renderAthlete}
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
              {loading ? 'Loading roster…' : 'No athletes found.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACING.sm,
  },
  search: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  athleteCard: {marginBottom: SPACING.sm},
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  athleteInfo: {flex: 1},
  athleteName: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '600',
  },
  athleteMeta: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 2,
  },
  statusArea: {alignItems: 'flex-end'},
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
  },
});
