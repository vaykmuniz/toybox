import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

const DefaultCenter: [number, number] = [-46.6333, -23.5505];
const MapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

type MapboxModule = typeof import('@rnmapbox/maps').default;

function MapFallback({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-center text-sm font-semibold leading-5 text-ink">{message}</Text>
    </View>
  );
}

export function Map() {
  const [Mapbox, setMapbox] = useState<MapboxModule | null>();

  useEffect(() => {
    let isMounted = true;

    import('@rnmapbox/maps')
      .then(({ default: loadedMapbox }) => {
        if (MapboxAccessToken) {
          loadedMapbox.setAccessToken(MapboxAccessToken);
        }

        if (isMounted) {
          setMapbox(loadedMapbox);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMapbox(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (Mapbox === null) {
    return <MapFallback message="Rebuild the native app to show the Mapbox map." />;
  }

  if (Mapbox === undefined) {
    return <MapFallback message="Loading map..." />;
  }

  if (!MapboxAccessToken) {
    return <MapFallback message="Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to show the map." />;
  }

  return (
    <Mapbox.MapView style={{ flex: 1 }}>
      <Mapbox.Camera centerCoordinate={DefaultCenter} zoomLevel={10} />
    </Mapbox.MapView>
  );
}
