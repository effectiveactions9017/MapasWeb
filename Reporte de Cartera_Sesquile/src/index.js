// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ + Popup con riesgo y vigencia
// ✅ + Colores por nivel de riesgo
// ✅ + Leyenda interactiva (filtros combinados)
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463],
  zoom: 15,
  container: 'map',
  antialias: true
});

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});

// ================================
// 🔹 DATA GLOBAL
// ================================
let PREDIOS_DATA = null;

// ================================
// 🔹 FILTROS ACTIVOS
// ================================
let activeFilters = {
  riesgo: new Set(['BAJO', 'MEDIO', 'ALTO']),
  vigencia: new Set(['1-2', '3-5', '5+'])
};

// =====================================================
// HELPERS
// =====================================================
function formatAvaluo(value) {
  if (!value) return 'N/A';
  const n = Number(value);
  return isNaN(n) ? value : n.toLocaleString('es-CO');
}

function formatArea(value) {
  if (!value) return 'N/A';
  return Math.round(value);
}

function norm(v) {
  return (v ?? '').toString().toLowerCase().replace(/\s+/g, '').trim();
}

function getFeatureLngLat(feature, fallbackLngLat = null) {
  if (fallbackLngLat) return [fallbackLngLat.lng, fallbackLngLat.lat];

  try {
    return turf.pointOnFeature(feature).geometry.coordinates;
  } catch (e) {
    return [-73.79724, 5.04463];
  }
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// =====================================================
// POPUP
// =====================================================
function buildPopupHTML(props, lngLat = null, extraHTML = '') {
  const svBtn = lngLat
    ? `<div style="margin-top:10px;">
        <a href="${streetViewUrl(lngLat)}" target="_blank"
        style="padding:6px 10px;background:#00bcd4;color:#000;border-radius:6px;font-weight:700;">
        📷 Street View
        </a>
      </div>`
    : '';

  return `
    <strong>Código:</strong> ${props.codigo ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? 'N/A'}<br>

    <hr>

    <strong>Total acumulado:</strong> ${formatAvaluo(props.total_acumulado)}<br>
    <strong>Categoría vigencia:</strong> ${props.categoria_vigencia ?? 'N/A'}<br>
    <strong>Nivel de riesgo:</strong> ${props.nivel_riesgo ?? 'N/A'}<br>
    <strong>Vereda:</strong> ${props.vereda ?? 'N/A'}<br>

    <hr>

    <strong>Avalúo 2026:</strong> ${formatAvaluo(props['AVALUO 2026'])}<br>
    <strong>Área:</strong> ${formatArea(props.Shape_Area)} m²<br>

    ${extraHTML}
    ${svBtn}
  `;
}

// =====================================================
// FILTROS
// =====================================================
function applyFilters() {
  const riesgoArray = Array.from(activeFilters.riesgo);
  const vigenciaArray = Array.from(activeFilters.vigencia);

  map.setFilter('predios_ssk_layer', [
    'all',
    ['in', ['get', 'nivel_riesgo'], ['literal', riesgoArray]],
    ['in', ['get', 'categoria_vigencia'], ['literal', vigenciaArray]]
  ]);
}

// =====================================================
// CAPA
// =====================================================
function addLayer() {
  fetch('../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson')
    .then(res => res.json())
    .then(data => {
      PREDIOS_DATA = data;

      map.addSource('predios_ssk', {
        type: 'geojson',
        data
      });

      map.addLayer({
        id: 'predios_ssk_layer',
        type: 'fill',
        source: 'predios_ssk',
        paint: {
          'fill-color': [
            'match',
            ['get', 'nivel_riesgo'],
            'BAJO', '#2ecc71',
            'MEDIO', '#f1c40f',
            'ALTO', '#e74c3c',
            '#999'
          ],
          'fill-opacity': 0.7,
          'fill-outline-color': '#fff'
        }
      });

      map.on('click', 'predios_ssk_layer', (e) => {
        const f = e.features[0];
        const coords = getFeatureLngLat(f, e.lngLat);

        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties, coords))
          .addTo(map);
      });

      map.addControl(new mapboxgl.NavigationControl());

      applyFilters(); // 🔥 activar filtros al inicio
    });
}

// =====================================================
// MAP LOAD
// =====================================================
map.on('load', () => {
  addLayer();
});

// =====================================================
// LEYENDA INTERACTIVA
// =====================================================
document.querySelectorAll('.filter-item').forEach(el => {
  el.addEventListener('click', () => {
    const type = el.dataset.filter;
    const value = el.dataset.value;

    el.classList.toggle('active');

    if (activeFilters[type].has(value)) {
      activeFilters[type].delete(value);
    } else {
      activeFilters[type].add(value);
    }

    applyFilters();
  });
});
