mapboxgl.accessToken = 'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';

const center = [-73.80, 5.05]; // Sesquilé (ajusta si quieres)

const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom: 11
});

const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/mapbox/light-v11",
  center,
  zoom: 11
});

beforeMap.on("load", () => {
  beforeMap.addSource("bosque2017_color", {
    type: "raster",
    url: "mapbox://effectiveactions9017.bosques_2017_esriLC_color-6k9wbc",
    tileSize: 256
  });

  beforeMap.addLayer({
    id: "bosque2017_color_layer",
    type: "raster",
    source: "bosque2017_color",
    paint: {
      "raster-opacity": 1
    }
  });
});

afterMap.on("load", () => {
  afterMap.addSource("bosque2024_color", {
    type: "raster",
    url: "mapbox://effectiveactions9017.bosques_2024_esriLC_color-aylbnk",
    tileSize: 256
  });

  afterMap.addLayer({
    id: "bosque2024_color_layer",
    type: "raster",
    source: "bosque2024_color",
    paint: {
      "raster-opacity": 1
    }
  });
});

new mapboxgl.Compare(beforeMap, afterMap, "#comparison-container");
