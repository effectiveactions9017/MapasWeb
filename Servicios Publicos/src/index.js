mapboxgl.accessToken = 'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21iOWY1eGtiMGQ2cjJqcG9xbTRjZnQxMiJ9.8p55iS2R45-p8lxTerDL9Q';

// ======================================================
// 🗺️ MAPA
// ======================================================
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-v9",
  center: [-73.79724, 5.04463],
  zoom: 15,
  pitch: 0,
  bearing: 0,
  antialias: true
});

// ======================================================
// 📌 POPUP
// ======================================================
let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup"
});

// ======================================================
// 🚀 CARGAR MAPA
// ======================================================
map.on("load", () => {

  // ====================================================
  // 📂 CARGAR GEOJSON
  // ====================================================
  fetch("../src/data/energia_1.geojson")
    .then(response => {

      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo GeoJSON");
      }

      return response.json();
    })

    .then(data => {

      console.log("GeoJSON cargado:", data);

      // ==================================================
      // 📍 SOURCE
      // ==================================================
      map.addSource("energia", {
        type: "geojson",
        data: data,
        cluster: false
      });

      // ==================================================
      // 🔴 CAPA DE PUNTOS
      // ==================================================
      map.addLayer({
        id: "energia",
        type: "circle",
        source: "energia",

        paint: {

          // Tamaño punto
          "circle-radius": 7,

          // Color según Tiene_Luz
          "circle-color": [
            "match",
            ["get", "Tiene_Luz"],

            "Si", "#FFD700", // amarillo
            "No", "#FF3B30", // rojo

            "#999999" // gris default
          ],

          // Borde
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 1.5,

          // Transparencia
          "circle-opacity": 1
        }
      });

      // ==================================================
      // 🖱️ CLICK POPUP
      // ==================================================
      map.on("click", "energia", (e) => {

        const feature = e.features[0];
        const props = feature.properties;

        let popupContent = `
          <div style="font-size:13px;">
            <strong>Servicios Públicos</strong><br><br>

            <strong>Tiene Luz:</strong> ${props.Tiene_Luz || "No"}<br>

            <br>
            <a style="font-size:9px;">
              © EffectiveActions
            </a>
          </div>
        `;

        popup
          .setLngLat(feature.geometry.coordinates)
          .setHTML(popupContent)
          .addTo(map);

      });

      // ==================================================
      // 🖱️ CURSOR
      // ==================================================
      map.on("mouseenter", "energia", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "energia", () => {
        map.getCanvas().style.cursor = "";
      });

    })

    .catch(error => {
      console.error("Error cargando el GeoJSON:", error);
    });

});
