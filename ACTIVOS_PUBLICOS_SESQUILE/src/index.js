// =====================================================
// ✅ Visor Predios Públicos – Sesquilé (Mapbox GL JS)
// =====================================================
// 🔵 Base: Predios municipio de Sesquilé (SOLO CONTORNO)
// 🟢 Interactiva: Predios públicos Sesquilé (POPUP + BUSCADOR + STREET VIEW)
// 🟡 Highlight: Predio seleccionado
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
// DATASETS
// =====================================================
let PUBLICOS_DATA = null;

// =====================================================
// CONFIGURACIÓN POPUP (SOLO CAMPOS DE LA CAPA)
// =====================================================
const CAMPOS_POPUP = [
  { key: "codigo", label: "Código predial" },
  { key: "NOMBRE", label: "Nombre" },
  { key: "DESTINO_ECONOMICO", label: "Destino económico" }
];

// =====================================================
// HELPERS
// =====================================================
function norm(v) {
  return (v ?? "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function safeOff(evt, layer) {
  try { map.off(evt, layer); } catch (e) {}
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function popupHTML(props, center) {
  props = props || {};

  const rows = CAMPOS_POPUP.map(({ key, label }) => {
    let v = props[key];
    if (v === null || v === undefined || v === "") v = "N/A";
    return `<strong>${label}:</strong> ${v}`;
  }).join("<br>");

  return `
    <div style="font-weight:700; margin-bottom:6px;">Predio público</div>
    ${rows}
    <div style="margin-top:10px;">
      <a href="${streetViewUrl(center)}" target="_blank"
         style="display:inline-block; padding:6px 10px;
         background:#00bcd4; color:#000; font-weight:700;
         border-radius:6px; text-decoration:none; font-size:12px;">
        📷 Street View
      </a>
    </div>
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// CAPA BASE – SOLO CONTORNO
// =====================================================
function addBaseOutlineLayer() {
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then(r => r.json())
    .then(data => {
      if (map.getSource("predios_base")) {
        map.getSource("predios_base").setData(data);
      } else {
        map.addSource("predios_base", { type: "geojson", data });
      }

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
    });
}

// =====================================================
// CAPA PREDIOS PÚBLICOS (INTERACTIVA)
// =====================================================
function addPublicosLayer() {
  fetch("../src/data/PREDIOS_PUBLICOS_SESQUILE.geojson")
    .then(r => r.json())
    .then(data => {
      PUBLICOS_DATA = data;

      if (map.getSource("predios_publicos")) {
        map.getSource("predios_publicos").setData(data);
      } else {
        map.addSource("predios_publicos", { type: "geojson", data });
      }

      if (!map.getLayer("predios_publicos_layer")) {
        map.addLayer({
          id: "predios_publicos_layer",
          type: "fill",
          source: "predios_publicos",
          paint: {
            "fill-color": "#2ec4b6",
            "fill-opacity": 0.75,
            "fill-outline-color": "#ffffff"
          }
        });
      }

      safeOff("mouseenter", "predios_publicos_layer");
      safeOff("mouseleave", "predios_publicos_layer");
      safeOff("click", "predios_publicos_layer");

      map.on("mouseenter", "predios_publicos_layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "predios_publicos_layer", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "predios_publicos_layer", e => {
        const f = e.features[0];
        const center = turf.centroid(f).geometry.coordinates;

        popup
          .setLngLat(center)
          .setHTML(popupHTML(f.properties, center))
          .addTo(map);
      });
    });
}

// =====================================================
// HIGHLIGHT
// =====================================================
function addHighlight() {
  map.addSource("highlight", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  map.addLayer({
    id: "highlight_fill",
    type: "fill",
    source: "highlight",
    paint: { "fill-color": "#ffff00", "fill-opacity": 0.25 }
  });

  map.addLayer({
    id: "highlight_line",
    type: "line",
    source: "highlight",
    paint: { "line-color": "#ffff00", "line-width": 4 }
  });
}

// =====================================================
// BUSCADOR LOCAL (SOLO PÚBLICOS)
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar predio público",
  localGeocoder: q => {
    q = q.toLowerCase().trim();
    if (!PUBLICOS_DATA) return [];

    return PUBLICOS_DATA.features
      .filter(f =>
        norm(f.properties.codigo).includes(q) ||
        norm(f.properties.NOMBRE).includes(q) ||
        norm(f.properties.DESTINO_ECONOMICO).includes(q)
      )
      .slice(0, 10)
      .map(f => {
        const center = turf.centroid(f).geometry.coordinates;
        return {
          type: "Feature",
          geometry: f.geometry,
          center,
          place_name: `${f.properties.codigo} | ${f.properties.NOMBRE}`,
          text: f.properties.codigo,
          properties: f.properties,
          place_type: ["place"]
        };
      });
  }
});

map.addControl(geocoder, "top-left");

// =====================================================
// RESULTADO BUSCADOR
// =====================================================
geocoder.on("result", e => {
  const f = e.result;
  const center = f.center || turf.centroid(f).geometry.coordinates;

  map.getSource("highlight").setData({
    type: "FeatureCollection",
    features: [f]
  });

  map.fitBounds(turf.bbox(f), { padding: 40 });

  popup
    .setLngLat(center)
    .setHTML(popupHTML(f.properties, center))
    .addTo(map);
});

// =====================================================
// CARGA FINAL
// =====================================================
map.on("style.load", () => {
  addBaseOutlineLayer();
  addPublicosLayer();
  addHighlight();

  map.moveLayer("predios_base_outline");
  map.moveLayer("predios_publicos_layer");
  map.moveLayer("highlight_fill");
  map.moveLayer("highlight_line");
});
