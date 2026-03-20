// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Todos los predios siempre visibles
// ✅ Sin categoría = solo contorno
// ✅ Con categoría = color por riesgo + filtro por vigencia
// ✅ Popup actualizado + slider de transparencia
// ✅ Buscador local por código, nombre y documento
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-v9',
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

function norm(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
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

  map.setPaintProperty('predios_ssk_line_base', 'line-color', [
    'case',
    ['any', isAlto, isMedio, isBajo],
    '#ffffff',
    '#bfc5cc'
  ]);

  map.setPaintProperty('predios_ssk_line_base', 'line-width', [
    'case',
    ['any', isAlto, isMedio, isBajo],
    2.2,
    1.6
  ]);

  map.setPaintProperty('predios_ssk_line_base', 'line-opacity', [
    'case',
    ['any', isAlto, isMedio, isBajo],
    1,
    0.95
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

      // Capa invisible para interacción
      map.addLayer({
        id: 'predios_ssk_hit',
        type: 'fill',
        source: 'predios_ssk',
        paint: {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-opacity': 0.01
        }
      });

      // Capa de relleno coloreado
      map.addLayer({
        id: 'predios_ssk_fill_color',
        type: 'fill',
        source: 'predios_ssk',
        paint: {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-opacity': 0
        }
      });

      // Capa de contorno base para todos
      map.addLayer({
        id: 'predios_ssk_line_base',
        type: 'line',
        source: 'predios_ssk',
        paint: {
          'line-color': '#bfc5cc',
          'line-width': 1.6,
          'line-opacity': 0.95
        }
      });

      // Popup
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
      addLocalGeocoder();
    })
    .catch(err => console.error('Error cargando GeoJSON:', err));
}

// =====================================================
// BUSCADOR LOCAL
// =====================================================
function addLocalGeocoder() {
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

      const features =
        PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features)
          ? PREDIOS_DATA.features
          : [];

      if (!features.length) return matchingFeatures;

      for (const feature of features) {
        const props = feature.properties || {};

        const codigo = (props.codigo ?? '').toString().toLowerCase();
        const nombre = (props.NOMBRE ?? '').toString().toLowerCase();
        const documento = (props.NUMERO_DOCUMENTO ?? '').toString().toLowerCase();

        const match =
          (codigo && codigo.includes(q)) ||
          (nombre && nombre.includes(q)) ||
          (documento && documento.includes(q));

        if (!match) continue;

        const centro = getFeatureLngLat(feature);

        const codTxt = (props.codigo ?? '').toString().trim();
        const nomTxt = (props.NOMBRE ?? '').toString().trim();
        const docTxt = (props.NUMERO_DOCUMENTO ?? '').toString().trim();

        matchingFeatures.push({
          type: 'Feature',
          geometry: feature.geometry,
          properties: props,
          place_name: `Código: ${codTxt || 'N/A'} | Nombre: ${nomTxt || 'N/A'} | Doc: ${
            docTxt || 'N/A'
          }`,
          center: centro,
          place_type: ['place']
        });

        if (matchingFeatures.length >= 10) break;
      }

      return matchingFeatures;
    }
  });

  map.addControl(geocoder, 'top-left');

  geocoder.on('result', (e) => {
    const result = e.result;
    if (!result || !result.geometry) return;

    const center = result.center || getFeatureLngLat(result);
    const bbox = turf.bbox(result);

    map.fitBounds(bbox, { padding: 60, maxZoom: 18 });

    popup
      .setLngLat(center)
      .setHTML(buildPopupHTML(result.properties || {}, center))
      .addTo(map);
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
