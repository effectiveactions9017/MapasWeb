// =====================================================
// ✅ Visor Bonos de Carbono Sesquilé - Mapbox GL JS
// ✅ 3 GeoJSON: Límite Urbano, Oportunidad y Pérdidas
// ✅ Popup SOLO con clic (no hover)
// ✅ addSource / addLayer seguros
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463],
  zoom: 12,
  pitch: 0,
  bearing: 0,
  container: 'map',
  antialias: true
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});

// 🔧 Ruta a los GeoJSON (GitHub Pages)
const DATA_PATH = '../src/data/';

// Guardar datasets (por si luego haces análisis)
let LIMITE_URBANO_DATA = null;
let OPORTUNIDAD_DATA = null;
let PERDIDAS_DATA = null;

// =============================
// Popup builder
// =============================
function buildPopupContent(feature, popupFields) {
  const props = feature.properties || {};

  if (Array.isArray(popupFields) && popupFields.length) {
    return popupFields
      .map(({ label, key, format }) => {
        let v = props[key];

        if (format === 'number' && v !== null && v !== undefined && v !== '') {
          const n = Number(v);
          v = isNaN(n) ? v : n.toLocaleString('es-CO');
        }
        if (format === 'round' && v !== null && v !== undefined && v !== '') {
          const n = Number(v);
          v = isNaN(n) ? v : Math.round(n);
        }

        return `<strong>${label}:</strong> ${v ?? 'N/A'}`;
      })
      .join('<br>');
  }

  const keys = Object.keys(props).sort();
  const show = keys.slice(0, 18);

  const rows = show.map((k) => {
    let v = props[k];
    if (typeof v === 'number') v = v.toLocaleString('es-CO');
    return `<strong>${k}:</strong> ${v ?? 'N/A'}`;
  });

  if (keys.length > show.length) {
    rows.push(`<em>… +${keys.length - show.length} campos</em>`);
  }

  return rows.join('<br>');
}

// =============================
// Click handlers (sin duplicados)
// =============================
const clickHandlers = {};

function bindClickPopup(layerId, popupFields) {
  if (clickHandlers[layerId]) {
    map.off('click', layerId, clickHandlers[layerId]);
  }

  const fn = (e) => {
    const feature = e.features && e.features[0];
    if (!feature) return;

    const html =
      buildPopupContent(feature, popupFields) +
      `<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`;

    popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
  };

  clickHandlers[layerId] = fn;
  map.on('click', layerId, fn);

  map.on('mouseenter', layerId, () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', layerId, () => (map.getCanvas().style.cursor = ''));
}

// =============================
// addLayer SEGURO (fill o line)
// =============================
function addLayer({
  geojsonFile,
  sourceId,
  layerId,
  type = 'fill',
  color,
  opacity = 0.65,
  outline = '#ffffff',
  width = 2,
  popupFields = null
}) {
  fetch(`${DATA_PATH}${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      if (sourceId === 'limite_urbano') LIMITE_URBANO_DATA = data;
      if (sourceId === 'oportunidad') OPORTUNIDAD_DATA = data;
      if (sourceId === 'perdidas') PERDIDAS_DATA = data;

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type,
          source: sourceId,
          minzoom: 10,
          paint:
            type === 'line'
              ? {
                  'line-color': color,
                  'line-width': width,
                  'line-opacity': opacity
                }
              : {
                  'fill-color': color,
                  'fill-opacity': opacity,
                  'fill-outline-color': outline
                }
        });
      }

      if (popupFields) {
        bindClickPopup(layerId, popupFields);
      }
    })
    .catch((err) =>
      console.error('Error cargando GeoJSON:', geojsonFile, err)
    );
}

// =============================
// Cargar capas
// =============================
map.on('style.load', () => {
  // 0) LÍMITE URBANO (contorno)
  addLayer({
    geojsonFile: 'LIMITE_URBANO_SESQUILE.geojson',
    sourceId: 'limite_urbano',
    layerId: 'limite_urbano_layer',
    type: 'line',
    color: '#ffd166',
    width: 2.5,
    opacity: 0.9,
    popupFields: null
  });

  // 1) OPORTUNIDAD (bosque actual)
  addLayer({
    geojsonFile: 'bosque_actual_final_ajustado_UNIDO.geojson',
    sourceId: 'oportunidad',
    layerId: 'oportunidad_layer',
    color: '#2ec4b6',
    opacity: 0.60,
    popupFields: null
  });

  // 2) PERDIDAS (pérdida de bosque con carbono)
  addLayer({
    geojsonFile: 'perdida_bosque_con_carbono_2001_2024.geojson',
    sourceId: 'perdidas',
    layerId: 'perdidas_layer',
    color: '#ff595e',
    opacity: 0.60,
    popupFields: null
  });
});
