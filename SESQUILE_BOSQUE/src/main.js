// ===============================
// Mapbox – Sesquilé | Cambio Bosques
// ===============================

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// Tileset IDs (sin mapbox://)
const TILESET_2017 = 'effectiveactions9017.bosques_2017_esriLC_color-7e6vbh';
const TILESET_2024 = 'effectiveactions9017.bosques_2024_esriLC_color-7dr8hx';

// -------------------------------
// Mapas
// -------------------------------
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

// -------------------------------
// Utils
// -------------------------------
function addRaster(map, id, tileset) {
  if (map.getSource(id)) return;

  map.addSource(id, {
    type: 'raster',
    tiles: [
      `https://api.mapbox.com/v4/${tileset}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
    ],
    tileSize: 256,
    maxzoom: 14
  });

  map.addLayer({
    id: id + '-layer',
    type: 'raster',
    source: id,
    paint: { 'raster-opacity': 0.9 }
  });
}

// -------------------------------
// Cargar raster (FORMA CORRECTA)
// -------------------------------
let loaded1 = false;
let loaded2 = false;

beforeMap.on('load', () => {
  addRaster(beforeMap, 'bosques2017', TILESET_2017);
  loaded1 = true;
  initCompare();
});

afterMap.on('load', () => {
  addRaster(afterMap, 'bosques2024', TILESET_2024);
  loaded2 = true;
  initCompare();
});

// -------------------------------
// Swipe
// -------------------------------
let compare;
function initCompare() {
  if (loaded1 && loaded2 && !compare) {
    compare = new mapboxgl.Compare(
      beforeMap,
      afterMap,
      '#comparison-container'
    );
  }
}
