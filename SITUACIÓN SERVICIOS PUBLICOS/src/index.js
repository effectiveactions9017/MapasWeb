// =====================================================
// ✅ Visor Predial + Servicios Públicos – Sesquilé (ACTUALIZADO)
// =====================================================
// 🔵 Predios municipio: polígono (CONTORNO + POPUP al clic)
// 🟠 Servicios públicos: puntos (POPUP + Street View + BUSCADOR)
// 🟡 Highlight: punto seleccionado (por buscador y clic)
// ✅ PRIORIDAD DE CLIC: si hay punto encima, manda el punto (no el predio)
// ✅ NUEVO: Filtro desplegable SI/NO por servicios (Gas/Acueducto/Alcantarillado/Internet/Basuras)
//     - Usa SOLO campos que existan en atributos
//     - Aplica filtro visual con map.setFilter() sobre servicios_publicos_layer
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
// ✅ POPUP PREDIOS (CLIC)
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
// ✅ FILTRO DESPLEGABLE (SI / NO) – SOLO SERVICIOS
// Requiere que en tu HTML exista: <select id="spSelect">...</select>
// =====================================================

// Expr Mapbox para “SI”
function exprTieneSi(fieldName) {
  return [
    "in",
    ["downcase", ["to-string", ["coalesce", ["get", fieldName], ""]]],
    ["literal", ["si", "sí", "s", "1", "true", "x", "yes", "y"]]
  ];
}

// Expr Mapbox para “NO” (incluye vacío como NO)
function exprTieneNo(fieldName) {
  return [
    "any",
    ["==", ["to-string", ["coalesce", ["get", fieldName], ""]], ""],
    ["in",
      ["downcase", ["to-string", ["coalesce", ["get", fieldName], ""]]],
      ["literal", ["no", "n", "0", "false", "na", "n/a", "sin", "ninguno"]]
    ]
  ];
}

const SP_FIELDS = {
  GAS: "Tiene servicio de Gas?",
  ACUEDUCTO: "Tiene servicio de acueducto?",
  ALC: "Tiene servicio de alcantarillado?",
  INTERNET: "Tiene servicio de Internet?",
  BASURAS: "Tiene servicio de recolección de basuras?",
};

// ✅ Detecta cuáles campos existen realmente en tus atributos
function getServiciosFieldsPresent() {
  const present = {};
  const feats = SERVICIOS_DATA?.features;
  if (!Array.isArray(feats) || !feats.length) return present;

  // revisa en las primeras ~50 features para no gastar mucho
  const sample = feats.slice(0, Math.min(50, feats.length));
  for (const [k, fieldName] of Object.entries(SP_FIELDS)) {
    present[k] = sample.some(f => f?.properties && Object.prototype.hasOwnProperty.call(f.properties, fieldName));
  }
  return present;
}

function applyServiciosSelectFilter(value) {
  const layerId = "servicios_publicos_layer";
  if (!map.getLayer(layerId)) return;

  if (!value || value === "ALL") {
    map.setFilter(layerId, null);
    return;
  }

  let filter = null;

  switch (value) {
    case "GAS_SI":       filter = exprTieneSi(SP_FIELDS.GAS); break;
    case "GAS_NO":       filter = exprTieneNo(SP_FIELDS.GAS); break;

    case "ACUEDUCTO_SI": filter = exprTieneSi(SP_FIELDS.ACUEDUCTO); break;
    case "ACUEDUCTO_NO": filter = exprTieneNo(SP_FIELDS.ACUEDUCTO); break;

    case "ALC_SI":       filter = exprTieneSi(SP_FIELDS.ALC); break;
    case "ALC_NO":       filter = exprTieneNo(SP_FIELDS.ALC); break;

    case "INTERNET_SI":  filter = exprTieneSi(SP_FIELDS.INTERNET); break;
    case "INTERNET_NO":  filter = exprTieneNo(SP_FIELDS.INTERNET); break;

    case "BASURAS_SI":   filter = exprTieneSi(SP_FIELDS.BASURAS); break;
    case "BASURAS_NO":   filter = exprTieneNo(SP_FIELDS.BASURAS); break;

    default: filter = null;
  }

  map.setFilter(layerId, filter);
}

