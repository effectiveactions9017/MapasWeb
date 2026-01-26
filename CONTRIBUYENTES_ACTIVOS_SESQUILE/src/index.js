// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Capa base (SIN interacción): PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326
// ✅ Capas interactivas (CON buscador + popup por clic y por búsqueda):
//    - PREDIOS_CONTRIBUYENTES_NATURAL
//    - PREDIOS_CONTRIBUYENTES_JURIDICOS
// ✅ Búsqueda local por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios vinculados (mismo codigo o NUMERO_DOCUMENTO)
// ✅ Evita errores "source/layer already exists"
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

// ============================
// ✅ Leyenda (si existe un div#legend en tu HTML)
// ============================
function renderLegend() {
  const el = document.getElementById("legend");
  if (!el) return;

  el.innerHTML = `
    <div style="font-weight:700; margin-bottom:8px;">Leyenda</div>

    <div style="display:flex; align-items:center; gap:8px; margin:6px 0;">
      <span style="width:14px; height:14px; background:#3a86ff; display:inline-block; border:1px solid #fff;"></span>
      <span>Predios municipio Sesquilé</span>
    </div>

    <div style="display:flex; align-items:center; gap:8px; margin:6px 0;">
      <span style="width:14px; height:14px; background:#2ec4b6; display:inline-block; border:1px solid #fff;"></span>
      <span>Predios contribuyentes natural</span>
    </div>

    <div style="display:flex; align-items:center; gap:8px; margin:6px 0;">
      <span style="width:14px; height:14px; background:#ff006e; display:inline-block; border:1px solid #fff;"></span>
      <span>Predios contribuyentes jurídicos</span>
    </div>

    <div style="font-size:9px; margin-top:10px;">&#9400 EffectiveActions</div>
  `;
}

