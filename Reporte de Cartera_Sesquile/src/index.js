// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Base siempre visible + filtros visuales por riesgo y vigencia
// ✅ Popup actualizado con información tributaria y física
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
  riesgo: new Set(['BAJO', 'MEDIO', 'ALTO']),
  vigencia: new Set(['1-2', '3-5', '5+'])
};

// =====================================================
// HELPERS
// =====================================================
function formatAvaluo(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  return isNaN(n) ? String(value) : n.toLocaleString('es-CO');
}

function formatArea(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  return isNaN(n) ? String(value) : String(Math.round(n));
}

function getFeatureLngLat(feature, fallbackLngLat = null) {
  if (
    fallbackLngLat &&
    typeof fallbackLngLat.lng === 'number' &&
    typeof fallbackLngLat.lat === 'number'
  ) {
    return [fallbackLngLat.lng, fallbackLngLat.lat];
  }

  try {
    return turf.pointOnFeature(feature).geometry.coordinates;
  } catch (e) {
    return [-73.79724, 5.04463];
  }
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function normalizeRiskValue(value) {
  const v = (value ?? '').toString().trim().toUpperCase();
  if (!v) return '';
  if (v.includes('BAJO')) return 'BAJO';
  if (v.includes('MEDIO')) return 'MEDIO';
  if (v.includes('ALTO')) return 'ALTO';
  return '';
}

function normalizeVigenciaValue(value) {
  const v = (value ?? '').toString().trim().toUpperCase();

  if (!v) return '';

  if (
    v === '1-2' ||
    v.includes('1 A 2') ||
    v.includes('1-2') ||
    v.includes('UNO A DOS')
  ) {
    return '1-2';
  }

  if (
    v === '3-5' ||
    v.includes('3 A 5') ||
    v.includes('3-5')
  ) {
    return '3-5';
  }

  if (
    v === '5+' ||
    v.includes('MAS DE 5') ||
    v.includes('MÁS DE 5') ||
    v.includes('>5') ||
    v.includes('5+')
  ) {
    return '5+';
  }

  return '';
}

// =====================================================
// POPUP
// =====================================================
function buildPopupHTML(props, lngLat = null) {
  const svBtn = lngLat
    ? `<div style="margin-top:10px;">
        <a href="${streetViewUrl(lngLat)}" target="_blank" rel="noopener"
        style="display:inline-block;padding:6px 10px;background:#00bcd4;color:#000;border-radius:6px;font-weight:700;text-decoration:none;">
        📷 Street View
        </a>
      </div>`
    : '';

  return `
    <strong>Código:</strong> ${props.codigo ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? 'N/A'}<br>

    <hr style="border:0.5px solid #555; margin:6px 0;">

    <strong>Total acumulado:</strong> ${formatAvaluo(props.total_acumulado)}<br>
    <strong>Categoría vigencia:</strong> ${props.categoria_vigencia ?? 'N/A'}<br>
    <strong>Nivel de riesgo:</strong> ${props.nivel_riesgo ?? 'N/A'}<br>
    <strong>Vereda:</strong> ${props.vereda ?? 'N/A'}<br>

    <hr style="border:0.5px solid #555; margin:6px 0;">

    <strong>Avalúo 2026:</strong> ${formatAvaluo(props['AVALUO 2026'])}<br>
    <strong>Área:</strong> ${formatArea(props.Shape_Area)} m²<br>

    ${svBtn}
    <br><a style="font-size:9px;">&#9400; EffectiveActions</a>
  `;
}

// =====================================================
// FUNCIÓN CLAVE 🔥 (COLOR DINÁMICO)
// - Todos los predios se ven siempre
// - Los que coinciden con filtros se colorean
// - Los demás quedan en color base
// =====================================================
function updateMapStyle() {
  const riesgos = Array.from(activeFilters.riesgo);
  const vigencias = Array.from(activeFilters.vigencia);

  map.setPaintProperty('predios_ssk_layer', 'fill-color', [
    'case',

    // 🔴 ALTO
    [
      'all',
      ['==', ['case',
        ['in', 'ALTO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'ALTO',
        ['in', 'MEDIO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'MEDIO',
        ['in', 'BAJO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'BAJO',
        ''
      ], 'ALTO'],
      ['in', 'ALTO', ['literal', riesgos]],
      ['==', ['case',
        ['any',
          ['in', '1 A 2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '1-2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '1-2',
        ['any',
          ['in', '3 A 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '3-5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '3-5',
        ['any',
          ['in', 'MAS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', 'MÁS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '5+', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '>5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '5+',
        ''
      ], ['at', 0, ['literal', vigencias]]],
    ],
    '#e74c3c',

    // 🔴 ALTO (para múltiples vigencias activas)
    [
      'all',
      ['==', ['case',
        ['in', 'ALTO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'ALTO',
        ['in', 'MEDIO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'MEDIO',
        ['in', 'BAJO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'BAJO',
        ''
      ], 'ALTO'],
      ['in', 'ALTO', ['literal', riesgos]],
      ['in', ['case',
        ['any',
          ['in', '1 A 2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '1-2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '1-2',
        ['any',
          ['in', '3 A 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '3-5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '3-5',
        ['any',
          ['in', 'MAS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', 'MÁS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '5+', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '>5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '5+',
        ''
      ], ['literal', vigencias]]
    ],
    '#e74c3c',

    // 🟡 MEDIO
    [
      'all',
      ['==', ['case',
        ['in', 'ALTO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'ALTO',
        ['in', 'MEDIO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'MEDIO',
        ['in', 'BAJO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'BAJO',
        ''
      ], 'MEDIO'],
      ['in', 'MEDIO', ['literal', riesgos]],
      ['in', ['case',
        ['any',
          ['in', '1 A 2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '1-2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '1-2',
        ['any',
          ['in', '3 A 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '3-5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '3-5',
        ['any',
          ['in', 'MAS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', 'MÁS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '5+', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '>5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '5+',
        ''
      ], ['literal', vigencias]]
    ],
    '#f1c40f',

    // 🟢 BAJO
    [
      'all',
      ['==', ['case',
        ['in', 'ALTO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'ALTO',
        ['in', 'MEDIO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'MEDIO',
        ['in', 'BAJO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'BAJO',
        ''
      ], 'BAJO'],
      ['in', 'BAJO', ['literal', riesgos]],
      ['in', ['case',
        ['any',
          ['in', '1 A 2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '1-2', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '1-2',
        ['any',
          ['in', '3 A 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '3-5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '3-5',
        ['any',
          ['in', 'MAS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', 'MÁS DE 5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '5+', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]],
          ['in', '>5', ['upcase', ['coalesce', ['get', 'categoria_vigencia'], '']]]
        ], '5+',
        ''
      ], ['literal', vigencias]]
    ],
    '#2ecc71',

    // 🔘 BASE (sin categoría, apagados o no coinciden)
    'rgba(200,200,200,0.20)'
  ]);

  map.setPaintProperty('predios_ssk_layer', 'fill-outline-color', [
    'case',
    ['==', ['coalesce', ['get', 'nivel_riesgo'], ''], ''],
    '#999999',
    '#ffffff'
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
          'fill-color': 'rgba(200,200,200,0.20)',
          'fill-outline-color': '#ffffff',
          'fill-opacity': 0.85
        }
      });

      map.on('click', 'predios_ssk_layer', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const coords = getFeatureLngLat(f, e.lngLat);

        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties, coords))
          .addTo(map);
      });

      map.on('mouseenter', 'predios_ssk_layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'predios_ssk_layer', () => {
        map.getCanvas().style.cursor = '';
      });

      map.addControl(new mapboxgl.NavigationControl());

      updateMapStyle();
    })
    .catch(err => console.error('Error cargando GeoJSON:', err));
}

// =====================================================
// MAP LOAD
// =====================================================
map.on('load', () => {
  addLayer();
});

// =====================================================
// LEYENDA INTERACTIVA
// - Soporta filtros de riesgo y vigencia
// =====================================================
document.querySelectorAll('.filter-item').forEach(el => {
  el.addEventListener('click', () => {
    const type = el.dataset.filter;
    const value = el.dataset.value;

    if (!type || !value || !activeFilters[type]) return;

    el.classList.toggle('active');

    if (activeFilters[type].has(value)) {
      activeFilters[type].delete(value);
    } else {
      activeFilters[type].add(value);
    }

    updateMapStyle();
  });
});
