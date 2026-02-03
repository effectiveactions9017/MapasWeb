// =====================================================
// ✅ Visor Predial + Servicios Públicos – Sesquilé (ACTUALIZADO)
// =====================================================
// 🔵 Predios municipio: polígono (CONTORNO + POPUP al clic)
// 🟠 Servicios públicos: puntos (POPUP + Street View + BUSCADOR)
// 🟡 Highlight: punto seleccionado (por buscador y clic)
// ✅ PRIORIDAD DE CLIC: si hay punto encima, manda el punto (no el predio)
// ✅ NUEVO: FILTROS MULTI-SELECT CON SWITCHES (pueden quedar varios prendidos)
//     - Cada switch muestra un "grupo" de puntos con un color distinto
//     - Si no hay switches activos → muestra TODOS (capa base)
// ✅ UI: Panel abrir/cerrar (spControl/spOpen/spClose)
// ✅ OJO: tu HTML ya quedó con .sp-row[data-layer="L_..."] (NO data-value)
// ✅ FIX: filtros Sí/No robustos para valores tipo "C_No", "Si_", "c_si", etc.
//     - Vacíos / N/A NO se toman como "No"
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
let SERVICIOS_DATA = null;

// =====================================================
// HELPERS
// =====================================================
function safeOff(evt, layer) {
  try { map.off(evt, layer); } catch (e) {}
}

