/**
 * TeamAvailabilityScreen — horizontal-scroll week view with color-coded availability blocks
 * Mobile-simplified heatmap: day columns with colored time blocks
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
import {scheduleAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import SectionHeader from '../../components/SectionHeader';

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const HOUR_LABELS = {
  7: '7a', 8: '8a', 9: '9a', 10: '10a', 11: '11a', 12: '12p',
  13: '1p', 14: '2p', 15: '3p', 16: '4p', 17: '5p', 18: '6p',
  19: '7p', 20: '8p', 21: '9p',
};

function getWeekDays(offset = 0) {
  const days = [];
  const today = new Date();
  today.setDate(today.getDate() - today.getDay() + offset * 7);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function getAvailabilityColor(count, total) {
  if (total === 0) return COLORS.border;
  const pct = count / total;
  if (pct >= 0.8) return '#22c55e'; // green — most available
  if (pct >= 0.5) return '#84cc16'; // lime
  if (pct >= 0.3) return '#f59e0b'; // amber — partial
  return '#ef4444';                 // red — mostly unavailable
}

export default function TeamAvailabilityScreen() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [weekOffset, setWeekOffset] = useState(0);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const days = getWeekDays(weekOffset);

  const load = useCallback(async () => {
    try {
      const weekStart = days[0].toISOString().slice(0, 10);
      const weekEnd = days[6].toISOString().slice(0, 10);
      const res = await scheduleAPI.getBlocks({
        teamId: user?.teamId,
        from: weekStart,
        to: weekEnd,
      });
      setBlocks(res.data || []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekOffset, user?.teamId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Build availability map: dayIndex → hour → count available
  const availabilityMap = {};
  days.forEach((day, di) => {
    const dateStr = day.toISOString().slice(0, 10);
    availabilityMap[di] = {};
    HOURS.forEach(h => {
      // Count athletes who DON'T have a conflict block at this hour on this day
      const conflicting = blocks.filter(b => {
        if (!b.date && !b.startTime) return false;
        const bDate = (b.date || b.startTime || '').slice(0, 10);
        if (bDate !== dateStr) return false;
        const bHour = b.hour ?? new Date(b.startTime).getHours();
        return bHour === h;
      });
      availabilityMap[di][h] = conflicting.length;
    });
  });

  const totalAthletes = blocks.length > 0
    ? Math.max(...blocks.map(b => b.totalAthletes || 1))
    : 10; // placeholder

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <ScreenWrapper scrollable={false} style={{padding: 0}}>
      {/* Week Nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setWeekOffset(w => w - 1)}>
          <Text style={styles.navText}>‹ Prev</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          {days[0].toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
          {' — '}
          {days[6].toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
        </Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setWeekOffset(w => w + 1)}>
          <Text style={styles.navText}>Next ›</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          {[
            {color: '#22c55e', label: 'Most free'},
            {color: '#84cc16', label: 'Mostly free'},
            {color: '#f59e0b', label: 'Partial'},
            {color: '#ef4444', label: 'Conflicts'},
          ].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: l.color}]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Availability Grid — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gridScroll}>
        <View style={styles.grid}>
          {/* Hour labels column */}
          <View style={styles.hourColumn}>
            <View style={styles.dayHeader} />
            {HOURS.map(h => (
              <View key={h} style={styles.hourCell}>
                <Text style={styles.hourLabel}>{HOUR_LABELS[h]}</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {days.map((day, di) => {
            const dateStr = day.toISOString().slice(0, 10);
            const isToday = dateStr === todayStr;
            return (
              <View key={di} style={styles.dayColumn}>
                <View
                  style={[
                    styles.dayHeader,
                    isToday && {
                      backgroundColor: theme.primary + '25',
                      borderRadius: RADIUS.sm,
                    },
                  ]}>
                  <Text style={styles.dayName}>
                    {day.toLocaleDateString('en-US', {weekday: 'short'})}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      isToday && {color: theme.primary},
                    ]}>
                    {day.getDate()}
                  </Text>
                </View>
                {HOURS.map(h => {
                  const conflictCount = availabilityMap[di]?.[h] ?? 0;
                  const available = Math.max(totalAthletes - conflictCount, 0);
                  const color = getAvailabilityColor(available, totalAthletes);
                  return (
                    <View
                      key={h}
                      style={[styles.cell, {backgroundColor: color + '55', borderColor: color + '30'}]}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const CELL_H = 28;
const CELL_W = 44;
const HOUR_W = 36;

const styles = StyleSheet.create({
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navBtn: {padding: SPACING.xs},
  navText: {
    color: COLORS.green,
    fontSize: FONT.md,
    fontWeight: '600',
  },
  weekLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  legend: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  legendRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  gridScroll: {flex: 1},
  grid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
  },
  hourColumn: {
    width: HOUR_W,
  },
  dayColumn: {
    width: CELL_W,
  },
  dayHeader: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayName: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dayNum: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  hourCell: {
    height: CELL_H,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  },
  hourLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  cell: {
    height: CELL_H,
    margin: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
});
