// =====================================================
// ✅ Visor Predial Santo Domingo - Mapbox GL JS
// ✅ Búsqueda local por: TERRENO_CO, nombre_completo, documento
// ✅ Resalta 1 o varios predios (mismo código o documento)
// ✅ Predios SIN NOMBRE en naranja
// ✅ Predios del MUNICIPIO en color diferente
// ✅ Popup solo por click
// ✅ Street View
// ✅ Google Satellite como mapa base
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'google-satellite': {
        type: 'raster',
        tiles: [
          'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'google-satellite-layer',
        type: 'raster',
        source: 'google-satellite'
      }
    ]
  },
  center: [-75.163994, 6.472377],
  zoom: 15,
  pitch: 0,
  bearing: 0,
  antialias: true
});

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});

let PREDIOS_DATA = null;
let PREDIOS_DATA_RENDER = null;

// =====================================================
// Helpers
// =====================================================
function formatAvaluo(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  return isNaN(n) ? String(value) : n.toLocaleString('es-CO');
}

function formatArea(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  return isNaN(n) ? String(value) : Math.round(n).toLocaleString('es-CO');
}

function norm(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function getFeatureLngLat(feature, fallbackLngLat = null) {
  if (
    fallbackLngLat &&
    typeof fallbackLngLat.lng === 'number' &&
    typeof fallbackLngLat.lat === 'number'
  ) {
    return [fallbackLngLat.lng, fallbackLngLat.lat];
  }

  const geom = feature?.geometry;
  if (!geom) return [-75.163994, 6.472377];

  if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
    return [Number(geom.coordinates[0]), Number(geom.coordinates[1])];
  }

  try {
    const pt = turf.pointOnFeature(feature).geometry.coordinates;
    return [Number(pt[0]), Number(pt[1])];
  } catch (e) {}

  return [-75.163994, 6.472377];
}

// =====================================================
// Deduplicar
// =====================================================
function deduplicateGeoJSONByTerreno(fc) {
  if (!fc || !Array.isArray(fc.features)) return fc;

  const seen = new Set();
  const unique = [];

  for (const f of fc.features) {
    const cod = norm(f.properties?.TERRENO_CO);

    if (!cod) {
      unique.push(f);
      continue;
    }

    if (!seen.has(cod)) {
      seen.add(cod);
      unique.push(f);
    }
  }

  return { ...fc, features: unique };
}

// =====================================================
// Popup
// =====================================================
function buildPopupHTML(props, lngLat = null, extraHTML = '') {
  props = props || {};

  const esPublico =
    (props.nombre_completo || '').toString().trim().toUpperCase() === 'MUNICIPIO';

  const publicoHTML = esPublico
    ? `<strong style="color:#3b82f6;">🏛️ Predio público</strong><br>`
    : '';

  const svBtn = lngLat
    ? `
      <div style="margin-top:10px;">
        <a href="${streetViewUrl(lngLat)}" target="_blank" rel="noopener"
           style="display:inline-block; padding:6px 10px; border-radius:6px;
                  background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
          📷 Street View
        </a>
      </div>
    `
    : '';

  return `
    <strong>Código:</strong> ${props.TERRENO_CO ?? 'N/A'}<br>
    <strong>Destino:</strong> ${props['destino.economico'] ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.nombre_completo ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.documento ?? 'N/A'}<br>
    <strong>Avalúo:</strong> ${formatAvaluo(props.avaluo)}<br>
    <strong>Área (m²):</strong> ${formatArea((Number(props['terreno.ha']) || 0) * 10000)}<br>
    ${publicoHTML}
    ${extraHTML}
    ${svBtn}
    <br><a style="font-size:9px; color:#000;">&#9400; EffectiveActions</a>
  `;
}

