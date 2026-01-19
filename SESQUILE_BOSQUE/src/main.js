// ===============================
// Mapbox – Sesquilé | Cambio Bosques
// Usuario: effectiveactions9017
// ===============================

// TOKEN
mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// -------------------------------
// Mapa BEFORE (2017)
// -------------------------------
const beforeMap = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
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
  center: [-73.80, 5.05],
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
// TILESETS (PUBLIC)
// -------------------------------
const TILESET_2017 =
  'mapbox://effectiveactions9017.bosques_2017_esriLC_color-7e6vbh';

const TILESET_2024 =
  'mapbox://effectiveactions9017.bosques_2024_esriLC_color-7dr8hx';

// -------------------------------
// Helpers: poner raster ARRIBA del basemap
// -------------------------------
function getFirstSymbolLayerId(map) {
  const layers = map.getStyle().layers || [];
  const firstSymbol = layers.find(l => l.type === 'symbol');
  return firstSymbol ? firstSymbol.id : null;
}

function addRasterTileset(map, sourceId, layerId, tilesetUrl) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'raster',
      url: tilesetUrl,
      tileSize: 256,
      minzoom: 6,
      maxzoom: 15
    });
  }

  const beforeId = getFirstSymbolLayerId(map);

  // Si ya existe, no lo duplica
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
      beforeId // 👈 esto lo deja arriba de la base (debajo de labels)
    );
  }
}

// -------------------------------
// Cargar capas + Compare cuando ambos mapas carguen
// -------------------------------
let beforeLoaded = false;
let afterLoaded = false;

function tryInitCompare() {
  if (beforeLoaded && afterLoaded) {
    new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
  }
}

// Debug útil (si algo falla verás en consola)
beforeMap.on('error', (e) => console.log('BEFORE error:', e?.error || e));
afterMap.on('error', (e) => console.log('AFTER error:', e?.error || e));

beforeMap.on('load', () => {
  addRasterTileset(beforeMap, 'bosques2017', 'bosques2017-layer', TILESET_2017);
  beforeLoaded = true;
  tryInitCompare();
});

afterMap.on('load', () => {
  addRasterTileset(afterMap, 'bosques2024', 'bosques2024-layer', TILESET_2024);
  afterLoaded = true;
  tryInitCompare();
});
