import './global.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryCard } from './src/components/CategoryCard';
import { ProgressHeader } from './src/components/ProgressHeader';
import { CATEGORIES, TOTAL_ITEMS } from './src/data/packingList';
import { loadChecked, saveChecked, type CheckedMap } from './src/lib/storage';
import { rtl, rtlRoot, rtlText } from './src/lib/rtl';
import { centeredColumn } from './src/lib/layout';

const VALID_IDS = new Set(CATEGORIES.flatMap((c) => c.items.map((i) => i.id)));

function PackingScreen() {
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState<CheckedMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [CATEGORIES[0].title]: true,
  });
  const skipNextSave = useRef(true);

  // Restore saved progress on launch.
  useEffect(() => {
    let cancelled = false;
    loadChecked().then((saved) => {
      if (cancelled) return;
      setChecked(saved);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change. The first run after hydration is skipped so we
  // don't immediately rewrite what we just read.
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveChecked(checked);
  }, [checked, hydrated]);

  const toggleItem = useCallback((id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleExpanded = useCallback((title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const resetAll = useCallback(() => {
    Alert.alert('לאפס את הרשימה?', 'כל הסימונים יימחקו. לא ניתן לבטל פעולה זו.', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'איפוס',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          setChecked({});
        },
      },
    ]);
  }, []);

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
      <ProgressHeader packed={packed} total={TOTAL_ITEMS} onReset={resetAll} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={[
          centeredColumn,
          { padding: 16, paddingBottom: insets.bottom + 32 },
        ]}
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
          {rtl('ההתקדמות נשמרת אוטומטית במכשיר')}
        </Text>
      </ScrollView>
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
