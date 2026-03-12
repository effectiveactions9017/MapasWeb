// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda local por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios (mismo codigo o documento)
// ✅ Clasificación visual por estado_pago
// ✅ Leyenda con encendido/apagado por categoría
// ✅ Usa PREDIOS_DATA para búsqueda completa
// ✅ Evita errores "source/layer already exists"
// ✅ POPUP SOLO POR CLICK (no hover)
// ✅ + BOTÓN STREET VIEW EN POPUP
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
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

// ✅ Estado de visibilidad por categoría
const estadoLayersVisibility = {
  predios_no_dia_layer: true,
  predios_si_dia_layer: true,
  predios_activos_publicos_layer: true
};

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
  return isNaN(n) ? String(value) : String(Math.round(n));
}

function norm(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function normalizeEstadoPagoLabel(value) {
  const v = (value ?? '').toString().trim();

  if (v === 'NO_ESTA_AL_DIA') return 'No está al día';
  if (v === 'ESTA_AL_DIA') return 'Está al día';
  if (v === 'Activos Publicos') return 'Activos públicos';

  return v || 'N/A';
}

// ✅ Filtros por categoría exacta
function getEstadoFilter(tipo) {
  if (tipo === 'no_dia') {
    return ['==', ['coalesce', ['get', 'estado_pago'], ''], 'NO_ESTA_AL_DIA'];
  }
  if (tipo === 'si_dia') {
    return ['==', ['coalesce', ['get', 'estado_pago'], ''], 'ESTA_AL_DIA'];
  }
  if (tipo === 'activos_publicos') {
    return ['==', ['coalesce', ['get', 'estado_pago'], ''], 'Activos Publicos'];
  }
  return true;
}

// ✅ Punto representativo del feature (para polígonos/puntos) + fallback
function getFeatureLngLat(feature, fallbackLngLat = null) {
  if (
    fallbackLngLat &&
    typeof fallbackLngLat.lng === 'number' &&
    typeof fallbackLngLat.lat === 'number'
  ) {
    return [fallbackLngLat.lng, fallbackLngLat.lat];
  }

  const c = feature?.geometry?.coordinates;
  if (Array.isArray(c) && c.length >= 2 && c[0] != null && c[1] != null) {
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

function buildPopupHTML(props, lngLat = null, extraHTML = '') {
  props = props || {};
  const avaluoTxt = formatAvaluo(props['AVALUO 2026']);
  const areaTxt = formatArea(props.Shape_Area);
  const estadoPagoTxt = normalizeEstadoPagoLabel(props.estado_pago);

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
    <strong>Código:</strong> ${props.codigo ?? 'N/A'}<br>
    <strong>Destino:</strong> ${props.DESTINO ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.NOMBRE ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO ?? 'N/A'}<br>
    <strong>Estado pago:</strong> ${estadoPagoTxt}<br>
    <strong>Avalúo 2026:</strong> ${avaluoTxt}<br>
    <strong>Área (㎡):</strong> ${areaTxt}<br>
    ${extraHTML}
    ${svBtn}
    <br><a style="font-size:9px;">&#9400; EffectiveActions</a>
  `;
}

// =====================================================
// Interacciones de click por layer
// =====================================================
function bindLayerInteractions(layerId) {
  try { map.off('click', layerId); } catch (e) {}
  try { map.off('mouseenter', layerId); } catch (e) {}
  try { map.off('mouseleave', layerId); } catch (e) {}

  map.on('click', layerId, (e) => {
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
  });

  map.on('mouseenter', layerId, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
  });
}

// =====================================================
// Crear source y layers por estado_pago
// =====================================================
function addPrediosLayer(geojsonFile, sourceId) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((data) => {
      if (sourceId === 'predios_ssk') PREDIOS_DATA = data;

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: data
        });
      }

      const layersConfig = [
        {
          id: 'predios_no_dia_layer',
          color: '#e63946',
          filter: getEstadoFilter('no_dia')
        },
        {
          id: 'predios_si_dia_layer',
          color: '#2a9d8f',
          filter: getEstadoFilter('si_dia')
        },
        {
          id: 'predios_activos_publicos_layer',
          color: '#3a86ff',
          filter: getEstadoFilter('activos_publicos')
        }
      ];

      layersConfig.forEach((cfg) => {
        if (!map.getLayer(cfg.id)) {
          map.addLayer({
            id: cfg.id,
            source: sourceId,
            type: 'fill',
            minzoom: 12,
            filter: cfg.filter,
            layout: {
              visibility: estadoLayersVisibility[cfg.id] ? 'visible' : 'none'
            },
            paint: {
              'fill-color': cfg.color,
              'fill-opacity': 0.75,
              'fill-outline-color': '#ffffff'
            }
          });
        }

        bindLayerInteractions(cfg.id);
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
// Leyenda / control de capas
// =====================================================
class EstadoPagoLegendControl {
  onAdd(mapInstance) {
    this._map = mapInstance;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.style.background = 'rgba(20,20,20,0.92)';
    this._container.style.color = '#fff';
    this._container.style.padding = '12px 14px';
    this._container.style.borderRadius = '10px';
    this._container.style.minWidth = '220px';
    this._container.style.fontFamily = 'Arial, sans-serif';
    this._container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.35)';

    this._container.innerHTML = `
      <div style="font-size:13px; font-weight:700; margin-bottom:10px;">
        Estado de pago
      </div>

      <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;">
        <input type="checkbox" id="chk_no_dia" checked />
        <span style="display:inline-block; width:12px; height:12px; background:#e63946; border-radius:2px;"></span>
        <span>No está al día</span>
      </label>

      <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;">
        <input type="checkbox" id="chk_si_dia" checked />
        <span style="display:inline-block; width:12px; height:12px; background:#2a9d8f; border-radius:2px;"></span>
        <span>Está al día</span>
      </label>

      <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
        <input type="checkbox" id="chk_activos" checked />
        <span style="display:inline-block; width:12px; height:12px; background:#3a86ff; border-radius:2px;"></span>
        <span>Activos públicos</span>
      </label>
    `;

    this._container.addEventListener('click', (e) => e.stopPropagation());

    setTimeout(() => {
      const chkNoDia = this._container.querySelector('#chk_no_dia');
      const chkSiDia = this._container.querySelector('#chk_si_dia');
      const chkActivos = this._container.querySelector('#chk_activos');

      chkNoDia?.addEventListener('change', () => {
        toggleLayerVisibility('predios_no_dia_layer', chkNoDia.checked);
      });

      chkSiDia?.addEventListener('change', () => {
        toggleLayerVisibility('predios_si_dia_layer', chkSiDia.checked);
      });

      chkActivos?.addEventListener('change', () => {
        toggleLayerVisibility('predios_activos_publicos_layer', chkActivos.checked);
      });
    }, 0);

    return this._container;
  }

  onRemove() {
    if (this._container?.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._map = undefined;
  }
}

function toggleLayerVisibility(layerId, isVisible) {
  estadoLayersVisibility[layerId] = isVisible;

  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
  }
}

// =====================================================
// Cargar capa predial + resaltado + controles
// =====================================================
map.on('style.load', () => {
  addPrediosLayer(
    'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',
    'predios_ssk'
  );

  ensureHighlightLayers();

  if (!map._navControlAdded) {
    map.addControl(new mapboxgl.NavigationControl());
    map._navControlAdded = true;
  }

  if (!map._legendControlAdded) {
    map.addControl(new EstadoPagoLegendControl(), 'top-right');
    map._legendControlAdded = true;
  }
});

// =====================================================
// Geocoder local: busca por codigo, NOMBRE, NUMERO_DOCUMENTO
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
// Al seleccionar resultado: zoom + resaltar 1 o varios predios
// + popup SOLO cuando selecciona
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

  const codigos = toHighlight
    .map((f) => (f.properties?.codigo ?? '').toString().trim())
    .filter(Boolean);

  const listaCodigos = codigos.length
    ? `<br><strong>Predios vinculados (${codigos.length}):</strong><br>${codigos
        .slice(0, 10)
        .join('<br>')}${codigos.length > 10 ? '<br>…' : ''}`
    : '';

  const b = turf.bbox(fc);
  const center = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

  popup
    .setLngLat(result.center || turf.centroid(result).geometry.coordinates)
    .setHTML(buildPopupHTML(properties, center, listaCodigos))
    .addTo(map);
});
