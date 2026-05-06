// =====================================================
// ✅ Visor Predial + Servicios Públicos + Alumbrado – Sesquilé
// ✅ Servicios: Servicios_publicos_puntos_nuevo.geojson
// ✅ Alumbrado: alumbrado_publico_con_vereda.geojson
// ✅ Atributos servicios actualizados
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-v9",
  center: [-73.79724, 5.04463],
  zoom: 15,
  antialias: true,
});

map.addControl(new mapboxgl.NavigationControl());

const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup",
});

let SERVICIOS_DATA = null;
let ALUMBRADO_DATA = null;

function safeOff(evt, layer) {
  try {
    map.off(evt, layer);
  } catch (e) {}
}

function norm(v) {
  return (v ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getPointLngLat(feature) {
  const c = feature?.geometry?.coordinates;

  if (Array.isArray(c) && c.length >= 2) {
    return [Number(c[0]), Number(c[1])];
  }

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

function valTxt(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  return v;
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
// ✅ PANEL
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

  return `
    <div style="font-weight:700; margin-bottom:6px;">Predio municipio de Sesquilé</div>
    <strong>Código:</strong> ${props.codigo ?? "N/A"}<br>
    <strong>Destino:</strong> ${props.DESTINO ?? "N/A"}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? "N/A"}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? "N/A"}<br>
    <strong>Avalúo 2026:</strong> ${formatAvaluo(props["AVALUO 2026"])}<br>
    <strong>Área (㎡):</strong> ${formatArea(props["Shape_Area"])}<br>
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// ✅ POPUP SERVICIOS NUEVOS
// =====================================================
const CAMPOS_SERVICIOS = [
  { label: "Número de registro", field: "numero_de_registro" },
  { label: "Número predial", field: "numero_predial" },
  { label: "Folio matrícula inmobiliaria", field: "folio_de_matricula_inmobiliaria" },
  { label: "Se realizó la encuesta", field: "se_realizo_la_encuesta" },
  { label: "Motivo", field: "motivo" },
  { label: "Nombre del propietario", field: "nombre_del_propietario" },
  { label: "Tipo de predio", field: "tipo_de_predio" },
  { label: "Otro tipo de predio", field: "otro_tipo_de_predio" },
  { label: "Uso actual del predio", field: "uso_actual_del_predio" },
  { label: "Tiene servicio de acueducto?", field: "tiene_servicio_de_acueducto" },
  { label: "Entidad prestadora acueducto", field: "entidad_prestadora_del_servicio_17" },
  { label: "Otra entidad acueducto", field: "cual" },
  { label: "Tiene servicio de alcantarillado?", field: "tiene_servicio_de_alcantarillado" },
  { label: "Entidad prestadora alcantarillado", field: "entidad_prestadora_del_servicio_20" },
  { label: "Otra entidad alcantarillado", field: "otro_entidad_prestadora_del_servicio_21" },
  { label: "Tiene servicio de recolección de basuras?", field: "tiene_servicio_de_recoleccion_de_basuras" },
  { label: "Entidad prestadora basuras", field: "entidad_prestadora_del_servicio_24" },
  { label: "Otra entidad basuras", field: "otro_entidad_prestadora_del_servicio_25" },
  { label: "Tiene código interno", field: "tiene_codigo_interno" },
  { label: "Código interno", field: "cual_27" },
  { label: "Nombre del usuario", field: "nombre_del_usuario" },
  { label: "Número de documento usuario", field: "numero_de_documento_28" },
  { label: "Tiene servicio de Internet?", field: "tiene_servicio_de_internet" },
  { label: "Entidad prestadora Internet", field: "entidad_prestadora_del_servicio" },
  { label: "Nombre del usuario Internet", field: "nombre_del_usuario_2" },
  { label: "Número de documento Internet", field: "numero_de_documento_32" },
  { label: "Quién atiende la visita", field: "quien_atiende_la_visita" },
  { label: "Número de identificación", field: "numero_de_identificacion" },
  { label: "Número telefónico", field: "numero_telefonico" },
  { label: "Observaciones", field: "observaciones" },
  { label: "La vivienda es", field: "la_vivienda_es" },
  { label: "Tiene servicio de Gas?", field: "tiene_servicio_de_gas" },
  { label: "Entidad prestadora Gas", field: "entidad_prestadora_del_servicio_39" },
  { label: "Otra entidad Gas", field: "cual_40" },
  { label: "Tiene servicio de luz eléctrica?", field: "tiene_servicio_de_luz_electrica" },
];

function popupHTMLServicios(props, lngLat) {
  props = props || {};

  const rows = CAMPOS_SERVICIOS.map((item) => {
    return `<strong>${item.label}:</strong> ${valTxt(props[item.field])}`;
  }).join("<br>");

  return `
    <div style="font-weight:700; margin-bottom:6px;">Situación de servicios públicos</div>
    ${rows}
    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLat)}" target="_blank"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    </div>
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

function popupHTMLAlumbrado(props, lngLat) {
  props = props || {};

  return `
    <div style="font-weight:700; margin-bottom:6px;">Alumbrado público</div>
    <strong>Tipo poste:</strong> ${valTxt(props.tipo_poste)}<br>
    <strong>Código de poste:</strong> ${valTxt(props.codigo_de_poste)}<br>
    <strong>Código de lámpara:</strong> ${valTxt(props.codigo_de_lampara)}<br>
    <strong>Observaciones:</strong> ${valTxt(props.observaciones)}<br>
    <strong>Vereda:</strong> ${valTxt(props.vereda)}<br>
    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLat)}" target="_blank"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    </div>
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// ✅ FILTROS
// =====================================================
function exprRaw(fieldName) {
  return ["downcase", ["to-string", ["coalesce", ["get", fieldName], ""]]];
}

function exprTieneSi(fieldName) {
  return [
    "match",
    exprRaw(fieldName),
    ["si", "sí", "si_", "sí_", "si.", "sí.", "c_si", "c_sí", "c_si_", "c_sí_", "s", "1", "true", "verdadero"],
    true,
    false,
  ];
}

function exprTieneNo(fieldName) {
  return [
    "match",
    exprRaw(fieldName),
    ["no", "no_", "no.", "c_no", "c_no_", "c-no", "c-no_", "n", "0", "false", "falso"],
    true,
    false,
  ];
}

const SP_FIELDS = {
  GAS: "tiene_servicio_de_gas",
  ACUEDUCTO: "tiene_servicio_de_acueducto",
  ALC: "tiene_servicio_de_alcantarillado",
  INTERNET: "tiene_servicio_de_internet",
  BASURAS: "tiene_servicio_de_recoleccion_de_basuras",
};

const FILTER_GROUPS = [
  { id: "L_GAS_SI", label: "Gas: Sí", field: SP_FIELDS.GAS, expr: () => exprTieneSi(SP_FIELDS.GAS), color: "#00bcd4" },
  { id: "L_GAS_NO", label: "Gas: No", field: SP_FIELDS.GAS, expr: () => exprTieneNo(SP_FIELDS.GAS), color: "#ff4d6d" },
  { id: "L_ACUEDUCTO_SI", label: "Acueducto: Sí", field: SP_FIELDS.ACUEDUCTO, expr: () => exprTieneSi(SP_FIELDS.ACUEDUCTO), color: "#7c3aed" },
  { id: "L_ACUEDUCTO_NO", label: "Acueducto: No", field: SP_FIELDS.ACUEDUCTO, expr: () => exprTieneNo(SP_FIELDS.ACUEDUCTO), color: "#f59e0b" },
  { id: "L_ALC_SI", label: "Alcantarillado: Sí", field: SP_FIELDS.ALC, expr: () => exprTieneSi(SP_FIELDS.ALC), color: "#22c55e" },
  { id: "L_ALC_NO", label: "Alcantarillado: No", field: SP_FIELDS.ALC, expr: () => exprTieneNo(SP_FIELDS.ALC), color: "#ef4444" },
  { id: "L_INTERNET_SI", label: "Internet: Sí", field: SP_FIELDS.INTERNET, expr: () => exprTieneSi(SP_FIELDS.INTERNET), color: "#3b82f6" },
  { id: "L_INTERNET_NO", label: "Internet: No", field: SP_FIELDS.INTERNET, expr: () => exprTieneNo(SP_FIELDS.INTERNET), color: "#a3a3a3" },
  { id: "L_BASURAS_SI", label: "Basuras: Sí", field: SP_FIELDS.BASURAS, expr: () => exprTieneSi(SP_FIELDS.BASURAS), color: "#e879f9" },
  { id: "L_BASURAS_NO", label: "Basuras: No", field: SP_FIELDS.BASURAS, expr: () => exprTieneNo(SP_FIELDS.BASURAS), color: "#f97316" },
];

const ALUMBRADO_LAYER_ID = "L_ALUMBRADO";
const ALUMBRADO_COLOR = "#38bdf8";

// =====================================================
// ✅ CAPAS SERVICIOS
// =====================================================
function ensureServiciosFilterLayers() {
  const sourceId = "servicios_publicos";

  if (!map.getLayer("L_BASE")) {
    map.addLayer({
      id: "L_BASE",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 9,
        "circle-color": "#ff0000",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2.5,
        "circle-opacity": 1,
      },
    });
  }

  for (const g of FILTER_GROUPS) {
    if (map.getLayer(g.id)) {
      map.setFilter(g.id, g.expr());
      map.setPaintProperty(g.id, "circle-color", g.color);
      continue;
    }

    map.addLayer({
      id: g.id,
      type: "circle",
      source: sourceId,
      layout: { visibility: "none" },
      filter: g.expr(),
      paint: {
        "circle-radius": 8,
        "circle-color": g.color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-opacity": 1,
      },
    });
  }
}

// =====================================================
// ✅ INTERACCIÓN SERVICIOS
// =====================================================
function wireServiciosLayerInteractions() {
  const all = ["L_BASE", ...FILTER_GROUPS.map((g) => g.id)];

  for (const lid of all) {
    safeOff("mouseenter", lid);
    safeOff("mouseleave", lid);
    safeOff("click", lid);
  }

  all.forEach((lid) => {
    map.on("mouseenter", lid, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", lid, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", lid, (e) => {
      const f = e.features?.[0];
      if (!f) return;

      const lngLat = getPointLngLat(f);

      popup.setLngLat(lngLat).setHTML(popupHTMLServicios(f.properties || {}, lngLat)).addTo(map);

      const hs = map.getSource("highlight");
      if (hs) {
        hs.setData({
          type: "FeatureCollection",
          features: [f],
        });
      }
    });
  });
}

// =====================================================
// ✅ PANEL SWITCHES
// =====================================================
function syncPanelAccentsFromJS() {
  const list = document.getElementById("spToggleList");
  if (!list) return;

  FILTER_GROUPS.forEach((g) => {
    const row = list.querySelector(`.sp-row[data-layer="${g.id}"]`);
    if (row) row.style.setProperty("--sp-accent", g.color);
  });

  const rowAll = list.querySelector(`.sp-row[data-layer="L_ALL"]`);
  if (rowAll) rowAll.style.setProperty("--sp-accent", "#ffb703");

  const rowAlumbrado = list.querySelector(`.sp-row[data-layer="${ALUMBRADO_LAYER_ID}"]`);
  if (rowAlumbrado) rowAlumbrado.style.setProperty("--sp-accent", ALUMBRADO_COLOR);
}

function wireServiciosToggleList() {
  const list = document.getElementById("spToggleList");
  if (!list) return;

  syncPanelAccentsFromJS();

  const rowAll = list.querySelector(`.sp-row[data-layer="L_ALL"]`);
  const rowAlumbrado = list.querySelector(`.sp-row[data-layer="${ALUMBRADO_LAYER_ID}"]`);

  const groupRows = Array.from(list.querySelectorAll(`.sp-row[data-layer]`)).filter(
    (r) => r.dataset.layer && r.dataset.layer !== "L_ALL" && r.dataset.layer !== ALUMBRADO_LAYER_ID
  );

  function setLayerVisibility(id, visible) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  }

  function getActiveGroups() {
    return groupRows.filter((r) => r.classList.contains("is-active")).map((r) => r.dataset.layer);
  }

  function isAlumbradoActive() {
    return rowAlumbrado && rowAlumbrado.classList.contains("is-active");
  }

  function limpiarPopupHighlight() {
    try {
      popup.remove();
    } catch (e) {}

    const hs = map.getSource("highlight");
    if (hs) {
      hs.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }

  function syncMapLayersFromUI() {
    const actives = getActiveGroups();
    const alumbradoActivo = isAlumbradoActive();

    if (!actives.length && !alumbradoActivo) {
      setLayerVisibility("L_BASE", true);
      FILTER_GROUPS.forEach((g) => setLayerVisibility(g.id, false));
    } else {
      setLayerVisibility("L_BASE", false);
      FILTER_GROUPS.forEach((g) => setLayerVisibility(g.id, actives.includes(g.id)));
    }

    setLayerVisibility(ALUMBRADO_LAYER_ID, alumbradoActivo);

    if (rowAll) {
      if (!actives.length && !alumbradoActivo) rowAll.classList.add("is-active");
      else rowAll.classList.remove("is-active");
    }
  }

  if (rowAll && !rowAll.dataset.wired) {
    rowAll.dataset.wired = "1";
    rowAll.addEventListener("click", () => {
      groupRows.forEach((r) => r.classList.remove("is-active"));
      if (rowAlumbrado) rowAlumbrado.classList.remove("is-active");
      rowAll.classList.add("is-active");
      syncMapLayersFromUI();
      limpiarPopupHighlight();
    });
  }

  groupRows.forEach((row) => {
    if (row.dataset.wired) return;
    row.dataset.wired = "1";

    row.addEventListener("click", () => {
      row.classList.toggle("is-active");
      syncMapLayersFromUI();
      limpiarPopupHighlight();
    });
  });

  if (rowAlumbrado && !rowAlumbrado.dataset.wired) {
    rowAlumbrado.dataset.wired = "1";

    rowAlumbrado.addEventListener("click", () => {
      rowAlumbrado.classList.toggle("is-active");
      syncMapLayersFromUI();
      limpiarPopupHighlight();
    });
  }

  syncMapLayersFromUI();
}

// =====================================================
// ✅ PREDIOS
// =====================================================
function isServiciosHitAtPoint(point) {
  const layers = ["L_BASE", ...FILTER_GROUPS.map((g) => g.id), ALUMBRADO_LAYER_ID].filter((id) =>
    map.getLayer(id)
  );

  const hits = map.queryRenderedFeatures(point, { layers });
  return hits && hits.length;
}

function addPrediosBase() {
  fetch(`../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson?v=${Date.now()}`)
    .then((r) => r.json())
    .then((data) => {
      if (map.getSource("predios_base")) {
        map.getSource("predios_base").setData(data);
      } else {
        map.addSource("predios_base", {
          type: "geojson",
          data,
        });
      }

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

      map.on("mouseenter", "predios_base_click", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "predios_base_click", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "predios_base_click", (e) => {
        if (isServiciosHitAtPoint(e.point)) return;

        const f = e.features?.[0];
        if (!f) return;

        const center = turf.centroid(f).geometry.coordinates;
        popup.setLngLat(center).setHTML(popupHTMLPredio(f.properties || {})).addTo(map);
      });
    })
    .catch((err) => console.error("Error cargando predios base:", err));
}

// =====================================================
// ✅ SERVICIOS
// =====================================================
function addServiciosPublicos() {
  const FILE = "Servicios_publicos_puntos_nuevo.geojson";

  fetch(`../src/data/${FILE}?v=${Date.now()}`)
    .then((r) => {
      if (!r.ok) throw new Error(`No se pudo cargar ${FILE}: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      SERVICIOS_DATA = data;

      console.log("✅ Servicios cargados:", data.features?.length);
      console.log("📍 Primera coordenada:", data.features?.[0]?.geometry?.coordinates);
      console.log("📋 Primeras propiedades:", data.features?.[0]?.properties);

      if (map.getSource("servicios_publicos")) {
        map.getSource("servicios_publicos").setData(data);
      } else {
        map.addSource("servicios_publicos", {
          type: "geojson",
          data,
        });
      }

      ensureServiciosFilterLayers();
      wireServiciosLayerInteractions();
      wireServiciosToggleList();
      wireFilterPanelToggle();

      ordenarCapas();
    })
    .catch((err) => console.error("Error cargando servicios públicos:", err));
}

