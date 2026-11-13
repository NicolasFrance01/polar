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

// Google Maps multi-stop embed iframe URL (draws real street routes and connects all stops)
export function getGoogleMapsRouteEmbedUrl(stops) {
  if (!stops || stops.length === 0) {
    return 'https://maps.google.com/maps?q=Cordoba,%20Argentina&t=&z=13&ie=UTF8&iwloc=&output=embed';
  }

  if (stops.length === 1) {
    const q = cleanAddressQuery(stops[0]);
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  }

  // Multi-stop directions embed:
  // saddr=origin&daddr=stop2+to:stop3+to:stop4
  const origin = encodeURIComponent(cleanAddressQuery(stops[0]));
  const destAndWaypoints = stops.slice(1).map((s) => encodeURIComponent(cleanAddressQuery(s))).join('+to:');
  return `https://maps.google.com/maps?saddr=${origin}&daddr=${destAndWaypoints}&output=embed`;
}

// Google Maps native app / web navigation deep link with all stops and waypoints
export function getGoogleMapsDirectionsAppUrl(stops) {
  if (!stops || stops.length === 0) return 'https://www.google.com/maps';

  if (stops.length === 1) {
    const q = cleanAddressQuery(stops[0]);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  const origin = encodeURIComponent(cleanAddressQuery(stops[0]));
  const destination = encodeURIComponent(cleanAddressQuery(stops[stops.length - 1]));
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

  if (stops.length > 2) {
    const waypoints = stops.slice(1, -1).map((s) => encodeURIComponent(cleanAddressQuery(s))).join('|');
    url += `&waypoints=${waypoints}`;
  }

  return url;
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
