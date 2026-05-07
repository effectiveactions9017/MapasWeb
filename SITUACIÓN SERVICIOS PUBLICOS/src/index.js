// =====================================================
// ✅ Visor Predial + Servicios + Alumbrado + Energía
// ✅ NUEVO: ENERGIA.geojson
// ✅ Campo: tiene_luz
// =====================================================

mapboxgl.accessToken =
  "TU_TOKEN_MAPBOX";

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
let ENERGIA_DATA = null;

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

function valTxt(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  return v;
}

// =====================================================
// ✅ FILTROS ROBUSTOS
// =====================================================
function exprRaw(fieldName) {
  return ["downcase", ["to-string", ["coalesce", ["get", fieldName], ""]]];
}

function exprTieneSi(fieldName) {
  const v = exprRaw(fieldName);

  return [
    "match",
    v,
    ["si", "sí", "si_", "sí_", "c_si", "c_sí"],
    true,
    false,
  ];
}

function exprTieneNo(fieldName) {
  const v = exprRaw(fieldName);

  return [
    "match",
    v,
    ["no", "no_", "c_no"],
    true,
    false,
  ];
}

// =====================================================
// ✅ CAPAS FILTRO
// =====================================================
const FILTER_GROUPS = [

  // =====================================================
  // ENERGÍA
  // =====================================================

  {
    id: "L_ENERGIA_SI",
    label: "Energía: Sí",
    source: "energia_publica",
    field: "tiene_luz",
    expr: () => exprTieneSi("tiene_luz"),
    color: "#ffe600",
  },

  {
    id: "L_ENERGIA_NO",
    label: "Energía: No",
    source: "energia_publica",
    field: "tiene_luz",
    expr: () => exprTieneNo("tiene_luz"),
    color: "#ff0000",
  },

];

// =====================================================
// ✅ POPUP ENERGÍA
// =====================================================
function popupHTMLEnergia(props, lngLat) {

  props = props || {};

  return `
    <div style="font-weight:700; margin-bottom:6px;">
      Energía eléctrica
    </div>

    <strong>Tiene energía:</strong>
    ${valTxt(props.tiene_luz)}<br>

    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLat)}"
         target="_blank"
         style="
           display:inline-block;
           padding:6px 10px;
           border-radius:6px;
           background:#ffe600;
           color:#000;
           font-weight:700;
           font-size:12px;
           text-decoration:none;
         ">
         📷 Street View
      </a>
    </div>

    <br>
    <a style="font-size:9px;">
      &#9400 EffectiveActions
    </a>
  `;
}

// =====================================================
// ✅ CAPAS ENERGÍA
// =====================================================
function ensureEnergiaLayers() {

  const sourceId = "energia_publica";

  for (const g of FILTER_GROUPS) {

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

      layout: {
        visibility: "none",
      },

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
// ✅ INTERACCIONES ENERGÍA
// =====================================================
function wireEnergiaInteractions() {

  const all = FILTER_GROUPS.map(g => g.id);

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
        .setHTML(
          popupHTMLEnergia(
            f.properties || {},
            lngLat
          )
        )
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
// ✅ CARGAR ENERGÍA
// =====================================================
function addEnergia() {

  const FILE = "ENERGIA.geojson";

  fetch(`../src/data/${FILE}`)
    .then((r) => r.json())

    .then((data) => {

      ENERGIA_DATA = data;

      if (map.getSource("energia_publica")) {

        map.getSource("energia_publica")
          .setData(data);

      } else {

        map.addSource("energia_publica", {
          type: "geojson",
          data,
        });
      }

      ensureEnergiaLayers();

      wireEnergiaInteractions();

      try {

        FILTER_GROUPS.forEach((g) => {

          if (map.getLayer(g.id)) {
            map.moveLayer(g.id);
          }
        });

        if (map.getLayer("highlight_circle")) {
          map.moveLayer("highlight_circle");
        }

      } catch (e) {}
    })

    .catch((err) =>
      console.error(
        "Error cargando energía:",
        err
      )
    );
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
// ✅ BUSCADOR LOCAL
// =====================================================
const geocoder = new MapboxGeocoder({

  accessToken: mapboxgl.accessToken,
  mapboxgl,

  marker: false,

  localGeocoderOnly: true,

  placeholder:
    "Buscar energía, SI, NO...",

  localGeocoder: (q) => {

    const query = norm(q);

    if (!query) return [];

    const results = [];

    if (
      ENERGIA_DATA &&
      Array.isArray(ENERGIA_DATA.features)
    ) {

      for (const feature of ENERGIA_DATA.features) {

        const p = feature.properties || {};

        const vEnergia = norm(p.tiene_luz);

        let ok =
          vEnergia &&
          vEnergia.includes(query);

        if (!ok) continue;

        const center =
          getPointLngLat(feature);

        results.push({

          type: "Feature",

          geometry: feature.geometry,

          center,

          place_name:
            `Energía | ${p.tiene_luz}`,

          text:
            (p.tiene_luz ?? "Energía")
            .toString(),

          properties: {
            ...p,
            __tipo_busqueda:
              "energia",
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

// =====================================================
// RESULTADO BUSCADOR
// =====================================================
geocoder.on("result", (e) => {

  const f = e.result;

  if (!f) return;

  const lngLat =
    f.center ||
    getPointLngLat(f);

  const hs =
    map.getSource("highlight");

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

  popup
    .setLngLat(lngLat)
    .setHTML(
      popupHTMLEnergia(
        f.properties || {},
        lngLat
      )
    )
    .addTo(map);
});

// =====================================================
// CARGA FINAL
// =====================================================
map.on("style.load", () => {

  addHighlight();

  addEnergia();

});
