// =====================================================
// ✅ Visor Predial + Recaudo impuesto ICA – Sesquilé
// ✅ + Contribuyentes Activos (Jurídica + Natural) (puntos) ✅ MISMO COLOR + MISMO NOMBRE
// ✅ + Fachadas con letreros encontradas (puntos)           ✅ NUEVO (antes: construcciones que coinciden)
// ✅ + Posibilidades de recaudo del ICA (puntos)            ✅ NUEVO NOMBRE (antes: unidades productivas identificadas)
// ✅ + ICA muestra FOTO (campo FOTOS) en el popup
// ✅ Popup organizado + Foto ampliable (clic)
// ✅ Popup siempre visible (SMART pan automático, no se recorta)
// ✅ FIX: ICA ya NO se ve tan oscuro
// ✅ FIX: Activos ya NO se ven transparentes (tarjeta con fondo)
// ✅ FIX: Código predial ya NO se recorta (wrap inteligente en grid)
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

// ✅ Popup: maxWidth + offset para mejor posicionamiento
const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup",
  maxWidth: "360px",
  offset: 18,
});

// =====================================================
// DATASETS COMPLETOS PARA BUSCADOR
// =====================================================
let PREDIOS_DATA = null; // (solo visual)
let ICA_DATA = null;
let CONTRIB_JURIDICA_DATA = null;
let CONTRIB_NATURAL_DATA = null;
let COINCIDEN_DATA = null;

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
// ✅ Popup visible "SMART": mide el popup y pan automático
// (Evita recortes arriba/abajo/izq/der)
// =====================================================
function ensurePopupVisibleSmart(padding = 14) {
  requestAnimationFrame(() => {
    const el = document.querySelector(".mapboxgl-popup");
    if (!el) return;

    const rect = el.getBoundingClientRect();

    let dx = 0;
    let dy = 0;

    if (rect.top < padding) dy = rect.top - padding;
    if (rect.bottom > window.innerHeight - padding)
      dy = rect.bottom - (window.innerHeight - padding);

    if (rect.left < padding) dx = rect.left - padding;
    if (rect.right > window.innerWidth - padding)
      dx = rect.right - (window.innerWidth - padding);

    if (dx || dy) map.panBy([dx, dy], { duration: 0 });
  });
}

// =====================================================
// ✅ LIGHTBOX para agrandar foto (clic)
// =====================================================
function openLightbox(url) {
  if (!url) return;

  const old = document.getElementById("ea-lightbox");
  if (old) old.remove();

  const lb = document.createElement("div");
  lb.id = "ea-lightbox";
  lb.style.cssText = `
    position:fixed; inset:0; z-index:99999;
    background:rgba(0,0,0,0.78);
    display:flex; align-items:center; justify-content:center;
    padding:18px;
  `;

  lb.innerHTML = `
    <div style="position:relative; max-width:92vw; max-height:92vh;">
      <button id="ea-lb-close" aria-label="Cerrar"
        style="position:absolute; top:-12px; right:-12px;
               width:36px; height:36px; border:0; cursor:pointer;
               border-radius:999px; font-weight:900;
               background:#00bcd4; color:#000;">
        ✕
      </button>
      <img src="${url}" alt="Foto ampliada"
           style="max-width:92vw; max-height:92vh; border-radius:14px; display:block; object-fit:contain;" />
    </div>
  `;

  lb.addEventListener("click", (e) => {
    if (e.target === lb) lb.remove();
  });

  lb.querySelector("#ea-lb-close").addEventListener("click", () => lb.remove());

  document.addEventListener(
    "keydown",
    (ev) => {
      if (ev.key === "Escape") {
        const x = document.getElementById("ea-lightbox");
        if (x) x.remove();
      }
    },
    { once: true }
  );

  document.body.appendChild(lb);
}

