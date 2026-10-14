import { memo } from 'react';
import { Pressable, Text } from 'react-native';
import { NeonCheckbox } from './NeonCheckbox';
import { rtl, rtlText } from '../lib/rtl';

type Props = {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
};

function ItemRowBase({ id, label, checked, onToggle }: Props) {
  return (
    <Pressable
      onPress={() => onToggle(id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(0,255,156,0.12)' }}
      hitSlop={4}
      className="min-h-[56px] flex-row items-center gap-4 px-4 py-3 active:bg-slate-800/60"
    >
      <NeonCheckbox checked={checked} />
      <Text
        style={rtlText}
        className={`flex-1 text-[17px] leading-6 ${
          checked ? 'text-slate-500 line-through' : 'text-slate-100'
        }`}
      >
        {rtl(label)}
      </Text>
    </Pressable>
  );
}

export const ItemRow = memo(ItemRowBase);
