// ===============================
// Mapbox – Sesquilé | Cambio Bosques
// Usuario: effectiveactions9017
// ===============================

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// TILESETS (PUBLIC)
const TILESET_2017 =
  'mapbox://effectiveactions9017.bosques_2017_esriLC_color-7e6vbh';

const TILESET_2024 =
  'mapbox://effectiveactions9017.bosques_2024_esriLC_color-7dr8hx';

// -------------------------------
// Mapa BEFORE (2017)
// -------------------------------
const beforeMap = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
  zoom: 11,
  minZoom: 6,
  maxZoom: 14, // 👈 el tileset llega a 14
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
  center: [-73.80, 5.05],
  zoom: 11,
  minZoom: 6,
  maxZoom: 14, // 👈 el tileset llega a 14
  bounds: [
    [-73.92, 4.94],
    [-73.69, 5.15]
  ],
  fitBoundsOptions: { padding: 15 },
  customAttribution: '© EffectiveActions | ESRI Land Cover'
});

// Debug útil
beforeMap.on('error', (e) => console.log('BEFORE error:', e?.error || e));
afterMap.on('error', (e) => console.log('AFTER error:', e?.error || e));

function firstSymbolId(map) {
  const layers = map.getStyle().layers || [];
  const sym = layers.find(l => l.type === 'symbol' && l.layout && l.layout['text-field']);
  return sym ? sym.id : (layers.find(l => l.type === 'symbol')?.id || null);
}

function addRaster(map, sourceId, layerId, tilesetUrl) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'raster',
      url: tilesetUrl,
      tileSize: 256,
      minzoom: 0,
      maxzoom: 14 // 👈 igual al tileset
    });
  }

  const beforeId = firstSymbolId(map);

  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': 0.9
        }
      },
      beforeId // 👈 arriba del basemap, debajo de labels
    );
  }
}

// Inicializar compare cuando ambos mapas estén listos
let beforeReady = false;
let afterReady = false;

function tryCompare() {
  if (beforeReady && afterReady) {
    new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
  }
}

// 👇 CLAVE: style.load (no load)
beforeMap.on('style.load', () => {
  addRaster(beforeMap, 'bosques2017', 'bosques2017-layer', TILESET_2017);
  beforeReady = true;
  tryCompare();
});

afterMap.on('style.load', () => {
  addRaster(afterMap, 'bosques2024', 'bosques2024-layer', TILESET_2024);
  afterReady = true;
  tryCompare();
});
