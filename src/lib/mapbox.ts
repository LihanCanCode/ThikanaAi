export interface RouteDetails {
  coordinates: [number, number][];
  distanceKm: number;
  durationMins: number;
}

/**
 * Fetches walking route from start [lng, lat] to end [lng, lat] using Mapbox Directions API
 */
export async function getWalkingRoute(
  start: [number, number],
  end: [number, number],
  token: string
): Promise<RouteDetails | null> {
  if (!token) return null;
  if (!start || start.length < 2 || isNaN(start[0]) || isNaN(start[1])) return null;
  if (!end || end.length < 2 || isNaN(end[0]) || isNaN(end[1])) return null;

  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Mapbox Directions API responded with status ${res.status}`);
    }
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        distanceKm: route.distance / 1000,
        durationMins: route.duration / 60,
      };
    }
  } catch (err) {
    console.error("Failed to fetch Mapbox walking route:", err);
  }
  return null;
}
