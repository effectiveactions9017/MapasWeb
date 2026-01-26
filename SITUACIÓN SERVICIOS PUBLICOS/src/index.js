// =====================================================
// Visor Predial + Servicios Públicos – Sesquilé
// =====================================================
// Base: Predios municipio (polígono, contorno, popup)
// Servicios: puntos (popup)
// Leyenda: base predial + situación de servicios públicos
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

// =====================================================
// MAPA
// =====================================================
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  center: [-73.79724, 5.04463],
  zoom: 15,
  antialias: true
});

map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// POPUP
// =====================================================
const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup"
});

// =====================================================
// HELPERS
// =====================================================
function safeOff(evt, layer) {
  try { map.off(evt, layer); } catch (e) {}
}

function popupHTMLCampos(props, campos, titulo) {
  props = props || {};
  const rows = campos.map(c => {
    let v = props[c];
    if (v === null || v === undefined || v === "") v = "N/A";
    return `<strong>${c}:</strong> ${v}`;
  }).join("<br>");

  return `
    <div style="font-weight:700; margin-bottom:6px;">${titulo}</div>
    ${rows}
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// CAMPOS POPUP
// =====================================================
const CAMPOS_SERVICIOS = [
  "Número predial",
  "Nombre del propietario",
  "Tipo de predio",
  "Otro - Tipo de predio",
  "Uso actual del predio",
  "Tiene servicio de acueducto?",
  "Tiene servicio de alcantarillado?",
  "Tiene servicio de recolección de basuras?",
  "Tiene servicio de Internet?",
  "Tiene servicio de Gas?"
];

const CAMPOS_PREDIO_BASE = [
  "codigo",
  "NOMBRE",
  "DESTINO_ECONOMICO"
];

// =====================================================
// CAPA BASE – PREDIOS (CONTORNO + POPUP)
// =====================================================
function addPrediosBase() {
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then(r => r.json())
    .then(data => {

      if (!map.getSource("predios_base")) {
        map.addSource("predios_base", { type: "geojson", data });
      }

      // Contorno
      if (!map.getLayer("predios_base_outline")) {
        map.addLayer({
          id: "predios_base_outline",
          type: "line",
          source: "predios_base",
          paint: {
            "line-color": "#ffffff",
            "line-width": 1.2,
            "line-opacity": 0.9
          }
        });
      }

      // Eventos popup
      safeOff("click", "predios_base_outline");

      map.on("click", "predios_base_outline", e => {
        const f = e.features[0];
        const center = turf.centroid(f).geometry.coordinates;

        popup
          .setLngLat(center)
          .setHTML(
            popupHTMLCampos(
              f.properties,
              CAMPOS_PREDIO_BASE,
              "Predio municipio de Sesquilé"
            )
          )
          .addTo(map);
      });
    });
}

// =====================================================
// CAPA SERVICIOS PÚBLICOS – PUNTOS
// =====================================================
function addServiciosPublicos() {
  fetch("../src/data/Servicios_publicos_puntos.geojson")
    .then(r => r.json())
    .then(data => {

      if (!map.getSource("servicios_publicos")) {
        map.addSource("servicios_publicos", { type: "geojson", data });
      }

      if (!map.getLayer("servicios_publicos_layer")) {
        map.addLayer({
          id: "servicios_publicos_layer",
          type: "circle",
          source: "servicios_publicos",
          paint: {
            "circle-radius": 6,
            "circle-color": "#ffb703",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5
          }
        });
      }

      safeOff("mouseenter", "servicios_publicos_layer");
      safeOff("mouseleave", "servicios_publicos_layer");
      safeOff("click", "servicios_publicos_layer");

      map.on("mouseenter", "servicios_publicos_layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "servicios_publicos_layer", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "servicios_publicos_layer", e => {
        const f = e.features[0];

        popup
          .setLngLat(e.lngLat)
          .setHTML(
            popupHTMLCampos(
              f.properties,
              CAMPOS_SERVICIOS,
              "Situación de servicios públicos"
            )
          )
          .addTo(map);
      });
    });
}

// =====================================================
// CARGA FINAL
// =====================================================
map.on("style.load", () => {
  addPrediosBase();        // abajo
  addServiciosPublicos(); // arriba

  // Orden forzado
  map.moveLayer("predios_base_outline");
  map.moveLayer("servicios_publicos_layer");
});
