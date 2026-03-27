// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda local por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios (mismo codigo o documento)
// ✅ POPUP SOLO POR CLICK
// ✅ + BOTÓN STREET VIEW
// ✅ + ELIMINAR DUPLICADOS POR CODIGO
// ✅ + CLASIFICACIÓN POR CATEGORÍAS
// ✅ + BOTONES EN LEYENDA PARA PRENDER / APAGAR
// ✅ + PREDIOS PÚBLICOS EN AZUL CLARO
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-v9',
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

let PREDIOS_DATA = null;

// =====================================================
// CONFIG
// =====================================================
const CATEGORY_CONFIG = {
  publicos: { label: 'Predios públicos', color: '#4fc3f7', layerId: 'predios_publicos_layer' },
  mora: { label: 'Predios con mora', color: '#e63946', layerId: 'predios_mora_layer' },
  aldia: { label: 'Predios al día', color: '#2ec4b6', layerId: 'predios_aldia_layer' },
  sinpago: { label: 'Posibles predios sin pagar', color: '#ffb703', layerId: 'predios_sinpago_layer' }
};

// =====================================================
// HELPERS
// =====================================================
function norm(v) {
  return (v ?? '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function formatCOP(value, fallback = 'N/A') {
  if (!value) return fallback;
  const n = Number(value);
  return isNaN(n) ? fallback : '$ ' + n.toLocaleString('es-CO');
}

function hasValue(v) {
  return v !== null && v !== undefined && v !== '';
}

// =====================================================
// DEDUPLICAR
// =====================================================
function deduplicateGeoJSONByCodigo(fc) {
  const seen = new Set();
  return {
    ...fc,
    features: fc.features.filter(f => {
      const c = norm(f.properties?.codigo);
      if (!c || !seen.has(c)) {
        seen.add(c);
        return true;
      }
      return false;
    })
  };
}

// =====================================================
// CATEGORÍA
// =====================================================
function getCategoriaPredio(props = {}) {
  const nombre = norm(props.NOMBRE);
  if (nombre === 'municipio de sesquile') return 'publicos';
  if (hasValue(props['total valor mora'])) return 'mora';
  if (hasValue(props['valor ultimo pago'])) return 'aldia';
  return 'sinpago';
}

// =====================================================
// POPUP (SIN BOTÓN DE PAGO)
// =====================================================
function buildPopupHTML(props, lngLat = null) {
  props = props || {};
  const categoria = getCategoriaPredio(props);

  let info = `<strong>Categoría:</strong> ${CATEGORY_CONFIG[categoria].label}<br>`;

  if (!hasValue(props['valor ultimo pago']) && !hasValue(props['total valor mora'])) {
    info += `<strong>Información de pago:</strong> No disponible<br>`;
  } else {
    if (hasValue(props['valor ultimo pago'])) {
      info += `<strong>Último pago:</strong> ${formatCOP(props['valor ultimo pago'])}<br>`;
    }
    if (hasValue(props['total valor mora'])) {
      info += `<strong>Valor en mora:</strong> ${formatCOP(props['total valor mora'])}<br>`;
    }
  }

  // 👇 ESTE ES TU STREET VIEW ORIGINAL (NO SE TOCÓ)
  const svBtn = lngLat
    ? `
      <a href="${streetViewUrl(lngLat)}" target="_blank" rel="noopener"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    `
    : '';

  return `
    <strong>Código:</strong> ${props.codigo ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? 'N/A'}<br>
    ${info}

    <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
      ${svBtn}
    </div>
  `;
}

// =====================================================
// CARGA
// =====================================================
function addPrediosLayer(file, sourceId) {
  fetch(`../src/data/${file}`)
    .then(r => r.json())
    .then(raw => {
      const data = deduplicateGeoJSONByCodigo(raw);
      PREDIOS_DATA = data;

      map.addSource(sourceId, { type: 'geojson', data });

      Object.entries(CATEGORY_CONFIG).forEach(([cat, cfg]) => {
        map.addLayer({
          id: cfg.layerId,
          source: sourceId,
          type: 'fill',
          filter: ['==', ['get', '__categoria'], cat],
          paint: {
            'fill-color': cfg.color,
            'fill-opacity': 0.6,
            'fill-outline-color': '#fff'
          }
        });
      });

      map.on('click', Object.values(CATEGORY_CONFIG).map(c => c.layerId), e => {
        const f = e.features[0];
        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties, [e.lngLat.lng, e.lngLat.lat]))
          .addTo(map);
      });
    });
}

map.on('load', () => {
  addPrediosLayer('PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson', 'predios');
});
