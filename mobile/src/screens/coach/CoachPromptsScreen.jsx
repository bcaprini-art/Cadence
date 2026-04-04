/**
 * CoachPromptsScreen — plain-English scheduling recommendations
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
import api from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';

const PRIORITY_CONFIG = {
  high: {color: '#ef4444', bg: '#ef444420', label: 'High Priority', icon: '🔴'},
  medium: {color: '#f59e0b', bg: '#f59e0b20', label: 'Medium', icon: '🟡'},
  low: {color: '#22c55e', bg: '#22c55e20', label: 'Low', icon: '🟢'},
};

export default function CoachPromptsScreen() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/compliance/prompts', {
        params: {teamId: user?.teamId},
      });
      setPrompts(res.data?.prompts || res.data || []);
    } catch {
      // Fallback mock prompts for demo purposes
      setPrompts([
        {
          id: '1',
          priority: 'high',
          category: 'CARA',
          title: '3 athletes approaching weekly CARA limit',
          message:
            'Johnson, Martinez, and Chen are at 17+ hours this week. Scheduling any mandatory activities will push them over the 20-hour NCAA limit.',
          action: 'Review their schedules before adding more events.',
        },
        {
          id: '2',
          priority: 'medium',
          category: 'Availability',
          title: 'Low team availability Thursday afternoon',
          message:
            'Only 60% of athletes are free between 2–5 PM Thursday. Consider moving the film session to Thursday morning (8–10 AM) where 90% are available.',
          action: 'Reschedule Thursday film session.',
        },
        {
          id: '3',
          priority: 'low',
          category: 'Scheduling',
          title: 'Best practice window this week',
          message:
            'Tuesday 3–6 PM has the highest availability (94% of team free) with zero academic conflicts detected.',
          action: 'Consider scheduling core practices on Tuesdays.',
        },
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

  const filtered = filter === 'all'
    ? prompts
    : prompts.filter(p => p.priority === filter);

  const renderPrompt = ({item}) => {
    const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.low;
    return (
      <Card style={[styles.promptCard, {borderLeftColor: cfg.color, borderLeftWidth: 3}]}>
        <View style={styles.promptHeader}>
          <View style={[styles.priorityBadge, {backgroundColor: cfg.bg}]}>
            <Text style={[styles.priorityText, {color: cfg.color}]}>
              {cfg.icon} {cfg.label}
            </Text>
          </View>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        <Text style={styles.promptTitle}>{item.title}</Text>
        <Text style={styles.promptMessage}>{item.message}</Text>
        {item.action && (
          <View style={[styles.actionBox, {backgroundColor: theme.primary + '15'}]}>
            <Text style={[styles.actionText, {color: theme.primary}]}>
              💡 {item.action}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScreenWrapper scrollable={false} style={{padding: 0}}>
      <View style={styles.inner}>
        <SectionHeader title="Scheduling Insights" />
        <Text style={styles.subtitle}>
          AI-powered recommendations based on team availability and CARA compliance.
        </Text>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {['all', 'high', 'medium', 'low'].map(f => (
            <TouchableOpacity
              key={f}
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
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id || String(Math.random())}
          renderItem={renderPrompt}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            loading ? (
              <Card>
                <Text style={styles.emptyText}>Loading insights…</Text>
              </Card>
            ) : (
              <Card>
                <Text style={styles.emptyText}>
                  {filter === 'all'
                    ? 'No scheduling insights available. Your team is in great shape! 🎉'
                    : `No ${filter}-priority insights right now.`}
                </Text>
              </Card>
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: COLORS.surface,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
  },
  promptCard: {
    marginBottom: SPACING.sm,
  },
  promptHeader: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  priorityBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  categoryText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  promptTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  promptMessage: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 20,
  },
  actionBox: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  actionText: {
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  listContent: {paddingBottom: SPACING.xl},
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: FONT.sm,
  },
});
