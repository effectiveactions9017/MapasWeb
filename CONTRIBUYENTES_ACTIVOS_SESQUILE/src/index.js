// =====================================================
// ✅ Visor Contribuyentes Sesquilé - Mapbox GL JS
// ✅ Base predial: SOLO CONTORNO (sin relleno) y SIEMPRE ABAJO
// ✅ Capas arriba: NATURAL y JURIDICOS con buscador + popup
// ✅ Popup: solo campos seleccionados (con espacios en nombres)
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

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

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup",
});

// ============================
// ✅ Guardar datasets completos (para buscador)
// ============================
let NATURAL_DATA = null;
let JURIDICOS_DATA = null;

// =====================================================
// ✅ POPUP: SOLO CAMPOS QUE PEDISTE
// =====================================================
const CAMPOS_POPUP = [
  { key: "CODIGO_PREDIAL", label: "Código predial" },
  { key: "No Documento", label: "Número documento" },
  { key: "Nombre del contribuyente", label: "Contribuyente" },
  { key: "Naturaleza Juridica", label: "Naturaleza jurídica" },
  { key: "Razon Social", label: "Razón social" },
  { key: "Estado", label: "Estado" },
];

function popupHTMLCamposSeleccionados(props, titulo = "Información") {
  if (!props) props = {};
  const rows = CAMPOS_POPUP.map(({ key, label }) => {
    let v = props[key];
    if (v === null || v === undefined || v === "") v = "N/A";
    return `<strong>${label}:</strong> ${v}`;
  }).join("<br>");

  return `
    <div style="font-weight:700; margin-bottom:6px;">${titulo}</div>
    ${rows}
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// ✅ Helpers
// =====================================================
function safeOff(eventName, layerId) {
  try { map.off(eventName, layerId); } catch (e) {}
}

function norm(v) {
  return (v ?? "").toString().toLowerCase().replace(/\s+/g, "").trim();
}

// =====================================================
// ✅ CAPA BASE: SOLO CONTORNO (SIN RELLENO) + ABAJO DE TODO
// =====================================================
function addBaseOutlineLayer(geojsonFile, sourceId, layerId, lineColor = "#ffffff") {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      // Source seguro
      if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
      else map.addSource(sourceId, { type: "geojson", data });

      // Layer contorno (type line)
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
// ✅ CAPAS INTERACTIVAS (ARRIBA): clic -> popup
// =====================================================
function addInteractiveLayer({ geojsonFile, sourceId, layerId, baseColor, datasetKey }) {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      if (datasetKey === "NATURAL") NATURAL_DATA = data;
      if (datasetKey === "JURIDICOS") JURIDICOS_DATA = data;

      // Source seguro
      if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
      else map.addSource(sourceId, { type: "geojson", data });

      // Layer fill (arriba)
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: "fill",
          minzoom: 12,
          paint: {
            // Si no hay "Nombre del contribuyente" => naranja
            "fill-color": [
              "case",
              ["==", ["coalesce", ["get", "Nombre del contribuyente"], ""], ""],
              "#ffb703",
              baseColor,
            ],
            "fill-opacity": 0.75,
            "fill-outline-color": "#ffffff",
          },
        });
      }

      // Evitar listeners duplicados
      safeOff("mouseenter", layerId);
      safeOff("mouseleave", layerId);
      safeOff("click", layerId);

      map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));

      // ✅ Popup por clic: solo campos seleccionados
      map.on("click", layerId, (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const props = f.properties || {};
        const center = turf.centroid(f).geometry.coordinates;

        const titulo =
          datasetKey === "NATURAL" ? "Contribuyente natural" :
          datasetKey === "JURIDICOS" ? "Contribuyente jurídico" :
          "Información";

        popup
          .setLngLat(center)
          .setHTML(popupHTMLCamposSeleccionados(props, titulo))
          .addTo(map);
      });
    })
    .catch((err) => console.error("Error capa interactiva:", err));
}

// =====================================================
// ✅ HIGHLIGHT (ARRIBA DE TODO)
// =====================================================
function ensureHighlightLayers() {
  if (!map.getSource("predios_highlight")) {
    map.addSource("predios_highlight", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getLayer("predios_highlight_fill")) {
    map.addLayer({
      id: "predios_highlight_fill",
      type: "fill",
      source: "predios_highlight",
      paint: { "fill-color": "#ffff00", "fill-opacity": 0.25 },
    });
  }

  if (!map.getLayer("predios_highlight_line")) {
    map.addLayer({
      id: "predios_highlight_line",
      type: "line",
      source: "predios_highlight",
      paint: { "line-color": "#ffff00", "line-width": 4 },
    });
  }
}

// =====================================================
// ✅ Geocoder: SOLO NATURAL + JURIDICOS
// Busca por: CODIGO_PREDIAL, No Documento, Nombre del contribuyente
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

        const cod = (p["CODIGO_PREDIAL"] ?? "").toString().toLowerCase();
        const doc = (p["No Documento"] ?? "").toString().toLowerCase();
        const nom = (p["Nombre del contribuyente"] ?? "").toString().toLowerCase();

        const match =
          (cod && cod.includes(q)) ||
          (doc && doc.includes(q)) ||
          (nom && nom.includes(q));

        if (!match) return;

        const center = turf.centroid(feature).geometry.coordinates;

        // Define campo match para agrupar
        let matchField = null;
        let matchValue = null;

        if (cod && cod.includes(q)) { matchField = "CODIGO_PREDIAL"; matchValue = (p["CODIGO_PREDIAL"] ?? "").toString().trim(); }
        else if (doc && doc.includes(q)) { matchField = "No Documento"; matchValue = (p["No Documento"] ?? "").toString().trim(); }
        else if (nom && nom.includes(q)) { matchField = "Nombre del contribuyente"; matchValue = (p["Nombre del contribuyente"] ?? "").toString().trim(); }

        const props2 = { ...p, __dataset: datasetTag, __matchField: matchField, __matchValue: matchValue };

        results.push({
          type: "Feature",
          geometry: feature.geometry,
          properties: props2,
          place_name: `[${datasetTag}] ${p["CODIGO_PREDIAL"] ?? "N/A"} | ${p["No Documento"] ?? "N/A"} | ${p["Nombre del contribuyente"] ?? "N/A"}`,
          text: (p["CODIGO_PREDIAL"] ?? p["No Documento"] ?? p["Nombre del contribuyente"] ?? "Resultado").toString(),
          center,
          place_type: ["place"],
        });
      });
    }

    scan(NATURAL_DATA, "NATURAL");
    scan(JURIDICOS_DATA, "JURIDICOS");

    return results.slice(0, 10);
  },
});

map.addControl(geocoder, "top-left");

// =====================================================
// ✅ CARGA DE CAPAS (ORDEN CORRECTO)
// Base abajo, luego natural y jurídicos arriba, y highlight arriba de todo
// =====================================================
map.on("style.load", () => {
  // 1) BASE abajo (solo contorno)
  addBaseOutlineLayer(
    "PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson",
    "predios_base",
    "predios_base_outline",
    "#ffffff"
  );

  // 2) Capas arriba (interactivas)
  addInteractiveLayer({
    geojsonFile: "PREDIOS_CONTRIBUYENTES_NATURAL.geojson",
    sourceId: "predios_natural",
    layerId: "predios_natural_layer",
    baseColor: "#2ec4b6",
    datasetKey: "NATURAL",
  });

  addInteractiveLayer({
    geojsonFile: "PREDIOS_CONTRIBUYENTES_JURIDICOS.geojson",
    sourceId: "predios_juridicos",
    layerId: "predios_juridicos_layer",
    baseColor: "#ff006e",
    datasetKey: "JURIDICOS",
  });

  // 3) Highlight siempre arriba
  ensureHighlightLayers();

  // ✅ Forzar orden por si acaso (blindaje)
  // Base contorno -> abajo
  if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");

  // Natural y Jurídicos encima del contorno
  if (map.getLayer("predios_natural_layer")) map.moveLayer("predios_natural_layer");
  if (map.getLayer("predios_juridicos_layer")) map.moveLayer("predios_juridicos_layer");

  // Highlight arriba de todo
  if (map.getLayer("predios_highlight_fill")) map.moveLayer("predios_highlight_fill");
  if (map.getLayer("predios_highlight_line")) map.moveLayer("predios_highlight_line");
});

// =====================================================
// ✅ Al seleccionar resultado: resalta grupo + zoom + popup con campos seleccionados
// Agrupa por CODIGO_PREDIAL o No Documento (si el match fue por esos)
// =====================================================
geocoder.on("result", (e) => {
  const result = e.result;
  if (!result) return;

  const props = result.properties || {};
  const dataset = props.__dataset; // NATURAL | JURIDICOS
  const matchField = props.__matchField; // CODIGO_PREDIAL | No Documento | Nombre del contribuyente
  const matchValue = (props.__matchValue ?? "").toString().trim();

  const fc =
    dataset === "NATURAL" ? NATURAL_DATA :
    dataset === "JURIDICOS" ? JURIDICOS_DATA :
    null;

  const feats = fc && Array.isArray(fc.features) ? fc.features : [];

  let toHighlight = [];

  // Agrupar por CODIGO_PREDIAL o No Documento
  if ((matchField === "CODIGO_PREDIAL" || matchField === "No Documento") && matchValue) {
    const mv = norm(matchValue);
    toHighlight = feats.filter((f) => {
      const p = f.properties || {};
      const v = p[matchField];
      return norm(v) === mv;
    });
  }

  // fallback: solo el seleccionado
  if (!toHighlight.length) toHighlight = [result];

  const highlightFC = { type: "FeatureCollection", features: toHighlight };
  const hlSource = map.getSource("predios_highlight");
  if (hlSource) hlSource.setData(highlightFC);

  const bounds = turf.bbox(highlightFC);
  map.fitBounds(bounds, { padding: 40 });

  const center = result.center || turf.centroid(result).geometry.coordinates;

  const titulo =
    dataset === "NATURAL" ? "Contribuyente natural" :
    dataset === "JURIDICOS" ? "Contribuyente jurídico" :
    "Información";

  popup
    .setLngLat(center)
    .setHTML(popupHTMLCamposSeleccionados(props, titulo))
    .addTo(map);
});
