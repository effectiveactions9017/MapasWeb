// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda local por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios (mismo codigo o documento)
// ✅ Usa PREDIOS_DATA para búsqueda completa (sin querySourceFeatures)
// ✅ Evita errores "source/layer already exists"
// ✅ POPUP SOLO POR CLICK (no hover)
// ✅ + BOTÓN STREET VIEW EN POPUP (también para predios/polígonos)
// ✅ + BOTÓN IR A PAGAR IMPUESTO
// ✅ + COLOR ÚNICO PARA TODOS LOS PREDIOS
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

// ✅ Dataset completo para búsquedas
let PREDIOS_DATA = null;

// =====================================================
// Helpers
// =====================================================
function norm(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function formatCOP(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return isNaN(n) ? fallback : '$ ' + n.toLocaleString('es-CO');
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
  if (
    Array.isArray(c) &&
    c.length >= 2 &&
    typeof c[0] === 'number' &&
    typeof c[1] === 'number'
  ) {
    return [Number(c[0]), Number(c[1])];
  }

  // 3) si es polígono
  try {
    const pt = turf.pointOnFeature(feature).geometry.coordinates;
    return [Number(pt[0]), Number(pt[1])];
  } catch (e) {}

  // 4) fallback
  return [-73.79724, 5.04463];
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function buildPopupHTML(props, lngLat = null, extraHTML = '') {
  props = props || {};

  const tieneUltimoPago =
    props['valor ultimo pago'] !== null &&
    props['valor ultimo pago'] !== undefined &&
    props['valor ultimo pago'] !== '';

  const tieneValorMora =
    props['total valor mora'] !== null &&
    props['total valor mora'] !== undefined &&
    props['total valor mora'] !== '';

  const ultimoPagoTxt = tieneUltimoPago
    ? formatCOP(props['valor ultimo pago'], 'N/A')
    : '';

  const valorMoraTxt = tieneValorMora
    ? formatCOP(props['total valor mora'], '$ 0')
    : '';

  let infoPagoHTML = '';

  if (!tieneUltimoPago && !tieneValorMora) {
    infoPagoHTML = `<strong>Información de pago:</strong> No se tiene información<br>`;
  } else {
    if (tieneUltimoPago) {
      infoPagoHTML += `<strong>Último pago realizado:</strong> ${ultimoPagoTxt}<br>`;
    }
    if (tieneValorMora) {
      infoPagoHTML += `<strong>Valor en mora:</strong> ${valorMoraTxt}<br>`;
    }
  }

  const svBtn = lngLat
    ? `
      <a href="${streetViewUrl(lngLat)}" target="_blank" rel="noopener"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    `
    : '';

  const pagoBtn = `
    <a href="https://sesquile.universo-online.com.co/WebForms/ImpuestoPredial/Liquidar_Impuesto_Predial_Usuario_1cero1.aspx"
       target="_blank" rel="noopener"
       style="display:inline-block; padding:6px 10px; border-radius:6px;
              background:#2ec4b6; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
      💳 Ir a pagar impuesto
    </a>
  `;

  return `
    <strong>Código:</strong> ${props.codigo ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? 'N/A'}<br>
    ${infoPagoHTML}

    <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
      ${pagoBtn}
      ${svBtn}
    </div>

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
      if (sourceId === 'predios_ssk') PREDIOS_DATA = data;

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
            'fill-color': baseColor,
            'fill-opacity': 0.75,
            'fill-outline-color': '#ffffff'
          }
        });
      }

      // =====================================================
      // ✅ POPUP SOLO POR CLICK
      // =====================================================
      try { map.off('click', layerId); } catch (e) {}
      try { map.off('mouseenter', layerId); } catch (e) {}
      try { map.off('mouseleave', layerId); } catch (e) {}

      map.on('click', layerId, (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const props = feature.properties || {};
        const lngLatClick = e.lngLat;

        // Resaltar grupo
        highlightGroupFromFeature(feature);

        // coords para Street View
        const svLngLat = getFeatureLngLat(feature, lngLatClick);

        popup
          .setLngLat(lngLatClick)
          .setHTML(buildPopupHTML(props, svLngLat))
          .addTo(map);
      });

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
  const props = feature.properties || {};
  const features =
    PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features) ? PREDIOS_DATA.features : [];

  if (!features.length) {
    setHighlight([feature]);
    return;
  }

  const codigo = norm(props.codigo);
  const doc = norm(props.NUMERO_DOCUMENTO);

  let group = [];

  if (doc) {
    group = features.filter((f) => norm(f.properties?.NUMERO_DOCUMENTO) === doc);
  } else if (codigo) {
    group = features.filter((f) => norm(f.properties?.codigo) === codigo);
  }

  if (!group.length) group = [feature];

  setHighlight(group);

  const bounds = turf.bbox({ type: 'FeatureCollection', features: group });
  map.fitBounds(bounds, { padding: 40 });
}

// =====================================================
// Cargar capa predial + resaltado
// =====================================================
map.on('style.load', () => {
  addLayer(
    'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',
    'predios_ssk',
    'predios_ssk_layer',
    '#2ec4b6'
  );

  ensureHighlightLayers();
  map.addControl(new mapboxgl.NavigationControl());
});

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
      const codigo = (props.codigo ?? '').toString().toLowerCase();
      const nombre = (props.NOMBRE ?? '').toString().toLowerCase();
      const documento = (props.NUMERO_DOCUMENTO ?? '').toString().toLowerCase();

      const match =
        (codigo && codigo.includes(q)) ||
        (nombre && nombre.includes(q)) ||
        (documento && documento.includes(q));

      if (!match) continue;

      const centro = turf.centroid(feature).geometry.coordinates;

      const codTxt = (props.codigo ?? '').toString().trim();
      const nomTxt = (props.NOMBRE ?? '').toString().trim();
      const docTxt = (props.NUMERO_DOCUMENTO ?? '').toString().trim();

      let matchField = null;
      let matchValue = null;

      if (codigo && codigo.includes(q)) {
        matchField = 'codigo';
        matchValue = codTxt;
      } else if (documento && documento.includes(q)) {
        matchField = 'NUMERO_DOCUMENTO';
        matchValue = docTxt;
      } else if (nombre && nombre.includes(q)) {
        matchField = 'NOMBRE';
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

  if ((matchField === 'NUMERO_DOCUMENTO' || matchField === 'codigo') && matchValue) {
    const mv = norm(matchValue);
    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      const v = matchField === 'NUMERO_DOCUMENTO' ? p.NUMERO_DOCUMENTO : p.codigo;
      return norm(v) === mv;
    });
  }

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

  const fc = { type: 'FeatureCollection', features: toHighlight };
  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  const b = turf.bbox(fc);
  const center = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

  popup
    .setLngLat(result.center || turf.centroid(result).geometry.coordinates)
    .setHTML(buildPopupHTML(properties, center))
    .addTo(map);
});
