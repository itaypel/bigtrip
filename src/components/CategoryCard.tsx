import { memo, useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ItemRow } from './ItemRow';
import type { PackingCategory } from '../data/packingList';
import type { CheckedMap } from '../lib/storage';
import { rtl, rtlText } from '../lib/rtl';

type Props = {
  category: PackingCategory;
  checked: CheckedMap;
  expanded: boolean;
  onToggleExpanded: (title: string) => void;
  onToggleItem: (id: string) => void;
};

function CategoryCardBase({
  category,
  checked,
  expanded,
  onToggleExpanded,
  onToggleItem,
}: Props) {
  const total = category.items.length;
  const done = category.items.filter((i) => checked[i.id]).length;
  const complete = done === total;

  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    onToggleExpanded(category.title);
  };

  return (
    <View
      className={`mb-4 overflow-hidden rounded-2xl border bg-panel ${
        complete ? 'border-neon/70' : 'border-edge'
      }`}
    >
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${category.title}, ${done} מתוך ${total}`}
        className="min-h-[64px] flex-row items-center gap-3 px-4 py-4 active:bg-slate-800/60"
      >
        <Text
          style={rtlText}
          numberOfLines={2}
          className={`flex-1 text-lg font-bold ${complete ? 'text-neon' : 'text-white'}`}
        >
          {rtl(category.title)}
        </Text>

        <View
          className={`rounded-full px-3 py-1 ${complete ? 'bg-neon/15' : 'bg-cyber/10'}`}
        >
          <Text className={`text-sm font-bold ${complete ? 'text-neon' : 'text-cyber'}`}>
            {complete ? '✓ הושלם' : `${done}/${total}`}
          </Text>
        </View>

        <Animated.View
          style={{
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <Ionicons name="chevron-down" size={22} color="#94a3b8" />
        </Animated.View>
      </Pressable>

      {/* Thin per-category progress line */}
      <View className="h-[3px] bg-edge">
        <View
          className={complete ? 'h-full bg-neon' : 'h-full bg-cyber'}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </View>

      {expanded && (
        <View className="py-1">
          {category.items.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View className="mx-4 h-px bg-edge" />}
              <ItemRow
                id={item.id}
                label={item.label}
                checked={!!checked[item.id]}
                onToggle={onToggleItem}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export const CategoryCard = memo(CategoryCardBase);
