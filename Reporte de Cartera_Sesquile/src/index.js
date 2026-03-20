// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Todos los predios siempre visibles
// ✅ Sin categoría = solo contorno
// ✅ Con categoría = color por riesgo + filtro por vigencia
// ✅ Popup actualizado + slider de transparencia
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

// ================================
// 🔹 OPACIDAD DINÁMICA
// ================================
let polygonOpacity = 0.85;

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
// EXPRESIONES NORMALIZADAS
// =====================================================
function riskExpression() {
  return [
    'case',
    ['in', 'ALTO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'ALTO',
    ['in', 'MEDIO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'MEDIO',
    ['in', 'BAJO', ['upcase', ['coalesce', ['get', 'nivel_riesgo'], '']]], 'BAJO',
    ''
  ];
}

function vigenciaExpression() {
  return [
    'case',
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
  ];
}

// =====================================================
// ESTILO DINÁMICO
// - Capa base_line: todos los contornos
// - Capa color_fill: solo los que coinciden con filtros
// =====================================================
function updateMapStyle() {
  const riesgos = Array.from(activeFilters.riesgo);
  const vigencias = Array.from(activeFilters.vigencia);

  const riskExpr = riskExpression();
  const vigExpr = vigenciaExpression();

  const isAlto = [
    'all',
    ['==', riskExpr, 'ALTO'],
    ['in', 'ALTO', ['literal', riesgos]],
    ['in', vigExpr, ['literal', vigencias]]
  ];

  const isMedio = [
    'all',
    ['==', riskExpr, 'MEDIO'],
    ['in', 'MEDIO', ['literal', riesgos]],
    ['in', vigExpr, ['literal', vigencias]]
  ];

  const isBajo = [
    'all',
    ['==', riskExpr, 'BAJO'],
    ['in', 'BAJO', ['literal', riesgos]],
    ['in', vigExpr, ['literal', vigencias]]
  ];

  map.setPaintProperty('predios_ssk_fill_color', 'fill-color', [
    'case',
    isAlto, '#e74c3c',
    isMedio, '#f1c40f',
    isBajo, '#2ecc71',
    'rgba(0,0,0,0)'
  ]);

  map.setPaintProperty('predios_ssk_fill_color', 'fill-opacity', [
    'case',
    ['any', isAlto, isMedio, isBajo],
    polygonOpacity,
    0
  ]);

  // contorno blanco para los coloreados, gris para el resto
  map.setPaintProperty('predios_ssk_line_base', 'line-color', [
    'case',
    ['any', isAlto, isMedio, isBajo],
    '#ffffff',
    '#7f7f7f'
  ]);

  map.setPaintProperty('predios_ssk_line_base', 'line-width', [
    'case',
    ['any', isAlto, isMedio, isBajo],
    1.4,
    1.0
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

      // 1) Capa invisible para interacción / click
      map.addLayer({
        id: 'predios_ssk_hit',
        type: 'fill',
        source: 'predios_ssk',
        paint: {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-opacity': 0.01
        }
      });

      // 2) Capa de relleno coloreado
      map.addLayer({
        id: 'predios_ssk_fill_color',
        type: 'fill',
        source: 'predios_ssk',
        paint: {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-opacity': 0
        }
      });

      // 3) Capa de contorno base para TODOS los predios
      map.addLayer({
        id: 'predios_ssk_line_base',
        type: 'line',
        source: 'predios_ssk',
        paint: {
          'line-color': '#7f7f7f',
          'line-width': 1
        }
      });

      // Popup sobre la capa hit
      map.on('click', 'predios_ssk_hit', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const coords = getFeatureLngLat(f, e.lngLat);

        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties, coords))
          .addTo(map);
      });

      map.on('mouseenter', 'predios_ssk_hit', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'predios_ssk_hit', () => {
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

// =====================================================
// SLIDER DE TRANSPARENCIA
// =====================================================
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');

if (opacitySlider && opacityValue) {
  opacitySlider.addEventListener('input', (e) => {
    polygonOpacity = Number(e.target.value) / 100;
    opacityValue.textContent = `${e.target.value}%`;
    updateMapStyle();
  });
}
