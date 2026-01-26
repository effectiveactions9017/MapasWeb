// =====================================================
// ✅ Visor Predial + Servicios Públicos – Sesquilé
// =====================================================
// 🔵 Predios municipio: polígono (CONTORNO + POPUP al clic)
// 🟠 Servicios públicos: puntos (POPUP + Street View + BUSCADOR)
// 🟡 Highlight: punto seleccionado (por buscador y clic)
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

function popupHTMLCampos(props, campos, titulo) {
  props = props || {};
  const rows = campos.map((k) => {
    let v = props[k];
    if (v === null || v === undefined || v === "") v = "N/A";
    return `<strong>${k}:</strong> ${v}`;
  }).join("<br>");

  return `
    <div style="font-weight:700; margin-bottom:6px;">${titulo}</div>
    ${rows}
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;
}

// =====================================================
// ✅ POPUP SERVICIOS: SOLO ESTOS CAMPOS (los definitivos)
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
  const base = popupHTMLCampos(props, CAMPOS_SERVICIOS, "Situación de servicios públicos");

  // Botón Street View (igual que lo veníamos manejando)
  const btn = `
    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLat)}" target="_blank"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    </div>
  `;

  // Insertamos el botón antes del ©
  return base.replace(
    `<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`,
    `${btn}<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`
  );
}

// =====================================================
// ✅ CAPA PREDIOS (CONTORNO + POPUP al clic)
// =====================================================
const CAMPOS_PREDIOS = ["codigo", "NOMBRE", "DESTINO_ECONOMICO"];

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

      // Popup por clic en predio (como “venía antes”)
      safeOff("click", "predios_base_outline");

      map.on("click", "predios_base_outline", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const center = turf.centroid(f).geometry.coordinates;

        popup
          .setLngLat(center)
          .setHTML(popupHTMLCampos(f.properties || {}, CAMPOS_PREDIOS, "Predios municipio de Sesquilé"))
          .addTo(map);
      });
    })
    .catch((err) => console.error("Error cargando predios base:", err));
}

// =====================================================
// ✅ CAPA SERVICIOS (PUNTOS + POPUP + Street View)
// =====================================================
function addServiciosPublicos() {
  // Asegúrate que el archivo exista EXACTO en src/data/
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

      map.on("mouseenter", "servicios_publicos_layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "servicios_publicos_layer", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "servicios_publicos_layer", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);

        // Popup servicios + Street View
        popup
          .setLngLat(lngLat)
          .setHTML(popupHTMLServicios(f.properties || {}, lngLat))
          .addTo(map);

        // Highlight
        const hs = map.getSource("highlight");
        if (hs) hs.setData({ type: "FeatureCollection", features: [f] });
      });
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
// ✅ BUSCADOR LOCAL (igual estilo que veníamos)
// Busca en SERVICIOS por varios campos, y fallback a todo
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

      // Campos clave
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

      // Fallback a todo
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

// =====================================================
// ✅ Resultado del buscador: zoom + highlight + popup + Street View
// =====================================================
geocoder.on("result", (e) => {
  const f = e.result;
  if (!f) return;

  const lngLat = f.center || getPointLngLat(f);

  // highlight
  const hs = map.getSource("highlight");
  if (hs) hs.setData({ type: "FeatureCollection", features: [f] });

  // zoom
  map.flyTo({ center: lngLat, zoom: 18 });

  // popup servicios + Street View
  popup
    .setLngLat(lngLat)
    .setHTML(popupHTMLServicios(f.properties || {}, lngLat))
    .addTo(map);
});

// =====================================================
// CARGA FINAL (orden correcto)
// =====================================================
map.on("style.load", () => {
  addPrediosBase();        // abajo (contorno)
  addServiciosPublicos();  // arriba (puntos)
  addHighlight();          // arriba de todo

  // Blindaje de orden (por si demora el fetch)
  setTimeout(() => {
    try {
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");
      if (map.getLayer("servicios_publicos_layer")) map.moveLayer("servicios_publicos_layer");
      if (map.getLayer("highlight_circle")) map.moveLayer("highlight_circle");
    } catch (e) {}
  }, 350);
});
