// =====================================================
// ✅ Visor Contribuyentes Sesquilé - Mapbox GL JS (SOLO PUNTOS)
// ✅ Base predial: SOLO CONTORNO (sin relleno) y SIEMPRE ABAJO
// ✅ Capas:
//    🟩 Persona NATURAL (punto)
//    🟥 Persona JURIDICA (punto)
// ✅ Popup: campos seleccionados + botón Street View (para TODOS)
// ✅ Buscador: busca SOLO en las 2 capas de puntos
// ✅ Highlight: SOLO puntos (circle)
// ✅ Leyenda: usar SOLO la del HTML (#legend). NO se inyecta leyenda extra.
// ✅ FIX: código predial = "codigo" (minúscula)
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

// ===== COLORES UNIFICADOS =====
const COLOR_NATURAL = "#2ec4b6";   // 🟩 verde
const COLOR_JURIDICO = "#ff006e";  // 🟥 rojo

// =====================================================
// MAPA
// =====================================================
const map = new mapboxgl.Map({
  style: "mapbox://styles/mapbox/dark-v11",
  center: [-73.79724, 5.04463],
  zoom: 15,
  pitch: 0,
  bearing: 0,
  container: "map",
  antialias: true,
});

map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// POPUP
// =====================================================
let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup",
});

// ============================
// ✅ DATASETS (BUSCADOR) — SOLO PUNTOS
// ============================
let PERSONA_NATURAL_DATA = null;    // puntos persona natural
let PERSONA_JURIDICA_DATA = null;   // puntos persona jurídica

// =====================================================
// ✅ POPUP: CAMPOS SELECCIONADOS
// =====================================================
const CAMPOS_POPUP = [
  { key: "codigo", label: "Código predial" }, // ✅ FIX
  { key: "No Documento", label: "Número documento" },
  { key: "Nombre del contribuyente", label: "Contribuyente" },
  { key: "Naturaleza Juridica", label: "Naturaleza jurídica" },
  { key: "Razon Social", label: "Razón social" },
  { key: "Estado", label: "Estado" },
];

// =====================================================
// HELPERS
// =====================================================
function safeOff(eventName, layerId) {
  try { map.off(eventName, layerId); } catch (e) {}
}

function norm(v) {
  return (v ?? "").toString().toLowerCase().replace(/\s+/g, "").trim();
}