// ✅ IMPORTANTE: para que el onclick="" funcione siempre
window.openLightbox = openLightbox;
window.ensurePopupVisibleSmart = ensurePopupVisibleSmart;

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
  const rel = sanitizePhotoRelPath(
    props?.FOTOS ?? props?.fotos ?? props?.Foto ?? props?.FOTO ?? ""
  );
  if (!rel) return "";
  return `../src/data/fotos_ica/${rel}`;
}

// =====================================================
// POPUP ICA (imagenes_limpias) ✅ ORGANIZADO + FOTO AMPLIABLE
// ✅ CAMBIO NOMBRE: "Posibilidades de recaudo del ICA"
// =====================================================
function popupHTMLICA(props, lngLat) {
  props = props || {};

  const nombre = (props.NOMBRE ?? "N/A").toString().trim() || "N/A";
  const codigo = (props.codigo ?? "N/A").toString().trim() || "N/A";

  const fotoUrl = buildIcaPhotoUrl(props);

  const fotoHTML = `
    <div style="
      margin-top:10px;
      border-radius:14px;
      overflow:hidden;
      border:1px solid rgba(255,255,255,0.12);
      background:rgba(255,255,255,0.06);
    ">
      ${
        fotoUrl
          ? `<img
               src="${fotoUrl}"
               alt="Foto del establecimiento"
               loading="lazy"
               style="width:100%; height:320px; object-fit:cover; display:block; cursor:zoom-in;"
               onclick="openLightbox('${fotoUrl}')"
               onload="ensurePopupVisibleSmart()"
               onerror="this.outerHTML='<div style=&quot;height:320px;display:flex;align-items:center;justify-content:center;opacity:.75;font-size:12px;padding:12px;text-align:center;&quot;>Sin foto disponible</div>';"
             />`
          : `<div style="height:320px;display:flex;align-items:center;justify-content:center;opacity:.75;font-size:12px;padding:12px;text-align:center;">
               Sin foto disponible
             </div>`
      }
    </div>
  `;

  return `
    <div style="
      width: 340px;
      max-width: 340px;
      padding: 12px;
      box-sizing: border-box;
      border-radius: 14px;
      background: rgba(0,0,0,0.45);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(6px);
      color:#fff;
    ">
      <div style="font-weight:800; font-size:14px; margin-bottom:8px;">
        Posibilidades de recaudo del ICA
      </div>

      <div style="
        display:grid;
        grid-template-columns: 120px 1fr;
        gap: 6px 10px;
        font-size:12px;
        line-height:1.25;
        min-width:0;
      ">
        <div style="opacity:.75; font-weight:700;">Nombre</div>
        <div style="font-weight:700; min-width:0;">${nombre}</div>

        <div style="opacity:.75; font-weight:700;">Código predial</div>
        <div style="min-width:0; overflow-wrap:anywhere; word-break:break-word;">
          ${codigo}
        </div>
      </div>

      ${fotoHTML}

      <div style="margin-top:10px;">
        <a href="${streetViewUrl(lngLat)}" target="_blank"
           style="display:inline-block; padding:6px 10px; border-radius:6px;
                  background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
          📷 Street View
        </a>
      </div>

      <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
    </div>
  `;
}

