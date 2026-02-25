// =====================================================
// ✅ Predial Sesquilé - Mapbox GL JS (ACTUALIZADO)
// ✅ Búsqueda por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios (mismo codigo o documento)
// ✅ POPUP SOLO POR CLICK + SOLO POR SELECCIÓN DEL BUSCADOR (NO HOVER)
// ✅ + Street View en el POPUP (también para predios/polígonos)
// ✅ DESTINO: (letra -> significado) + color por destino + leyenda con filtros
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463],
  zoom: 15,
  pitch: 0,
  bearing: 0,
  container: 'map',
  antialias: true
});

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});

// ✅ Guardar dataset completo para búsquedas completas
let PREDIOS_DATA = null;

// =====================================================
// ✅ DESTINO: etiqueta + color (R1)
// =====================================================
const DESTINO_INFO = {
  A:  { label: "Agropecuario", color: "#1b9e77" },
  C:  { label: "Comercial",    color: "#d95f02" },
  I:  { label: "Industrial",   color: "#7570b3" },
  R:  { label: "Residencial",  color: "#e7298a" },
  S:  { label: "Servicios",    color: "#66a61e" },
  M:  { label: "Mixto",        color: "#e6ab02" },
  L:  { label: "Lote",         color: "#a6761d" },
  D:  { label: "Dotacional",   color: "#1f78b4" },
  D1: { label: "Dotacional institucional", color: "#2c7fb8" },
  D2: { label: "Dotacional social/comunitario", color: "#41b6c4" },
  E:  { label: "Educativo",    color: "#00bcd4" },
  H:  { label: "Hotelero/Turístico", color: "#fb9a99" },
  T:  { label: "Transporte",   color: "#6a3d9a" },
  U:  { label: "Uso público",  color: "#33a02c" },
  P:  { label: "Protección",   color: "#b2df8a" },
  F:  { label: "Forestal",     color: "#0b6623" },
  G:  { label: "Institucional/Gob.", color: "#a6cee3" },
  O:  { label: "Otros",        color: "#bdbdbd" },
  N:  { label: "No determinado", color: "#ff5252" },
};

function normalizeDestino(raw) {
  const v = (raw ?? "").toString().trim().toUpperCase().replace(/\s+/g, "");
  if (!v) return "N";
  // Primero intenta exacto (D1, D2, etc.)
  if (DESTINO_INFO[v]) return v;
  // Si viene algo raro tipo "OS", "O.", "S1" -> prueba con primera letra
  const first = v[0];
  if (DESTINO_INFO[first]) return first;
  return "N";
}

function destinoTexto(raw) {
  const code = normalizeDestino(raw);
  const info = DESTINO_INFO[code] || DESTINO_INFO.N;
  return `${info.label} (${code})`;
}

function destinoColor(raw) {
  const code = normalizeDestino(raw);
  return (DESTINO_INFO[code] || DESTINO_INFO.N).color;
}

// =====================================================
// ✅ Leyenda con filtros por DESTINO (prender/apagar)
// =====================================================
function ensureLegendUI() {
  let legend = document.querySelector(".legend-container");
  if (!legend) {
    legend = document.createElement("div");
    legend.className = "legend-container";
    legend.style.position = "absolute";
    legend.style.bottom = "25px";
    legend.style.right = "5px";
    legend.style.zIndex = "10";
    legend.style.background = "rgba(0,0,0,0.7)";
    legend.style.padding = "12px";
    legend.style.borderRadius = "8px";
    legend.style.width = "260px";
    legend.style.color = "#fff";
    legend.style.fontFamily = "Libre Franklin, sans-serif";
    legend.style.boxShadow = "0 2px 5px rgba(0,0,0,0.5)";
    legend.innerHTML = `
      <div style="font-weight:700; margin-bottom:10px;">Destino (R1) – Filtro</div>
      <div id="destino-legend-list" style="max-height:240px; overflow:auto;"></div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button id="destino-all" style="flex:1; padding:6px 8px; border-radius:6px; border:0; cursor:pointer; font-weight:700;">Todos</button>
        <button id="destino-none" style="flex:1; padding:6px 8px; border-radius:6px; border:0; cursor:pointer; font-weight:700;">Ninguno</button>
      </div>
      <div style="margin-top:8px; font-size:11px; opacity:0.85;">Puedes prender/apagar categorías.</div>
    `;
    document.body.appendChild(legend);
  }
  return legend;
}

