import './global.css';

import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryCard } from './src/components/CategoryCard';
import { ProgressHeader } from './src/components/ProgressHeader';
import { SyncSheet } from './src/components/SyncSheet';
import { CATEGORIES, TOTAL_ITEMS } from './src/data/packingList';
import { usePackingState } from './src/lib/usePackingState';
import { rtl, rtlRoot, rtlText } from './src/lib/rtl';
import { centeredColumn } from './src/lib/layout';

if (Platform.OS === 'web') {
  // Lets the browser use Hebrew fonts/hyphenation and put the scrollbar on the left.
  document.documentElement.lang = 'he';
  document.documentElement.dir = 'rtl';
}

const ALL_IDS = CATEGORIES.flatMap((c) => c.items.map((i) => i.id));
const VALID_IDS = new Set(ALL_IDS);

function PackingScreen() {
  const insets = useSafeAreaInsets();
  const { checked, hydrated, toggle, resetAll, sync } = usePackingState(ALL_IDS);
  const [syncOpen, setSyncOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [CATEGORIES[0].title]: true,
  });

  const toggleItem = useCallback(
    (id: string) => {
      Haptics.selectionAsync().catch(() => {});
      toggle(id);
    },
    [toggle],
  );

  const toggleExpanded = useCallback((title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const confirmReset = useCallback(() => {
    const title = 'לאפס את הרשימה?';
    const message = sync.session
      ? 'כל הסימונים יימחקו בכל המכשירים. לא ניתן לבטל פעולה זו.'
      : 'כל הסימונים יימחקו. לא ניתן לבטל פעולה זו.';
    const reset = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      resetAll();
    };

    // react-native-web's Alert.alert is a no-op, so the browser gets a native confirm().
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${message}`)) reset();
      return;
    }
    Alert.alert(title, message, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'איפוס', style: 'destructive', onPress: reset },
    ]);
  }, [resetAll, sync.session]);

  // Ignore stale IDs in storage (e.g. an item that was renamed in the data file).
  const packed = useMemo(
    () => Object.keys(checked).filter((id) => checked[id] && VALID_IDS.has(id)).length,
    [checked],
  );

  if (!hydrated) {
    return (
      <View style={rtlRoot} className="flex-1 items-center justify-center bg-void">
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  return (
    <View style={rtlRoot} className="flex-1 bg-void">
      <ProgressHeader
        packed={packed}
        total={TOTAL_ITEMS}
        onReset={confirmReset}
        syncStatus={sync.status}
        onOpenSync={() => setSyncOpen(true)}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={[centeredColumn, { padding: 16, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.title}
            category={category}
            checked={checked}
            expanded={!!expanded[category.title]}
            onToggleExpanded={toggleExpanded}
            onToggleItem={toggleItem}
          />
        ))}
        <Text style={rtlText} className="mt-2 text-center text-xs text-slate-400">
          {rtl(
            sync.session
              ? `מסונכרן עם ${sync.session.user.email}`
              : 'ההתקדמות נשמרת אוטומטית במכשיר',
          )}
        </Text>
      </ScrollView>

      <SyncSheet
        visible={syncOpen}
        onClose={() => setSyncOpen(false)}
        session={sync.session}
        status={sync.status}
        onSyncNow={sync.syncNow}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <PackingScreen />
    </SafeAreaProvider>
  );
}
