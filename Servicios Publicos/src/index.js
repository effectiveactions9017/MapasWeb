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
    .then(response => response.json())
    .then(data => {

      map.addSource("energia", {
        type: "geojson",
        data: data,
        cluster: false
      });

      map.addLayer({
        id: "energia",
        type: "circle",
        source: "energia",
        minzoom: 0,
        maxzoom: 24,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],

            5, 14,
            10, 12,
            15, 8,
            20, 6
          ],

          "circle-color": [
            "match",
            ["get", "Tiene_Luz"],
            "Si", "#FFD700",
            "No", "#FF3B30",
            "#00BFFF"
          ],

          "circle-stroke-color": "#000000",
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, 2,
            15, 1.5,
            20, 1
          ],

          "circle-opacity": 1,
          "circle-stroke-opacity": 1
        }
      });

      map.moveLayer("energia");

      map.on("click", "energia", (e) => {
        const feature = e.features[0];
        const props = feature.properties;

        const popupContent = `
          <div style="font-size:13px;">
            <strong>Servicios Públicos</strong><br><br>
            <strong>Tiene Luz:</strong> ${props.Tiene_Luz || "No"}<br>
            <br>
            <a style="font-size:9px;">© EffectiveActions</a>
          </div>
        `;

        popup
          .setLngLat(feature.geometry.coordinates)
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
      console.error("Error cargando energia_1.geojson:", error);
    });

});
