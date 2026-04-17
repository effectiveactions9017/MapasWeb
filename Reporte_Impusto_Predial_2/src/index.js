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
// ✅ + PREDIOS PÚBLICOS SE RESALTAN UNO POR UNO
// ✅ + PAGO MARZO COMO PRIORIDAD DE "AL DÍA"
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

// Capas por categoría
const CATEGORY_CONFIG = {
  publicos: {
    label: 'Predios públicos',
    color: '#4fc3f7',
    layerId: 'predios_publicos_layer'
  },
  mora: {
    label: 'Predios con mora',
    color: '#e63946',
    layerId: 'predios_mora_layer'
  },
  aldia: {
    label: 'Predios al día',
    color: '#2ec4b6',
    layerId: 'predios_aldia_layer'
  },
  sinpago: {
    label: 'Posibles predios sin pagar',
    color: '#ffb703',
    layerId: 'predios_sinpago_layer'
  }
};

// =====================================================
// Helpers
// =====================================================
function norm(v) {
  return (v ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function formatCOP(value, fallback = 'N/A') {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return isNaN(n) ? fallback : '$ ' + n.toLocaleString('es-CO');
}

function hasValue(v) {
  return v !== null && v !== undefined && v !== '';
}

// ✅ Elimina duplicados por código para evitar sobreposición visual
function deduplicateGeoJSONByCodigo(fc) {
  if (!fc || !Array.isArray(fc.features)) return fc;

  const seen = new Set();
  const uniqueFeatures = [];

  for (const feature of fc.features) {
    const codigo = norm(feature?.properties?.codigo);

    if (!codigo) {
      uniqueFeatures.push(feature);
      continue;
    }

    if (!seen.has(codigo)) {
      seen.add(codigo);
      uniqueFeatures.push(feature);
    }
  }

  return {
    ...fc,
    features: uniqueFeatures
  };
}

// ✅ Clasificación única por prioridad:
// 1) Públicos
// 2) Pago marzo = al día
// 3) Mora
// 4) Pago febrero = al día
// 5) Posibles sin pagar
function getCategoriaPredio(props = {}) {
  const nombre = norm(props.NOMBRE);
  const esPublico = nombre === 'municipio de sesquile';

  const tienePagoMarzo = hasValue(props['pago marzo']);
  const tienePagoFebrero = hasValue(props['valor ultimo pago']);
  const tieneValorMora = hasValue(props['total valor mora']);

  if (esPublico) return 'publicos';
  if (tienePagoMarzo) return 'aldia';
  if (tieneValorMora) return 'mora';
  if (tienePagoFebrero) return 'aldia';
  return 'sinpago';
}

function getCategoriaLabel(cat) {
  return CATEGORY_CONFIG[cat]?.label || 'Sin categoría';
}

// ✅ Punto representativo del feature
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
    return [Number(c[0]), Number(c[1])];
  }

  try {
    const pt = turf.pointOnFeature(feature).geometry.coordinates;
    return [Number(pt[0]), Number(pt[1])];
  } catch (e) {}

  return [-73.79724, 5.04463];
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function buildPopupHTML(props, lngLat = null) {
  props = props || {};

  const categoria = getCategoriaPredio(props);

  const tienePagoMarzo = hasValue(props['pago marzo']);
  const tienePagoFebrero = hasValue(props['valor ultimo pago']);
  const tieneValorMora = hasValue(props['total valor mora']);

  const pagoMarzoTxt = tienePagoMarzo
    ? formatCOP(props['pago marzo'], 'N/A')
    : '';

  const pagoFebreroTxt = tienePagoFebrero
    ? formatCOP(props['valor ultimo pago'], 'N/A')
    : '';

  const valorMoraTxt = tieneValorMora
    ? formatCOP(props['total valor mora'], '$ 0')
    : '';

  let infoPagoHTML = '';

  if (categoria === 'publicos') {
    infoPagoHTML += `<strong>Categoría:</strong> Predio público<br>`;
  } else if (categoria === 'mora') {
    infoPagoHTML += `<strong>Categoría:</strong> Predio con mora<br>`;
  } else if (categoria === 'aldia') {
    infoPagoHTML += `<strong>Categoría:</strong> Predio al día<br>`;
  } else {
    infoPagoHTML += `<strong>Categoría:</strong> Posible predio sin pagar<br>`;
  }

  if (!tienePagoMarzo && !tienePagoFebrero && !tieneValorMora) {
    infoPagoHTML += `<strong>Información de pago:</strong> No se tiene información<br>`;
  } else {
    if (tienePagoMarzo) {
      infoPagoHTML += `<strong>Pago marzo:</strong> ${pagoMarzoTxt}<br>`;
    } else if (tienePagoFebrero) {
      infoPagoHTML += `<strong>Pago febrero:</strong> ${pagoFebreroTxt}<br>`;
    }

    if (tieneValorMora && categoria === 'mora') {
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

  return `
    <strong>Código:</strong> ${props.codigo ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? 'N/A'}<br>
    ${infoPagoHTML}

    <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
      ${svBtn}
    </div>

    <br><a style="font-size:9px;">&#9400; EffectiveActions</a>
  `;
}

// =====================================================
// Procesar dataset y agregar categoría
// =====================================================
function enrichPrediosData(rawFC) {
  const dedup = deduplicateGeoJSONByCodigo(rawFC);

  const features = (dedup.features || []).map((feature) => {
    const props = { ...(feature.properties || {}) };
    props.__categoria = getCategoriaPredio(props);

    return {
      ...feature,
      properties: props
    };
  });

  return {
    ...dedup,
    features
  };
}

// =====================================================
// Crear source y capas por categoría
// =====================================================
function addPrediosLayer(geojsonFile, sourceId) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((rawData) => {
      const data = enrichPrediosData(rawData);
      PREDIOS_DATA = data;

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data
        });
      }

      addCategoryLayers(sourceId);
      bindCategoryLayerEvents();
      bindLegendToggles();
    })
    .catch((err) => console.error('Error cargando GeoJSON:', err));
}

