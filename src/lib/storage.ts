import AsyncStorage from '@react-native-async-storage/async-storage';

export type CheckedMap = Record<string, boolean>;

const CHECKED_KEY = '@packing-list/checked/v1';

export async function loadChecked(): Promise<CheckedMap> {
  try {
    const raw = await AsyncStorage.getItem(CHECKED_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as CheckedMap)
      : {};
  } catch (e) {
    console.warn('Failed to load packing state', e);
    return {};
  }
}

/** Local changes not yet confirmed by the server, with the time they were made. */
export type PendingMap = Record<string, { checked: boolean; t: number }>;

const PENDING_KEY = '@packing-list/pending/v1';
const LAST_USER_KEY = '@packing-list/last-user/v1';

export async function loadPending(): Promise<PendingMap> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingMap) : {};
  } catch {
    return {};
  }
}

export function savePending(pending: PendingMap) {
  AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending)).catch((e) =>
    console.warn('Failed to save pending sync changes', e),
  );
}

export async function loadLastUser(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

export function saveLastUser(userId: string | null) {
  const op = userId
    ? AsyncStorage.setItem(LAST_USER_KEY, userId)
    : AsyncStorage.removeItem(LAST_USER_KEY);
  op.catch(() => {});
}

export async function saveChecked(checked: CheckedMap): Promise<void> {
  try {
    // Only persist checked items — keeps the payload small and unchecking == deleting.
    const compact: CheckedMap = {};
    for (const id in checked) if (checked[id]) compact[id] = true;
    await AsyncStorage.setItem(CHECKED_KEY, JSON.stringify(compact));
  } catch (e) {
    console.warn('Failed to save packing state', e);
  }
}