function norm(v) {
  return (v ?? "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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

function formatAvaluo(val) {
  if (val === null || val === undefined || val === "") return "N/A";
  const n = Number(val);
  return isNaN(n) ? String(val) : n.toLocaleString("es-CO");
}

function formatArea(val) {
  if (val === null || val === undefined || val === "") return "N/A";
  const n = Number(val);
  return isNaN(n) ? String(val) : Math.round(n).toString();
}

// =====================================================
// ✅ UI: CERRAR / ABRIR PANEL
// =====================================================
function wireFilterPanelToggle() {
  const panel = document.getElementById("spControl");
  const btnClose = document.getElementById("spClose");
  const btnOpen = document.getElementById("spOpen");

  if (!panel || !btnClose || !btnOpen) return;

  btnOpen.style.display = "none";

  btnClose.addEventListener("click", () => {
    panel.style.display = "none";
    btnOpen.style.display = "block";
  });

  btnOpen.addEventListener("click", () => {
    panel.style.display = "block";
    btnOpen.style.display = "none";
  });
}

// =====================================================
// ✅ POPUP PREDIOS
// =====================================================
function popupHTMLPredio(props) {
  props = props || {};
  const avaluoTxt = formatAvaluo(props["AVALUO 2026"]);
  const areaTxt = formatArea(props["Shape_Area"]);

  return `
    <div style="font-weight:700; margin-bottom:6px;">Predio municipio de Sesquilé</div>
    <strong>Código:</strong> ${props.codigo ?? "N/A"}<br>
    <strong>Destino:</strong> ${props.DESTINO ?? "N/A"}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? "N/A"}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? "N/A"}<br>
    <strong>Avalúo 2026:</strong> ${avaluoTxt}<br>
    <strong>Área (㎡):</strong> ${areaTxt}<br>
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// ✅ POPUP SERVICIOS (10 campos) + Street View
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
  "Tiene servicio de Gas?",
];

function popupHTMLServicios(props, lngLat) {
  props = props || {};
  const rows = CAMPOS_SERVICIOS.map((k) => {
    let v = props[k];
    if (v === null || v === undefined || v === "") v = "N/A";
    return `<strong>${k}:</strong> ${v}`;
  }).join("<br>");

  const btn = `
    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLat)}" target="_blank"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    </div>
  `;

  return `
    <div style="font-weight:700; margin-bottom:6px;">Situación de servicios públicos</div>
    ${rows}
    ${btn}
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// ✅ FILTROS (Mapbox Expressions) — FIX Sí/No con "C_No", "Si_", etc.
// =====================================================
function exprNorm(fieldName) {
  // 1) minúscula + string
  const v = ["downcase", ["to-string", ["coalesce", ["get", fieldName], ""]]];

  // 2) limpiar prefijos/sufijos comunes (c_, _, -, espacios)
  const v1 = ["replace", v, "c_", ""];
  const v2 = ["replace", v1, "_", ""];
  const v3 = ["replace", v2, "-", ""];
  const v4 = ["replace", v3, " ", ""];

  return v4; // "C_No"->"no", "Si_"->"si"
}

function exprTieneSi(fieldName) {
  const v = exprNorm(fieldName);
  return [
    "all",
    ["!=", v, ""], // no vacío
    ["in", v, ["literal", ["si", "sí"]]], // solo SI real (incluye "sí")
  ];
}

function exprTieneNo(fieldName) {
  const v = exprNorm(fieldName);
  return [
    "all",
    ["!=", v, ""],   // no vacío
    ["==", v, "no"], // solo NO real
  ];
}

const SP_FIELDS = {
  GAS: "Tiene servicio de Gas?",
  ACUEDUCTO: "Tiene servicio de acueducto?",
  ALC: "Tiene servicio de alcantarillado?",
  INTERNET: "Tiene servicio de Internet?",
  BASURAS: "Tiene servicio de recolección de basuras?",
};

function getServiciosFieldsPresent() {
  const present = {};
  const feats = SERVICIOS_DATA?.features;
  if (!Array.isArray(feats) || !feats.length) return present;

  const sample = feats.slice(0, Math.min(50, feats.length));
  for (const [k, fieldName] of Object.entries(SP_FIELDS)) {
    present[k] = sample.some((f) => f?.properties && (fieldName in f.properties));
  }
  return present;
}

// =====================================================
// ✅ DEFINICIÓN DE "GRUPOS" (cada grupo = 1 switch + 1 color)
// =====================================================
const FILTER_GROUPS = [
  { id: "L_GAS_SI",       label: "Gas: Sí",            field: SP_FIELDS.GAS,       expr: () => exprTieneSi(SP_FIELDS.GAS),       color: "#00bcd4" },
  { id: "L_GAS_NO",       label: "Gas: No",            field: SP_FIELDS.GAS,       expr: () => exprTieneNo(SP_FIELDS.GAS),       color: "#ff4d6d" },

  { id: "L_ACUEDUCTO_SI", label: "Acueducto: Sí",      field: SP_FIELDS.ACUEDUCTO, expr: () => exprTieneSi(SP_FIELDS.ACUEDUCTO), color: "#7c3aed" },
  { id: "L_ACUEDUCTO_NO", label: "Acueducto: No",      field: SP_FIELDS.ACUEDUCTO, expr: () => exprTieneNo(SP_FIELDS.ACUEDUCTO), color: "#f59e0b" },

  { id: "L_ALC_SI",       label: "Alcantarillado: Sí", field: SP_FIELDS.ALC,       expr: () => exprTieneSi(SP_FIELDS.ALC),       color: "#22c55e" },
  { id: "L_ALC_NO",       label: "Alcantarillado: No", field: SP_FIELDS.ALC,       expr: () => exprTieneNo(SP_FIELDS.ALC),       color: "#ef4444" },

  { id: "L_INTERNET_SI",  label: "Internet: Sí",       field: SP_FIELDS.INTERNET,  expr: () => exprTieneSi(SP_FIELDS.INTERNET),  color: "#3b82f6" },
  { id: "L_INTERNET_NO",  label: "Internet: No",       field: SP_FIELDS.INTERNET,  expr: () => exprTieneNo(SP_FIELDS.INTERNET),  color: "#a3a3a3" },

  { id: "L_BASURAS_SI",   label: "Basuras: Sí",        field: SP_FIELDS.BASURAS,   expr: () => exprTieneSi(SP_FIELDS.BASURAS),   color: "#e879f9" },
  { id: "L_BASURAS_NO",   label: "Basuras: No",        field: SP_FIELDS.BASURAS,   expr: () => exprTieneNo(SP_FIELDS.BASURAS),   color: "#f97316" },
];

// =====================================================
// ✅ LAYERS DE FILTRO: base + N capas por grupo
// =====================================================
function ensureServiciosFilterLayers() {
  const sourceId = "servicios_publicos";
  const baseId = "L_BASE";

  // Base (todos)
  if (!map.getLayer(baseId)) {
    map.addLayer({
      id: baseId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 6,
        "circle-color": "#ffb703",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.95,
      },
    });
  }

  // Capas por grupo (inicialmente ocultas)
  for (const g of FILTER_GROUPS) {
    if (map.getLayer(g.id)) continue;

    map.addLayer({
      id: g.id,
      type: "circle",
      source: sourceId,
      layout: { visibility: "none" },
      filter: g.expr(),
      paint: {
        "circle-radius": 6,
        "circle-color": g.color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.95,
      },
    });
  }
}

// =====================================================
// ✅ Interacción sobre servicios (click/hover)
// =====================================================
function getTopServiciosLayerId(activeLayerIds) {
  if (activeLayerIds && activeLayerIds.length) return activeLayerIds[0];
  return "L_BASE";
}

