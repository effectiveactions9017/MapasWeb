// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Base siempre visible + filtros visuales por riesgo
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
// 🔹 FILTROS ACTIVOS
// ================================
let activeFilters = {
  riesgo: new Set(['BAJO', 'MEDIO', 'ALTO'])
};

// =====================================================
// HELPERS
// =====================================================
function formatAvaluo(value) {
  if (!value) return 'N/A';
  return Number(value).toLocaleString('es-CO');
}

function formatArea(value) {
  if (!value) return 'N/A';
  return Math.round(value);
}

function getFeatureLngLat(feature, fallbackLngLat = null) {
  if (fallbackLngLat) return [fallbackLngLat.lng, fallbackLngLat.lat];
  return turf.pointOnFeature(feature).geometry.coordinates;
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// =====================================================
// POPUP
// =====================================================
function buildPopupHTML(props, lngLat = null) {
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

    <hr>

    <strong>Nivel de riesgo:</strong> ${props.nivel_riesgo ?? 'N/A'}<br>
    <strong>Categoría vigencia:</strong> ${props.categoria_vigencia ?? 'N/A'}<br>

    ${svBtn}
  `;
}

// =====================================================
// FUNCIÓN CLAVE 🔥 (COLOR DINÁMICO)
// =====================================================
function updateMapStyle() {
  const riesgos = Array.from(activeFilters.riesgo);

  map.setPaintProperty('predios_ssk_layer', 'fill-color', [
    'case',

    // 🔴 ALTO
    [
      'all',
      ['in', 'ALTO', ['upcase', ['get', 'nivel_riesgo']]],
      ['in', 'ALTO', ['literal', riesgos]]
    ],
    '#e74c3c',

    // 🟡 MEDIO
    [
      'all',
      ['in', 'MEDIO', ['upcase', ['get', 'nivel_riesgo']]],
      ['in', 'MEDIO', ['literal', riesgos]]
    ],
    '#f1c40f',

    // 🟢 BAJO
    [
      'all',
      ['in', 'BAJO', ['upcase', ['get', 'nivel_riesgo']]],
      ['in', 'BAJO', ['literal', riesgos]]
    ],
    '#2ecc71',

    // 🔘 BASE (sin categoría o apagados)
    'rgba(200,200,200,0.2)'
  ]);
}

// =====================================================
// CAPA
// =====================================================
function addLayer() {
  fetch('../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson')
    .then(res => res.json())
    .then(data => {

      map.addSource('predios_ssk', {
        type: 'geojson',
        data
      });

      map.addLayer({
        id: 'predios_ssk_layer',
        type: 'fill',
        source: 'predios_ssk',
        paint: {
          'fill-color': 'rgba(200,200,200,0.2)', // base
          'fill-outline-color': '#ffffff',
          'fill-opacity': 0.8
        }
      });

      // Popup
      map.on('click', 'predios_ssk_layer', (e) => {
        const f = e.features[0];
        const coords = getFeatureLngLat(f, e.lngLat);

        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties, coords))
          .addTo(map);
      });

      map.addControl(new mapboxgl.NavigationControl());

      updateMapStyle(); // 🔥 aplicar colores iniciales
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

    const value = el.dataset.value;

    el.classList.toggle('active');

    if (activeFilters.riesgo.has(value)) {
      activeFilters.riesgo.delete(value);
    } else {
      activeFilters.riesgo.add(value);
    }

    updateMapStyle(); // 🔥 clave
  });
});
