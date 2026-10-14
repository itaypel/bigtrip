import type { ViewStyle } from 'react-native';

/** Keeps rows a readable length on iPad instead of stretching edge to edge. */
export const CONTENT_MAX_WIDTH = 640;

export const centeredColumn: ViewStyle = {
  width: '100%',
  maxWidth: CONTENT_MAX_WIDTH,
  alignSelf: 'center',
};
