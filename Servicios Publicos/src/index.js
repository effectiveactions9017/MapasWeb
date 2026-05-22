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

map.on("load", () => {

  fetch("../src/data/energia_1.geojson")
    .then(response => response.json())
    .then(data => {

      console.log("Total puntos:", data.features.length);

      data.features.forEach(feature => {

        const coords = feature.geometry.coordinates;
        const props = feature.properties;

        const tieneLuz = props.Tiene_Luz || "No";

        const el = document.createElement("div");
        el.className = "marker-energia";

        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = tieneLuz === "Si" ? "#FFD700" : "#FF3B30";
        el.style.border = "2px solid #000";
        el.style.boxShadow = "0 0 6px rgba(0,0,0,0.8)";
        el.style.cursor = "pointer";

        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true
        }).setHTML(`
          <div style="font-size:13px;">
            <strong>Servicios Públicos</strong><br><br>
            <strong>Tiene Luz:</strong> ${tieneLuz}<br>
            <br>
            <a style="font-size:9px;">© EffectiveActions</a>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map);

      });

    })
    .catch(error => {
      console.error("Error cargando energia_1.geojson:", error);
    });

});
