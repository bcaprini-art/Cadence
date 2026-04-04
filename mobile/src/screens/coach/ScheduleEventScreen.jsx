/**
 * ScheduleEventScreen — create events + "Find Best Times" via conflict-check/suggest
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import {getSportTheme} from '../../lib/sportThemes';
import {eventsAPI, conflictAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';

const EVENT_TYPES = ['Practice', 'Game', 'Film Session', 'Meeting', 'Travel', 'Other'];
const DURATIONS = ['30 min', '1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours'];

function toMinutes(str) {
  const map = {'30 min': 30, '1 hour': 60, '1.5 hours': 90, '2 hours': 120, '2.5 hours': 150, '3 hours': 180};
  return map[str] || 60;
}

export default function ScheduleEventScreen() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    title: '',
    type: 'Practice',
    date: '',
    startTime: '',
    duration: '1 hour',
    location: '',
    notes: '',
    isVoluntary: false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const update = (key, val) => {
    setForm(f => ({...f, [key]: val}));
    if (errors[key]) setErrors(e => ({...e, [key]: null}));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Event title is required';
    if (!form.date) e.date = 'Date is required (YYYY-MM-DD)';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) e.date = 'Use format YYYY-MM-DD';
    if (!form.startTime) e.startTime = 'Start time is required (HH:MM)';
    else if (!/^\d{2}:\d{2}$/.test(form.startTime)) e.startTime = 'Use format HH:MM (24h)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const startDateTime = `${form.date}T${form.startTime}:00`;
      const durationMs = toMinutes(form.duration) * 60 * 1000;
      const endDateTime = new Date(new Date(startDateTime).getTime() + durationMs).toISOString();

      await eventsAPI.createEvent({
        title: form.title.trim(),
        type: form.type,
        startTime: startDateTime,
        endTime: endDateTime,
        location: form.location.trim(),
        notes: form.notes.trim(),
        isVoluntary: form.isVoluntary,
        teamId: user?.teamId,
      });

      Alert.alert('Event Created', `"${form.title}" has been scheduled.`);
      setForm({
        title: '',
        type: 'Practice',
        date: '',
        startTime: '',
        duration: '1 hour',
        location: '',
        notes: '',
        isVoluntary: false,
      });
      setSuggestions([]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create event.');
    } finally {
      setSaving(false);
    }
  };

  const handleFindBestTimes = async () => {
    if (!form.date) {
      Alert.alert('Date Required', 'Enter a target date first to find best times near it.');
      return;
    }
    setSuggesting(true);
    setSuggestions([]);
    try {
      const res = await conflictAPI.suggest({
        teamId: user?.teamId,
        date: form.date,
        durationMinutes: toMinutes(form.duration),
        eventType: form.type,
      });
      const data = res.data;
      setSuggestions(data?.suggestions || data?.times || []);
      if ((data?.suggestions || data?.times || []).length === 0) {
        Alert.alert('No Suggestions', 'No ideal time slots found for this date and duration. Try different settings.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not fetch suggestions. Make sure the backend is running.');
    } finally {
      setSuggesting(false);
    }
  };

  const applySuggestion = (s) => {
    const dt = new Date(s.startTime || s.start);
    update('date', dt.toISOString().slice(0, 10));
    update('startTime', `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`);
    setSuggestions([]);
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.background}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {paddingTop: insets.top + SPACING.md, paddingBottom: SPACING.xxl},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Schedule Event</Text>
        <Text style={styles.subtitle}>
          {theme.icon} {user?.sport || 'Athletics'}
        </Text>

        <Card>
          <Input
            label="Event Title"
            value={form.title}
            onChangeText={v => update('title', v)}
            placeholder="e.g. Tuesday Practice"
            error={errors.title}
          />

          {/* Event Type */}
          <Text style={styles.fieldLabel}>Event Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {EVENT_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.chip,
                  form.type === t && {
                    backgroundColor: theme.primary + '25',
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => update('type', t)}>
                <Text style={[styles.chipText, form.type === t && {color: theme.primary}]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input
            label="Date"
            value={form.date}
            onChangeText={v => update('date', v)}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            error={errors.date}
          />

          <Input
            label="Start Time (24h)"
            value={form.startTime}
            onChangeText={v => update('startTime', v)}
            placeholder="14:00"
            keyboardType="numbers-and-punctuation"
            error={errors.startTime}
          />

          {/* Duration */}
          <Text style={styles.fieldLabel}>Duration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  form.duration === d && {
                    backgroundColor: theme.primary + '25',
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => update('duration', d)}>
                <Text style={[styles.chipText, form.duration === d && {color: theme.primary}]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input
            label="Location (optional)"
            value={form.location}
            onChangeText={v => update('location', v)}
            placeholder="Practice Field 1"
          />

          <Input
            label="Notes (optional)"
            value={form.notes}
            onChangeText={v => update('notes', v)}
            placeholder="Any additional notes…"
            multiline
            numberOfLines={3}
          />

          {/* Voluntary toggle */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Voluntary Activity</Text>
              <Text style={styles.toggleDesc}>
                Voluntary activities don't count toward CARA hours
              </Text>
            </View>
            <Switch
              value={form.isVoluntary}
              onValueChange={v => update('isVoluntary', v)}
              trackColor={{false: COLORS.border, true: theme.primary + '80'}}
              thumbColor={form.isVoluntary ? theme.primary : COLORS.textMuted}
            />
          </View>
        </Card>

        {/* Find Best Times */}
        <Button
          title="🔍 Find Best Times"
          onPress={handleFindBestTimes}
          loading={suggesting}
          variant="outline"
          color={theme.primary}
          style={styles.suggestBtn}
        />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card>
            <Text style={styles.suggestTitle}>Best Available Times</Text>
            {suggestions.map((s, idx) => {
              const dt = new Date(s.startTime || s.start);
              const conflictCount = s.conflictCount ?? 0;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.suggestionRow,
                    idx < suggestions.length - 1 && styles.suggestionBorder,
                  ]}
                  onPress={() => applySuggestion(s)}>
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionTime}>
                      {dt.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                      {' at '}
                      {dt.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
                    </Text>
                    <Text style={styles.suggestionConflicts}>
                      {conflictCount === 0
                        ? '✅ No conflicts'
                        : `⚠️ ${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <Text style={[styles.useBtn, {color: theme.primary}]}>Use →</Text>
                </TouchableOpacity>
              );
            })}
          </Card>
        )}

        <Button
          title="Create Event"
          onPress={handleSave}
          loading={saving}
          color={theme.primary}
          style={styles.createBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {paddingHorizontal: SPACING.md},
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
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  chipScroll: {marginBottom: SPACING.md},
  chip: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    marginRight: SPACING.sm,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  toggleLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  toggleDesc: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 2,
    maxWidth: 220,
  },
  suggestBtn: {marginBottom: SPACING.sm},
  suggestTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionInfo: {flex: 1},
  suggestionTime: {
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  suggestionConflicts: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 2,
  },
  useBtn: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  createBtn: {marginTop: SPACING.md},
});