let ACTIVE_DESTINOS = new Set(Object.keys(DESTINO_INFO)); // por defecto todos ON

function applyDestinoFilter(layerId) {
  const arr = Array.from(ACTIVE_DESTINOS);

  // Si no hay ninguno activo, mostramos nada
  if (!arr.length) {
    map.setFilter(layerId, ["==", ["get", "DESTINO_NORM"], "__NONE__"]);
    return;
  }

  // Mostrar solo los destinos activos
  map.setFilter(layerId, ["in", ["get", "DESTINO_NORM"], ["literal", arr]]);
}

function buildDestinoLegend(layerId) {
  ensureLegendUI();
  const list = document.getElementById("destino-legend-list");
  if (!list) return;

  const items = Object.entries(DESTINO_INFO)
    // orden agradable: primero económicos/urbanos, luego resto, y al final N/O
    .sort(([a], [b]) => {
      const order = ["R","M","C","S","I","L","A","D","D1","D2","E","G","U","T","H","F","P","O","N"];
      return order.indexOf(a) - order.indexOf(b);
    });

  list.innerHTML = items
    .map(([code, info]) => {
      const checked = ACTIVE_DESTINOS.has(code) ? "checked" : "";
      return `
        <label style="display:flex; align-items:center; gap:8px; margin:6px 0; cursor:pointer;">
          <input type="checkbox" data-destino="${code}" ${checked} style="transform:scale(1.05);" />
          <span style="width:14px; height:14px; border-radius:3px; background:${info.color}; display:inline-block; border:1px solid rgba(255,255,255,0.35);"></span>
          <span style="font-size:12px; line-height:1.2;">${info.label} (${code})</span>
        </label>
      `;
    })
    .join("");

  // listeners checkboxes
  list.querySelectorAll('input[type="checkbox"][data-destino]').forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const code = e.target.getAttribute("data-destino");
      if (!code) return;
      if (e.target.checked) ACTIVE_DESTINOS.add(code);
      else ACTIVE_DESTINOS.delete(code);
      applyDestinoFilter(layerId);
    });
  });

  // botones todos / ninguno
  const btnAll = document.getElementById("destino-all");
  const btnNone = document.getElementById("destino-none");

  if (btnAll && !btnAll.__bound) {
    btnAll.__bound = true;
    btnAll.addEventListener("click", () => {
      ACTIVE_DESTINOS = new Set(Object.keys(DESTINO_INFO));
      buildDestinoLegend(layerId);
      applyDestinoFilter(layerId);
    });
  }

  if (btnNone && !btnNone.__bound) {
    btnNone.__bound = true;
    btnNone.addEventListener("click", () => {
      ACTIVE_DESTINOS = new Set([]);
      buildDestinoLegend(layerId);
      applyDestinoFilter(layerId);
    });
  }
}

