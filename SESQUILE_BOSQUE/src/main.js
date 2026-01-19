// Token de Mapbox (el tuyo)
mapboxgl.accessToken =
  "pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA";

// Parámetros Sesquilé
const center = [-73.80, 5.05];
const zoom = 11;

// (Opcional pero recomendado) límites aprox para que haga zoom al municipio.
// Si no los tienes exactos, puedes comentar "bounds" y "fitBoundingOptions".
const boundsSesquile = [
  [-73.92, 4.94], // SW (aprox)
  [-73.69, 5.15], // NE (aprox)
];

// Crear el mapa base para "before" (2017)
const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom,
  maxZoom: 18,
  minZoom: 6,
  customAttribution: "© EffectiveActions, datos: ESRI Land Cover",
  bounds: boundsSesquile,
  fitBoundingOptions: { padding: 15 },
});

// Crear el mapa base para "after" (2024)
const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom,
  maxZoom: 18,
  minZoom: 6,
  customAttribution: "© EffectiveActions, datos: ESRI Land Cover",
  bounds: boundsSesquile,
  fitBoundingOptions: { padding: 15 },
});

// Tilesets (Mapbox) - Sesquilé
const TILESET_2017 = "mapbox://effectiveactions9017.bosques_2017_esriLC_color-6k9wbc";
const TILESET_2024 = "mapbox://effectiveactions9017.bosques_2024_esriLC_color-aylbnk";

// Agregar tilesets a los mapas
beforeMap.on("load", () => {
  beforeMap.addSource("bosques2017", {
    type: "raster",
    url: TILESET_2017,
    tileSize: 256,
  });

  beforeMap.addLayer({
    id: "bosques2017-layer",
    type: "raster",
    source: "bosques2017",
    paint: { "raster-opacity": 1 },
  });
});

afterMap.on("load", () => {
  afterMap.addSource("bosques2024", {
    type: "raster",
    url: TILESET_2024,
    tileSize: 256,
  });

  afterMap.addLayer({
    id: "bosques2024-layer",
    type: "raster",
    source: "bosques2024",
    paint: { "raster-opacity": 1 },
  });
});

// Crear la funcionalidad de comparación (swipe)
new mapboxgl.Compare(beforeMap, afterMap, "#comparison-container");
