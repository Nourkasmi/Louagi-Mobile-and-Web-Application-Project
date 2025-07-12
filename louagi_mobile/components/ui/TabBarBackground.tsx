// components/ui/TabBarBackground.tsx - FIXED VERSION
import { View } from 'react-native';

// 🔧 SIMPLE WHITE BACKGROUND - NO BLUR, NO COMPLEXITY
export default function TabBarBackground() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff', // FORCE WHITE
      }}
    />
  );
}

export function useBottomTabOverflow() {
  return 0; // No overflow needed
}