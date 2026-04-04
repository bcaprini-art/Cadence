/**
 * RegisterScreen — multi-step: basic info → role → sport picker
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import THEMES, {getSportTheme} from '../../lib/sportThemes';
import Input from '../../components/Input';
import Button from '../../components/Button';

const SPORTS = [
  'Football', 'Basketball', 'Soccer', 'Baseball', 'Softball',
  'Volleyball', 'Swimming', 'Track and Field', 'Wrestling',
  'Ice Hockey', 'Lacrosse', 'Tennis', 'Golf', 'Gymnastics', 'Rowing',
];

const TOTAL_STEPS = 3;

export default function RegisterScreen({navigation}) {
  const {register} = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    sport: '',
    school: '',
  });

  const update = (key, val) => {
    setForm(f => ({...f, [key]: val}));
    if (errors[key]) setErrors(e => ({...e, [key]: null}));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.role) e.role = 'Please select a role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!form.sport) e.sport = 'Please select a sport';
    if (!form.school.trim()) e.school = 'School name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role.toUpperCase(),
        sport: form.sport,
        school: form.school.trim(),
      });
    } catch (err) {
      Alert.alert(
        'Registration Failed',
        err?.response?.data?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const sportTheme = getSportTheme(form.sport);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, {backgroundColor: COLORS.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {paddingTop: insets.top + SPACING.lg},
          {paddingBottom: insets.bottom + SPACING.xl},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={step > 1 ? () => setStep(s => s - 1) : () => navigation.goBack()}
            style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(step / TOTAL_STEPS) * 100}%`,
                backgroundColor: sportTheme.primary || COLORS.green,
              },
            ]}
          />
        </View>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Create your account</Text>
            <Text style={styles.stepSub}>Enter your basic information</Text>

            <Input
              label="Full Name"
              value={form.name}
              onChangeText={v => update('name', v)}
              placeholder="Jane Smith"
              error={errors.name}
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={v => update('email', v)}
              placeholder="you@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Password"
              value={form.password}
              onChangeText={v => update('password', v)}
              placeholder="Min 8 characters"
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              value={form.confirmPassword}
              onChangeText={v => update('confirmPassword', v)}
              placeholder="Re-enter password"
              secureTextEntry
              error={errors.confirmPassword}
            />
            <Button title="Continue" onPress={nextStep} />
          </View>
        )}

        {/* Step 2: Role Selection */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your role?</Text>
            <Text style={styles.stepSub}>Choose how you'll use Cadence</Text>

            {errors.role ? (
              <Text style={styles.errorText}>{errors.role}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'coach' && {
                  borderColor: sportTheme.primary || COLORS.green,
                  backgroundColor: `${sportTheme.primary || COLORS.green}18`,
                },
              ]}
              onPress={() => update('role', 'coach')}>
              <Text style={styles.roleIcon}>🎯</Text>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>Coach</Text>
                <Text style={styles.roleDesc}>
                  Manage team schedules, compliance, and athlete availability
                </Text>
              </View>
              {form.role === 'coach' && (
                <Text style={[styles.checkmark, {color: sportTheme.primary || COLORS.green}]}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'athlete' && {
                  borderColor: sportTheme.primary || COLORS.green,
                  backgroundColor: `${sportTheme.primary || COLORS.green}18`,
                },
              ]}
              onPress={() => update('role', 'athlete')}>
              <Text style={styles.roleIcon}>🏅</Text>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>Athlete</Text>
                <Text style={styles.roleDesc}>
                  View your schedule, submit availability, and track CARA hours
                </Text>
              </View>
              {form.role === 'athlete' && (
                <Text style={[styles.checkmark, {color: sportTheme.primary || COLORS.green}]}>✓</Text>
              )}
            </TouchableOpacity>

            <Button
              title="Continue"
              onPress={nextStep}
              disabled={!form.role}
            />
          </View>
        )}

        {/* Step 3: Sport + School */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your sport & school</Text>
            <Text style={styles.stepSub}>Almost there!</Text>

            <Input
              label="School / University"
              value={form.school}
              onChangeText={v => update('school', v)}
              placeholder="State University"
              error={errors.school}
            />

            <Text style={styles.fieldLabel}>Sport</Text>
            {errors.sport ? (
              <Text style={styles.errorText}>{errors.sport}</Text>
            ) : null}
            <View style={styles.sportGrid}>
              {SPORTS.map(sport => {
                const t = getSportTheme(sport);
                const selected = form.sport === sport;
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.sportChip,
                      selected && {
                        borderColor: t.primary,
                        backgroundColor: `${t.primary}20`,
                      },
                    ]}
                    onPress={() => update('sport', sport)}>
                    <Text style={styles.sportIcon}>{t.icon}</Text>
                    <Text
                      style={[
                        styles.sportLabel,
                        selected && {color: t.primary},
                      ]}>
                      {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Create Account"
              onPress={handleSubmit}
              loading={loading}
              color={sportTheme.primary}
              style={styles.submitBtn}
            />
          </View>
        )}

        {step === 1 && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {padding: SPACING.xs},
  backText: {
    color: COLORS.green,
    fontSize: FONT.md,
    fontWeight: '600',
  },
  stepLabel: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  stepContainer: {},
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepSub: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT.sm,
    marginBottom: SPACING.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  roleIcon: {fontSize: 28, marginRight: SPACING.md},
  roleInfo: {flex: 1},
  roleName: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  roleDesc: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    gap: 4,
  },
  sportIcon: {fontSize: 14},
  sportLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '500',
  },
  submitBtn: {marginTop: SPACING.sm},
  loginLink: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loginLinkText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
  },
  loginLinkBold: {
    color: COLORS.green,
    fontWeight: '700',
  },
});
