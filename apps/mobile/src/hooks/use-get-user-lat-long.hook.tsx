import { useCallback, useEffect, useState } from 'react';

import * as Location from 'expo-location';

export type UserLatLong = {
  latitude: number;
  longitude: number;
};

export interface GetUserLatLongResult {
  error: Error | null;
  isLoading: boolean;
  latLong: UserLatLong | null;
  refetch: () => Promise<void>;
}

const normalizeLocationError = (locationError: unknown) => {
  return locationError instanceof Error ? locationError : new Error('Failed to get location');
};

const getCurrentLatLong = async (): Promise<UserLatLong> => {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Location permission was not granted');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

export const useGetUserLatLong = (): GetUserLatLongResult => {
  const [latLong, setLatLong] = useState<UserLatLong | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setLatLong(await getCurrentLatLong());
    } catch (locationError) {
      console.log(locationError);
      setError(normalizeLocationError(locationError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getCurrentLatLong()
      .then((nextLatLong) => {
        if (isMounted) {
          setLatLong(nextLatLong);
        }
      })
      .catch((locationError) => {
        console.log(locationError);
        if (isMounted) {
          setError(normalizeLocationError(locationError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    error,
    isLoading,
    latLong,
    refetch,
  };
};
