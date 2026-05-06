fetch("../src/data/Servicios_publicos_puntos_nuevo.geojson?v=" + Date.now())
  .then(r => {
    console.log("STATUS SERVICIOS:", r.status);
    return r.json();
  })
  .then(data => {
    console.log("SERVICIOS FEATURES:", data.features?.length);
    console.log("PRIMER PUNTO:", data.features?.[0]?.geometry);

    map.addSource("servicios", {
      type: "geojson",
      data: data
    });

    map.addLayer({
      id: "servicios_puntos",
      type: "circle",
      source: "servicios",
      paint: {
        "circle-radius": 12,
        "circle-color": "#ff0000",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3,
        "circle-opacity": 1
      }
    });

    map.moveLayer("servicios_puntos");
  })
  .catch(err => console.error("ERROR SERVICIOS:", err));
