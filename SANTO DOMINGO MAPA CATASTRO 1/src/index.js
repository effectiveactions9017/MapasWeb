// =====================================================
// ✅ Visor Predial Santo Domingo - Mapbox GL JS
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [-75.163994, 6.472377],
  zoom: 15,
  container: 'map'
});

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true
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
  return (v ?? '').toString().toLowerCase().replace(/\s+/g, '').trim();
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

  const c = feature?.geometry?.coordinates;
  if (
    Array.isArray(c) &&
    c.length >= 2 &&
    typeof c[0] === 'number' &&
    typeof c[1] === 'number'
  ) {
    return [c[0], c[1]];
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
// Cargar capa
// =====================================================
function addLayer() {
  fetch('../src/data/BASE_PREDIAL_SANTO_DOMINGO_FINAL.geojson')
    .then(r => r.json())
    .then(data => {
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
          paint: {
            'fill-color': [
              'case',

              // 🔵 Predios públicos
              ['==', ['upcase', ['coalesce', ['get', 'nombre_completo'], '']], 'MUNICIPIO'],
              '#3b82f6',

              // 🟠 Sin nombre
              ['==', ['coalesce', ['get', 'nombre_completo'], ''], ''],
              '#ffb703',

              // 🟢 Predio normal
              '#2ec4b6'
            ],
            'fill-opacity': 0.7,
            'fill-outline-color': '#ffffff'
          }
        });
      }

      try { map.off('click', 'predios-layer'); } catch (e) {}
      try { map.off('mouseenter', 'predios-layer'); } catch (e) {}
      try { map.off('mouseleave', 'predios-layer'); } catch (e) {}

      map.on('click', 'predios-layer', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;

        const svLngLat = getFeatureLngLat(f, e.lngLat);

        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties, svLngLat))
          .addTo(map);
      });

      map.on('mouseenter', 'predios-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'predios-layer', () => {
        map.getCanvas().style.cursor = '';
      });
    })
    .catch(err => console.error('Error cargando GeoJSON:', err));
}

// =====================================================
map.on('load', () => {
  addLayer();
  map.addControl(new mapboxgl.NavigationControl());
});
