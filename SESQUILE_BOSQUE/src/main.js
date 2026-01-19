// ===============================
// Mapbox – Sesquilé | Cambio Bosques
// Usuario: effectiveactions9017
// ===============================

// TOKEN CORRECTO
mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// -------------------------------
// Mapa BEFORE (2017)
// -------------------------------
const beforeMap = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05], // Sesquilé
  zoom: 11,
  minZoom: 6,
  maxZoom: 15,
  bounds: [
    [-73.92, 4.94],
    [-73.69, 5.15]
  ],
  fitBoundsOptions: { padding: 15 },
  customAttribution: '© EffectiveActions | ESRI Land Cover'
});

// -------------------------------
// Mapa AFTER (2024)
// -------------------------------
const afterMap = new mapboxgl.Map({
  container: 'after',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05], // Sesquilé
  zoom: 11,
  minZoom: 6,
  maxZoom: 15,
  bounds: [
    [-73.92, 4.94],
    [-73.69, 5.15]
  ],
  fitBoundsOptions: { padding: 15 },
  customAttribution: '© EffectiveActions | ESRI Land Cover'
});

// -------------------------------
// TILESETS (DEBEN ESTAR PUBLIC)
// -------------------------------
const TILESET_2017 =
  'mapbox://effectiveactions9017.bosques_2017_esriLC_color-7e6vbh';

const TILESET_2024 =
  'mapbox://effectiveactions9017.bosques_2024_esriLC_color-7dr8hx';

// -------------------------------
// Cargar capas
// -------------------------------
beforeMap.on('load', () => {
  beforeMap.addSource('bosques2017', {
    type: 'raster',
    url: TILESET_2017,
    tileSize: 256
  });

  beforeMap.addLayer({
    id: 'bosques2017-layer',
    type: 'raster',
    source: 'bosques2017',
    paint: {
      'raster-opacity': 1
    }
  });
});

afterMap.on('load', () => {
  afterMap.addSource('bosques2024', {
    type: 'raster',
    url: TILESET_2024,
    tileSize: 256
  });

  afterMap.addLayer({
    id: 'bosques2024-layer',
    type: 'raster',
    source: 'bosques2024',
    paint: {
      'raster-opacity': 1
    }
  });
});

// -------------------------------
// Comparador (Swipe)
// -------------------------------
new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
