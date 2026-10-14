import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReduceMotion } from '../lib/useReduceMotion';

const NEON = '#00ff9c';

type Props = { checked: boolean; size?: number };

/** Purely visual — the whole row is the touch target (see ItemRow). */
export function NeonCheckbox({ checked, size = 30 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    // Don't "pop" every checked box when state is restored from storage on launch.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (reduceMotion) return;
    scale.setValue(0.7);
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
    // reduceMotion is read but deliberately not a dependency: only a check change should pop.
  }, [checked, scale]);

  return (
    <Animated.View
      style={[
        { width: size, height: size, transform: [{ scale }] },
        checked && {
          shadowColor: NEON,
          shadowOpacity: 0.9,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
      ]}
    >
      <View
        className={`flex-1 items-center justify-center rounded-lg border-2 ${
          checked ? 'border-neon bg-neon' : 'border-slate-400 bg-night'
        }`}
      >
        {checked && <Ionicons name="checkmark-sharp" size={size * 0.72} color="#05070d" />}
      </View>
    </Animated.View>
  );
}