function getPointLngLat(feature) {
  const c = feature?.geometry?.coordinates;
  if (Array.isArray(c) && c.length >= 2) return [Number(c[0]), Number(c[1])];
  try {
    const cent = turf.centroid(feature).geometry.coordinates;
    return [Number(cent[0]), Number(cent[1])];
  } catch {
    return [-73.79724, 5.04463];
  }
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function popupHTMLCamposSeleccionados(props, titulo = "Información", lngLatForSV = null) {
  if (!props) props = {};

  const rows = CAMPOS_POPUP
    .map(({ key, label }) => {
      let v = props[key];
      if (v === null || v === undefined || v === "") v = "N/A";
      return `<strong>${label}:</strong> ${v}`;
    })
    .join("<br>");

  const svBtn = lngLatForSV
    ? `
      <div style="margin-top:10px;">
        <a href="${streetViewUrl(lngLatForSV)}" target="_blank" rel="noopener"
           style="display:inline-block; padding:6px 10px; border-radius:6px;
                  background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
          📷 Street View
        </a>
      </div>
    `
    : "";

  return `
    <div style="font-weight:700; margin-bottom:6px;">${titulo}</div>
    ${rows}
    ${svBtn}
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// ✅ IMPORTANTE: QUITAR LA LEYENDA DUPLICADA
// =====================================================
function removeInjectedLegendIfExists() {
  const old = document.getElementById("ea-legend");
  if (old) old.remove();
}

// =====================================================
// ✅ CAPA BASE: SOLO CONTORNO (SIN RELLENO) + ABAJO DE TODO
// =====================================================
function addBaseOutlineLayer(geojsonFile, sourceId, layerId, lineColor = "#ffffff") {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
      else map.addSource(sourceId, { type: "geojson", data });

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: "line",
          minzoom: 12,
          paint: {
            "line-color": lineColor,
            "line-width": 1.2,
            "line-opacity": 0.9,
          },
        });
      }
    })
    .catch((err) => console.error("Error capa base:", err));
}

// =====================================================
// ✅ CAPAS PUNTO INTERACTIVAS
// =====================================================
function addInteractivePointLayer({ geojsonFile, sourceId, layerId, color, datasetKey }) {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      if (datasetKey === "PERSONA_NATURAL") PERSONA_NATURAL_DATA = data;
      if (datasetKey === "PERSONA_JURIDICA") PERSONA_JURIDICA_DATA = data;

      if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
      else map.addSource(sourceId, { type: "geojson", data });

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": 6,
            "circle-color": color,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });
      }

      safeOff("mouseenter", layerId);
      safeOff("mouseleave", layerId);
      safeOff("click", layerId);

      map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));

      map.on("click", layerId, (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const props = f.properties || {};
        const lngLat = getPointLngLat(f);

        const hl = map.getSource("point_highlight");
        if (hl) hl.setData({ type: "FeatureCollection", features: [f] });

        const titulo =
          datasetKey === "PERSONA_NATURAL"
            ? "Persona natural"
            : datasetKey === "PERSONA_JURIDICA"
            ? "Persona jurídica"
            : "Información";

        popup
          .setLngLat(lngLat)
          .setHTML(popupHTMLCamposSeleccionados(props, titulo, lngLat))
          .addTo(map);
      });
    })
    .catch((err) => console.error("Error capa punto:", err));
}

// =====================================================
// ✅ HIGHLIGHT (SOLO PUNTOS)
// =====================================================
function ensureHighlightLayers() {
  if (!map.getSource("point_highlight")) {
    map.addSource("point_highlight", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!map.getLayer("point_highlight_circle")) {
    map.addLayer({
      id: "point_highlight_circle",
      type: "circle",
      source: "point_highlight",
      paint: {
        "circle-radius": 11,
        "circle-color": "#ffff00",
        "circle-opacity": 0.35,
        "circle-stroke-width": 4,
        "circle-stroke-color": "#ffff00",
      },
    });
  }
}

// =====================================================
// ✅ CONTROL UI (SOLO CHECKS DE PUNTOS)
// =====================================================
const LAYERS = {
  PERSONA_NATURAL: "persona_natural_layer",
  PERSONA_JURIDICO: "persona_juridica_layer",
};

function setLayerVisibility(layerId, visible) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

function wireLayerControls() {
  const cbPerNat = document.getElementById("toggle_persona_natural");
  const cbPerJur = document.getElementById("toggle_persona_juridica");

  // Si el HTML aún no está montado, no hacemos nada
  if (!cbPerNat || !cbPerJur) return;

  // Estado inicial (si no vienen “checked”, los dejamos prendidos por defecto)
  if (typeof cbPerNat.checked !== "boolean") cbPerNat.checked = true;
  if (typeof cbPerJur.checked !== "boolean") cbPerJur.checked = true;

  const apply = () => {
    setLayerVisibility(LAYERS.PERSONA_NATURAL, cbPerNat.checked);
    setLayerVisibility(LAYERS.PERSONA_JURIDICO, cbPerJur.checked);
    try { popup.remove(); } catch(e){}
  };

  cbPerNat.addEventListener("change", apply);
  cbPerJur.addEventListener("change", apply);

  apply();
}

// =====================================================
// ✅ GEOCODER: BUSCA SOLO EN LAS 2 CAPAS DE PUNTOS
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar (código predial, documento o contribuyente)",
  localGeocoder: function (query) {
    const q = (query || "").toString().toLowerCase().trim();
    if (!q) return [];

    const results = [];

    function scan(fc, datasetTag) {
      const feats = fc && Array.isArray(fc.features) ? fc.features : [];
      feats.forEach((feature) => {
        const p = feature.properties || {};

        const cod = (p["codigo"] ?? "").toString().toLowerCase();
        const doc = (p["No Documento"] ?? "").toString().toLowerCase();
        const nom = (p["Nombre del contribuyente"] ?? "").toString().toLowerCase();

        const match = (cod && cod.includes(q)) || (doc && doc.includes(q)) || (nom && nom.includes(q));
        if (!match) return;

        let matchField = null;
        let matchValue = null;

        if (cod && cod.includes(q)) { matchField = "codigo"; matchValue = (p["codigo"] ?? "").toString().trim(); }
        else if (doc && doc.includes(q)) { matchField = "No Documento"; matchValue = (p["No Documento"] ?? "").toString().trim(); }
        else if (nom && nom.includes(q)) { matchField = "Nombre del contribuyente"; matchValue = (p["Nombre del contribuyente"] ?? "").toString().trim(); }

        const props2 = { ...p, __dataset: datasetTag, __matchField: matchField, __matchValue: matchValue };

        const center = getPointLngLat(feature);

        results.push({
          type: "Feature",
          geometry: feature.geometry,
          properties: props2,
          place_name: `[${datasetTag}] ${p["codigo"] ?? "N/A"} | ${p["No Documento"] ?? "N/A"} | ${p["Nombre del contribuyente"] ?? "N/A"}`,
          text: (p["codigo"] ?? p["No Documento"] ?? p["Nombre del contribuyente"] ?? "Resultado").toString(),
          center,
          place_type: ["place"],
        });
      });
    }

    scan(PERSONA_NATURAL_DATA, "PERSONA_NATURAL");
    scan(PERSONA_JURIDICA_DATA, "PERSONA_JURIDICA");

    return results.slice(0, 10);
  },
});

map.addControl(geocoder, "top-left");

// =====================================================
// CARGA DE CAPAS (ORDEN)
// =====================================================
map.on("style.load", () => {
  removeInjectedLegendIfExists();

  addBaseOutlineLayer(
    "PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson",
    "predios_base",
    "predios_base_outline",
    "#ffffff"
  );

  addInteractivePointLayer({
    geojsonFile: "Contribuyentes_Persona_Natural.geojson",
    sourceId: "persona_natural",
    layerId: "persona_natural_layer",
    color: COLOR_NATURAL,
    datasetKey: "PERSONA_NATURAL",
  });

  addInteractivePointLayer({
    geojsonFile: "Contribuyentes_Persona_Juridica.geojson",
    sourceId: "persona_juridica",
    layerId: "persona_juridica_layer",
    color: COLOR_JURIDICO,
    datasetKey: "PERSONA_JURIDICA",
  });

  ensureHighlightLayers();

  setTimeout(() => {
    wireLayerControls();

    try {
      // Base siempre abajo
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");

      // Puntos arriba
      if (map.getLayer("persona_natural_layer")) map.moveLayer("persona_natural_layer");
      if (map.getLayer("persona_juridica_layer")) map.moveLayer("persona_juridica_layer");

      // Highlight arriba del todo
      if (map.getLayer("point_highlight_circle")) map.moveLayer("point_highlight_circle");
    } catch (e) {}
  }, 600);
});

// =====================================================
// ✅ RESULTADO DEL BUSCADOR (SOLO PUNTOS)
// =====================================================
geocoder.on("result", (e) => {
  const result = e.result;
  if (!result) return;

  const props = result.properties || {};
  const dataset = props.__dataset;
  const matchField = props.__matchField;
  const matchValue = (props.__matchValue ?? "").toString().trim();

  let fc = null;
  if (dataset === "PERSONA_NATURAL") fc = PERSONA_NATURAL_DATA;
  if (dataset === "PERSONA_JURIDICA") fc = PERSONA_JURIDICA_DATA;

  const feats = fc && Array.isArray(fc.features) ? fc.features : [];
  let toHighlight = [];

  if ((matchField === "codigo" || matchField === "No Documento") && matchValue && feats.length) {
    const mv = norm(matchValue);
    toHighlight = feats.filter((f) => {
      const p = f.properties || {};
      const v = p[matchField];
      return norm(v) === mv;
    });
  }

  if (!toHighlight.length) toHighlight = [result];

  const highlightFC = { type: "FeatureCollection", features: toHighlight };

  // zoom al resultado
  const bounds = turf.bbox(highlightFC);
  map.fitBounds(bounds, { padding: 40 });

  // highlight
  const hs = map.getSource("point_highlight");
  if (hs) hs.setData(highlightFC);

  const center = result.center || getPointLngLat(result);

  const titulo =
    dataset === "PERSONA_NATURAL"
      ? "Persona natural"
      : dataset === "PERSONA_JURIDICA"
      ? "Persona jurídica"
      : "Información";

  popup
    .setLngLat(center)
    .setHTML(popupHTMLCamposSeleccionados(props, titulo, center))
    .addTo(map);
});
