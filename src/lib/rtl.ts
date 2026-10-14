import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * RTL strategy (works identically in Expo Go, dev builds and release builds):
 *
 * 1. `direction: 'rtl'` on the root view makes Yoga lay out every `flex-row`
 *    right-to-left, independent of the device language or I18nManager state
 *    (Expo Go resets I18nManager, so we can't rely on it alone).
 * 2. app.json also sets `forcesRTL` via the expo-localization plugin so native
 *    builds (scroll bars, system UI) are RTL too. Both together are safe: they
 *    agree on the direction, so nothing gets double-flipped.
 * 3. Text gets a leading RIGHT-TO-LEFT MARK so the paragraph's base direction is
 *    RTL even when it starts with Latin text (e.g. "Apple AirTag"), and so mixed
 *    strings like "סוללה ניידת (Power Bank)" keep their parentheses in place.
 */
export const RLM = '‏';

export const rtlRoot: ViewStyle = { direction: 'rtl' };

export const rtlText: TextStyle = Platform.select<TextStyle>({
  ios: { writingDirection: 'rtl' },
  default: {},
});

export const rtl = (s: string | number) => `${RLM}${s}`;
