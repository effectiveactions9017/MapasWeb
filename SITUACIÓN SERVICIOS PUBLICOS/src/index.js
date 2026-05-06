mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-v9",
  center: [-73.79724, 5.04463],
  zoom: 14,
});

map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// CARGA SIMPLE
// =====================================================
map.on("load", () => {

  // =====================================================
  // PREDIOS
  // =====================================================
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then(r => r.json())
    .then(data => {

      console.log("✅ Predios OK");

      map.addSource("predios", {
        type: "geojson",
        data: data
      });

      map.addLayer({
        id: "predios_linea",
        type: "line",
        source: "predios",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.2
        }
      });

    })
    .catch(err => console.error("❌ Predios error:", err));

  // =====================================================
  // SERVICIOS
  // =====================================================
  fetch("../src/data/Servicios_publicos_puntos_nuevo.geojson?v=" + Date.now())
    .then(r => r.json())
    .then(data => {

      console.log("✅ Servicios OK");
      console.log(data);

      map.addSource("servicios", {
        type: "geojson",
        data: data
      });

      map.addLayer({
        id: "servicios_puntos",
        type: "circle",
        source: "servicios",
        paint: {
          "circle-radius": 6,
          "circle-color": "#ff0000",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5
        }
      });

    })
    .catch(err => console.error("❌ Servicios error:", err));

  // =====================================================
  // ALUMBRADO
  // =====================================================
  fetch("../src/data/alumbrado_publico_con_vereda.geojson")
    .then(r => r.json())
    .then(data => {

      console.log("✅ Alumbrado OK");

      map.addSource("alumbrado", {
        type: "geojson",
        data: data
      });

      map.addLayer({
        id: "alumbrado_puntos",
        type: "circle",
        source: "alumbrado",
        paint: {
          "circle-radius": 5,
          "circle-color": "#00ffff",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.2
        }
      });

    })
    .catch(err => console.error("❌ Alumbrado error:", err));

});
