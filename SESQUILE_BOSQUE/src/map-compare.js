mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

const TILESET_2017 = 'mapbox://effectiveactions9017.bosques_2017_esriLC_color-7e6vbh';
const TILESET_2024 = 'mapbox://effectiveactions9017.bosques_2024_esriLC_color-7dr8hx';

const beforeMap = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
  zoom: 11,
  maxZoom: 14
});

const afterMap = new mapboxgl.Map({
  container: 'after',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.80, 5.05],
  zoom: 11,
  maxZoom: 14
});

function firstLabelLayerId(map) {
  const layers = map.getStyle()?.layers || [];
  const label = layers.find(l => l.type === 'symbol' && l.layout && l.layout['text-field']);
  return label ? label.id : null;
}

function ensureRaster(map, sourceId, layerId, tilesetUrl) {
  // 1) Source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'raster',
      url: tilesetUrl,
      tileSize: 256
    });
  }

  // 2) Layer
  const beforeId = firstLabelLayerId(map);

  if (!map.getLayer(layerId)) {
    const layerDef = {
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': 1 }
    };

    // Si no hay "label layer", agrega sin beforeId (igual debe verse)
    if (beforeId) {
      map.addLayer(layerDef, beforeId);
    } else {
      map.addLayer(layerDef);
    }
  } else {
    // Si ya existe, intenta dejarla justo debajo de labels
    if (beforeId) {
      try { map.moveLayer(layerId, beforeId); } catch (e) {}
    }
  }
}

// Debug
beforeMap.on('error', (e) => console.log('BEFORE error:', e?.error || e));
afterMap.on('error', (e) => console.log('AFTER error:', e?.error || e));

// ✅ Cargar + proteger contra recargas del estilo
function wire(map, sourceId, layerId, tilesetUrl) {
  map.on('style.load', () => {
    // Primer intento apenas carga el estilo
    ensureRaster(map, sourceId, layerId, tilesetUrl);
  });

  map.on('idle', () => {
    // Segundo intento cuando el mapa está "quieto" (labels ya existen)
    if (map.isStyleLoaded()) {
      ensureRaster(map, sourceId, layerId, tilesetUrl);
    }
  });
}

wire(beforeMap, 'bosques2017', 'bosques2017-layer', TILESET_2017);
wire(afterMap,  'bosques2024', 'bosques2024-layer',  TILESET_2024);

// Compare (una sola vez)
let ready1 = false, ready2 = false, compare = null;

function tryCompare() {
  if (ready1 && ready2 && !compare) {
    compare = new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
  }
}

beforeMap.on('load', () => { ready1 = true; tryCompare(); });
afterMap.on('load',  () => { ready2 = true; tryCompare(); });