// =====================================================
// Highlight
// =====================================================
function ensureHighlightLayers() {
  if (!map.getSource('predios_highlight')) {
    map.addSource('predios_highlight', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getLayer('predios_highlight_fill')) {
    map.addLayer({
      id: 'predios_highlight_fill',
      type: 'fill',
      source: 'predios_highlight',
      paint: {
        'fill-color': '#ffff00',
        'fill-opacity': 0.28
      }
    });
  }

  if (!map.getLayer('predios_highlight_line')) {
    map.addLayer({
      id: 'predios_highlight_line',
      type: 'line',
      source: 'predios_highlight',
      paint: {
        'line-color': '#ffff00',
        'line-width': 4
      }
    });
  }
}

function setHighlight(featuresArr) {
  const fc = {
    type: 'FeatureCollection',
    features: featuresArr || []
  };

  const src = map.getSource('predios_highlight');
  if (src) src.setData(fc);
}

function highlightGroupFromFeature(feature) {
  const props = feature.properties || {};
  const features =
    PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features) ? PREDIOS_DATA.features : [];

  if (!features.length) {
    setHighlight([feature]);
    return [feature];
  }

  const codigo = norm(props.TERRENO_CO);
  const doc = norm(props.documento);

  let group = [];

  if (doc) {
    group = features.filter((f) => norm(f.properties?.documento) === doc);
  } else if (codigo) {
    group = features.filter((f) => norm(f.properties?.TERRENO_CO) === codigo);
  }

  if (!group.length) group = [feature];

  setHighlight(group);

  try {
    const bounds = turf.bbox({
      type: 'FeatureCollection',
      features: group
    });
    map.fitBounds(bounds, { padding: 40 });
  } catch (e) {}

  return group;
}

// =====================================================
// Cargar capa
// =====================================================
function addLayer() {
  fetch('../src/data/BASE_PREDIAL_SANTO_DOMINGO_FINAL.geojson')
    .then((r) => r.json())
    .then((data) => {
      PREDIOS_DATA = data;
      PREDIOS_DATA_RENDER = deduplicateGeoJSONByTerreno(data);

      if (map.getSource('predios')) {
        map.getSource('predios').setData(PREDIOS_DATA_RENDER);
      } else {
        map.addSource('predios', {
          type: 'geojson',
          data: PREDIOS_DATA_RENDER
        });
      }

      if (!map.getLayer('predios-layer')) {
        map.addLayer({
          id: 'predios-layer',
          type: 'fill',
          source: 'predios',
          minzoom: 12,
          paint: {
            'fill-color': [
              'case',

              // Predios públicos
              ['==', ['upcase', ['coalesce', ['get', 'nombre_completo'], '']], 'MUNICIPIO'],
              '#3b82f6',

              // Sin nombre
              ['==', ['coalesce', ['get', 'nombre_completo'], ''], ''],
              '#ffb703',

              // Normal
              '#2ec4b6'
            ],
            'fill-opacity': 0.72,
            'fill-outline-color': '#ffffff'
          }
        });
      }

      ensureHighlightLayers();

      try { map.off('click', 'predios-layer'); } catch (e) {}
      try { map.off('mouseenter', 'predios-layer'); } catch (e) {}
      try { map.off('mouseleave', 'predios-layer'); } catch (e) {}

      map.on('click', 'predios-layer', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const group = highlightGroupFromFeature(f);
        const svLngLat = getFeatureLngLat(f, e.lngLat);

        const codigos = group
          .map((g) => (g.properties?.TERRENO_CO ?? '').toString().trim())
          .filter(Boolean);

        const listaCodigos = codigos.length > 1
          ? `<br><strong>Predios vinculados (${codigos.length}):</strong><br>${codigos
              .slice(0, 10)
              .join('<br>')}${codigos.length > 10 ? '<br>…' : ''}`
          : '';

        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties, svLngLat, listaCodigos))
          .addTo(map);
      });

      map.on('mouseenter', 'predios-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'predios-layer', () => {
        map.getCanvas().style.cursor = '';
      });
    })
    .catch((err) => console.error('Error cargando GeoJSON:', err));
}

