// Token Mapbox (TU TOKEN PERSONAL)
mapboxgl.accessToken = 'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

// Centro aproximado de Sesquilé
const center = [-73.80, 5.05];

// -------- MAPA 2017 --------
const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/mapbox/light-v11",
  center: center,
  zoom: 11,
  minZoom: 9,
  maxZoom: 15,
  attributionControl: true
});

// -------- MAPA 2024 --------
const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/mapbox/light-v11",
  center: center,
  zoom: 11,
  minZoom: 9,
  maxZoom: 15,
  attributionControl: true
});

// ---- BOSQUE 2017 ----
beforeMap.on("load", () => {
  beforeMap.addSource("bosque2017", {
    type: "raster",
    url: "mapbox://effectiveactions9017.24tn4qga",
    tileSize: 256
  });

  beforeMap.addLayer({
    id: "bosque2017-layer",
    type: "raster",
    source: "bosque2017",
    paint: {
      "raster-opacity": 1
    }
  });
});

// ---- BOSQUE 2024 ----
afterMap.on("load", () => {
  afterMap.addSource("bosque2024", {
    type: "raster",
    url: "mapbox://effectiveactions9017.01eo8fcc",
    tileSize: 256
  });

  afterMap.addLayer({
    id: "bosque2024-layer",
    type: "raster",
    source: "bosque2024",
    paint: {
      "raster-opacity": 1
    }
  });
});

// ---- SWIPE ----
new mapboxgl.Compare(
  beforeMap,
  afterMap,
  "#comparison-container"
);