// =====================================================
// HELPERS Street View (punto representativo)
// =====================================================
function getFeatureLngLat(feature, fallbackLngLat = null) {
  // 1) si viene de evento (click) úsalo
  if (
    fallbackLngLat &&
    typeof fallbackLngLat.lng === 'number' &&
    typeof fallbackLngLat.lat === 'number'
  ) {
    return [fallbackLngLat.lng, fallbackLngLat.lat];
  }

  // 2) si es punto
  const c = feature?.geometry?.coordinates;
  if (Array.isArray(c) && c.length >= 2 && c[0] != null && c[1] != null) {
    return [Number(c[0]), Number(c[1])];
  }

  // 3) si es polígono: punto dentro del polígono (mejor que centroide)
  try {
    const pt = turf.pointOnFeature(feature).geometry.coordinates;
    return [Number(pt[0]), Number(pt[1])];
  } catch (e) {}

  return [-73.79724, 5.04463];
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// =====================================================
// Util: construir HTML del popup desde fields + Street View
// =====================================================
function buildPopupFromFields(feature, lngLatForPopup, popupFields, lngLatForSV) {
  const props = feature.properties || {};

  const popupContent = popupFields
    .map((field) => {
      let value = props?.[field.key];

      // Área (m²) - usa Shape_Area
      if (field.key === 'Shape_Area' && value !== null && value !== undefined) {
        value = Math.round(Number(value));
      }

      // Avalúo (campo con espacio)
      if (field.key === 'AVALUO 2026' && value !== null && value !== undefined && value !== '') {
        const n = Number(value);
        value = isNaN(n) ? value : n.toLocaleString('es-CO');
      }

      // ✅ DESTINO (mostrar texto bonito + badge color)
      if (field.key === 'DESTINO') {
        const code = props?.DESTINO_NORM ?? normalizeDestino(value);
        const info = DESTINO_INFO[code] || DESTINO_INFO.N;
        const nice = props?.DESTINO_TXT ?? `${info.label} (${code})`;
        const badge = `
          <span style="display:inline-block; margin-left:6px; width:10px; height:10px; border-radius:2px;
                       background:${info.color}; border:1px solid rgba(255,255,255,0.35);"></span>
        `;
        value = `${nice}${badge}`;
      }

      return `<strong>${field.label}:</strong> ${value ?? 'N/A'}`;
    })
    .join('<br>');

  const svBtn = `
    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLatForSV)}" target="_blank" rel="noopener"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    </div>
  `;

  popup
    .setLngLat(lngLatForPopup)
    .setHTML(`${popupContent}${svBtn}<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`)
    .addTo(map);
}

// =====================================================
// Capa + popup (SOLO CLICK)
// =====================================================
function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((data) => {
      // ✅ Enriquecer features con DESTINO_NORM/TXT/COLOR
      if (data && Array.isArray(data.features)) {
        data.features.forEach((f) => {
          const p = f.properties || {};
          const raw = p.DESTINO;
          const norm = normalizeDestino(raw);
          const info = DESTINO_INFO[norm] || DESTINO_INFO.N;
          p.DESTINO_NORM = norm;
          p.DESTINO_TXT = `${info.label} (${norm})`;
          p.DESTINO_COLOR = info.color;
          f.properties = p;
        });
      }

      if (sourceId === 'predios_ssk') PREDIOS_DATA = data;

      // Source seguro
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: data });
      }

      // Layer seguro (pintar por DESTINO_COLOR)
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: 'fill',
          minzoom: 12,
          paint: {
            // ✅ ahora el color viene del atributo DESTINO_COLOR
            'fill-color': ['coalesce', ['get', 'DESTINO_COLOR'], '#2ec4b6'],
            'fill-opacity': 0.75,
            'fill-outline-color': '#ffffff'
          }
        });
      }

      // ✅ construir leyenda y aplicar filtro por defecto
      if (layerId === 'predios_ssk_layer') {
        buildDestinoLegend(layerId);
        applyDestinoFilter(layerId);
      }

      // ✅ IMPORTANTE: QUITAR MOUSEMOVE (HOVER POPUP)
      try { map.off('mousemove', layerId); } catch (e) {}
      try { map.off('mouseenter', layerId); } catch (e) {}
      try { map.off('mouseleave', layerId); } catch (e) {}
      try { map.off('click', layerId); } catch (e) {}

      // Cursor pointer (solo cursor)
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });

      // ✅ Popup SOLO por CLICK
      map.on('click', layerId, (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const svLngLat = getFeatureLngLat(feature, e.lngLat);

        buildPopupFromFields(
          feature,
          e.lngLat,         // popup donde clickeas
          popupFields,
          svLngLat          // Street View
        );
      });
    })
    .catch((err) => console.error('Error cargando GeoJSON:', err));
}