function addCategoryLayers(sourceId) {
  Object.entries(CATEGORY_CONFIG).forEach(([catKey, cfg]) => {
    if (!map.getLayer(cfg.layerId)) {
      map.addLayer({
        id: cfg.layerId,
        source: sourceId,
        type: 'fill',
        minzoom: 12,
        filter: ['==', ['get', '__categoria'], catKey],
        paint: {
          'fill-color': cfg.color,
          'fill-opacity': 0.6,
          'fill-outline-color': '#ffffff'
        }
      });
    }
  });
}

// =====================================================
// Eventos sobre capas
// =====================================================
function handlePredioClick(e) {
  const feature = e.features && e.features[0];
  if (!feature) return;

  const props = feature.properties || {};
  const lngLatClick = e.lngLat;

  highlightGroupFromFeature(feature);

  const svLngLat = getFeatureLngLat(feature, lngLatClick);

  popup
    .setLngLat(lngLatClick)
    .setHTML(buildPopupHTML(props, svLngLat))
    .addTo(map);
}

function bindCategoryLayerEvents() {
  Object.values(CATEGORY_CONFIG).forEach((cfg) => {
    const layerId = cfg.layerId;

    try { map.off('click', layerId, handlePredioClick); } catch (e) {}
    try { map.off('mouseenter', layerId); } catch (e) {}
    try { map.off('mouseleave', layerId); } catch (e) {}

    map.on('click', layerId, handlePredioClick);

    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });
  });
}

// =====================================================
// Resaltado
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
        'fill-opacity': 0
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

function zoomToFeatureCollection(fc) {
  try {
    const bounds = turf.bbox(fc);
    if (
      Array.isArray(bounds) &&
      bounds.length === 4 &&
      bounds.every((n) => typeof n === 'number' && !isNaN(n))
    ) {
      map.fitBounds(bounds, { padding: 40 });
    }
  } catch (e) {
    console.warn('No se pudo calcular el zoom al grupo resaltado.', e);
  }
}

function highlightGroupFromFeature(feature) {
  const props = feature.properties || {};
  const features =
    PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features) ? PREDIOS_DATA.features : [];

  if (!features.length) {
    setHighlight([feature]);
    return;
  }

  const categoria = getCategoriaPredio(props);

  // ✅ Si es predio público, resaltar SOLO ese predio
  if (categoria === 'publicos') {
    const group = [feature];
    setHighlight(group);
    zoomToFeatureCollection({ type: 'FeatureCollection', features: group });
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
  zoomToFeatureCollection({ type: 'FeatureCollection', features: group });
}

// =====================================================
// Leyenda interactiva
// =====================================================
function bindLegendToggles() {
  const buttons = document.querySelectorAll('.legend-toggle');

  buttons.forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      const cfg = CATEGORY_CONFIG[category];
      if (!cfg) return;

      const layerId = cfg.layerId;
      if (!map.getLayer(layerId)) return;

      const currentVisibility = map.getLayoutProperty(layerId, 'visibility');
      const willHide = currentVisibility !== 'none';

      map.setLayoutProperty(layerId, 'visibility', willHide ? 'none' : 'visible');

      btn.classList.toggle('inactive', willHide);
      btn.classList.toggle('active', !willHide);
      btn.textContent = willHide ? 'OFF' : 'ON';
    });
  });
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

  // ✅ Si el resultado es predio público, solo resaltar uno
  if (getCategoriaPredio(properties) === 'publicos') {
    toHighlight = [
      {
        type: 'Feature',
        geometry: result.geometry,
        properties: properties
      }
    ];
  } else if ((matchField === 'NUMERO_DOCUMENTO' || matchField === 'codigo') && matchValue) {
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
  zoomToFeatureCollection(fc);

  const featureForPopup = toHighlight[0] || {
    type: 'Feature',
    geometry: result.geometry,
    properties: properties
  };

  const popupLngLat = getFeatureLngLat(featureForPopup, result.center
    ? { lng: result.center[0], lat: result.center[1] }
    : null);

  popup
    .setLngLat(popupLngLat)
    .setHTML(buildPopupHTML(featureForPopup.properties || properties, popupLngLat))
    .addTo(map);
});

// =====================================================
// Cargar capa predial + resaltado
// =====================================================
map.on('style.load', () => {
  addPrediosLayer(
    'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',
    'predios_ssk'
  );

  ensureHighlightLayers();

  if (!map._controlsAddedOnce) {
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(geocoder, 'top-left');
    map._controlsAddedOnce = true;
  }
});
