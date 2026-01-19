alert("main.js cargó OK");

mapboxgl.accessToken =
  "pk.eyJ1IjoiZWZmZWN0aXZlYWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA";

const map = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/mapbox/light-v11",
  center: [-73.80, 5.05],
  zoom: 11
});

map.on("load", () => {
  console.log("map loaded");

  map.addSource("bosque2017", {
    type: "raster",
    tiles: [
      "https://api.mapbox.com/v4/effectiveactions9017.bosques_2017_esriLC_color-6k9wbc/{z}/{x}/{y}.png?access_token=" +
        mapboxgl.accessToken
    ],
    tileSize: 256
  });

  map.addLayer({
    id: "bosque2017_layer",
    type: "raster",
    source: "bosque2017",
    paint: {
      "raster-opacity": 1
    }
  });

  console.log("raster layer added");
});
