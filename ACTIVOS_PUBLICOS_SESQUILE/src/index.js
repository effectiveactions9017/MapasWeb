// =====================================================
// ✅ Visor Predios Públicos – Sesquilé (Mapbox GL JS)
// =====================================================
// 🔵 Base: Predios municipio de Sesquilé (SOLO CONTORNO, SIN POPUP)
// 🟢 Interactiva: Predios públicos Sesquilé (POPUP + BUSCADOR + STREET VIEW)
// 🟡 Highlight: Predio seleccionado
//
// ✅ FIX RUTA/ARCHIVO:
//   El archivo real es: PREDIOS_PUBLICOS_SESQUILE.geojson
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
  antialias: true,
});

map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// POPUP
// =====================================================
const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup",
});

// =====================================================
// DATASETS
// =====================================================
let PUBLICOS_DATA = null;

// =====================================================
// CONFIGURACIÓN POPUP (lo que pediste)
// =====================================================
const CAMPOS_POPUP = [
  { key: "codigo", label: "Código predial" },
  { key: "NOMBRE", label: "Nombre" },
  { key: "DESTINO_ECONOMICO", label: "Destino económico" },
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
  try {
    map.off(evt, layer);
  } catch (e) {}
}

function streetViewUrl([lng, lat]) {
  // Street View desde el punto del centroide del predio
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function popupHTMLPredioPublico(props, center) {
  props = props || {};

  const rows = CAMPOS_POPUP.map(({ key, label }) => {
    let v = props[key];
    if (v === null || v === undefined || v === "") v = "N/A";
    return `<strong>${label}:</strong> ${v}`;
  }).join("<br>");

  return `
    <div style="font-weight:700; margin-bottom:6px;">Predio público</div>
    ${rows}<br>
    <strong>Destino económico:</strong> Público<br>
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
// CAPA BASE – SOLO CONTORNO (sin relleno, sin interacción)
// =====================================================
function addBaseOutlineLayer() {
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then((r) => r.json())
    .then((data) => {
      // Source seguro
      if (map.getSource("predios_base")) map.getSource("predios_base").setData(data);
      else map.addSource("predios_base", { type: "geojson", data });

      // Layer seguro
      if (!map.getLayer("predios_base_outline")) {
        map.addLayer({
          id: "predios_base_outline",
          type: "line",
          source: "predios_base",
          minzoom: 12,
          paint: {
            "line-color": "#ffffff",
            "line-width": 1.2,
            "line-opacity": 0.9,
          },
        });
      }
    })
    .catch((err) => console.error("Error cargando base:", err));
}

// =====================================================
// CAPA PREDIOS PÚBLICOS SESQUILÉ (interactiva)
// =====================================================
function addPublicosLayer() {
  // ✅ nombre real del archivo en tu repo:
  const FILE_PUBLICOS = "PREDIOS_PUBLICOS_SESQUILE.geojson";

  fetch(`../src/data/${FILE_PUBLICOS}`)
    .then((r) => r.json())
    .then((data) => {
      PUBLICOS_DATA = data;

      // Source seguro
      if (map.getSource("predios_publicos")) map.getSource("predios_publicos").setData(data);
      else map.addSource("predios_publicos", { type: "geojson", data });

      // Layer seguro (fill)
      if (!map.getLayer("predios_publicos_layer")) {
        map.addLayer({
          id: "predios_publicos_layer",
          type: "fill",
          source: "predios_publicos",
          minzoom: 12,
          paint: {
            // Si no hay NOMBRE -> naranja, si hay -> verde
            "fill-color": [
              "case",
              ["==", ["coalesce", ["get", "NOMBRE"], ""], ""],
              "#ffb703",
              "#2ec4b6",
            ],
            "fill-opacity": 0.75,
            "fill-outline-color": "#ffffff",
          },
        });
      }

      // Eventos
      safeOff("click", "predios_publicos_layer");
      safeOff("mouseenter", "predios_publicos_layer");
      safeOff("mouseleave", "predios_publicos_layer");

      map.on("mouseenter", "predios_publicos_layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "predios_publicos_layer", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "predios_publicos_layer", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const center = turf.centroid(f).geometry.coordinates;

        popup
          .setLngLat(center)
          .setHTML(popupHTMLPredioPublico(f.properties, center))
          .addTo(map);
      });
    })
    .catch((err) => console.error("Error cargando públicos:", err));
}

// =====================================================
// HIGHLIGHT (selección)
// =====================================================
function addHighlight() {
  if (!map.getSource("highlight")) {
    map.addSource("highlight", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getLayer("highlight_fill")) {
    map.addLayer({
      id: "highlight_fill",
      type: "fill",
      source: "highlight",
      paint: {
        "fill-color": "#ffff00",
        "fill-opacity": 0.25,
      },
    });
  }

  if (!map.getLayer("highlight_line")) {
    map.addLayer({
      id: "highlight_line",
      type: "line",
      source: "highlight",
      paint: {
        "line-color": "#ffff00",
        "line-width": 4,
      },
    });
  }
}

// =====================================================
// BUSCADOR LOCAL (SOLO PÚBLICOS)
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar (código, nombre o destino económico)",
  localGeocoder: (q) => {
    q = (q || "").toString().toLowerCase().trim();
    if (!q || !PUBLICOS_DATA || !Array.isArray(PUBLICOS_DATA.features)) return [];

    return PUBLICOS_DATA.features
      .filter((f) => {
        const p = f.properties || {};
        return (
          norm(p.codigo).includes(q) ||
          norm(p.NOMBRE).includes(q) ||
          norm(p.DESTINO_ECONOMICO).includes(q)
        );
      })
      .slice(0, 10)
      .map((f) => {
        const center = turf.centroid(f).geometry.coordinates;
        return {
          type: "Feature",
          geometry: f.geometry,
          center,
          place_name: `${f.properties?.codigo ?? "N/A"} | ${f.properties?.NOMBRE ?? "N/A"} | ${f.properties?.DESTINO_ECONOMICO ?? "N/A"}`,
          text: (f.properties?.codigo ?? f.properties?.NOMBRE ?? "Resultado").toString(),
          properties: f.properties,
          place_type: ["place"],
        };
      });
  },
});

map.addControl(geocoder, "top-left");

// =====================================================
// RESULTADO BUSCADOR: highlight + zoom + popup + StreetView
// =====================================================
geocoder.on("result", (e) => {
  const f = e.result;
  if (!f) return;

  const center = f.center || turf.centroid(f).geometry.coordinates;

  const src = map.getSource("highlight");
  if (src) {
    src.setData({
      type: "FeatureCollection",
      features: [f],
    });
  }

  map.fitBounds(turf.bbox(f), { padding: 40 });

  popup
    .setLngLat(center)
    .setHTML(popupHTMLPredioPublico(f.properties || {}, center))
    .addTo(map);
});

// =====================================================
// CARGA FINAL (orden de capas)
// =====================================================
map.on("style.load", () => {
  addBaseOutlineLayer(); // abajo
  addPublicosLayer();    // encima
  addHighlight();        // arriba de todo

  // Blindaje (cuando ya existan)
  setTimeout(() => {
    try {
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
      if (map.getLayer("predios_publicos_layer")) map.moveLayer("predios_publicos_layer");
      if (map.getLayer("highlight_fill")) map.moveLayer("highlight_fill");
      if (map.getLayer("highlight_line")) map.moveLayer("highlight_line");
    } catch (e) {}
  }, 300);
});