// =====================================================
// ✅ ALUMBRADO
// =====================================================
function addAlumbradoPublico() {
  const FILE = "alumbrado_publico_con_vereda.geojson";

  fetch(`../src/data/${FILE}?v=${Date.now()}`)
    .then((r) => {
      if (!r.ok) throw new Error(`No se pudo cargar ${FILE}: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      ALUMBRADO_DATA = data;

      if (map.getSource("alumbrado_publico")) {
        map.getSource("alumbrado_publico").setData(data);
      } else {
        map.addSource("alumbrado_publico", {
          type: "geojson",
          data,
        });
      }

      if (!map.getLayer(ALUMBRADO_LAYER_ID)) {
        map.addLayer({
          id: ALUMBRADO_LAYER_ID,
          type: "circle",
          source: "alumbrado_publico",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": 7,
            "circle-color": ALUMBRADO_COLOR,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-opacity": 1,
          },
        });
      }

      safeOff("mouseenter", ALUMBRADO_LAYER_ID);
      safeOff("mouseleave", ALUMBRADO_LAYER_ID);
      safeOff("click", ALUMBRADO_LAYER_ID);

      map.on("mouseenter", ALUMBRADO_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", ALUMBRADO_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", ALUMBRADO_LAYER_ID, (e) => {
        const f = e.features?.[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);
        popup.setLngLat(lngLat).setHTML(popupHTMLAlumbrado(f.properties || {}, lngLat)).addTo(map);

        const hs = map.getSource("highlight");
        if (hs) {
          hs.setData({
            type: "FeatureCollection",
            features: [f],
          });
        }
      });

      syncPanelAccentsFromJS();
      wireServiciosToggleList();
      ordenarCapas();
    })
    .catch((err) => console.error("Error cargando alumbrado público:", err));
}

// =====================================================
// ✅ HIGHLIGHT
// =====================================================
function addHighlight() {
  if (!map.getSource("highlight")) {
    map.addSource("highlight", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  if (!map.getLayer("highlight_circle")) {
    map.addLayer({
      id: "highlight_circle",
      type: "circle",
      source: "highlight",
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
// ✅ ORDENAR CAPAS
// =====================================================
function ordenarCapas() {
  try {
    if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
    if (map.getLayer("predios_base_click")) map.moveLayer("predios_base_click");

    ["L_BASE", ...FILTER_GROUPS.map((g) => g.id)].forEach((lid) => {
      if (map.getLayer(lid)) map.moveLayer(lid);
    });

    if (map.getLayer(ALUMBRADO_LAYER_ID)) map.moveLayer(ALUMBRADO_LAYER_ID);
    if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");

    if (map.getLayer("L_BASE")) {
      map.setLayoutProperty("L_BASE", "visibility", "visible");
    }

    console.log("✅ Capas ordenadas");
    console.log("✅ Visibilidad L_BASE:", map.getLayer("L_BASE") ? map.getLayoutProperty("L_BASE", "visibility") : "No existe");
  } catch (e) {
    console.error("Error ordenando capas:", e);
  }
}

// =====================================================
// ✅ BUSCADOR
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar predial, propietario, servicio, poste, lámpara...",
  localGeocoder: (q) => {
    const query = norm(q);
    if (!query) return [];

    const results = [];

    if (SERVICIOS_DATA && Array.isArray(SERVICIOS_DATA.features)) {
      for (const feature of SERVICIOS_DATA.features) {
        const p = feature.properties || {};

        const big = norm(Object.values(p).join(" "));
        if (!big.includes(query)) continue;

        const center = getPointLngLat(feature);

        results.push({
          type: "Feature",
          geometry: feature.geometry,
          center,
          place_name: `Servicios públicos | ${p.numero_predial ?? "N/A"} | ${p.nombre_del_propietario ?? "N/A"}`,
          text: (p.numero_predial ?? p.nombre_del_propietario ?? "Resultado").toString(),
          properties: {
            ...p,
            __tipo_busqueda: "servicios",
          },
          place_type: ["place"],
        });

        if (results.length >= 10) break;
      }
    }

    if (ALUMBRADO_DATA && Array.isArray(ALUMBRADO_DATA.features) && results.length < 10) {
      for (const feature of ALUMBRADO_DATA.features) {
        const p = feature.properties || {};
        const big = norm(Object.values(p).join(" "));
        if (!big.includes(query)) continue;

        const center = getPointLngLat(feature);

        results.push({
          type: "Feature",
          geometry: feature.geometry,
          center,
          place_name: `Alumbrado público | Poste: ${p.codigo_de_poste ?? "N/A"} | Lámpara: ${p.codigo_de_lampara ?? "N/A"}`,
          text: (p.codigo_de_poste ?? p.codigo_de_lampara ?? "Alumbrado").toString(),
          properties: {
            ...p,
            __tipo_busqueda: "alumbrado",
          },
          place_type: ["place"],
        });

        if (results.length >= 10) break;
      }
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
  if (hs) {
    hs.setData({
      type: "FeatureCollection",
      features: [f],
    });
  }

  map.flyTo({
    center: lngLat,
    zoom: 18,
  });

  if (f.properties?.__tipo_busqueda === "alumbrado") {
    popup.setLngLat(lngLat).setHTML(popupHTMLAlumbrado(f.properties || {}, lngLat)).addTo(map);
  } else {
    popup.setLngLat(lngLat).setHTML(popupHTMLServicios(f.properties || {}, lngLat)).addTo(map);
  }
});

// =====================================================
// ✅ CARGA FINAL
// =====================================================
map.on("style.load", () => {
  addPrediosBase();
  addServiciosPublicos();
  addAlumbradoPublico();
  addHighlight();

  setTimeout(() => {
    ordenarCapas();
  }, 1500);
});
