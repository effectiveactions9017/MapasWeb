mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// -------------------------------
// Mapa 2017
// -------------------------------
const beforeMap = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/effectiveactions9017/cmkhiq4hy007901qq4jw7c79j',
  center: [-73.80, 5.05], // Sesquilé
  zoom: 11,
  minZoom: 6,
  maxZoom: 14
});

// -------------------------------
// Mapa 2024
// -------------------------------
const afterMap = new mapboxgl.Map({
  container: 'after',
  style: 'mapbox://styles/effectiveactions9017/cmklt68zl006t01ry16zhajul',
  center: [-73.80, 5.05],
  zoom: 11,
  minZoom: 6,
  maxZoom: 14
});

// -------------------------------
// Inicializar Swipe
// -------------------------------
let readyBefore = false;
let readyAfter  = false;
let compare     = null;

function initCompare() {
  if (readyBefore && readyAfter && !compare) {
    compare = new mapboxgl.Compare(
      beforeMap,
      afterMap,
      '#comparison-container'
    );
  }
}

beforeMap.on('load', () => {
  readyBefore = true;
  initCompare();
});

afterMap.on('load', () => {
  readyAfter = true;
  initCompare();
});

// Debug
beforeMap.on('error', e => console.error('BEFORE map error:', e));
afterMap.on('error',  e => console.error('AFTER map error:', e));
