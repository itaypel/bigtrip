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