function wireServiciosSelect() {
  const sel = document.getElementById("spSelect");
  if (!sel) return;

  // ✅ Oculta opciones que no existan en la tabla de atributos
  const present = getServiciosFieldsPresent();
  const hideIfMissing = [
    { key: "GAS", values: ["GAS_SI", "GAS_NO"] },
    { key: "ACUEDUCTO", values: ["ACUEDUCTO_SI", "ACUEDUCTO_NO"] },
    { key: "ALC", values: ["ALC_SI", "ALC_NO"] },
    { key: "INTERNET", values: ["INTERNET_SI", "INTERNET_NO"] },
    { key: "BASURAS", values: ["BASURAS_SI", "BASURAS_NO"] },
  ];

  hideIfMissing.forEach(({ key, values }) => {
    if (present[key]) return;
    values.forEach((v) => {
      const opt = sel.querySelector(`option[value="${v}"]`);
      if (opt) opt.style.display = "none";
    });
  });

  sel.addEventListener("change", () => {
    applyServiciosSelectFilter(sel.value);

    // Limpia popup y highlight al cambiar filtro
    try { popup.remove(); } catch (e) {}
    const hs = map.getSource("highlight");
    if (hs) hs.setData({ type: "FeatureCollection", features: [] });
  });

  applyServiciosSelectFilter(sel.value || "ALL");
}

// =====================================================
// ✅ CAPA PREDIOS (CONTORNO + POPUP al clic)
// ✅ PRIORIDAD: si hay punto encima, NO muestra predio
// =====================================================
function addPrediosBase() {
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (map.getSource("predios_base")) map.getSource("predios_base").setData(data);
      else map.addSource("predios_base", { type: "geojson", data });

      // contorno
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

      // fill transparente clickable
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
        // ✅ PRIORIDAD: si el click cae sobre un punto de servicios, NO abrir predio
        const hitServicios = map.queryRenderedFeatures(e.point, {
          layers: ["servicios_publicos_layer"],
        });
        if (hitServicios && hitServicios.length) return;

        const f = e.features && e.features[0];
        if (!f) return;

        const center = turf.centroid(f).geometry.coordinates;

        popup
          .setLngLat(center)
          .setHTML(popupHTMLPredio(f.properties || {}))
          .addTo(map);
      });

      // Orden coherente
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
      if (map.getLayer("predios_base_click")) map.moveLayer("predios_base_click");
    })
    .catch((err) => console.error("Error cargando predios base:", err));
}

// =====================================================
// ✅ CAPA SERVICIOS (PUNTOS + POPUP + Street View)
// =====================================================
function addServiciosPublicos() {
  const FILE = "Servicios_publicos_puntos.geojson";

  fetch(`../src/data/${FILE}`)
    .then((r) => r.json())
    .then((data) => {
      SERVICIOS_DATA = data;

      if (map.getSource("servicios_publicos")) map.getSource("servicios_publicos").setData(data);
      else map.addSource("servicios_publicos", { type: "geojson", data });

      if (!map.getLayer("servicios_publicos_layer")) {
        map.addLayer({
          id: "servicios_publicos_layer",
          type: "circle",
          source: "servicios_publicos",
          paint: {
            "circle-radius": 6,
            "circle-color": "#ffb703",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
            "circle-opacity": 0.95,
          },
        });
      }

      safeOff("mouseenter", "servicios_publicos_layer");
      safeOff("mouseleave", "servicios_publicos_layer");
      safeOff("click", "servicios_publicos_layer");

      map.on("mouseenter", "servicios_publicos_layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "servicios_publicos_layer", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "servicios_publicos_layer", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);

        popup
          .setLngLat(lngLat)
          .setHTML(popupHTMLServicios(f.properties || {}, lngLat))
          .addTo(map);

        // highlight
        const hs = map.getSource("highlight");
        if (hs) hs.setData({ type: "FeatureCollection", features: [f] });
      });

      // ✅ Conectar el filtro desplegable cuando YA cargó servicios
      setTimeout(() => {
        try { wireServiciosSelect(); } catch (e) {}
      }, 0);

      // ✅ Blindaje de orden cuando ya existen capas
      try {
        if (map.getLayer("predios_base_click") && map.getLayer("servicios_publicos_layer")) {
          map.moveLayer("servicios_publicos_layer"); // arriba de predios
        }
        if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle"); // arriba de todo
      } catch (e) {}
    })
    .catch((err) => console.error("Error cargando servicios públicos:", err));
}

// =====================================================
// ✅ HIGHLIGHT (punto seleccionado)
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
// ✅ BUSCADOR LOCAL (SERVICIOS) + Street View
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

// Resultado del buscador
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
// CARGA FINAL (orden correcto)
// =====================================================
map.on("style.load", () => {
  addPrediosBase();        // abajo (contorno + click)
  addServiciosPublicos();  // arriba (puntos)
  addHighlight();          // arriba de todo

  // Blindaje extra (por si demora el fetch)
  setTimeout(() => {
    try {
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
      if (map.getLayer("predios_base_click")) map.moveLayer("predios_base_click");
      if (map.getLayer("servicios_publicos_layer")) map.moveLayer("servicios_publicos_layer");
      if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");
    } catch (e) {}
  }, 400);
});
