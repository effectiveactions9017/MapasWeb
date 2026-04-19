// =====================================================
// ✅ Visor Predial Santo Domingo - Mapbox GL JS
// ✅ Búsqueda local por: TERRENO_CO, nombre_completo, documento
// ✅ Resalta 1 o varios predios (mismo código o documento)
// ✅ Predios SIN NOMBRE en naranja
// ✅ Usa PREDIOS_DATA para búsqueda completa (sin querySourceFeatures)
// ✅ Evita errores "source/layer already exists"
// ✅ POPUP SOLO POR CLICK (no hover)
// ✅ + BOTÓN STREET VIEW EN POPUP (también para predios/polígonos)
//    (Google ajusta al panorama/vía más cercana)
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-75.163994, 6.472377],
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

// ✅ Dataset completo para búsquedas
let PREDIOS_DATA = null;

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
  return isNaN(n)
    ? String(value)
    : Math.round(n).toLocaleString('es-CO');
}

function norm(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

// ✅ Punto representativo del feature (para polígonos/puntos) + fallback
function getFeatureLngLat(feature, fallbackLngLat = null) {
  // 1) si viene del click (e.lngLat)
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

  // 4) fallback
  return [-75.163994, 6.472377];
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function buildPopupHTML(props, lngLat = null, extraHTML = '') {
  props = props || {};
  const avaluoTxt = formatAvaluo(props.avaluo);
  const areaTxt = formatArea((Number(props['terreno.ha']) || 0) * 10000);

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
    <strong>Avalúo:</strong> ${avaluoTxt}<br>
    <strong>Área (m²):</strong> ${areaTxt}<br>
    ${extraHTML}
    ${svBtn}
    <br><a style="font-size:9px;">&#9400; EffectiveActions</a>
  `;
}

// =====================================================
// Función para agregar capa GeoJSON
// =====================================================
function addLayer(geojsonFile, sourceId, layerId, baseColor) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((data) => {
      // Guardar dataset completo
      if (sourceId === 'predios_sd') PREDIOS_DATA = data;

      // ✅ Source seguro
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: data
        });
      }

      // ✅ Layer seguro
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: 'fill',
          minzoom: 12,
          paint: {
            // ✅ Sin nombre_completo = naranja, Con nombre_completo = baseColor
            'fill-color': [
              'case',
              ['==', ['coalesce', ['get', 'nombre_completo'], ''], ''],
              '#ffb703',
              baseColor
            ],
            'fill-opacity': 0.75,
            'fill-outline-color': '#ffffff'
          }
        });
      }

      // =====================================================
      // ✅ POPUP SOLO POR CLICK (se quita hover)
      // =====================================================
      try { map.off('click', layerId); } catch (e) {}
      try { map.off('mouseenter', layerId); } catch (e) {}
      try { map.off('mouseleave', layerId); } catch (e) {}

      map.on('click', layerId, (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const props = feature.properties || {};
        const lngLatClick = e.lngLat;

        // (Opcional) si quieres que al click también resalte el grupo:
        highlightGroupFromFeature(feature);

        // ✅ coords para Street View (click o punto representativo)
        const svLngLat = getFeatureLngLat(feature, lngLatClick);

        popup
          .setLngLat(lngLatClick)
          .setHTML(buildPopupHTML(props, svLngLat))
          .addTo(map);
      });

      // Cursor pointer
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    })
    .catch((err) => console.error('Error cargando GeoJSON:', err));
}

// =====================================================
// Fuente + capas de resaltado
// =====================================================
function ensureHighlightLayers() {
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
      paint: {
        'fill-color': '#ffff00',
        'fill-opacity': 0.30
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
  const hlSource = map.getSource('predios_highlight');
  if (hlSource) hlSource.setData(fc);
}

function highlightGroupFromFeature(feature) {
  // resalta por TERRENO_CO o documento si existen
  const props = feature.properties || {};
  const features =
    PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features) ? PREDIOS_DATA.features : [];

  if (!features.length) {
    setHighlight([feature]);
    return;
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

  // Zoom al conjunto
  const bounds = turf.bbox({ type: 'FeatureCollection', features: group });
  map.fitBounds(bounds, { padding: 40 });
}

// =====================================================
// Cargar capa predial + resaltado
// =====================================================
map.on('style.load', () => {
  addLayer(
    'BASE_PREDIAL_SANTO_DOMINGO_FINAL.geojson',
    'predios_sd',
    'predios_sd_layer',
    '#2ec4b6'
  );

  ensureHighlightLayers();
  map.addControl(new mapboxgl.NavigationControl());
});

// =====================================================
// Geocoder local: busca por TERRENO_CO, nombre_completo, documento
// (usando PREDIOS_DATA completo)
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

      const centro = turf.centroid(feature).geometry.coordinates;

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

      const props2 = { ...props, __matchField: matchField, __matchValue: matchValue };

      matchingFeatures.push({
        type: 'Feature',
        geometry: feature.geometry,
        properties: props2,
        place_name: `Código: ${codTxt || 'N/A'} | Nombre: ${nomTxt || 'N/A'} | Doc: ${
          docTxt || 'N/A'
        }`,
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
// Al seleccionar resultado: zoom + resaltar 1 o varios predios vinculados
// + popup SOLO cuando selecciona (no hover)
// =====================================================
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  const properties = result.properties || {};
  const matchField = properties.__matchField; // 'TERRENO_CO' | 'documento' | 'nombre_completo'
  const matchValue = (properties.__matchValue ?? '').toString().trim();

  const features =
    PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features) ? PREDIOS_DATA.features : [];

  let toHighlight = [];

  // ✅ Agrupar y resaltar todos los que compartan el mismo código o documento
  if ((matchField === 'documento' || matchField === 'TERRENO_CO') && matchValue) {
    const mv = norm(matchValue);
    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      const v = matchField === 'documento' ? p.documento : p.TERRENO_CO;
      return norm(v) === mv;
    });
  }

  // Fallback: si no encontró grupo, resalta el seleccionado
  if (!toHighlight.length) {
    toHighlight = [
      {
        type: 'Feature',
        geometry: result.geometry,
        properties: properties
      }
    ];
  }

  setHighlight(toHighlight);

  // Zoom al conjunto
  const fc = { type: 'FeatureCollection', features: toHighlight };
  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  // Lista de códigos
  const codigos = toHighlight
    .map((f) => (f.properties?.TERRENO_CO ?? '').toString().trim())
    .filter(Boolean);

  const listaCodigos = codigos.length
    ? `<br><strong>Predios vinculados (${codigos.length}):</strong><br>${codigos
        .slice(0, 10)
        .join('<br>')}${codigos.length > 10 ? '<br>…' : ''}`
    : '';

  // ✅ coords para Street View desde el centro del bbox del grupo
  const b = turf.bbox(fc);
  const center = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

  // Popup SOLO por selección (geocoder)
  popup
    .setLngLat(result.center || turf.centroid(result).geometry.coordinates)
    .setHTML(buildPopupHTML(properties, center, listaCodigos))
    .addTo(map);
});
