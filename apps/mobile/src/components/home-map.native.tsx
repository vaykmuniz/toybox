import Mapbox from '@rnmapbox/maps';
import { Text, View } from 'react-native';

const DefaultCenter: [number, number] = [-46.6333, -23.5505];
const MapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (MapboxAccessToken) {
  Mapbox.setAccessToken(MapboxAccessToken);
}

export function HomeMap() {
  if (!MapboxAccessToken) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-sm font-semibold leading-5 text-ink">
          Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to show the map.
        </Text>
      </View>
    );
  }

  return (
    <Mapbox.MapView style={{ flex: 1 }}>
      <Mapbox.Camera centerCoordinate={DefaultCenter} zoomLevel={10} />
    </Mapbox.MapView>
  );
}
