mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// Tilesets EXACTOS como en Mapbox Studio
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

function addRaster(map, id, tilesetUrl) {
  if (map.getSource(id)) return;

  map.addSource(id, {
    type: 'raster',
    url: tilesetUrl,
    tileSize: 256
  });

  map.addLayer({
    id: `${id}-layer`,
    type: 'raster',
    source: id,
    paint: {
      'raster-opacity': 1
    }
  });
}

let ready1 = false;
let ready2 = false;
let compare;

beforeMap.on('load', () => {
  addRaster(beforeMap, 'bosques2017', TILESET_2017);
  ready1 = true;
  if (ready1 && ready2 && !compare) {
    compare = new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
  }
});

afterMap.on('load', () => {
  addRaster(afterMap, 'bosques2024', TILESET_2024);
  ready2 = true;
  if (ready1 && ready2 && !compare) {
    compare = new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
  }
});
