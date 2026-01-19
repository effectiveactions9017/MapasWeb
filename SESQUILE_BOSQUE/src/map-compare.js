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

// Inserta raster arriba del fondo (debajo de labels)
function firstLabelLayerId(map) {
  const layers = map.getStyle().layers || [];
  const label = layers.find(l => l.type === 'symbol' && l.layout && l.layout['text-field']);
  return label ? label.id : null;
}

function addRaster(map, sourceId, layerId, tilesetUrl) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'raster',
      url: tilesetUrl,
      tileSize: 256
    });
  }

  const beforeId = firstLabelLayerId(map);

  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: { 'raster-opacity': 1 }
      },
      beforeId
    );
  }
}

let ready1 = false, ready2 = false, compare = null;

// usar style.load para asegurar que existan layers del estilo
beforeMap.on('style.load', () => {
  addRaster(beforeMap, 'bosques2017', 'bosques2017-layer', TILESET_2017);
});
afterMap.on('style.load', () => {
  addRaster(afterMap, 'bosques2024', 'bosques2024-layer', TILESET_2024);
});

beforeMap.on('load', () => {
  ready1 = true;
  if (ready1 && ready2 && !compare) compare = new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
});

afterMap.on('load', () => {
  ready2 = true;
  if (ready1 && ready2 && !compare) compare = new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
});

// Debug: si algo falla, se ve en consola
beforeMap.on('error', (e) => console.log('BEFORE error:', e?.error || e));
afterMap.on('error', (e) => console.log('AFTER error:', e?.error || e));
