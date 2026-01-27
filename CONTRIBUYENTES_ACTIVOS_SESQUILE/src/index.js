// =====================================================
// ✅ Visor Contribuyentes Sesquilé - Mapbox GL JS (ACTUALIZADO)
// ✅ Base predial: SOLO CONTORNO (sin relleno) y SIEMPRE ABAJO
// ✅ Capas:
//    🟩 Predios Contribuyentes NATURAL (polígono)
//    🟥 Predios Contribuyentes JURIDICOS (polígono)
//    🟩 Persona NATURAL (punto)
//    🟥 Persona JURIDICA (punto)
// ✅ Popup: campos seleccionados + botón Street View (para TODOS)
// ✅ Buscador: busca en las 4 capas
// ✅ Highlight: polígonos (fill+line) y puntos (circle)
// ✅ Leyenda: muestra cuadrito (polígonos) y puntico (puntos)
// ✅ FIX: código predial = "codigo" (minúscula)
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

// ===== COLORES UNIFICADOS =====
const COLOR_NATURAL = "#2ec4b6";  // 🟩 verde
const COLOR_JURIDICO = "#ff006e"; // 🟥 rojo

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
// ✅ DATASETS COMPLETOS (BUSCADOR)
// ============================
let NATURAL_DATA = null;            // predios natural (polígonos)
let JURIDICOS_DATA = null;          // predios jurídicos (polígonos)
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
  // para puntos
  const c = feature?.geometry?.coordinates;
  if (Array.isArray(c) && c.length >= 2) return [Number(c[0]), Number(c[1])];
  // fallback
  try {
    const cent = turf.centroid(feature).geometry.coordinates;
    return [Number(cent[0]), Number(cent[1])];
  } catch {
    return [-73.79724, 5.04463];
  }
}

function getFeatureLngLat(feature, fallbackLngLat = null) {
  // para polígonos/puntos: devuelve [lng,lat]
  if (
    fallbackLngLat &&
    typeof fallbackLngLat.lng === "number" &&
    typeof fallbackLngLat.lat === "number"
  ) {
    return [fallbackLngLat.lng, fallbackLngLat.lat];
  }

  const c = feature?.geometry?.coordinates;
  if (Array.isArray(c) && c.length >= 2 && typeof c[0] === "number") {
    return [Number(c[0]), Number(c[1])];
  }

  try {
    const pt = turf.pointOnFeature(feature).geometry.coordinates;
    return [Number(pt[0]), Number(pt[1])];
  } catch (e) {}

  return [-73.79724, 5.04463];
}

