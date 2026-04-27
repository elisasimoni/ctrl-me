// Opens an address or coordinates in the native Maps app.
// Uses URL schemes: maps:// on iOS, geo: on Android, Google Maps as fallback.

import { getPlatform } from './platform.js';

export function openMaps(query) {
  const platform = getPlatform();
  const encoded = encodeURIComponent(query);

  let url;
  if (platform === 'ios') {
    url = `maps://?q=${encoded}`;
  } else if (platform === 'android') {
    url = `geo:0,0?q=${encoded}`;
  } else {
    url = `https://maps.google.com/?q=${encoded}`;
  }

  window.open(url, '_blank');
}

export function openMapsCoords(lat, lon, label = '') {
  const platform = getPlatform();
  const encodedLabel = encodeURIComponent(label);

  let url;
  if (platform === 'ios') {
    url = `maps://?ll=${lat},${lon}&q=${encodedLabel}`;
  } else if (platform === 'android') {
    url = `geo:${lat},${lon}?q=${lat},${lon}(${encodedLabel})`;
  } else {
    url = `https://maps.google.com/?q=${lat},${lon}`;
  }

  window.open(url, '_blank');
}