function wireServiciosLayerInteractions(activeLayerIdsGetter) {
  const all = ["L_BASE", ...FILTER_GROUPS.map(g => g.id)];

  for (const lid of all) {
    safeOff("mouseenter", lid);
    safeOff("mouseleave", lid);
    safeOff("click", lid);
  }

  function attach(lid) {
    map.on("mouseenter", lid, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", lid, () => (map.getCanvas().style.cursor = ""));

    map.on("click", lid, (e) => {
      const f = e.features && e.features[0];
      if (!f) return;

      const lngLat = getPointLngLat(f);

      popup
        .setLngLat(lngLat)
        .setHTML(popupHTMLServicios(f.properties || {}, lngLat))
        .addTo(map);

      const hs = map.getSource("highlight");
      if (hs) hs.setData({ type: "FeatureCollection", features: [f] });
    });
  }

  all.forEach(attach);
}

// =====================================================
// ✅ LISTA CON SWITCHES: MULTI-SELECT
// =====================================================
function wireServiciosToggleList() {
  const list = document.getElementById("spToggleList");
  if (!list) return;

  // Oculta filas si no existe el campo
  const present = getServiciosFieldsPresent();
  const canDetect = Object.keys(present).length > 0;

  if (canDetect) {
    FILTER_GROUPS.forEach((g) => {
      const spKey = Object.keys(SP_FIELDS).find(k => SP_FIELDS[k] === g.field);
      const exists = spKey ? !!present[spKey] : true;
      if (!exists) {
        const row = list.querySelector(`.sp-row[data-layer="${g.id}"]`);
        if (row) row.style.display = "none";
      }
    });
  }

  const rowAll = list.querySelector(`.sp-row[data-layer="L_ALL"]`);
  const groupRows = Array.from(list.querySelectorAll(`.sp-row[data-layer]`))
    .filter(r => r.dataset.layer && r.dataset.layer !== "L_ALL");

  function getActiveGroups() {
    return groupRows
      .filter(r => r.classList.contains("is-active"))
      .map(r => r.dataset.layer)
      .filter(Boolean);
  }

  function setLayerVisibility(id, visible) {
    if (!map.getLayer(id)) return;
    map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  }

  function syncMapLayersFromUI() {
    const actives = getActiveGroups();

    if (!actives.length) {
      setLayerVisibility("L_BASE", true);
      FILTER_GROUPS.forEach(g => setLayerVisibility(g.id, false));
      if (rowAll) rowAll.classList.add("is-active");
      return;
    }

    setLayerVisibility("L_BASE", false);
    FILTER_GROUPS.forEach(g => setLayerVisibility(g.id, actives.includes(g.id)));
    if (rowAll) rowAll.classList.remove("is-active");
  }

  if (rowAll) {
    rowAll.addEventListener("click", () => {
      rowAll.classList.add("is-active");
      groupRows.forEach(r => r.classList.remove("is-active"));
      syncMapLayersFromUI();

      try { popup.remove(); } catch (e) {}
      const hs = map.getSource("highlight");
      if (hs) hs.setData({ type: "FeatureCollection", features: [] });
    });
  }

  groupRows.forEach((row) => {
    row.addEventListener("click", () => {
      row.classList.toggle("is-active");

      if (row.classList.contains("is-active") && rowAll) rowAll.classList.remove("is-active");
      if (!getActiveGroups().length && rowAll) rowAll.classList.add("is-active");

      syncMapLayersFromUI();

      try { popup.remove(); } catch (e) {}
      const hs = map.getSource("highlight");
      if (hs) hs.setData({ type: "FeatureCollection", features: [] });
    });
  });

  if (rowAll) rowAll.classList.add("is-active");
  groupRows.forEach(r => r.classList.remove("is-active"));
  syncMapLayersFromUI();
}

// =====================================================
// ✅ CAPA PREDIOS (PRIORIDAD: si hay punto encima, NO muestra predio)
// =====================================================
function isServiciosHitAtPoint(point) {
  const layers = ["L_BASE", ...FILTER_GROUPS.map(g => g.id)];
  const hits = map.queryRenderedFeatures(point, { layers });
  return hits && hits.length;
}

function addPrediosBase() {
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (map.getSource("predios_base")) map.getSource("predios_base").setData(data);
      else map.addSource("predios_base", { type: "geojson", data });

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

      if (!map.getLayer("predios_base_click")) {
        map.addLayer({
          id: "predios_base_click",
          type: "fill",
          source: "predios_base",
          minzoom: 12,
          paint: {
            "fill-color": "#000000",
            "fill-opacity": 0.001,
          },
        });
      }

      safeOff("click", "predios_base_click");
      safeOff("mouseenter", "predios_base_click");
      safeOff("mouseleave", "predios_base_click");

      map.on("mouseenter", "predios_base_click", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "predios_base_click", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "predios_base_click", (e) => {
        if (isServiciosHitAtPoint(e.point)) return;

        const f = e.features && e.features[0];
        if (!f) return;

        const center = turf.centroid(f).geometry.coordinates;

        popup
          .setLngLat(center)
          .setHTML(popupHTMLPredio(f.properties || {}))
          .addTo(map);
      });

      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
      if (map.getLayer("predios_base_click")) map.moveLayer("predios_base_click");
    })
    .catch((err) => console.error("Error cargando predios base:", err));
}

