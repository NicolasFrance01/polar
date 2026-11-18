// Service for Google Maps directions generation and OSRM street network routing

export function cleanAddressQuery(item) {
  if (!item) return 'Córdoba, Argentina';
  if (typeof item === 'string') {
    return item.includes('Córdoba') ? item : `${item}, Córdoba, Argentina`;
  }
  const parts = [
    item.address,
    item.neighborhood,
    'Córdoba, Argentina'
  ].filter(Boolean);
  return parts.join(', ');
}

function resolveOriginString(originLocation) {
  if (!originLocation) return null;
  if (typeof originLocation === 'object' && originLocation.lat != null && originLocation.lng != null) {
    return `${originLocation.lat},${originLocation.lng}`;
  }
  if (typeof originLocation === 'string' && originLocation.trim().length > 0) {
    return originLocation.trim();
  }
  return null;
}

// Google Maps multi-stop embed iframe URL (draws real street routes and connects all stops)
// ALWAYS starts from origin (user or driver location), then connects all stops in exact order:
// Mi Ubicación -> Parada 1 -> Parada 2 -> Parada 3...
export function getGoogleMapsRouteEmbedUrl(stops, originLocation = null) {
  const originStr = resolveOriginString(originLocation);

  if (!stops || stops.length === 0) {
    if (originStr && originStr !== 'Current Location' && originStr !== 'My Location') {
      return `https://maps.google.com/maps?q=${encodeURIComponent(originStr)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    }
    return 'https://maps.google.com/maps?q=Cordoba,%20Argentina&t=&z=13&ie=UTF8&iwloc=&output=embed';
  }

  // The route ALWAYS starts from origin (user live location or Córdoba fallback coords):
  const origin = (originStr && originStr !== 'Current Location' && originStr !== 'My Location')
    ? encodeURIComponent(originStr)
    : encodeURIComponent('-31.4170,-64.1830');

  // ALL stops are in daddr in order, separated by +to:
  const destAndWaypoints = stops.map((s) => encodeURIComponent(cleanAddressQuery(s))).join('+to:');
  return `https://maps.google.com/maps?saddr=${origin}&daddr=${destAndWaypoints}&output=embed`;
}

// Google Maps native app / web navigation deep link with all stops and waypoints
// ALWAYS starts from "Mi ubicación" (or coordinates) to Stop 1, Stop 2, ..., Stop N
export function getGoogleMapsDirectionsAppUrl(stops, originLocation = null) {
  if (!stops || stops.length === 0) {
    return 'https://www.google.com/maps';
  }

  const originCoordStr = resolveOriginString(originLocation);

  // In Google Maps Directions API:
  // If coordinates are provided, pass &origin=lat,lng
  // If no coordinates are provided (or 'Current Location'), omit origin so Google Maps automatically defaults to device location (Tu ubicación)
  const originParam = (originCoordStr && originCoordStr !== 'Current Location' && originCoordStr !== 'My Location')
    ? `&origin=${encodeURIComponent(originCoordStr)}`
    : '';

  // Destination is ALWAYS the last stop in the route
  const destination = encodeURIComponent(cleanAddressQuery(stops[stops.length - 1]));

  // If there's only 1 stop: route from Mi Ubicación -> Stop 1
  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destination}&travelmode=driving`;
  }

  // If there are multiple stops:
  // Waypoints are all stops from Stop 1 up to Stop N-1
  // Destination is Stop N
  const waypoints = stops.slice(0, -1).map((s) => encodeURIComponent(cleanAddressQuery(s))).join('|');
  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

// Single stop Waze link
export function getWazeStopUrl(item) {
  const q = cleanAddressQuery(item);
  return `https://waze.com/ul?q=${encodeURIComponent(q)}`;
}

// Fetch real turn-by-turn street route from OSRM for Leaflet (avoids straight line across blocks)
export async function fetchOSRMStreetRoute(latlngs) {
  if (!latlngs || latlngs.length < 2) return null;
  try {
    const coordsStr = latlngs.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.routes && data.routes[0]?.geometry?.coordinates) {
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (err) {
    console.warn('OSRM route fetch error:', err.message);
  }
  return null;
}
