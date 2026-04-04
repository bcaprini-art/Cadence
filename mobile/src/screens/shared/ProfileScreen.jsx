/**
 * ProfileScreen — user info, sport, school, sign out
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getSportTheme} from '../../lib/sportThemes';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import Card from '../../components/Card';
import Button from '../../components/Button';

function getInitials(name) {
  return (name || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function roleLabel(role) {
  const map = {
    COACH: 'Coach',
    coach: 'Coach',
    ATHLETE: 'Athlete',
    athlete: 'Athlete',
    AD: 'Athletic Director',
    ADMIN: 'Admin',
  };
  return map[role] || role || 'Member';
}

export default function ProfileScreen() {
  const {user, school, logout, isCoach, isAthlete} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
          },
        },
      ],
    );
  };

  const infoRows = [
    {label: 'Name', value: user?.name},
    {label: 'Email', value: user?.email},
    {label: 'Role', value: roleLabel(user?.role)},
    {label: 'Sport', value: user?.sport || '—'},
    {label: 'School', value: school?.name || user?.school || '—'},
    user?.year && {label: 'Year', value: user.year},
    user?.position && {label: 'Position', value: user.position},
    user?.number && {label: 'Number', value: `#${user.number}`},
  ].filter(Boolean);

  return (
    <ScreenWrapper>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.primary + '25',
              borderColor: theme.primary,
            },
          ]}>
          <Text style={[styles.avatarText, {color: theme.primary}]}>
            {getInitials(user?.name)}
          </Text>
        </View>
        <Text style={styles.displayName}>{user?.name || 'Athlete'}</Text>
        <View style={[styles.roleBadge, {backgroundColor: theme.primary + '20'}]}>
          <Text style={[styles.roleText, {color: theme.primary}]}>
            {theme.icon} {roleLabel(user?.role)}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <Card>
        {infoRows.map((row, i) => (
          <View
            key={row.label}
            style={[
              styles.infoRow,
              i < infoRows.length - 1 && styles.infoBorder,
            ]}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value || '—'}</Text>
          </View>
        ))}
      </Card>

      {/* Sport Card */}
      {user?.sport && (
        <Card style={[styles.sportCard, {borderColor: theme.primary + '40'}]}>
          <View style={styles.sportRow}>
            <Text style={styles.sportIcon}>{theme.icon}</Text>
            <View>
              <Text style={[styles.sportName, {color: theme.primary}]}>
                {user.sport}
              </Text>
              <Text style={styles.sportField}>
                {theme.fieldName} · {theme.eventVerb}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* App Info */}
      <Card>
        <Text style={styles.appInfoTitle}>About Cadence</Text>
        <Text style={styles.appInfoText}>
          NCAA-compliant scheduling platform for college athletics. Tracks CARA hours,
          manages team availability, and coordinates athlete schedules.
        </Text>
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.versionText}>Port 4001</Text>
        </View>
      </Card>

      {/* Sign Out */}
      <Button
        title="Sign Out"
        onPress={handleLogout}
        loading={loggingOut}
        variant="outline"
        color={COLORS.danger}
        style={styles.signOutBtn}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: FONT.xxl,
    fontWeight: '800',
  },
  displayName: {
    color: COLORS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  infoBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    fontWeight: '500',
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  sportCard: {
    borderWidth: 1,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  sportIcon: {fontSize: 32},
  sportName: {
    fontSize: FONT.lg,
    fontWeight: '700',
  },
  sportField: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  appInfoTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  appInfoText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
  },
  signOutBtn: {
    marginTop: SPACING.md,
  },
});
