mapboxgl.accessToken =
  "pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA";

const center = [-73.80, 5.05]; // Sesquilé
const zoom = 11;

const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom,
});

const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom,
});

/* ============================
   TILES DE BOSQUE (MAPBOX)
   ============================ */

const TILESET_2017 =
  "mapbox://effectiveactions9017.bosques_2017_esriLC_color-6k9wbc";

const TILESET_2024 =
  "mapbox://effectiveactions9017.bosques_2024_esriLC_color-aylbnk";

/* ============================
   MAPA 2017 (BEFORE)
   ============================ */

beforeMap.on("load", () => {
  beforeMap.addSource("bosque2017_color", {
    type: "raster",
    url: TILESET_2017,
    tileSize: 256,
  });

  beforeMap.addLayer({
    id: "bosque2017_color_layer",
    type: "raster",
    source: "bosque2017_color",
    paint: {
      "raster-opacity": 1,
    },
  });
});

/* ============================
   MAPA 2024 (AFTER)
   ============================ */

afterMap.on("load", () => {
  afterMap.addSource("bosque2024_color", {
    type: "raster",
    url: TILESET_2024,
    tileSize: 256,
  });

  afterMap.addLayer({
    id: "bosque2024_color_layer",
    type: "raster",
    source: "bosque2024_color",
    paint: {
      "raster-opacity": 1,
    },
  });
});

/* ============================
   COMPARE
   ============================ */

new mapboxgl.Compare(beforeMap, afterMap, "#comparison-container");