// =====================================================
// Geocoder local
// =====================================================
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
      PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features) ? PREDIOS_DATA.features : [];
    if (!features.length) return matchingFeatures;

    for (const feature of features) {
      const props = feature.properties || {};
      const codigo = (props.TERRENO_CO ?? '').toString().toLowerCase();
      const nombre = (props.nombre_completo ?? '').toString().toLowerCase();
      const documento = (props.documento ?? '').toString().toLowerCase();

      const match =
        (codigo && codigo.includes(q)) ||
        (nombre && nombre.includes(q)) ||
        (documento && documento.includes(q));

      if (!match) continue;

      let centro;
      try {
        centro = turf.centroid(feature).geometry.coordinates;
      } catch (e) {
        centro = getFeatureLngLat(feature);
      }

      const codTxt = (props.TERRENO_CO ?? '').toString().trim();
      const nomTxt = (props.nombre_completo ?? '').toString().trim();
      const docTxt = (props.documento ?? '').toString().trim();

      let matchField = null;
      let matchValue = null;

      if (codigo && codigo.includes(q)) {
        matchField = 'TERRENO_CO';
        matchValue = codTxt;
      } else if (documento && documento.includes(q)) {
        matchField = 'documento';
        matchValue = docTxt;
      } else if (nombre && nombre.includes(q)) {
        matchField = 'nombre_completo';
        matchValue = nomTxt;
      }

      const props2 = {
        ...props,
        __matchField: matchField,
        __matchValue: matchValue
      };

      matchingFeatures.push({
        type: 'Feature',
        geometry: feature.geometry,
        properties: props2,
        place_name: `Código: ${codTxt || 'N/A'} | Nombre: ${nomTxt || 'N/A'} | Doc: ${docTxt || 'N/A'}`,
        text: codTxt || nomTxt || docTxt || 'Resultado',
        center: centro,
        place_type: ['place']
      });

      if (matchingFeatures.length >= 10) break;
    }

    return matchingFeatures;
  }
});

map.addControl(geocoder, 'top-left');

// =====================================================
// Al seleccionar resultado
// =====================================================
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  const properties = result.properties || {};
  const matchField = properties.__matchField;
  const matchValue = (properties.__matchValue ?? '').toString().trim();

  const features =
    PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features) ? PREDIOS_DATA.features : [];

  let toHighlight = [];

  if ((matchField === 'documento' || matchField === 'TERRENO_CO') && matchValue) {
    const mv = norm(matchValue);
    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      const v = matchField === 'documento' ? p.documento : p.TERRENO_CO;
      return norm(v) === mv;
    });
  }

  if (!toHighlight.length) {
    toHighlight = [{
      type: 'Feature',
      geometry: result.geometry,
      properties: properties
    }];
  }

  setHighlight(toHighlight);

  const fc = {
    type: 'FeatureCollection',
    features: toHighlight
  };

  try {
    const bounds = turf.bbox(fc);
    map.fitBounds(bounds, { padding: 40 });
  } catch (e) {}

  const codigos = toHighlight
    .map((f) => (f.properties?.TERRENO_CO ?? '').toString().trim())
    .filter(Boolean);

  const listaCodigos = codigos.length
    ? `<br><strong>Predios vinculados (${codigos.length}):</strong><br>${codigos
        .slice(0, 10)
        .join('<br>')}${codigos.length > 10 ? '<br>…' : ''}`
    : '';

  let center = result.center;
  if (!Array.isArray(center) || center.length < 2) {
    try {
      const b = turf.bbox(fc);
      center = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    } catch (e) {
      center = [-75.163994, 6.472377];
    }
  }

  popup
    .setLngLat(center)
    .setHTML(buildPopupHTML(properties, center, listaCodigos))
    .addTo(map);
});

// =====================================================
// Inicio
// =====================================================
map.on('load', () => {
  addLayer();
  map.addControl(new mapboxgl.NavigationControl());
});