// =====================================================
// ✅ POPUP "Fachadas con letreros encontradas" (antes: construcciones que coinciden)
// (mismos atributos/foto que ICA)
// =====================================================
function popupHTMLCoinciden(props, lngLat) {
  props = props || {};

  const nombre = (props.NOMBRE ?? "N/A").toString().trim() || "N/A";
  const codigo = (props.codigo ?? "N/A").toString().trim() || "N/A";
  const fotoUrl = buildIcaPhotoUrl(props);

  const fotoHTML = `
    <div style="
      margin-top:10px;
      border-radius:14px;
      overflow:hidden;
      border:1px solid rgba(255,255,255,0.12);
      background:rgba(255,255,255,0.06);
    ">
      ${
        fotoUrl
          ? `<img
               src="${fotoUrl}"
               alt="Foto"
               loading="lazy"
               style="width:100%; height:320px; object-fit:cover; display:block; cursor:zoom-in;"
               onclick="openLightbox('${fotoUrl}')"
               onload="ensurePopupVisibleSmart()"
               onerror="this.outerHTML='<div style=&quot;height:320px;display:flex;align-items:center;justify-content:center;opacity:.75;font-size:12px;padding:12px;text-align:center;&quot;>Sin foto disponible</div>';"
             />`
          : `<div style="height:320px;display:flex;align-items:center;justify-content:center;opacity:.75;font-size:12px;padding:12px;text-align:center;">
               Sin foto disponible
             </div>`
      }
    </div>
  `;

  return `
    <div style="
      width: 340px;
      max-width: 340px;
      padding: 12px;
      box-sizing: border-box;
      border-radius: 14px;
      background: rgba(0,0,0,0.45);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(6px);
      color:#fff;
    ">
      <div style="font-weight:800; font-size:14px; margin-bottom:8px;">
        Fachadas con letreros encontradas
      </div>

      <div style="
        display:grid;
        grid-template-columns: 120px 1fr;
        gap: 6px 10px;
        font-size:12px;
        line-height:1.25;
        min-width:0;
      ">
        <div style="opacity:.75; font-weight:700;">Nombre</div>
        <div style="font-weight:700; min-width:0;">${nombre}</div>

        <div style="opacity:.75; font-weight:700;">Código predial</div>
        <div style="min-width:0; overflow-wrap:anywhere; word-break:break-word;">
          ${codigo}
        </div>
      </div>

      ${fotoHTML}

      <div style="margin-top:10px;">
        <a href="${streetViewUrl(lngLat)}" target="_blank"
           style="display:inline-block; padding:6px 10px; border-radius:6px;
                  background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
          📷 Street View
        </a>
      </div>

      <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
    </div>
  `;
}

