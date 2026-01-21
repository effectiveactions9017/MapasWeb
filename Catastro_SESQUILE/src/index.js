const GEOJSON_URL = "./src/data/PREDIOS_SESQUILE_URB.geojson";

let prediosData = null;

map.on("load", async () => {

  const response = await fetch(GEOJSON_URL);
  prediosData = await response.json();

  map.addSource("predios", {
    type: "geojson",
    data: prediosData
  });

  // Capa principal
  map.addLayer({
    id: "predios-fill",
    type: "fill",
    source: "predios",
    paint: {
      "fill-color": "#2ec4b6",
      "fill-opacity": 0.35
    }
  });

  map.addLayer({
    id: "predios-line",
    type: "line",
    source: "predios",
    paint: {
      "line-color": "#ffffff",
      "line-width": 0.5
    }
  });

  // Capa de resaltado
  map.addLayer({
    id: "predios-highlight",
    type: "line",
    source: "predios",
    paint: {
      "line-color": "#ff0000",
      "line-width": 3
    },
    filter: ["==", "__id__", ""]
  });

  inicializarBuscador(prediosData);
});
