// ==========================================================
// 🌍 VISOR SOLO CON CAPA DE PLUSVALÍA
// ==========================================================

// Token Mapbox
mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

// Crear mapa
const map = new mapboxgl.Map({
  style: "mapbox://styles/mapbox/dark-v11",
  center: [-76.6200, 7.8840],
  zoom: 14,
  container: "map",
  antialias: true,
});

// Popup
let popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: "custom-popup",
});

// ==========================================================
// 🚀 CARGAR SOLO LA CAPA DE PLUSVALÍA
// ==========================================================

map.on("style.load", () => {
  fetch("../src/data/Clasificacion_Plusvalia.geojson")
    .then((res) => res.json())
    .then((data) => {
      map.addSource("plus_src", {
        type: "geojson",
        data: data,
      });

      // Layer
      map.addLayer({
        id: "plus_layer",
        type: "fill",
        source: "plus_src",
        minzoom: 12,
        paint: {
          "fill-opacity": 0.75,
          "fill-outline-color": "#000",
          "fill-color": [
            "match",
            ["get", "CLASIFICACION_PLUSVALIA"],
            "Muy alta",
            "#d73027",
            "Alta",
            "#f46d43",
            "Media",
            "#fdae61",
            "Baja",
            "#66c2a5",
            "Muy baja",
            "#3288bd",
            "#cccccc", // default
          ],
        },
      });

      // POPUP
      map.on("mousemove", "plus_layer", (e) => {
        const p = e.features[0].properties;

        const html = `
            <strong>Manzana:</strong> ${p.ID_MANZANA}<br>
            <strong>Clasificación:</strong> ${p.CLASIFICACION_PLUSVALIA}<br>
            <strong>Predios:</strong> ${p.n_predios}<br>
            <a style="font-size:9px;">© EffectiveActions</a>
        `;

        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });

      map.on("mouseleave", "plus_layer", () => popup.remove());
    });
});
