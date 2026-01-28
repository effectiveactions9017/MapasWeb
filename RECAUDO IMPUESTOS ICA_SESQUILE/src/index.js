// =====================================================
// ✅ Visor Predial + Recaudo impuesto ICA – Sesquilé
// ✅ + Predios Contribuyentes Jurídicos (polígono)
// ✅ + Contribuyentes Persona Jurídica (puntos)
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
let PREDIOS_DATA = null; // (solo visual, pero lo cargamos por si lo necesitas luego)
let ICA_DATA = null;
let PREDIOS_JURIDICOS_DATA = null;
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
// POPUP ICA (imagenes_limpias)
// =====================================================
function popupHTMLICA(props, lngLat) {
  props = props || {};
  const texto = props.texto ?? props.TEXTO ?? props.nombre ?? props.NOMBRE ?? "N/A";

  return `
    <div style="font-weight:700; margin-bottom:6px;">Recaudo impuesto ICA</div>
    <strong>Texto:</strong> ${texto}<br>

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
// ✅ POPUP PREDIOS CONTRIBUYENTES JURÍDICOS (polígono)
// =====================================================
function popupHTMLPredioJuridico(props, lngLat) {
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
    <div style="font-weight:700; margin-bottom:6px;">Predios contribuyentes jurídico</div>
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
// ✅ POPUP CONTRIBUYENTES PERSONA JURÍDICA (puntos)
// =====================================================
function popupHTMLContribJuridica(props, lngLat) {
  return popupHTMLPredioJuridico(props, lngLat);
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

      // contorno visible (SOLO VISUAL)
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
            "circle-color": "#00c853", // ✅ VERDE sólido
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });
      }

      // highlight ICA
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
// ✅ PREDIOS CONTRIBUYENTES JURÍDICOS (POLÍGONOS) — ✅ FUCSIA (relleno + contorno)
// =====================================================
function addPrediosJuridicosLayer() {
  fetch("../src/data/PREDIOS_CONTRIBUYENTES_JURIDICOS.geojson")
    .then((r) => r.json())
    .then((data) => {
      PREDIOS_JURIDICOS_DATA = data;

      if (map.getSource("predios_juridicos")) map.getSource("predios_juridicos").setData(data);
      else map.addSource("predios_juridicos", { type: "geojson", data });

      // ✅ relleno fucsia sólido
      if (!map.getLayer("predios_juridicos_fill")) {
        map.addLayer({
          id: "predios_juridicos_fill",
          type: "fill",
          source: "predios_juridicos",
          minzoom: 12,
          paint: {
            "fill-color": "#ff00ff",  // ✅ FUCSIA
            "fill-opacity": 0.35,
          },
        });
      }

      // contorno fucsia
      if (!map.getLayer("predios_juridicos_outline")) {
        map.addLayer({
          id: "predios_juridicos_outline",
          type: "line",
          source: "predios_juridicos",
          minzoom: 12,
          paint: {
            "line-color": "#ff00ff",  // ✅ FUCSIA
            "line-width": 2.0,
            "line-opacity": 0.95,
          },
        });
      }

      // capa invisible para click
      if (!map.getLayer("predios_juridicos_click")) {
        map.addLayer({
          id: "predios_juridicos_click",
          type: "fill",
          source: "predios_juridicos",
          minzoom: 12,
          paint: { "fill-color": "#000", "fill-opacity": 0.001 },
        });
      }

      // highlight jurídico
      if (!map.getSource("highlight_juridico_predio")) {
        map.addSource("highlight_juridico_predio", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getLayer("highlight_juridico_predio_fill")) {
        map.addLayer({
          id: "highlight_juridico_predio_fill",
          type: "fill",
          source: "highlight_juridico_predio",
          paint: { "fill-color": "#ffff00", "fill-opacity": 0.18 },
        });
      }
      if (!map.getLayer("highlight_juridico_predio_line")) {
        map.addLayer({
          id: "highlight_juridico_predio_line",
          type: "line",
          source: "highlight_juridico_predio",
          paint: { "line-color": "#ffff00", "line-width": 5 },
        });
      }

      safeOff("mouseenter", "predios_juridicos_click");
      safeOff("mouseleave", "predios_juridicos_click");
      safeOff("click", "predios_juridicos_click");

      map.on("mouseenter", "predios_juridicos_click", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "predios_juridicos_click", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "predios_juridicos_click", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const center = turf.centroid(f).geometry.coordinates;

        const hs = map.getSource("highlight_juridico_predio");
        if (hs) hs.setData({ type: "FeatureCollection", features: [f] });

        popup.setLngLat(center).setHTML(popupHTMLPredioJuridico(f.properties || {}, center)).addTo(map);
      });
    })
    .catch((err) => console.error("Error cargando predios jurídicos:", err));
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
            "circle-color": "#ff00ff", // ✅ FUCSIA sólido
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });
      }

      // highlight punto
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
// BUSCADOR LOCAL (ICA + JURIDICOS) — ❌ sin predios base
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

    // --- PREDIOS CONTRIBUYENTES JURÍDICOS (polígonos) ---
    if (PREDIOS_JURIDICOS_DATA && Array.isArray(PREDIOS_JURIDICOS_DATA.features) && results.length < 10) {
      for (const f of PREDIOS_JURIDICOS_DATA.features) {
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

        const center = turf.centroid(f).geometry.coordinates;

        results.push({
          type: "Feature",
          geometry: f.geometry,
          center,
          properties: { ...p, __tipo: "PREDIO_JURIDICO" },
          place_name: `Predio Jurídico: ${p["Código predial"] ?? p.CODIGO_PREDIAL ?? "N/A"} | ${p["Razón social"] ?? p.RAZON_SOCIAL ?? "N/A"}`,
          text: (p["Código predial"] ?? p.CODIGO_PREDIAL ?? "Predio Jurídico").toString(),
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

  if (tipo === "PREDIO_JURIDICO") {
    const center = r.center || turf.centroid(r).geometry.coordinates;

    const hs = map.getSource("highlight_juridico_predio");
    if (hs) hs.setData({ type: "FeatureCollection", features: [r] });

    map.fitBounds(turf.bbox(r), { padding: 40 });

    popup.setLngLat(center).setHTML(popupHTMLPredioJuridico(r.properties || {}, center)).addTo(map);
    return;
  }
});

// =====================================================
// CARGA FINAL (orden)
// =====================================================
map.on("style.load", () => {
  addPrediosBase();
  addPrediosJuridicosLayer();
  addICALayer();
  addContribJuridicaLayer();

  setTimeout(() => {
    try {
      // base visual abajo
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");

      // jurídicos: fill debajo del outline
      if (map.getLayer("predios_juridicos_fill")) map.moveLayer("predios_juridicos_fill");
      if (map.getLayer("predios_juridicos_outline")) map.moveLayer("predios_juridicos_outline");
      if (map.getLayer("predios_juridicos_click")) map.moveLayer("predios_juridicos_click");

      // puntos arriba
      if (map.getLayer("ica_points_layer")) map.moveLayer("ica_points_layer");
      if (map.getLayer("contrib_juridica_layer")) map.moveLayer("contrib_juridica_layer");

      // highlights arriba
      if (map.getLayer("highlight_juridico_predio_fill")) map.moveLayer("highlight_juridico_predio_fill");
      if (map.getLayer("highlight_juridico_predio_line")) map.moveLayer("highlight_juridico_predio_line");
      if (map.getLayer("highlight_ica_circle")) map.moveLayer("highlight_ica_circle");
      if (map.getLayer("highlight_contrib_juridica_circle")) map.moveLayer("highlight_contrib_juridica_circle");
    } catch (e) {}
  }, 450);
});