function streetViewUrl([lng, lat]) {
  // Google ajusta al panorama/vía más cercana
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
// ✅ LEYENDA (cuadritos + punticos)
// =====================================================
function ensureLegend() {
  if (document.getElementById("ea-legend")) return;

  const div = document.createElement("div");
  div.id = "ea-legend";
  div.className = "ea-legend";
  div.innerHTML = `
    <div class="ea-legend-title">Leyenda</div>

    <div class="ea-legend-item">
      <span class="ea-swatch ea-square" style="background:${COLOR_NATURAL}"></span>
      <span>Predios contribuyentes natural</span>
    </div>
    <div class="ea-legend-item">
      <span class="ea-swatch ea-square" style="background:${COLOR_JURIDICO}"></span>
      <span>Predios contribuyentes jurídicos</span>
    </div>

    <div class="ea-legend-item">
      <span class="ea-swatch ea-dot" style="background:${COLOR_NATURAL}"></span>
      <span>Persona natural</span>
    </div>
    <div class="ea-legend-item">
      <span class="ea-swatch ea-dot" style="background:${COLOR_JURIDICO}"></span>
      <span>Persona jurídica</span>
    </div>

    <div class="ea-legend-item">
      <span class="ea-swatch ea-hl"></span>
      <span>Seleccionado</span>
    </div>
  `;

  const css = document.createElement("style");
  css.innerHTML = `
    .ea-legend{
      position:absolute;
      bottom:20px;
      right:10px;
      z-index:10;
      background: rgba(0,0,0,0.70);
      color:#fff;
      padding:12px 12px;
      border-radius:10px;
      width: 240px;
      font-family: Arial, sans-serif;
      box-shadow: 0 8px 20px rgba(0,0,0,.35);
    }
    .ea-legend-title{
      font-weight: 800;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .ea-legend-item{
      display:flex;
      gap:10px;
      align-items:center;
      margin: 6px 0;
      font-size: 12px;
      line-height: 1.2;
    }
    .ea-swatch{ display:inline-block; flex:0 0 auto; }
    .ea-square{
      width: 12px; height: 12px; border-radius: 3px;
      border: 1px solid rgba(255,255,255,.8);
    }
    .ea-dot{
      width: 12px; height: 12px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,.8);
    }
    .ea-hl{
      width: 12px; height: 12px; border-radius: 3px;
      background: #ffff00;
      border: 1px solid rgba(255,255,255,.8);
    }
  `;

  document.head.appendChild(css);
  document.body.appendChild(div);
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
// ✅ CAPAS POLÍGONO INTERACTIVAS: clic -> popup + highlight
// =====================================================
function addInteractivePolygonLayer({
  geojsonFile,
  sourceId,
  layerId,
  baseColor,
  datasetKey,
}) {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      if (datasetKey === "NATURAL") NATURAL_DATA = data;
      if (datasetKey === "JURIDICOS") JURIDICOS_DATA = data;

      if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
      else map.addSource(sourceId, { type: "geojson", data });

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: "fill",
          minzoom: 12,
          paint: {
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

      safeOff("mouseenter", layerId);
      safeOff("mouseleave", layerId);
      safeOff("click", layerId);

      map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));

      map.on("click", layerId, (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const props = f.properties || {};
        const center = turf.centroid(f).geometry.coordinates;

        // highlight (polígono)
        const hl = map.getSource("poly_highlight");
        if (hl) hl.setData({ type: "FeatureCollection", features: [f] });

        const titulo =
          datasetKey === "NATURAL"
            ? "Predios contribuyentes natural"
            : datasetKey === "JURIDICOS"
            ? "Predios contribuyentes jurídico"
            : "Información";

        const svLngLat = getFeatureLngLat(f, e.lngLat);

        popup
          .setLngLat(center)
          .setHTML(popupHTMLCamposSeleccionados(props, titulo, svLngLat))
          .addTo(map);
      });
    })
    .catch((err) => console.error("Error capa polígono:", err));
}

