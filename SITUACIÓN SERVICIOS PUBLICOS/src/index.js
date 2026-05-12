// =====================================================
// ✅ Visor Predial + Servicios Públicos + Alumbrado – Sesquilé
// ✅ Servicios: Servicios_publicos_puntos_nuevo.geojson
// ✅ Alumbrado: alumbrado_publico_con_vereda.geojson
// ✅ Energía ahora está dentro de Servicios
// ✅ Campo energía: tiene_luz
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

// =====================================================
// MAPA
// =====================================================
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-v9",
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
let ALUMBRADO_DATA = null;

// =====================================================
// HELPERS
// =====================================================
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

function valTxt(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  return v;
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
// ✅ POPUP SERVICIOS
// =====================================================
const CAMPOS_SERVICIOS = [
  { label: "Número predial", field: "n_mero_pre" },
  { label: "Nombre del propietario", field: "nombre_del" },
  { label: "Tipo de predio", field: "tipo_de_pr" },
  { label: "Otro - Tipo de predio", field: "tipo_de__1" },
  { label: "Uso actual del predio", field: "uso_actual" },
  { label: "Tiene servicio de acueducto?", field: "tiene_serv" },
  { label: "Entidad prestadora acueducto", field: "entidad_pr" },
  { label: "Tiene servicio de alcantarillado?", field: "tiene_se_1" },
  { label: "Entidad prestadora alcantarillado", field: "field_38" },
  { label: "Tiene servicio de recolección de basuras?", field: "tiene_se_2" },
  { label: "Entidad prestadora basuras", field: "field_39" },
  { label: "Tiene servicio de Internet?", field: "tiene_se_3" },
  { label: "Operador de Internet", field: "field_19" },
  { label: "Tiene servicio de Gas?", field: "tiene_se_4" },
  { label: "Operador de Gas", field: "field_50" },
  { label: "Tiene servicio de energía?", field: "tiene_luz" },
  { label: "La vivienda es", field: "la_viviend" },
  { label: "Observación", field: "observacio" },
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

// =====================================================
// ✅ POPUP ALUMBRADO
// =====================================================
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
// ✅ FILTROS SÍ / NO ROBUSTOS
// =====================================================
function exprRaw(fieldName) {
  return [
    "downcase",
    [
      "to-string",
      ["coalesce", ["get", fieldName], ""]
    ]
  ];
}

function exprTieneSi(fieldName) {
  return [
    "in",
    exprRaw(fieldName),
    ["literal", ["si", "sí", "s"]]
  ];
}

function exprTieneNo(fieldName) {
  return [
    "in",
    exprRaw(fieldName),
    ["literal", ["no", "n"]]
  ];
}

// =====================================================
// ✅ CAMPOS SERVICIOS
// =====================================================
const SP_FIELDS = {
  GAS: "tiene_se_4",
  ACUEDUCTO: "tiene_serv",
  ALC: "tiene_se_1",
  INTERNET: "tiene_se_3",
  BASURAS: "tiene_se_2",
  ENERGIA: "tiene_luz",
};

// =====================================================
// ✅ GRUPOS SERVICIOS
// =====================================================
const SERVICIOS_FILTER_GROUPS = [
  {
    id: "L_GAS_SI",
    label: "Gas: Sí",
    field: SP_FIELDS.GAS,
    expr: () => exprTieneSi(SP_FIELDS.GAS),
    color: "#00bcd4",
  },
  {
    id: "L_GAS_NO",
    label: "Gas: No",
    field: SP_FIELDS.GAS,
    expr: () => exprTieneNo(SP_FIELDS.GAS),
    color: "#ff4d6d",
  },
  {
    id: "L_ACUEDUCTO_SI",
    label: "Acueducto: Sí",
    field: SP_FIELDS.ACUEDUCTO,
    expr: () => exprTieneSi(SP_FIELDS.ACUEDUCTO),
    color: "#7c3aed",
  },
  {
    id: "L_ACUEDUCTO_NO",
    label: "Acueducto: No",
    field: SP_FIELDS.ACUEDUCTO,
    expr: () => exprTieneNo(SP_FIELDS.ACUEDUCTO),
    color: "#f59e0b",
  },
  {
    id: "L_ALC_SI",
    label: "Alcantarillado: Sí",
    field: SP_FIELDS.ALC,
    expr: () => exprTieneSi(SP_FIELDS.ALC),
    color: "#22c55e",
  },
  {
    id: "L_ALC_NO",
    label: "Alcantarillado: No",
    field: SP_FIELDS.ALC,
    expr: () => exprTieneNo(SP_FIELDS.ALC),
    color: "#ef4444",
  },
  {
    id: "L_INTERNET_SI",
    label: "Internet: Sí",
    field: SP_FIELDS.INTERNET,
    expr: () => exprTieneSi(SP_FIELDS.INTERNET),
    color: "#3b82f6",
  },
  {
    id: "L_INTERNET_NO",
    label: "Internet: No",
    field: SP_FIELDS.INTERNET,
    expr: () => exprTieneNo(SP_FIELDS.INTERNET),
    color: "#a3a3a3",
  },
  {
    id: "L_BASURAS_SI",
    label: "Basuras: Sí",
    field: SP_FIELDS.BASURAS,
    expr: () => exprTieneSi(SP_FIELDS.BASURAS),
    color: "#e879f9",
  },
  {
    id: "L_BASURAS_NO",
    label: "Basuras: No",
    field: SP_FIELDS.BASURAS,
    expr: () => exprTieneNo(SP_FIELDS.BASURAS),
    color: "#f97316",
  },
  {
    id: "L_ENERGIA_SI",
    label: "Energía: Sí",
    field: SP_FIELDS.ENERGIA,
    expr: () => exprTieneSi(SP_FIELDS.ENERGIA),
    color: "#facc15",
  },
  {
    id: "L_ENERGIA_NO",
    label: "Energía: No",
    field: SP_FIELDS.ENERGIA,
    expr: () => exprTieneNo(SP_FIELDS.ENERGIA),
    color: "#ef4444",
  },
];

const ALL_FILTER_GROUPS = [...SERVICIOS_FILTER_GROUPS];

const ALUMBRADO_LAYER_ID = "L_ALUMBRADO";
const ALUMBRADO_COLOR = "#38bdf8";

// =====================================================
// ✅ SINCRONIZAR COLORES DEL PANEL
// =====================================================
function syncPanelAccentsFromJS() {
  const list = document.getElementById("spToggleList");
  if (!list) return;

  ALL_FILTER_GROUPS.forEach((g) => {
    const row = list.querySelector(`.sp-row[data-layer="${g.id}"]`);
    if (!row) return;
    row.style.setProperty("--sp-accent", g.color);
  });

  const rowAll = list.querySelector(`.sp-row[data-layer="L_ALL"]`);
  if (rowAll) rowAll.style.setProperty("--sp-accent", "#00bcd4");

  const rowAlumbrado = list.querySelector(`.sp-row[data-layer="${ALUMBRADO_LAYER_ID}"]`);
  if (rowAlumbrado) rowAlumbrado.style.setProperty("--sp-accent", ALUMBRADO_COLOR);
}

// =====================================================
// ✅ CAPAS DE SERVICIOS
// =====================================================
function ensureServiciosFilterLayers() {
  const sourceId = "servicios_publicos";
  const baseId = "L_BASE";

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

  for (const g of SERVICIOS_FILTER_GROUPS) {
    const newFilter = g.expr();

    if (map.getLayer(g.id)) {
      map.setFilter(g.id, newFilter);
      map.setPaintProperty(g.id, "circle-color", g.color);
      continue;
    }

    map.addLayer({
      id: g.id,
      type: "circle",
      source: sourceId,
      layout: { visibility: "none" },
      filter: newFilter,
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
// ✅ INTERACCIÓN SERVICIOS
// =====================================================
function wireServiciosLayerInteractions() {
  const all = ["L_BASE", ...SERVICIOS_FILTER_GROUPS.map((g) => g.id)];

  for (const lid of all) {
    safeOff("mouseenter", lid);
    safeOff("mouseleave", lid);
    safeOff("click", lid);
  }

  function attach(lid) {
    map.on("mouseenter", lid, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", lid, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", lid, (e) => {
      const f = e.features && e.features[0];
      if (!f) return;

      const lngLat = getPointLngLat(f);

      popup
        .setLngLat(lngLat)
        .setHTML(popupHTMLServicios(f.properties || {}, lngLat))
        .addTo(map);

      const hs = map.getSource("highlight");
      if (hs) {
        hs.setData({
          type: "FeatureCollection",
          features: [f],
        });
      }
    });
  }

  all.forEach(attach);
}

// =====================================================
// ✅ SWITCHES MULTISELECT + ALUMBRADO
// =====================================================
function wireServiciosToggleList() {
  const list = document.getElementById("spToggleList");
  if (!list) return;

  syncPanelAccentsFromJS();

  const rowAll = list.querySelector(`.sp-row[data-layer="L_ALL"]`);
  const rowAlumbrado = list.querySelector(`.sp-row[data-layer="${ALUMBRADO_LAYER_ID}"]`);

  const groupRows = Array.from(list.querySelectorAll(`.sp-row[data-layer]`))
    .filter((r) =>
      r.dataset.layer &&
      r.dataset.layer !== "L_ALL" &&
      r.dataset.layer !== ALUMBRADO_LAYER_ID
    );

  function getActiveGroups() {
    return groupRows
      .filter((r) => r.classList.contains("is-active"))
      .map((r) => r.dataset.layer)
      .filter(Boolean);
  }

  function isAlumbradoActive() {
    return rowAlumbrado && rowAlumbrado.classList.contains("is-active");
  }

  function setLayerVisibility(id, visible) {
    if (!map.getLayer(id)) return;
    map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  }

  function syncMapLayersFromUI() {
    const actives = getActiveGroups();
    const alumbradoActivo = isAlumbradoActive();

    if (!actives.length && !alumbradoActivo) {
      setLayerVisibility("L_BASE", true);
      ALL_FILTER_GROUPS.forEach((g) => setLayerVisibility(g.id, false));
    } else {
      setLayerVisibility("L_BASE", false);
      ALL_FILTER_GROUPS.forEach((g) => {
        setLayerVisibility(g.id, actives.includes(g.id));
      });
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

      if (rowAll) rowAll.classList.add("is-active");

      syncMapLayersFromUI();

      try { popup.remove(); } catch (e) {}

      const hs = map.getSource("highlight");
      if (hs) {
        hs.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    });
  }

  groupRows.forEach((row) => {
    if (row.dataset.wired) return;
    row.dataset.wired = "1";

    row.addEventListener("click", () => {
      row.classList.toggle("is-active");
      syncMapLayersFromUI();

      try { popup.remove(); } catch (e) {}

      const hs = map.getSource("highlight");
      if (hs) {
        hs.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    });
  });

  if (rowAlumbrado && !rowAlumbrado.dataset.wired) {
    rowAlumbrado.dataset.wired = "1";

    rowAlumbrado.addEventListener("click", () => {
      rowAlumbrado.classList.toggle("is-active");
      syncMapLayersFromUI();

      try { popup.remove(); } catch (e) {}

      const hs = map.getSource("highlight");
      if (hs) {
        hs.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    });
  }

  syncMapLayersFromUI();
}

// =====================================================
// ✅ PRIORIDAD DE CLIC SOBRE PUNTOS
// =====================================================
function isServiciosHitAtPoint(point) {
  const layers = [
    "L_BASE",
    ...SERVICIOS_FILTER_GROUPS.map((g) => g.id),
    ALUMBRADO_LAYER_ID,
  ].filter((id) => map.getLayer(id));

  const hits = map.queryRenderedFeatures(point, { layers });
  return hits && hits.length;
}

// =====================================================
// ✅ PREDIOS BASE
// =====================================================
function addPrediosBase() {
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
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
// ✅ SERVICIOS PÚBLICOS
// =====================================================
function addServiciosPublicos() {
  const FILE = "Servicios_publicos_puntos_nuevo.geojson";

  fetch(`../src/data/${FILE}`)
    .then((r) => r.json())
    .then((data) => {
      SERVICIOS_DATA = data;

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

      setTimeout(() => {
        try { wireServiciosToggleList(); } catch (e) {}
      }, 0);

      setTimeout(() => {
        try { wireFilterPanelToggle(); } catch (e) {}
      }, 0);

      try {
        ["L_BASE", ...SERVICIOS_FILTER_GROUPS.map((g) => g.id)].forEach((lid) => {
          if (map.getLayer(lid)) map.moveLayer(lid);
        });

        if (map.getLayer(ALUMBRADO_LAYER_ID)) map.moveLayer(ALUMBRADO_LAYER_ID);

        if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");
      } catch (e) {}
    })
    .catch((err) => console.error("Error cargando servicios públicos:", err));
}

// =====================================================
// ✅ ALUMBRADO PÚBLICO
// =====================================================
function addAlumbradoPublico() {
  const FILE = "alumbrado_publico_con_vereda.geojson";

  fetch(`../src/data/${FILE}`)
    .then((r) => r.json())
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
          layout: {
            visibility: "none",
          },
          paint: {
            "circle-radius": 6,
            "circle-color": ALUMBRADO_COLOR,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
            "circle-opacity": 0.95,
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
        const f = e.features && e.features[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);

        popup
          .setLngLat(lngLat)
          .setHTML(popupHTMLAlumbrado(f.properties || {}, lngLat))
          .addTo(map);

        const hs = map.getSource("highlight");
        if (hs) {
          hs.setData({
            type: "FeatureCollection",
            features: [f],
          });
        }
      });

      syncPanelAccentsFromJS();

      setTimeout(() => {
        try { wireServiciosToggleList(); } catch (e) {}
      }, 0);

      try {
        if (map.getLayer(ALUMBRADO_LAYER_ID)) map.moveLayer(ALUMBRADO_LAYER_ID);
        if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");
      } catch (e) {}
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
// ✅ BUSCADOR LOCAL SERVICIOS + ALUMBRADO
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar predial, propietario, servicio, poste, lámpara, energía...",
  localGeocoder: (q) => {
    const query = norm(q);

    if (!query) return [];

    const results = [];

    // Servicios públicos, incluyendo energía porque está en la misma capa
    if (SERVICIOS_DATA && Array.isArray(SERVICIOS_DATA.features)) {
      for (const feature of SERVICIOS_DATA.features) {
        const p = feature.properties || {};

        const big = norm(Object.values(p).join(" "));
        const ok = big.includes(query);

        if (!ok) continue;

        const center = getPointLngLat(feature);
        const placeName = `${p["n_mero_pre"] ?? "N/A"} | ${p["nombre_del"] ?? "N/A"} | Energía: ${p["tiene_luz"] ?? "N/A"}`;

        results.push({
          type: "Feature",
          geometry: feature.geometry,
          center,
          place_name: `Servicios públicos | ${placeName}`,
          text: (p["n_mero_pre"] ?? p["nombre_del"] ?? "Resultado").toString(),
          properties: {
            ...p,
            __tipo_busqueda: "servicios",
          },
          place_type: ["place"],
        });

        if (results.length >= 10) break;
      }
    }

    // Alumbrado público
    if (ALUMBRADO_DATA && Array.isArray(ALUMBRADO_DATA.features) && results.length < 10) {
      for (const feature of ALUMBRADO_DATA.features) {
        const p = feature.properties || {};

        const big = norm(Object.values(p).join(" "));
        const ok = big.includes(query);

        if (!ok) continue;

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
    popup
      .setLngLat(lngLat)
      .setHTML(popupHTMLAlumbrado(f.properties || {}, lngLat))
      .addTo(map);
  } else {
    popup
      .setLngLat(lngLat)
      .setHTML(popupHTMLServicios(f.properties || {}, lngLat))
      .addTo(map);
  }
});

// =====================================================
// CARGA FINAL
// =====================================================
map.on("style.load", () => {
  addPrediosBase();
  addServiciosPublicos();
  addAlumbradoPublico();
  addHighlight();

  setTimeout(() => {
    try {
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
      if (map.getLayer("predios_base_click")) map.moveLayer("predios_base_click");

      ["L_BASE", ...SERVICIOS_FILTER_GROUPS.map((g) => g.id)].forEach((lid) => {
        if (map.getLayer(lid)) map.moveLayer(lid);
      });

      if (map.getLayer(ALUMBRADO_LAYER_ID)) map.moveLayer(ALUMBRADO_LAYER_ID);

      if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");
    } catch (e) {}
  }, 400);
});
