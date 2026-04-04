/**
 * Cadence Mobile — Auth Service
 * Wraps AsyncStorage operations and API calls for authentication.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from './api';

const TOKEN_KEY = 'cadence_token';
const USER_KEY = 'cadence_user';

export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function login(email, password) {
  const {data} = await authAPI.login(email, password);
  await saveSession(data.token, data.user);
  return data;
}

export async function register(formData) {
  const {data} = await authAPI.register(formData);
  await saveSession(data.token, data.user);
  return data;
}

export async function logout() {
  await clearSession();
}