// =====================================================
// ✅ CAPAS PUNTO INTERACTIVAS: clic -> popup + highlight
// =====================================================
function addInteractivePointLayer({
  geojsonFile,
  sourceId,
  layerId,
  color,
  datasetKey,
}) {
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

        // highlight (punto)
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
// ✅ HIGHLIGHTS (polígonos y puntos)
// =====================================================
function ensureHighlightLayers() {
  // ---- highlight polígonos
  if (!map.getSource("poly_highlight")) {
    map.addSource("poly_highlight", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!map.getLayer("poly_highlight_fill")) {
    map.addLayer({
      id: "poly_highlight_fill",
      type: "fill",
      source: "poly_highlight",
      paint: { "fill-color": "#ffff00", "fill-opacity": 0.25 },
    });
  }
  if (!map.getLayer("poly_highlight_line")) {
    map.addLayer({
      id: "poly_highlight_line",
      type: "line",
      source: "poly_highlight",
      paint: { "line-color": "#ffff00", "line-width": 4 },
    });
  }

  // ---- highlight puntos
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
// ✅ GEOCODER: BUSCA EN LAS 4 CAPAS
// Busca por: codigo, No Documento, Nombre del contribuyente
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

        const cod = (p["codigo"] ?? "").toString().toLowerCase(); // ✅ FIX
        const doc = (p["No Documento"] ?? "").toString().toLowerCase();
        const nom = (p["Nombre del contribuyente"] ?? "").toString().toLowerCase();

        const match = (cod && cod.includes(q)) || (doc && doc.includes(q)) || (nom && nom.includes(q));
        if (!match) return;

        const center = turf.centroid(feature).geometry.coordinates;

        let matchField = null;
        let matchValue = null;

        if (cod && cod.includes(q)) { matchField = "codigo"; matchValue = (p["codigo"] ?? "").toString().trim(); }
        else if (doc && doc.includes(q)) { matchField = "No Documento"; matchValue = (p["No Documento"] ?? "").toString().trim(); }
        else if (nom && nom.includes(q)) { matchField = "Nombre del contribuyente"; matchValue = (p["Nombre del contribuyente"] ?? "").toString().trim(); }

        const props2 = { ...p, __dataset: datasetTag, __matchField: matchField, __matchValue: matchValue };

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

    scan(NATURAL_DATA, "PREDIO_NATURAL");
    scan(JURIDICOS_DATA, "PREDIO_JURIDICO");
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
  // Leyenda (una vez)
  ensureLegend();

  // 1) Base abajo
  addBaseOutlineLayer(
    "PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson",
    "predios_base",
    "predios_base_outline",
    "#ffffff"
  );

  // 2) Polígonos (natural/jurídico)
  addInteractivePolygonLayer({
    geojsonFile: "PREDIOS_CONTRIBUYENTES_NATURAL.geojson",
    sourceId: "predios_natural",
    layerId: "predios_natural_layer",
    baseColor: COLOR_NATURAL,
    datasetKey: "NATURAL",
  });

  addInteractivePolygonLayer({
    geojsonFile: "PREDIOS_CONTRIBUYENTES_JURIDICOS.geojson",
    sourceId: "predios_juridicos",
    layerId: "predios_juridicos_layer",
    baseColor: COLOR_JURIDICO,
    datasetKey: "JURIDICOS",
  });

  // 3) Puntos (persona natural/jurídica)
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

  // 4) Highlights arriba de todo
  ensureHighlightLayers();

  // Blindaje de orden (por si fetch demora)
  setTimeout(() => {
    try {
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");

      if (map.getLayer("predios_natural_layer")) map.moveLayer("predios_natural_layer");
      if (map.getLayer("predios_juridicos_layer")) map.moveLayer("predios_juridicos_layer");

      if (map.getLayer("persona_natural_layer")) map.moveLayer("persona_natural_layer");
      if (map.getLayer("persona_juridica_layer")) map.moveLayer("persona_juridica_layer");

      if (map.getLayer("poly_highlight_fill")) map.moveLayer("poly_highlight_fill");
      if (map.getLayer("poly_highlight_line")) map.moveLayer("poly_highlight_line");
      if (map.getLayer("point_highlight_circle")) map.moveLayer("point_highlight_circle");
    } catch (e) {}
  }, 450);
});

// =====================================================
// ✅ RESULTADO DEL BUSCADOR:
// - Resalta grupo (si match fue por codigo o No Documento)
// - Zoom al grupo
// - Popup con Street View
// =====================================================
geocoder.on("result", (e) => {
  const result = e.result;
  if (!result) return;

  const props = result.properties || {};
  const dataset = props.__dataset;       // PREDIO_NATURAL | PREDIO_JURIDICO | PERSONA_NATURAL | PERSONA_JURIDICA
  const matchField = props.__matchField; // codigo | No Documento | Nombre del contribuyente
  const matchValue = (props.__matchValue ?? "").toString().trim();

  // Elegir FC según dataset
  let fc = null;
  if (dataset === "PREDIO_NATURAL") fc = NATURAL_DATA;
  if (dataset === "PREDIO_JURIDICO") fc = JURIDICOS_DATA;
  if (dataset === "PERSONA_NATURAL") fc = PERSONA_NATURAL_DATA;
  if (dataset === "PERSONA_JURIDICA") fc = PERSONA_JURIDICA_DATA;

  const feats = fc && Array.isArray(fc.features) ? fc.features : [];
  let toHighlight = [];

  // Agrupar por codigo o No Documento
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
  const bounds = turf.bbox(highlightFC);
  map.fitBounds(bounds, { padding: 40 });

  // ¿Es punto o polígono?
  const isPoint = (result.geometry?.type || "").toLowerCase().includes("point");

  if (isPoint) {
    // highlight punto
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

  } else {
    // highlight polígono
    const hs = map.getSource("poly_highlight");
    if (hs) hs.setData(highlightFC);

    const center = result.center || turf.centroid(result).geometry.coordinates;

    const titulo =
      dataset === "PREDIO_NATURAL"
        ? "Predios contribuyentes natural"
        : dataset === "PREDIO_JURIDICO"
        ? "Predios contribuyentes jurídico"
        : "Información";

    // Street View: centro del bbox del grupo
    const b = turf.bbox(highlightFC);
    const svCenter = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

    popup
      .setLngLat(center)
      .setHTML(popupHTMLCamposSeleccionados(props, titulo, svCenter))
      .addTo(map);
  }
});