// Cargar capa predial + resaltado
map.on('style.load', () => {
  addLayer(
    'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',
    'predios_ssk',
    'predios_ssk_layer',
    '#2ec4b6',
    [
      { label: 'Código', key: 'codigo' },
      { label: 'Destino', key: 'DESTINO' },
      { label: 'Nombre', key: 'NOMBRE' },
      { label: 'Documento', key: 'NUMERO_DOCUMENTO' },
      { label: 'Avalúo 2026', key: 'AVALUO 2026' },
      { label: 'Área (㎡)', key: 'Shape_Area' }
    ]
  );

  // Highlight source/layers
  if (!map.getSource('predios_highlight')) {
    map.addSource('predios_highlight', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer('predios_highlight_fill')) {
    map.addLayer({
      id: 'predios_highlight_fill',
      type: 'fill',
      source: 'predios_highlight',
      paint: { 'fill-color': '#ffff00', 'fill-opacity': 0.30 }
    });
  }

  if (!map.getLayer('predios_highlight_line')) {
    map.addLayer({
      id: 'predios_highlight_line',
      type: 'line',
      source: 'predios_highlight',
      paint: { 'line-color': '#ffff00', 'line-width': 4 }
    });
  }
});

// Geocoder local
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: 'Buscar por código, nombre o documento',
  localGeocoder: function (query) {
    const matchingFeatures = [];
    const q = (query || '').toString().toLowerCase().trim();
    if (!q) return matchingFeatures;

    const features = (PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features)) ? PREDIOS_DATA.features : [];
    if (!features.length) return matchingFeatures;

    features.forEach((feature) => {
      const props = feature.properties || {};

      const codigo = (props.codigo ?? '').toString().toLowerCase();
      const nombre = (props.NOMBRE ?? '').toString().toLowerCase();
      const documento = (props.NUMERO_DOCUMENTO ?? '').toString().toLowerCase();

      const match =
        (codigo && codigo.includes(q)) ||
        (nombre && nombre.includes(q)) ||
        (documento && documento.includes(q));

      if (match) {
        const centro = turf.centroid(feature).geometry.coordinates;

        const codTxt = (props.codigo ?? '').toString().trim();
        const nomTxt = (props.NOMBRE ?? '').toString().trim();
        const docTxt = (props.NUMERO_DOCUMENTO ?? '').toString().trim();

        let matchField = null;
        let matchValue = null;

        if (codigo && codigo.includes(q)) { matchField = 'codigo'; matchValue = codTxt; }
        else if (documento && documento.includes(q)) { matchField = 'NUMERO_DOCUMENTO'; matchValue = docTxt; }
        else if (nombre && nombre.includes(q)) { matchField = 'NOMBRE'; matchValue = nomTxt; }

        const props2 = { ...props, __matchField: matchField, __matchValue: matchValue };

        matchingFeatures.push({
          type: 'Feature',
          geometry: feature.geometry,
          properties: props2,
          place_name: `Código: ${codTxt || 'N/A'} | Nombre: ${nomTxt || 'N/A'} | Doc: ${docTxt || 'N/A'}`,
          text: codTxt || nomTxt || docTxt || 'Resultado',
          center: centro,
          place_type: ['place']
        });
      }
    });

    return matchingFeatures.slice(0, 10);
  }
});

map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());

// Al seleccionar resultado: resaltar grupo + zoom + popup (SOLO por selección)
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  const properties = result.properties || {};
  const matchField = properties.__matchField;
  const matchValue = (properties.__matchValue ?? '').toString().trim();

  const normLocal = (v) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').trim();
  const features = (PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features)) ? PREDIOS_DATA.features : [];

  let toHighlight = [];

  if ((matchField === 'NUMERO_DOCUMENTO' || matchField === 'codigo') && matchValue) {
    const mv = normLocal(matchValue);
    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      const v = matchField === 'NUMERO_DOCUMENTO' ? p.NUMERO_DOCUMENTO : p.codigo;
      return normLocal(v) === mv;
    });
  }

  if (!toHighlight.length) toHighlight = [result];

  const fc = { type: 'FeatureCollection', features: toHighlight };

  // ✅ highlight
  const hlSource = map.getSource('predios_highlight');
  if (hlSource) hlSource.setData(fc);

  // ✅ zoom
  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  // ✅ construir popup con los mismos fields
  const popupFields = [
    { label: 'Código', key: 'codigo' },
    { label: 'Destino', key: 'DESTINO' },
    { label: 'Nombre', key: 'NOMBRE' },
    { label: 'Documento', key: 'NUMERO_DOCUMENTO' },
    { label: 'Avalúo 2026', key: 'AVALUO 2026' },
    { label: 'Área (㎡)', key: 'Shape_Area' }
  ];

  // Street View: centro del bbox del grupo
  const b = turf.bbox(fc);
  const svCenter = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

  // popup en el centro del resultado (o centroide)
  const center = result.center || turf.centroid(result).geometry.coordinates;

  // construir "feature-like" para reutilizar el builder
  const featureLike = { properties };

  buildPopupFromFields(
    featureLike,
    center,
    popupFields,
    svCenter
  );
});