// =====================================================
// ✅ POPUP CONTRIBUYENTES ACTIVOS (Jurídica + Natural)
// ✅ MISMO TITULO: "Contribuyentes activos"
// =====================================================
function popupHTMLContribActivos(props, lngLat) {
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

  const wrap = (v) =>
    `<div style="min-width:0; overflow-wrap:anywhere; word-break:break-word;">${(v ?? "N/A").toString()}</div>`;

  return `
    <div style="
      width: 340px;
      max-width: 340px;
      padding: 12px;
      box-sizing: border-box;
      border-radius: 14px;
      background: rgba(0,0,0,0.45);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(6px);
      color:#fff;
    ">
      <div style="font-weight:800; font-size:14px; margin-bottom:8px;">
        Contribuyentes activos
      </div>

      <div style="
        display:grid;
        grid-template-columns: 120px 1fr;
        gap: 6px 10px;
        font-size:12px;
        line-height:1.25;
        min-width:0;
      ">
        <div style="opacity:.75; font-weight:700;">Código predial</div>
        ${wrap(codigoPredial)}

        <div style="opacity:.75; font-weight:700;">Número documento</div>
        ${wrap(numDoc)}

        <div style="opacity:.75; font-weight:700;">Contribuyente</div>
        ${wrap(contribuyente)}

        <div style="opacity:.75; font-weight:700;">Naturaleza</div>
        ${wrap(naturaleza)}

        <div style="opacity:.75; font-weight:700;">Razón social</div>
        ${wrap(razonSocial)}

        <div style="opacity:.75; font-weight:700;">Estado</div>
        ${wrap(estado)}
      </div>

      <div style="margin-top:10px;">
        <a href="${streetViewUrl(lngLat)}" target="_blank"
           style="display:inline-block; padding:6px 10px; border-radius:6px;
                  background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
          📷 Street View
        </a>
      </div>

      <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
    </div>
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
        ensurePopupVisibleSmart();
      });
    })
    .catch((err) => console.error("Error cargando ICA:", err));
}

// =====================================================
// ✅ "Fachadas con letreros encontradas" (PUNTOS) — ✅ AZUL
// ✅ FIX: nombre real del archivo en tu repo: "Contrucciones_que_coinciden.geojson"
// =====================================================
function addCoincidenLayer() {
  fetch("../src/data/Contrucciones_que_coinciden.geojson")
    .then((r) => r.json())
    .then((data) => {
      COINCIDEN_DATA = data;

      if (map.getSource("coinciden_points")) map.getSource("coinciden_points").setData(data);
      else map.addSource("coinciden_points", { type: "geojson", data });

      if (!map.getLayer("coinciden_points_layer")) {
        map.addLayer({
          id: "coinciden_points_layer",
          type: "circle",
          source: "coinciden_points",
          paint: {
            "circle-radius": 6,
            "circle-color": "#00b0ff",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });
      }

      if (!map.getSource("highlight_coinciden")) {
        map.addSource("highlight_coinciden", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getLayer("highlight_coinciden_circle")) {
        map.addLayer({
          id: "highlight_coinciden_circle",
          type: "circle",
          source: "highlight_coinciden",
          paint: {
            "circle-radius": 11,
            "circle-color": "#ffff00",
            "circle-opacity": 0.35,
            "circle-stroke-width": 4,
            "circle-stroke-color": "#ffff00",
          },
        });
      }

      safeOff("mouseenter", "coinciden_points_layer");
      safeOff("mouseleave", "coinciden_points_layer");
      safeOff("click", "coinciden_points_layer");

      map.on("mouseenter", "coinciden_points_layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "coinciden_points_layer", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "coinciden_points_layer", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);

        const hs = map.getSource("highlight_coinciden");
        if (hs) hs.setData({ type: "FeatureCollection", features: [f] });

        popup
          .setLngLat(lngLat)
          .setHTML(popupHTMLCoinciden(f.properties || {}, lngLat))
          .addTo(map);

        ensurePopupVisibleSmart();
      });
    })
    .catch((err) => console.error("Error cargando fachadas con letreros:", err));
}

// =====================================================
// ✅ CONTRIBUYENTES PERSONA JURÍDICA (PUNTOS) — ✅ MORADO
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

        popup
          .setLngLat(lngLat)
          .setHTML(popupHTMLContribActivos(f.properties || {}, lngLat))
          .addTo(map);

        ensurePopupVisibleSmart();
      });
    })
    .catch((err) => console.error("Error cargando contribuyentes jurídicos:", err));
}

// =====================================================
// ✅ CONTRIBUYENTES PERSONA NATURAL (PUNTOS) — ✅ MISMO MORADO + MISMO POPUP
// =====================================================
function addContribNaturalLayer() {
  fetch("../src/data/Contribuyentes_Persona_Natural.geojson")
    .then((r) => r.json())
    .then((data) => {
      CONTRIB_NATURAL_DATA = data;

      if (map.getSource("contrib_natural")) map.getSource("contrib_natural").setData(data);
      else map.addSource("contrib_natural", { type: "geojson", data });

      if (!map.getLayer("contrib_natural_layer")) {
        map.addLayer({
          id: "contrib_natural_layer",
          type: "circle",
          source: "contrib_natural",
          paint: {
            "circle-radius": 6,
            "circle-color": "#ff00ff", // ✅ mismo color que jurídica
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });
      }

      if (!map.getSource("highlight_contrib_natural")) {
        map.addSource("highlight_contrib_natural", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getLayer("highlight_contrib_natural_circle")) {
        map.addLayer({
          id: "highlight_contrib_natural_circle",
          type: "circle",
          source: "highlight_contrib_natural",
          paint: {
            "circle-radius": 11,
            "circle-color": "#ffff00",
            "circle-opacity": 0.35,
            "circle-stroke-width": 4,
            "circle-stroke-color": "#ffff00",
          },
        });
      }

      safeOff("mouseenter", "contrib_natural_layer");
      safeOff("mouseleave", "contrib_natural_layer");
      safeOff("click", "contrib_natural_layer");

      map.on("mouseenter", "contrib_natural_layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "contrib_natural_layer", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "contrib_natural_layer", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const lngLat = getPointLngLat(f);

        const hs = map.getSource("highlight_contrib_natural");
        if (hs) hs.setData({ type: "FeatureCollection", features: [f] });

        popup
          .setLngLat(lngLat)
          .setHTML(popupHTMLContribActivos(f.properties || {}, lngLat))
          .addTo(map);

        ensurePopupVisibleSmart();
      });
    })
    .catch((err) => console.error("Error cargando contribuyentes natural:", err));
}

// =====================================================
// BUSCADOR LOCAL (ICA + Fachadas + Contribuyentes activos)
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: "Buscar ICA / fachadas / contribuyentes activos",
  localGeocoder: (q) => {
    const query = norm(q);
    if (!query) return [];

    const results = [];

    // --- ICA (Posibilidades) ---
    if (ICA_DATA && Array.isArray(ICA_DATA.features)) {
      for (const f of ICA_DATA.features) {
        const p = f.properties || {};
        const txt = norm(p.NOMBRE);
        if (txt && txt.includes(query)) {
          const center = getPointLngLat(f);
          results.push({
            type: "Feature",
            geometry: f.geometry,
            center,
            properties: { ...p, __tipo: "ICA" },
            place_name: `Posibilidades ICA: ${(p.NOMBRE ?? "N/A").toString()}`,
            text: (p.NOMBRE ?? "Posibilidades ICA").toString(),
            place_type: ["place"],
          });
          if (results.length >= 10) break;
        }
      }
    }

    // --- Fachadas con letreros encontradas ---
    if (COINCIDEN_DATA && Array.isArray(COINCIDEN_DATA.features) && results.length < 10) {
      for (const f of COINCIDEN_DATA.features) {
        const p = f.properties || {};
        const txt = norm(p.NOMBRE);
        if (txt && txt.includes(query)) {
          const center = getPointLngLat(f);
          results.push({
            type: "Feature",
            geometry: f.geometry,
            center,
            properties: { ...p, __tipo: "COINCIDEN" },
            place_name: `Fachadas: ${(p.NOMBRE ?? "N/A").toString()}`,
            text: (p.NOMBRE ?? "Fachadas").toString(),
            place_type: ["place"],
          });
          if (results.length >= 10) break;
        }
      }
    }

    function matchContrib(p) {
      const cod = norm(p["Código predial"] ?? p.CODIGO_PREDIAL ?? p.codigo_predial ?? p.codigo);
      const doc = norm(p["Número documento"] ?? p.NUMERO_DOCUMENTO ?? p["No Documento"] ?? p.NO_DOCUMENTO);
      const razon = norm(p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Razon Social"]);
      const contrib = norm(p["Contribuyente"] ?? p.NOMBRE ?? p.Nombre ?? p.RAZON_SOCIAL);

      return (
        (cod && cod.includes(query)) ||
        (doc && doc.includes(query)) ||
        (razon && razon.includes(query)) ||
        (contrib && contrib.includes(query))
      );
    }

    // --- Contribuyentes activos (Jurídica) ---
    if (CONTRIB_JURIDICA_DATA && Array.isArray(CONTRIB_JURIDICA_DATA.features) && results.length < 10) {
      for (const f of CONTRIB_JURIDICA_DATA.features) {
        const p = f.properties || {};
        if (!matchContrib(p)) continue;

        const center = getPointLngLat(f);
        results.push({
          type: "Feature",
          geometry: f.geometry,
          center,
          properties: { ...p, __tipo: "CONTRIB_ACTIVOS" },
          place_name: `Contribuyentes activos: ${(p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Contribuyente"] ?? "N/A").toString()}`,
          text: (p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Contribuyente"] ?? "Activos").toString(),
          place_type: ["place"],
        });

        if (results.length >= 10) break;
      }
    }

    // --- Contribuyentes activos (Natural) ---
    if (CONTRIB_NATURAL_DATA && Array.isArray(CONTRIB_NATURAL_DATA.features) && results.length < 10) {
      for (const f of CONTRIB_NATURAL_DATA.features) {
        const p = f.properties || {};
        if (!matchContrib(p)) continue;

        const center = getPointLngLat(f);
        results.push({
          type: "Feature",
          geometry: f.geometry,
          center,
          properties: { ...p, __tipo: "CONTRIB_ACTIVOS" },
          place_name: `Contribuyentes activos: ${(p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Contribuyente"] ?? "N/A").toString()}`,
          text: (p["Razón social"] ?? p.RAZON_SOCIAL ?? p["Contribuyente"] ?? "Activos").toString(),
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
  const r = e.result;
  if (!r) return;

  const tipo = r.properties?.__tipo;

  if (tipo === "ICA") {
    const lngLat = r.center || getPointLngLat(r);

    const hs = map.getSource("highlight_ica");
    if (hs) hs.setData({ type: "FeatureCollection", features: [r] });

    map.flyTo({ center: lngLat, zoom: 18 });

    popup.setLngLat(lngLat).setHTML(popupHTMLICA(r.properties || {}, lngLat)).addTo(map);
    ensurePopupVisibleSmart();
    return;
  }

  if (tipo === "COINCIDEN") {
    const lngLat = r.center || getPointLngLat(r);

    const hs = map.getSource("highlight_coinciden");
    if (hs) hs.setData({ type: "FeatureCollection", features: [r] });

    map.flyTo({ center: lngLat, zoom: 18 });

    popup.setLngLat(lngLat).setHTML(popupHTMLCoinciden(r.properties || {}, lngLat)).addTo(map);
    ensurePopupVisibleSmart();
    return;
  }

  if (tipo === "CONTRIB_ACTIVOS") {
    const lngLat = r.center || getPointLngLat(r);

    // 🔥 si viene de jurídica, prende ese highlight; si viene de natural, prende el de natural.
    // Como ambos tienen __tipo = CONTRIB_ACTIVOS, escogemos por existencia de campos:
    const isNatural = !!(r.properties && (r.properties["Contribuyente"] || r.properties["Razón social"] || r.properties.RAZON_SOCIAL));

    // Intento de highlight en ambos (sin romper si falta)
    const hsJ = map.getSource("highlight_contrib_juridica");
    if (hsJ) hsJ.setData({ type: "FeatureCollection", features: [r] });

    const hsN = map.getSource("highlight_contrib_natural");
    if (hsN) hsN.setData({ type: "FeatureCollection", features: [r] });

    map.flyTo({ center: lngLat, zoom: 18 });

    popup.setLngLat(lngLat).setHTML(popupHTMLContribActivos(r.properties || {}, lngLat)).addTo(map);
    ensurePopupVisibleSmart();
    return;
  }
});

// =====================================================
// CARGA FINAL (orden)
// =====================================================
map.on("style.load", () => {
  addPrediosBase();
  addICALayer();          // ✅ verde = Posibilidades ICA
  addCoincidenLayer();    // ✅ azul  = Fachadas con letreros
  addContribJuridicaLayer(); // ✅ morado = Activos (jurídica)
  addContribNaturalLayer();  // ✅ morado = Activos (natural)

  setTimeout(() => {
    try {
      if (map.getLayer("predios_base_outline")) map.moveLayer("predios_base_outline");

      if (map.getLayer("ica_points_layer")) map.moveLayer("ica_points_layer");
      if (map.getLayer("coinciden_points_layer")) map.moveLayer("coinciden_points_layer");
      if (map.getLayer("contrib_juridica_layer")) map.moveLayer("contrib_juridica_layer");
      if (map.getLayer("contrib_natural_layer")) map.moveLayer("contrib_natural_layer");

      if (map.getLayer("highlight_ica_circle")) map.moveLayer("highlight_ica_circle");
      if (map.getLayer("highlight_coinciden_circle")) map.moveLayer("highlight_coinciden_circle");
      if (map.getLayer("highlight_contrib_juridica_circle"))
        map.moveLayer("highlight_contrib_juridica_circle");
      if (map.getLayer("highlight_contrib_natural_circle"))
        map.moveLayer("highlight_contrib_natural_circle");
    } catch (e) {}
  }, 450);
});
