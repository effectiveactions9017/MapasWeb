// ===============================
// Mapbox – Sesquilé | Cambio Bosques
// Usuario: effectiveactions9017
// ===============================

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// IDs (sin mapbox://)
const TILESET_ID_2017 = 'effectiveactions9017.bosques_2017_esriLC_color-7e6vbh';
const TILESET_ID_2024 = 'effectiveactions9017.bosques_2024_esriLC_color-7dr8hx';

const beforeMap = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
  zoom: 11,
  minZoom: 6,
  maxZoom: 14,
  bounds: [
    [-73.92, 4.94],
    [-73.69, 5.15]
  ],
  fitBoundsOptions: { padding: 15 },
  customAttribution: '© EffectiveActions | ESRI Land Cover'
});

const afterMap = new mapboxgl.Map({
  container: 'after',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
  zoom: 11,
  minZoom: 6,
  maxZoom: 14,
  bounds: [
    [-73.92, 4.94],
    [-73.69, 5.15]
  ],
  fitBoundsOptions: { padding: 15 },
  customAttribution: '© EffectiveActions | ESRI Land Cover'
});

beforeMap.on('error', (e) => console.log('BEFORE error:', e?.error || e));
afterMap.on('error', (e) => console.log('AFTER error:', e?.error || e));

function firstSymbolId(map) {
  const layers = map.getStyle().layers || [];
  const sym = layers.find((l) => l.type === 'symbol' && l.layout && l.layout['text-field']);
  return sym ? sym.id : (layers.find((l) => l.type === 'symbol')?.id || null);
}

function addRasterTiles(map, sourceId, layerId, tilesetId) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [
        `https://api.mapbox.com/v4/${tilesetId}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
      ],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 14
    });
  }

  const beforeId = firstSymbolId(map);

  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: { 'raster-opacity': 0.9 }
      },
      beforeId
    );
  }
}

// Compare (solo una vez)
let beforeReady = false;
let afterReady = false;
let compareInitialized = false;

function tryCompare() {
  if (!compareInitialized && beforeReady && afterReady) {
    new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
    compareInitialized = true;
  }
}

// Reinyectar si el estilo se refresca
beforeMap.on('styledata', () => {
  if (!beforeMap.getLayer('bosques2017-layer')) {
    addRasterTiles(beforeMap, 'bosques2017', 'bosques2017-layer', TILESET_ID_2017);
  }
  beforeReady = true;
  tryCompare();
});

afterMap.on('styledata', () => {
  if (!afterMap.getLayer('bosques2024-layer')) {
    addRasterTiles(afterMap, 'bosques2024', 'bosques2024-layer', TILESET_ID_2024);
  }
  afterReady = true;
  tryCompare();
});
