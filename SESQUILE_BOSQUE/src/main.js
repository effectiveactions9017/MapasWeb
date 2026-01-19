mapboxgl.accessToken =
  "pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA";

const center = [-73.80, 5.05];
const bounds = [
  [-73.92, 4.94],
  [-73.69, 5.15]
];

// IDs EXACTOS de tus tilesets
const TS2017 = "effectiveactions9017.bosques_2017_esriLC_color-7e6vbh";
const TS2024 = "effectiveactions9017.bosques_2024_esriLC_color-7dr8hx";

// Convierte un tileset a URL v4 PNG tiles (robusto)
function v4(tilesetId) {
  return [
    `https://api.mapbox.com/v4/${tilesetId}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
  ];
}

// BEFORE (2017)
const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom: 11,
  maxZoom: 15,
  minZoom: 6,
  bounds,
  fitBoundsOptions: { padding: 15 },
  customAttribution: "© EffectiveActions, datos: ESRI Land Cover"
});

// AFTER (2024)
const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom: 11,
  maxZoom: 15,
  minZoom: 6,
  bounds,
  fitBoundsOptions: { padding: 15 },
  customAttribution: "© EffectiveActions, datos: ESRI Land Cover"
});

beforeMap.on("load", () => {
  beforeMap.addSource("bosques2017", {
    type: "raster",
    tiles: v4(TS2017),
    tileSize: 256
  });

  beforeMap.addLayer({
    id: "bosques2017-layer",
    type: "raster",
    source: "bosques2017",
    paint: { "raster-opacity": 1 }
  });
});

afterMap.on("load", () => {
  afterMap.addSource("bosques2024", {
    type: "raster",
    tiles: v4(TS2024),
    tileSize: 256
  });

  afterMap.addLayer({
    id: "bosques2024-layer",
    type: "raster",
    source: "bosques2024",
    paint: { "raster-opacity": 1 }
  });
});

new mapboxgl.Compare(beforeMap, afterMap, "#comparison-container");
