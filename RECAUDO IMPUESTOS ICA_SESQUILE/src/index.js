// =====================================================
// ✅ Visor Predial + Recaudo impuesto ICA – Sesquilé
// ✅ + Contribuyentes Persona Jurídica (puntos)
// ✅ + ICA muestra FOTO (campo FOTOS) en el popup
// ❌ (ELIMINADO) Predios Contribuyentes Jurídicos (polígono)
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
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

// =====================================================
// DATASETS COMPLETOS PARA BUSCADOR
// =====================================================
let PREDIOS_DATA = null; // (solo visual)
let ICA_DATA = null;
let CONTRIB_JURIDICA_DATA = null;

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

// =====================================================
// ✅ HELPERS FOTO ICA (QField attachments)
// =====================================================
function sanitizePhotoRelPath(p) {
  let s = (p ?? "").toString().trim();
  if (!s) return "";
  s = s.replace(/\\/g, "/");
  s = s.replace(/^\/+/, "");
  s = s.replace(/\.\.\//g, "");
  return s;
}

function buildIcaPhotoUrl(props) {
  const rel = sanitizePhotoRelPath(props?.FOTOS ?? props?.fotos ?? props?.Foto ?? props?.FOTO ?? "");
  if (!rel) return "";
  return `../src/data/fotos_ica/${rel}`;
}

// =====================================================
// POPUP ICA (imagenes_limpias) ✅ + FOTO
// =====================================================
function popupHTMLICA(props, lngLat) {
  props = props || {};
  const texto = props.texto ?? props.TEXTO ?? props.nombre ?? props.NOMBRE ?? "N/A";

  const fotoUrl = buildIcaPhotoUrl(props);

  const fotoHTML = fotoUrl
    ? `
      <div style="margin-top:10px;">
        <img src="${fotoUrl}" alt="Foto"
             style="width:100%; max-width:320px; border-radius:10px; display:block;"
             loading="lazy"
             onerror="this.style.display='none';" />
      </div>
    `
    : "";

  return `
    <div style="font-weight:700; margin-bottom:6px;">Unidades Productivas Identificadas</div>
    <strong>Texto:</strong> ${texto}<br>
    ${fotoHTML}

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
// ✅ POPUP CONTRIBUYENTES PERSONA JURÍDICA (puntos)
// =====================================================
function popupHTMLContribJuridica(props, lngLat) {
  props = props || {};

  const codigoPredial =
    props["Código predial"] ??
    props["CODIGO_PREDIAL"] ??
    props["codigo_predial"] ??
    props["codigo"] ??
    "N/A";

  const numDoc =
    props["Número documento"] ??
    props["NUMERO_DOCUMENTO"] ??
    props["No Documento"] ??
    props["NO_DOCUMENTO"] ??
    "N/A";

  const contribuyente =
    props["Contribuyente"] ??
    props["NOMBRE"] ??
    props["Nombre"] ??
    props["RAZON_SOCIAL"] ??
    "N/A";

  const naturaleza =
    props["Naturaleza jurídica"] ??
    props["NATURALEZA_JURIDICA"] ??
    props["Naturaleza Juridica"] ??
    "N/A";

  const razonSocial =
    props["Razón social"] ??
    props["RAZON_SOCIAL"] ??
    props["Razon Social"] ??
    "N/A";

  const estado = props["Estado"] ?? props["ESTADO"] ?? "N/A";

  return `
    <div style="font-weight:700; margin-bottom:6px;">Contribuyentes persona jurídica</div>
    <strong>Código predial:</strong> ${codigoPredial}<br>
    <strong>Número documento:</strong> ${numDoc}<br>
    <strong>Contribuyente:</strong> ${contribuyente}<br>
    <strong>Naturaleza jurídica:</strong> ${naturaleza}<br>
    <strong>Razón social:</strong> ${razonSocial}<br>
    <strong>Estado:</strong> ${estado}<br>

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
// CAPA PREDIOS BASE (SOLO VISUAL)
// =====================================================
function addPrediosBase() {
  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then((r) => r.json())
    .then((data) => {
      PREDIOS_DATA = data;

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
    })
    .catch((err) => console.error("Error cargando predios:", err));
}

// =====================================================
// CAPA ICA (imagenes_limpias) — ✅ VERDE
// =====================================================
function addICALayer() {
  fetch("../src/data/imagenes_limpias.geojson")
    .then((r) => r.json())
    .then((data) => {
      ICA_DATA = data;

      if (map.getSource("ica_points")) map.getSource("ica_points").setData(data);
      else map.addSource("ica_points", { type: "geojson", data });

      if (!map.getLayer("ica_points_layer")) {
        map.addLayer({
          id: "ica_points_layer",
          type: "circle",
          source: "ica_points",
          paint: {
            "circle-radius": 6,
            "circle-color": "#00c853",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });
      }

      if (!map.getSource("highlight_ica")) {
        map.addSource("highlight_ica", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getLayer("highlight_ica_circle")) {
        map.addLayer({
          id: "highlight_ica_circle",
          type: "circle",
          source: "highlight_ica",
          paint: {
            "circle-radius": 11,
            "circle-color": "#ffff00",
            "circle-opacity": 0.35,
            "circle-stroke-width": 4,
            "circle-stroke-color": "#ffff00",
          },
        });
      }

      safeOff("mouseenter", "ica_points_layer");
      safeOff("mouseleave", "ica_points_layer");
      safeOff("click", "ica_points_layer");

      map.on("mouseenter", "ica_points_layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "ica_points_layer", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "ica_points_layer", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);

        const hs = map.getSource("highlight_ica");
        if (hs) hs.setData({ type: "FeatureCollection", features: [f] });

        popup.setLngLat(lngLat).setHTML(popupHTMLICA(f.properties || {}, lngLat)).addTo(map);
      });
    })
    .catch((err) => console.error("Error cargando ICA:", err));
}

// =====================================================
// ✅ CONTRIBUYENTES PERSONA JURÍDICA (PUNTOS) — ✅ FUCSIA
// =====================================================
function addContribJuridicaLayer() {
  fetch("../src/data/Contribuyentes_Persona_Juridica.geojson")
    .then((r) => r.json())
    .then((data) => {
      CONTRIB_JURIDICA_DATA = data;

      if (map.getSource("contrib_juridica")) map.getSource("contrib_juridica").setData(data);
      else map.addSource("contrib_juridica", { type: "geojson", data });

      if (!map.getLayer("contrib_juridica_layer")) {
        map.addLayer({
          id: "contrib_juridica_layer",
          type: "circle",
          source: "contrib_juridica",
          paint: {
            "circle-radius": 6,
            "circle-color": "#ff00ff",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });
      }

      if (!map.getSource("highlight_contrib_juridica")) {
        map.addSource("highlight_contrib_juridica", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getLayer("highlight_contrib_juridica_circle")) {
        map.addLayer({
          id: "highlight_contrib_juridica_circle",
          type: "circle",
          source: "highlight_contrib_juridica",
          paint: {
            "circle-radius": 11,
            "circle-color": "#ffff00",
            "circle-opacity": 0.35,
            "circle-stroke-width": 4,
            "circle-stroke-color": "#ffff00",
          },
        });
      }

      safeOff("mouseenter", "contrib_juridica_layer");
      safeOff("mouseleave", "contrib_juridica_layer");
      safeOff("click", "contrib_juridica_layer");

      map.on("mouseenter", "contrib_juridica_layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "contrib_juridica_layer", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "contrib_juridica_layer", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);

        const hs = map.getSource("highlight_contrib_juridica");
        if (hs) hs.setData({ type: "FeatureCollection", features: [f] });

        popup.setLngLat(lngLat).setHTML(popupHTMLContribJuridica(f.properties || {}, lngLat)).addTo(map);
      });
    })
    .catch((err) => console.error("Error cargando contribuyentes jurídicos:", err));
}

// =====================================================
// BUSCADOR LOCAL (ICA + CONTRIBUYENTE JURÍDICO PUNTOS) — ❌ sin polígonos
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar ICA / contribuyente jurídico",
  localGeocoder: (q) => {
    const query = norm(q);
    if (!query) return [];

    const results = [];

    // --- ICA ---
    if (ICA_DATA && Array.isArray(ICA_DATA.features)) {
      for (const f of ICA_DATA.features) {
        const p = f.properties || {};
        const txt = norm(p.texto ?? p.TEXTO ?? p.nombre ?? p.NOMBRE);
        if (txt && txt.includes(query)) {
          const center = getPointLngLat(f);
          results.push({
            type: "Feature",
            geometry: f.geometry,
            center,
            properties: { ...p, __tipo: "ICA" },
            place_name: `ICA: ${(p.texto ?? p.TEXTO ?? p.nombre ?? p.NOMBRE ?? "N/A").toString()}`,
            text: (p.texto ?? p.TEXTO ?? p.nombre ?? p.NOMBRE ?? "ICA").toString(),
            place_type: ["place"],
          });
          if (results.length >= 10) break;
        }
      }
    }

    // --- CONTRIBUYENTES PERSONA JURÍDICA (puntos) ---
    if (CONTRIB_JURIDICA_DATA && Array.isArray(CONTRIB_JURIDICA_DATA.features) && results.length < 10) {
      for (const f of CONTRIB_JURIDICA_DATA.features) {
        const p = f.properties || {};

        const cod = norm(p["Código predial"] ?? p.CODIGO_PREDIAL ?? p.codigo_predial ?? p.codigo);
        const doc = norm(p["Número documento"] ?? p.NUMERO_DOCUMENTO ?? p["No Documento"] ?? p.NO_DOCUMENTO);
        const razon = norm(p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Razon Social"]);
        const contrib = norm(p["Contribuyente"] ?? p.NOMBRE ?? p.Nombre ?? p.RAZON_SOCIAL);

        const ok =
          (cod && cod.includes(query)) ||
          (doc && doc.includes(query)) ||
          (razon && razon.includes(query)) ||
          (contrib && contrib.includes(query));

        if (!ok) continue;

        const center = getPointLngLat(f);

        results.push({
          type: "Feature",
          geometry: f.geometry,
          center,
          properties: { ...p, __tipo: "CONTRIB_JURIDICA" },
          place_name: `Jurídico: ${(p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Contribuyente"] ?? "N/A").toString()}`,
          text: (p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Contribuyente"] ?? "Jurídico").toString(),
          place_type: ["place"],
        });

        if (results.length >= 10) break;
      }
    }

    return results;
  },
});

map.addControl(geocoder, "top-left");

// Resultado del buscador
geocoder.on("result", (e) => {
  const r = e.result;
  if (!r) return;

  const tipo = r.properties?.__tipo;

  if (tipo === "ICA") {
    const lngLat = r.center || getPointLngLat(r);

    const hs = map.getSource("highlight_ica");
    if (hs) hs.setData({ type: "FeatureCollection", features: [r] });

    map.flyTo({ center: lngLat, zoom: 18 });

    popup.setLngLat(lngLat).setHTML(popupHTMLICA(r.properties || {}, lngLat)).addTo(map);
    return;
  }

  if (tipo === "CONTRIB_JURIDICA") {
    const lngLat = r.center || getPointLngLat(r);

    const hs = map.getSource("highlight_contrib_juridica");
    if (hs) hs.setData({ type: "FeatureCollection", features: [r] });

    map.flyTo({ center: lngLat, zoom: 18 });

    popup.setLngLat(lngLat).setHTML(popupHTMLContribJuridica(r.properties || {}, lngLat)).addTo(map);
    return;
  }
});

// =====================================================
// CARGA FINAL (orden)
// =====================================================
map.on("style.load", () => {
  addPrediosBase();
  addICALayer();
  addContribJuridicaLayer();

  setTimeout(() => {
    try {
      // base visual abajo
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");

      // puntos arriba
      if (map.getLayer("ica_points_layer")) map.moveLayer("ica_points_layer");
      if (map.getLayer("contrib_juridica_layer")) map.moveLayer("contrib_juridica_layer");

      // highlights arriba
      if (map.getLayer("highlight_ica_circle")) map.moveLayer("highlight_ica_circle");
      if (map.getLayer("highlight_contrib_juridica_circle")) map.moveLayer("highlight_contrib_juridica_circle");
    } catch (e) {}
  }, 450);
});
