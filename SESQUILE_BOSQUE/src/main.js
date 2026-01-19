// ===============================
// Mapbox – Sesquilé | Cambio Bosques
// Basado 100% en el ejemplo FUNCIONAL
// ===============================

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// -------- BEFORE (2017)
const beforeMap = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
  zoom: 11,
  maxZoom: 15,
  minZoom: 6,
  customAttribution: '&#9400 EffectiveActions, datos: ESRI Land Cover',
  bounds: [
    [-74.10, 4.80],   // ⬅️ bounds AMPLIADOS (clave)
    [-73.50, 5.30]
  ],
  fitBoundsOptions: { padding: 15 }
});

// -------- AFTER (2024)
const afterMap = new mapboxgl.Map({
  container: 'after',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
  zoom: 11,
  maxZoom: 15,
  minZoom: 6,
  customAttribution: '&#9400 EffectiveActions, datos: ESRI Land Cover',
  bounds: [
    [-74.10, 4.80],   // ⬅️ MISMO bounds
    [-73.50, 5.30]
  ],
  fitBoundsOptions: { padding: 15 }
});

// -------- Raster layers
beforeMap.on('load', () => {
  beforeMap.addSource('bosques2017', {
    type: 'raster',
    url: 'mapbox://effectiveactions9017.bosques_2017_esriLC_color-7e6vbh',
    tileSize: 256
  });

  beforeMap.addLayer({
    id: 'bosques2017-layer',
    type: 'raster',
    source: 'bosques2017',
    paint: { 'raster-opacity': 1 }
  });
});

afterMap.on('load', () => {
  afterMap.addSource('bosques2024', {
    type: 'raster',
    url: 'mapbox://effectiveactions9017.bosques_2024_esriLC_color-7dr8hx',
    tileSize: 256
  });

  afterMap.addLayer({
    id: 'bosques2024-layer',
    type: 'raster',
    source: 'bosques2024',
    paint: { 'raster-opacity': 1 }
  });
});

// -------- Compare
new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