// =====================================================
// ✅ Helpers
// =====================================================
function safeOff(eventName, layerId, handlerName) {
  // No tenemos referencia a handlers específicos aquí,
  // así que usamos try-catch para evitar crash.
  try {
    map.off(eventName, layerId);
  } catch (e) {}
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

function norm(v) {
  return (v ?? "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function popupHTMLFromProps(props) {
  const avaluoTxt = formatAvaluo(props["AVALUO 2026"]);
  const areaTxt = formatArea(props["Shape_Area"]);

  return `
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
// ✅ Capa BASE (SIN interacción / SIN popup / SIN buscador)
// =====================================================
function addBaseLayer(geojsonFile, sourceId, layerId, baseColor) {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
      else map.addSource(sourceId, { type: "geojson", data });

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: "fill",
          minzoom: 12,
          paint: {
            "fill-color": baseColor,
            "fill-opacity": 0.35,
            "fill-outline-color": "#ffffff",
          },
        });
      }
    })
    .catch((err) => console.error("Error cargando capa base:", err));
}

// =====================================================
// ✅ Capa INTERACTIVA (clic popup + guarda dataset para buscador)
// =====================================================
function addInteractiveLayer(options) {
  const {
    geojsonFile,
    sourceId,
    layerId,
    baseColor,
    datasetKey, // 'NATURAL' | 'JURIDICOS'
  } = options;

  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      // Guardar dataset completo
      if (datasetKey === "NATURAL") NATURAL_DATA = data;
      if (datasetKey === "JURIDICOS") JURIDICOS_DATA = data;

      // Source seguro
      if (map.getSource(sourceId)) map.getSource(sourceId).setData(data);
      else map.addSource(sourceId, { type: "geojson", data });

      // Layer seguro
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: "fill",
          minzoom: 12,
          paint: {
            // si quieres también diferenciar sin NOMBRE en naranja:
            "fill-color": [
              "case",
              ["==", ["coalesce", ["get", "NOMBRE"], ""], ""],
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

      // Cursor
      map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));

      // ✅ Popup por CLIC
      map.on("click", layerId, (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const props = f.properties || {};
        const center = turf.centroid(f).geometry.coordinates;

        popup
          .setLngLat(center)
          .setHTML(popupHTMLFromProps(props))
          .addTo(map);
      });
    })
    .catch((err) => console.error("Error cargando capa interactiva:", err));
}

// =====================================================
// ✅ Fuente/capas de resaltado (para resultados del buscador)
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
      paint: { "fill-color": "#ffff00", "fill-opacity": 0.30 },
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
// ✅ Geocoder local (busca SOLO en NATURAL + JURIDICOS)
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar contribuyentes (código, nombre o documento)",
  localGeocoder: function (query) {
    const q = (query || "").toString().toLowerCase().trim();
    if (!q) return [];

    const results = [];

    const scan = (fc, datasetTag) => {
      const feats = fc && Array.isArray(fc.features) ? fc.features : [];
      feats.forEach((feature) => {
        const props = feature.properties || {};

        const codigo = (props.codigo ?? "").toString().toLowerCase();
        const nombre = (props.NOMBRE ?? "").toString().toLowerCase();
        const documento = (props.NUMERO_DOCUMENTO ?? "").toString().toLowerCase();

        const match =
          (codigo && codigo.includes(q)) ||
          (nombre && nombre.includes(q)) ||
          (documento && documento.includes(q));

        if (!match) return;

        const centro = turf.centroid(feature).geometry.coordinates;

        // define campo de match
        let matchField = null;
        let matchValue = null;

        if (codigo && codigo.includes(q)) {
          matchField = "codigo";
          matchValue = (props.codigo ?? "").toString().trim();
        } else if (documento && documento.includes(q)) {
          matchField = "NUMERO_DOCUMENTO";
          matchValue = (props.NUMERO_DOCUMENTO ?? "").toString().trim();
        } else if (nombre && nombre.includes(q)) {
          matchField = "NOMBRE";
          matchValue = (props.NOMBRE ?? "").toString().trim();
        }

        const codTxt = (props.codigo ?? "").toString().trim();
        const nomTxt = (props.NOMBRE ?? "").toString().trim();
        const docTxt = (props.NUMERO_DOCUMENTO ?? "").toString().trim();

        const props2 = {
          ...props,
          __dataset: datasetTag,       // 'NATURAL' | 'JURIDICOS'
          __matchField: matchField,
          __matchValue: matchValue,
        };

        results.push({
          type: "Feature",
          geometry: feature.geometry,
          properties: props2,
          place_name: `[${datasetTag}] Código: ${codTxt || "N/A"} | Nombre: ${nomTxt || "N/A"} | Doc: ${docTxt || "N/A"}`,
          text: codTxt || nomTxt || docTxt || "Resultado",
          center: centro,
          place_type: ["place"],
        });
      });
    };

    scan(NATURAL_DATA, "NATURAL");
    scan(JURIDICOS_DATA, "JURIDICOS");

    return results.slice(0, 10);
  },
});

map.addControl(geocoder, "top-left");

// =====================================================
// ✅ Cargar capas al estilo
// =====================================================
map.on("style.load", () => {
  renderLegend();

  // 1) Base (SIN interacción)
  addBaseLayer(
    "PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson",
    "predios_base",
    "predios_base_layer",
    "#3a86ff"
  );

  // 2) Interactivas (CON buscador y popup por clic)
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

  // 3) highlight para resultados del buscador
  ensureHighlightLayers();
});

// =====================================================
// ✅ Al elegir resultado: zoom + resaltar grupo + popup
// =====================================================
geocoder.on("result", (e) => {
  const result = e.result;
  if (!result) return;

  const props = result.properties || {};
  const dataset = props.__dataset; // 'NATURAL' | 'JURIDICOS'
  const matchField = props.__matchField; // 'codigo' | 'NUMERO_DOCUMENTO' | 'NOMBRE'
  const matchValue = (props.__matchValue ?? "").toString().trim();

  const sourceFC =
    dataset === "NATURAL" ? NATURAL_DATA :
    dataset === "JURIDICOS" ? JURIDICOS_DATA :
    null;

  const feats = sourceFC && Array.isArray(sourceFC.features) ? sourceFC.features : [];

  let toHighlight = [];

  // Agrupar por codigo o NUMERO_DOCUMENTO (como pediste)
  if ((matchField === "codigo" || matchField === "NUMERO_DOCUMENTO") && matchValue) {
    const mv = norm(matchValue);
    toHighlight = feats.filter((f) => {
      const p = f.properties || {};
      const v = matchField === "codigo" ? p.codigo : p.NUMERO_DOCUMENTO;
      return norm(v) === mv;
    });
  }

  // Si la búsqueda fue por nombre o no encontró grupo -> resalta solo el seleccionado
  if (!toHighlight.length) toHighlight = [result];

  // Pintar resaltado
  const fc = { type: "FeatureCollection", features: toHighlight };
  const hlSource = map.getSource("predios_highlight");
  if (hlSource) hlSource.setData(fc);

  // Zoom al conjunto
  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  // Popup al centro del resultado
  const center = result.center || turf.centroid(result).geometry.coordinates;

  // lista de códigos (opcional)
  const codigos = toHighlight
    .map((f) => (f.properties?.codigo ?? "").toString().trim())
    .filter(Boolean);

  const listaCodigos = codigos.length
    ? `<br><strong>Predios vinculados (${codigos.length}):</strong><br>${codigos.slice(0, 10).join("<br>")}${codigos.length > 10 ? "<br>…" : ""}`
    : "";

  popup
    .setLngLat(center)
    .setHTML(popupHTMLFromProps(props) + listaCodigos)
    .addTo(map);
});
