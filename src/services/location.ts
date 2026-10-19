import * as Location from 'expo-location';
import { GeoPoint } from '../domain/types';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function locationStatus(): Promise<PermissionState> {
  try {
    const r = await Location.getForegroundPermissionsAsync();
    return r.status as PermissionState;
  } catch {
    return 'denied';
  }
}

export async function requestLocation(): Promise<PermissionState> {
  try {
    const r = await Location.requestForegroundPermissionsAsync();
    return r.status as PermissionState;
  } catch {
    return 'denied';
  }
}

/** Foreground GPS while a workout is recording. Returns a stop function. */
export async function watchLocation(onPoint: (p: GeoPoint) => void, onError: (msg: string) => void): Promise<() => void> {
  try {
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
      (loc) => onPoint({ lat: loc.coords.latitude, lon: loc.coords.longitude, accuracy: loc.coords.accuracy ?? null, at: new Date(loc.timestamp).toISOString() }),
      (reason) => onError(String(reason)),
    );
    return () => sub.remove();
  } catch (e) {
    onError(e instanceof Error ? e.message : String(e));
    return () => {};
  }
}
