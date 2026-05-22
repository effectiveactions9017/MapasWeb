mapboxgl.accessToken = 'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21iOWY1eGtiMGQ2cjJqcG9xbTRjZnQxMiJ9.8p55iS2R45-p8lxTerDL9Q';

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-v9",
  center: [-73.79724, 5.04463],
  zoom: 15,
  pitch: 0,
  bearing: 0,
  antialias: true
});

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup"
});

map.on("load", () => {

  fetch("../src/data/energia_1.geojson")
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar energia_1.geojson");
      }
      return response.json();
    })
    .then(data => {

      map.addSource("energia", {
        type: "geojson",
        data: data
      });

      map.addLayer({
        id: "energia",
        type: "circle",
        source: "energia",
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "Tiene_Luz"],
            "Si", "#FFD700",
            "No", "#FF3B30",
            "#999999"
          ],
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.95
        }
      });

      map.on("click", "energia", (e) => {
        const props = e.features[0].properties;

        let popupContent = `
          <strong>Información del punto</strong><br><br>
          <strong>Tiene luz:</strong> ${props.Tiene_Luz || "No"}<br>
        `;

        popupContent += `<br><a style="font-size:9px;">© EffectiveActions</a>`;

        popup
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(map);
      });

      map.on("mouseenter", "energia", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "energia", () => {
        map.getCanvas().style.cursor = "";
      });

    })
    .catch(error => {
      console.error("Error cargando la capa:", error);
    });

});
