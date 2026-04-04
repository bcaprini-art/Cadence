/**
 * LoginScreen — dark navy design, email/password + quick-login buttons
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import {COLORS, SPACING, FONT, RADIUS} from '../../lib/colors';
import Input from '../../components/Input';
import Button from '../../components/Button';

const QUICK_LOGINS = [
  {label: '⚽ Demo Coach', email: 'coach@demo.cadence.app', password: 'demo123', role: 'coach'},
  {label: '🏃 Demo Athlete', email: 'athlete@demo.cadence.app', password: 'demo123', role: 'athlete'},
];

export default function LoginScreen({navigation}) {
  const {login} = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert(
        'Login Failed',
        err?.response?.data?.message || 'Invalid credentials. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async ({email: e, password: p}) => {
    setLoading(true);
    try {
      await login(e, p);
    } catch (err) {
      Alert.alert('Demo Login Failed', 'Make sure the backend is running on port 4001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, {backgroundColor: COLORS.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {paddingTop: insets.top + SPACING.xl},
          {paddingBottom: insets.bottom + SPACING.xl},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.appName}>Cadence</Text>
          <Text style={styles.tagline}>College Athletics Scheduling</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your account</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={v => {
              setEmail(v);
              if (errors.email) setErrors(e => ({...e, email: null}));
            }}
            placeholder="you@university.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={v => {
              setPassword(v);
              if (errors.password) setErrors(e => ({...e, password: null}));
            }}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            error={errors.password}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Login */}
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Quick Demo Login</Text>
          <View style={styles.quickRow}>
            {QUICK_LOGINS.map(q => (
              <TouchableOpacity
                key={q.role}
                style={styles.quickBtn}
                onPress={() => handleQuickLogin(q)}
                disabled={loading}>
                <Text style={styles.quickBtnText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {
    paddingHorizontal: SPACING.lg,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.greenMuted,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: FONT.xxxl,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginTop: 4,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginBottom: SPACING.lg,
  },
  loginBtn: {
    marginTop: SPACING.sm,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
  },
  registerBold: {
    color: COLORS.green,
    fontWeight: '700',
  },
  quickSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  quickTitle: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  quickBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
});
