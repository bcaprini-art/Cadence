/**
 * ComplianceScreen — CARA dashboard with team hours, warnings, and forecast
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
import {complianceAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import CARABar from '../../components/CARABar';
import SectionHeader from '../../components/SectionHeader';

const CARA_WEEKLY_LIMIT = 20;
const CARA_DAILY_LIMIT = 4;

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default function ComplianceScreen() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [weekStart, setWeekStart] = useState(getMonday());
  const [summary, setSummary] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sumRes, fcRes] = await Promise.allSettled([
        complianceAPI.getSummary(user?.teamId, weekStart),
        complianceAPI.getForecast(user?.teamId, weekStart),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (fcRes.status === 'fulfilled') setForecast(fcRes.value.data);
    } catch {
      // Fallback mock
      setSummary({
        weekStart,
        totalAthletes: 18,
        avgHours: 14.2,
        maxHours: 19.5,
        warnings: [
          {name: 'Alex Johnson', hours: 19.5},
          {name: 'Jordan Chen', hours: 18.8},
        ],
        violations: [],
      });
      setForecast({
        projectedHours: 17.3,
        remainingCapacity: 2.7,
        riskLevel: 'medium',
        events: [
          {title: 'Practice', day: 'Wed', hours: 2},
          {title: 'Film', day: 'Thu', hours: 1},
          {title: 'Game', day: 'Sat', hours: 3},
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.teamId, weekStart]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const changeWeek = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const riskColor = forecast?.riskLevel === 'high'
    ? COLORS.danger
    : forecast?.riskLevel === 'medium'
    ? COLORS.warning
    : COLORS.green;

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
      {/* Title */}
      <Text style={styles.title}>CARA Compliance</Text>
      <Text style={styles.subtitle}>NCAA Weekly Hours Monitor</Text>

      {/* Week Nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.navBtn}>
          <Text style={styles.navText}>‹ Prev</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          Week of{' '}
          {new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <TouchableOpacity onPress={() => changeWeek(1)} style={styles.navBtn}>
          <Text style={styles.navText}>Next ›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      {summary && (
        <View style={styles.statsRow}>
          <Card style={[styles.statCard]}>
            <Text style={[styles.statNumber, {color: theme.primary}]}>
              {summary.avgHours?.toFixed(1) ?? '--'}h
            </Text>
            <Text style={styles.statLabel}>Avg Hours</Text>
          </Card>
          <Card style={[styles.statCard]}>
            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    (summary.maxHours ?? 0) >= 19
                      ? COLORS.danger
                      : (summary.maxHours ?? 0) >= 16
                      ? COLORS.warning
                      : COLORS.green,
                },
              ]}>
              {summary.maxHours?.toFixed(1) ?? '--'}h
            </Text>
            <Text style={styles.statLabel}>Max Hours</Text>
          </Card>
          <Card style={[styles.statCard]}>
            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    (summary.warnings?.length ?? 0) > 0
                      ? COLORS.warning
                      : COLORS.green,
                },
              ]}>
              {summary.warnings?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Warnings</Text>
          </Card>
        </View>
      )}

      {/* Warnings */}
      {summary?.warnings?.length > 0 && (
        <>
          <SectionHeader title="Athletes Near Limit" />
          {summary.warnings.map((w, i) => (
            <Card key={i} style={styles.warningCard}>
              <View style={styles.warningRow}>
                <Text style={styles.warningName}>{w.name || w.athleteName}</Text>
                <Text style={[styles.warningHours, {color: COLORS.warning}]}>
                  {(w.hours ?? w.totalHours ?? 0).toFixed(1)}h / {CARA_WEEKLY_LIMIT}h
                </Text>
              </View>
              <CARABar
                used={w.hours ?? w.totalHours ?? 0}
                limit={CARA_WEEKLY_LIMIT}
                accentColor={COLORS.warning}
                showLabel={false}
                style={{marginTop: SPACING.sm}}
              />
            </Card>
          ))}
        </>
      )}

      {/* Violations */}
      {summary?.violations?.length > 0 && (
        <>
          <SectionHeader title="⛔ Violations" />
          {summary.violations.map((v, i) => (
            <Card key={i} style={[styles.warningCard, styles.violationCard]}>
              <Text style={styles.warningName}>{v.name || v.athleteName}</Text>
              <Text style={[styles.warningHours, {color: COLORS.danger}]}>
                {(v.hours ?? 0).toFixed(1)}h — Over limit!
              </Text>
            </Card>
          ))}
        </>
      )}

      {/* Forecast */}
      {forecast && (
        <>
          <SectionHeader title="Week Forecast" />
          <Card>
            <View style={styles.forecastHeader}>
              <Text style={styles.forecastLabel}>Risk Level</Text>
              <View style={[styles.riskBadge, {backgroundColor: riskColor + '25'}]}>
                <Text style={[styles.riskText, {color: riskColor}]}>
                  {(forecast.riskLevel || 'low').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.forecastStats}>
              <View style={styles.forecastStat}>
                <Text style={styles.forecastStatNum}>
                  {forecast.projectedHours?.toFixed(1) ?? '--'}h
                </Text>
                <Text style={styles.forecastStatLabel}>Projected</Text>
              </View>
              <View style={styles.forecastStat}>
                <Text style={[styles.forecastStatNum, {color: COLORS.green}]}>
                  {forecast.remainingCapacity?.toFixed(1) ?? '--'}h
                </Text>
                <Text style={styles.forecastStatLabel}>Remaining</Text>
              </View>
            </View>

            {forecast.events?.length > 0 && (
              <View style={styles.forecastEvents}>
                <Text style={styles.forecastEventsTitle}>Upcoming Events</Text>
                {forecast.events.map((e, i) => (
                  <View key={i} style={styles.forecastEvent}>
                    <Text style={styles.forecastEventDay}>{e.day}</Text>
                    <Text style={styles.forecastEventTitle}>{e.title}</Text>
                    <Text style={[styles.forecastEventHours, {color: theme.primary}]}>
                      {e.hours}h
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      )}

      {loading && !summary && (
        <Card>
          <Text style={styles.loadingText}>Loading compliance data…</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACING.md,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
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
    flex: 1,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statNumber: {
    fontSize: FONT.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  warningCard: {marginBottom: SPACING.sm},
  violationCard: {
    borderColor: COLORS.danger + '60',
    backgroundColor: COLORS.dangerMuted,
  },
  warningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningName: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '600',
  },
  warningHours: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  forecastLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  riskBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forecastStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  forecastStat: {},
  forecastStatNum: {
    color: COLORS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '700',
  },
  forecastStatLabel: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
  },
  forecastEvents: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  forecastEventsTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forecastEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  forecastEventDay: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    width: 40,
    fontWeight: '600',
  },
  forecastEventTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    flex: 1,
  },
  forecastEventHours: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  loadingText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: FONT.sm,
  },
});