// =====================================================
// ✅ SERVICIOS: fuente + capas (base + grupos) + interacciones
// =====================================================
function addServiciosPublicos() {
  const FILE = "Servicios_publicos_puntos.geojson";

  fetch(`../src/data/${FILE}`)
    .then((r) => r.json())
    .then((data) => {
      SERVICIOS_DATA = data;

      if (map.getSource("servicios_publicos")) map.getSource("servicios_publicos").setData(data);
      else map.addSource("servicios_publicos", { type: "geojson", data });

      ensureServiciosFilterLayers();

      wireServiciosLayerInteractions(() => []);

      setTimeout(() => {
        try { wireServiciosToggleList(); } catch (e) {}
      }, 0);

      setTimeout(() => {
        try { wireFilterPanelToggle(); } catch (e) {}
      }, 0);

      try {
        ["L_BASE", ...FILTER_GROUPS.map(g => g.id)].forEach((lid) => {
          if (map.getLayer(lid)) map.moveLayer(lid);
        });
        if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");
      } catch (e) {}
    })
    .catch((err) => console.error("Error cargando servicios públicos:", err));
}

// =====================================================
// ✅ HIGHLIGHT
// =====================================================
function addHighlight() {
  if (!map.getSource("highlight")) {
    map.addSource("highlight", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getLayer("highlight_circle")) {
    map.addLayer({
      id: "highlight_circle",
      type: "circle",
      source: "highlight",
      paint: {
        "circle-radius": 10,
        "circle-color": "#ffff00",
        "circle-opacity": 0.35,
        "circle-stroke-width": 4,
        "circle-stroke-color": "#ffff00",
      },
    });
  }
}

// =====================================================
// ✅ BUSCADOR LOCAL (SERVICIOS)
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar (número predial, propietario, tipo, uso, servicios...)",
  localGeocoder: (q) => {
    const query = norm(q);
    if (!query || !SERVICIOS_DATA || !Array.isArray(SERVICIOS_DATA.features)) return [];

    const results = [];

    for (const feature of SERVICIOS_DATA.features) {
      const p = feature.properties || {};

      const vPredial = norm(p["Número predial"]);
      const vProp = norm(p["Nombre del propietario"]);
      const vTipo = norm(p["Tipo de predio"]);
      const vUso = norm(p["Uso actual del predio"]);
      const vAc = norm(p["Tiene servicio de acueducto?"]);
      const vAl = norm(p["Tiene servicio de alcantarillado?"]);
      const vBa = norm(p["Tiene servicio de recolección de basuras?"]);
      const vInt = norm(p["Tiene servicio de Internet?"]);
      const vGas = norm(p["Tiene servicio de Gas?"]);

      let ok =
        (vPredial && vPredial.includes(query)) ||
        (vProp && vProp.includes(query)) ||
        (vTipo && vTipo.includes(query)) ||
        (vUso && vUso.includes(query)) ||
        (vAc && vAc.includes(query)) ||
        (vAl && vAl.includes(query)) ||
        (vBa && vBa.includes(query)) ||
        (vInt && vInt.includes(query)) ||
        (vGas && vGas.includes(query));

      if (!ok) {
        const big = norm(Object.values(p).join(" "));
        ok = big.includes(query);
      }

      if (!ok) continue;

      const center = getPointLngLat(feature);
      const placeName = `${p["Número predial"] ?? "N/A"} | ${p["Nombre del propietario"] ?? "N/A"}`;

      results.push({
        type: "Feature",
        geometry: feature.geometry,
        center,
        place_name: placeName,
        text: (p["Número predial"] ?? p["Nombre del propietario"] ?? "Resultado").toString(),
        properties: p,
        place_type: ["place"],
      });

      if (results.length >= 10) break;
    }

    return results;
  },
});

map.addControl(geocoder, "top-left");

geocoder.on("result", (e) => {
  const f = e.result;
  if (!f) return;

  const lngLat = f.center || getPointLngLat(f);

  const hs = map.getSource("highlight");
  if (hs) hs.setData({ type: "FeatureCollection", features: [f] });

  map.flyTo({ center: lngLat, zoom: 18 });

  popup
    .setLngLat(lngLat)
    .setHTML(popupHTMLServicios(f.properties || {}, lngLat))
    .addTo(map);
});

// =====================================================
// CARGA FINAL
// =====================================================
map.on("style.load", () => {
  addPrediosBase();
  addServiciosPublicos();
  addHighlight();

  setTimeout(() => {
    try {
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
      if (map.getLayer("predios_base_click")) map.moveLayer("predios_base_click");

      ["L_BASE", ...FILTER_GROUPS.map(g => g.id)].forEach((lid) => {
        if (map.getLayer(lid)) map.moveLayer(lid);
      });

      if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");
    } catch (e) {}
  }, 400);
});
