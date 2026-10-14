import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { SyncStatus } from '../lib/usePackingState';

export const STATUS_LABEL: Record<SyncStatus, string> = {
  local: 'לא מחובר: הרשימה נשמרת רק במכשיר הזה',
  syncing: 'מסנכרן…',
  synced: 'מסונכרן ✓',
  offline: 'אין חיבור. השינויים יעלו כשתחזור לרשת',
  error: 'הסנכרון נכשל. ננסה שוב אוטומטית',
};

const ICON: Record<SyncStatus, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  local: { name: 'cloud-outline', color: '#94a3b8' },
  syncing: { name: 'cloud-upload-outline', color: '#22d3ee' },
  synced: { name: 'cloud-done-outline', color: '#00ff9c' },
  offline: { name: 'cloud-offline-outline', color: '#fbbf24' },
  error: { name: 'cloud-offline-outline', color: '#fbbf24' },
};

export function SyncButton({ status, onPress }: { status: SyncStatus; onPress: () => void }) {
  const icon = ICON[status];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`סנכרון. ${STATUS_LABEL[status]}`}
      hitSlop={10}
      className="h-11 w-11 items-center justify-center rounded-full border border-edge bg-panel active:bg-slate-800"
    >
      <Ionicons name={icon.name} size={21} color={icon.color} />
    </Pressable>
  );
}
