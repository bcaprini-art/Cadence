/**
 * MyScheduleScreen — weekly calendar view + add block button
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getSportTheme} from '../../lib/sportThemes';
import {scheduleAPI, eventsAPI} from '../../services/api';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';

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

const BLOCK_TYPES = [
  {label: 'Class', color: '#3B82F6'},
  {label: 'Work', color: '#F59E0B'},
  {label: 'Study', color: '#8B5CF6'},
  {label: 'Personal', color: '#EC4899'},
  {label: 'Unavailable', color: '#EF4444'},
];

export default function MyScheduleScreen() {
  const {user} = useAuth();
  const theme = getSportTheme(user?.sport);
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const [newBlock, setNewBlock] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'Class',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const days = getWeekDays(weekOffset);
  const todayStr = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const weekStart = days[0].toISOString().slice(0, 10);
    const weekEnd = days[6].toISOString().slice(0, 10);
    try {
      const [evRes, blRes] = await Promise.allSettled([
        eventsAPI.getEvents({userId: user?.id, from: weekStart, to: weekEnd}),
        scheduleAPI.getBlocks({userId: user?.id, from: weekStart, to: weekEnd}),
      ]);
      if (evRes.status === 'fulfilled') {
        setEvents(evRes.value.data?.events || evRes.value.data || []);
      }
      if (blRes.status === 'fulfilled') {
        setBlocks(blRes.value.data || []);
      }
    } catch {
      // Mock
      setEvents([
        {id: 'e1', title: 'Practice', startTime: `${days[2].toISOString().slice(0, 10)}T15:00:00`, endTime: `${days[2].toISOString().slice(0, 10)}T17:00:00`, isTeam: true},
      ]);
      setBlocks([
        {id: 'b1', title: 'Econ 201', date: days[1].toISOString().slice(0, 10), startHour: 9, endHour: 10, type: 'Class'},
        {id: 'b2', title: 'Chemistry Lab', date: days[3].toISOString().slice(0, 10), startHour: 14, endHour: 16, type: 'Class'},
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekOffset, user?.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openAddModal = (day) => {
    setSelectedDay(day);
    setNewBlock(b => ({
      ...b,
      date: day.toISOString().slice(0, 10),
    }));
    setShowAddModal(true);
  };

  const handleAddBlock = async () => {
    if (!newBlock.title.trim() || !newBlock.startTime || !newBlock.endTime) {
      Alert.alert('Missing Fields', 'Please fill in title, start time, and end time.');
      return;
    }
    setSaving(true);
    try {
      await scheduleAPI.createBlock({
        userId: user?.id,
        title: newBlock.title.trim(),
        date: newBlock.date,
        startTime: `${newBlock.date}T${newBlock.startTime}:00`,
        endTime: `${newBlock.date}T${newBlock.endTime}:00`,
        type: newBlock.type,
        notes: newBlock.notes,
      });
      setShowAddModal(false);
      setNewBlock({title: '', date: '', startTime: '', endTime: '', type: 'Class', notes: ''});
      load();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add block.');
    } finally {
      setSaving(false);
    }
  };

  const getItemsForDay = (day) => {
    const dateStr = day.toISOString().slice(0, 10);
    const dayEvents = events.filter(e => (e.startTime || '').startsWith(dateStr));
    const dayBlocks = blocks.filter(b => (b.date || (b.startTime || '')).startsWith(dateStr));
    return [...dayEvents, ...dayBlocks];
  };

  return (
    <View style={styles.root}>
      {/* Week Nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          {days[0].toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
          {' – '}
          {days[6].toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
        </Text>
        <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {days.map((day, i) => {
          const dateStr = day.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayHeaderCell,
                isToday && {backgroundColor: theme.primary + '20', borderRadius: RADIUS.sm},
              ]}
              onPress={() => openAddModal(day)}>
              <Text style={styles.dayName}>
                {day.toLocaleDateString('en-US', {weekday: 'narrow'})}
              </Text>
              <Text style={[styles.dayNum, isToday && {color: theme.primary}]}>
                {day.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Week Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }>
        {loading ? (
          <Text style={styles.loadingText}>Loading schedule…</Text>
        ) : (
          <View style={styles.daysRow}>
            {days.map((day, di) => {
              const items = getItemsForDay(day);
              return (
                <View key={di} style={styles.dayCol}>
                  {items.length === 0 ? (
                    <TouchableOpacity
                      style={styles.emptyDayCell}
                      onPress={() => openAddModal(day)}>
                      <Text style={styles.addPlus}>+</Text>
                    </TouchableOpacity>
                  ) : (
                    items.map((item, idx) => {
                      const blockType = BLOCK_TYPES.find(t => t.label === item.type);
                      const color = item.isTeam
                        ? theme.primary
                        : blockType?.color || '#64748b';
                      return (
                        <View
                          key={item.id || idx}
                          style={[styles.eventChip, {backgroundColor: color + '30', borderColor: color}]}>
                          <Text style={[styles.chipText, {color}]} numberOfLines={2}>
                            {item.title}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Add Block Button */}
        <TouchableOpacity
          style={[styles.addBlockBtn, {borderColor: theme.primary}]}
          onPress={() => openAddModal(days[0])}>
          <Text style={[styles.addBlockText, {color: theme.primary}]}>
            + Add Availability Block
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Block Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Schedule Block</Text>
            {selectedDay && (
              <Text style={styles.modalSubtitle}>
                {selectedDay.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            )}

            <ScrollView keyboardShouldPersistTaps="handled">
              <Input
                label="Title"
                value={newBlock.title}
                onChangeText={v => setNewBlock(b => ({...b, title: v}))}
                placeholder="e.g. Chemistry Lab"
              />
              <Input
                label="Start Time (HH:MM)"
                value={newBlock.startTime}
                onChangeText={v => setNewBlock(b => ({...b, startTime: v}))}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
              />
              <Input
                label="End Time (HH:MM)"
                value={newBlock.endTime}
                onChangeText={v => setNewBlock(b => ({...b, endTime: v}))}
                placeholder="10:30"
                keyboardType="numbers-and-punctuation"
              />

              {/* Type picker */}
              <Text style={styles.typeLabel}>Block Type</Text>
              <View style={styles.typeRow}>
                {BLOCK_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.label}
                    style={[
                      styles.typeChip,
                      newBlock.type === t.label && {
                        backgroundColor: t.color + '30',
                        borderColor: t.color,
                      },
                    ]}
                    onPress={() => setNewBlock(b => ({...b, type: t.label}))}>
                    <Text
                      style={[
                        styles.typeChipText,
                        newBlock.type === t.label && {color: t.color},
                      ]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Notes (optional)"
                value={newBlock.notes}
                onChangeText={v => setNewBlock(b => ({...b, notes: v}))}
                placeholder="Any additional info…"
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => setShowAddModal(false)}
                  variant="ghost"
                  color={COLORS.textMuted}
                  style={{flex: 1, marginRight: SPACING.sm}}
                />
                <Button
                  title="Add Block"
                  onPress={handleAddBlock}
                  loading={saving}
                  color={theme.primary}
                  style={{flex: 1}}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.background},
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navBtn: {padding: SPACING.sm},
  navText: {
    color: COLORS.green,
    fontSize: FONT.xl,
    fontWeight: '700',
  },
  weekLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  dayName: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  dayNum: {
    color: COLORS.textSecondary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  scroll: {flex: 1},
  scrollContent: {padding: SPACING.sm, paddingBottom: SPACING.xl},
  daysRow: {
    flexDirection: 'row',
    gap: 2,
    minHeight: 200,
  },
  dayCol: {
    flex: 1,
    gap: 2,
  },
  emptyDayCell: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.sm,
  },
  addPlus: {
    color: COLORS.textMuted,
    fontSize: FONT.lg,
  },
  eventChip: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 3,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  addBlockBtn: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  addBlockText: {
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  loadingText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.xl,
    fontSize: FONT.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACING.md,
  },
  typeLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    backgroundColor: COLORS.surfaceAlt,
  },
  typeChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
});
