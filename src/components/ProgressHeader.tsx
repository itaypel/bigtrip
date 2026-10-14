import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rtl, rtlText } from '../lib/rtl';
import { useReduceMotion } from '../lib/useReduceMotion';
import { centeredColumn } from '../lib/layout';
import type { SyncStatus } from '../lib/usePackingState';
import { SyncButton } from './SyncButton';

const NEON = '#00ff9c';
const CYBER = '#22d3ee';

type Props = {
  packed: number;
  total: number;
  onReset: () => void;
  syncStatus: SyncStatus;
  onOpenSync: () => void;
};

export function ProgressHeader({ packed, total, onReset, syncStatus, onOpenSync }: Props) {
  const insets = useSafeAreaInsets();
  const ratio = total === 0 ? 0 : packed / total;
  const percent = Math.round(ratio * 100);
  const complete = packed === total && total > 0;

  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(ratio)).current;
  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(ratio);
      return;
    }
    Animated.timing(progress, {
      toValue: ratio,
      duration: 450,
      useNativeDriver: false, // width can't be driven natively
    }).start();
  }, [ratio, progress, reduceMotion]);

  const barColor = complete ? NEON : CYBER;

  return (
    <View
      style={{ paddingTop: insets.top + 12 }}
      className="border-b border-edge bg-void px-5 pb-5"
    >
      <View style={centeredColumn}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text style={rtlText} className="text-xs font-bold tracking-[3px] text-cyber">
              {rtl('// דרום אמריקה · 6 חודשים')}
            </Text>
            <Text style={rtlText} className="mt-1 text-3xl font-black text-white">
              {rtl('רשימת אריזה')}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <SyncButton status={syncStatus} onPress={onOpenSync} />
            <Pressable
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel="איפוס הרשימה"
              hitSlop={10}
              className="h-11 w-11 items-center justify-center rounded-full border border-edge bg-panel active:bg-slate-800"
            >
              <Ionicons name="refresh" size={20} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        <View className="mt-5 flex-row items-end justify-between">
          <Text style={rtlText} className="text-base text-slate-300">
            {rtl('ארזת ')}
            <Text className="font-black text-white">{packed}</Text>
            {' מתוך '}
            <Text className="font-black text-white">{total}</Text>
            {' פריטים'}
          </Text>
          <Text
            className="text-2xl font-black"
            style={{
              color: barColor,
              textShadowColor: barColor,
              textShadowRadius: 12,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            {percent}%
          </Text>
        </View>

        <View
          className="mt-3 h-3 overflow-hidden rounded-full border border-edge bg-night"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: packed }}
        >
          <Animated.View
            style={{
              height: '100%',
              borderRadius: 999,
              backgroundColor: barColor,
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              shadowColor: barColor,
              shadowOpacity: 1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </View>

        {complete && (
          <Text style={rtlText} className="mt-3 text-sm font-bold text-neon">
            {rtl('🎒 הכל ארוז! נסיעה טובה ¡Buen viaje!')}
          </Text>
        )}
      </View>
    </View>
  );
}
