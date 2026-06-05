import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Fonts, Spacing } from '@/hooks/use-theme/theme.consts';

const Pink = '#ff74b8';
const Blue = '#5ba7ff';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Pink, Blue]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.colorField}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Home</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Blue,
  },
  colorField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '80%',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#111111',
    fontFamily: Fonts.sans,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
});
