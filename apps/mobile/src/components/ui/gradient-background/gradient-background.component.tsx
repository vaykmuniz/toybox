import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

export default function GradientBackground({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-toybox-blue">
      <LinearGradient
        colors={[Pink, Blue]}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
