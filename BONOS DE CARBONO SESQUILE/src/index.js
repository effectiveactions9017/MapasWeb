// =====================================================
// ✅ Visor Bonos de Carbono Sesquilé - Mapbox GL JS
// ✅ 2 GeoJSON: Oportunidad y Pérdidas
// ✅ Popup SOLO con clic (no hover)
// ✅ addSource / addLayer seguros
// ✅ Leyenda se actualiza con IDs (HTML aparte)
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

// 🔧 Ajusta esta ruta según tu estructura en GitHub Pages
// Si tu JS está en /public y tu data está en /src/data:
const DATA_PATH = '../src/data/';

// Guardar datasets (por si luego haces búsquedas/estadísticas)
let OPORTUNIDAD_DATA = null;
let PERDIDAS_DATA = null;

// =============================
// Popup builder (campos definidos o automático)
// =============================
function buildPopupContent(feature, popupFields) {
  const props = feature.properties || {};

  // Si defines campos: usa esos
  if (Array.isArray(popupFields) && popupFields.length) {
    return popupFields
      .map(({ label, key, format }) => {
        let v = props[key];

        // formatos opcionales
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

  // Automático: muestra hasta 18 props
  const keys = Object.keys(props).sort();
  const show = keys.slice(0, 18);

  const rows = show.map((k) => {
    let v = props[k];
    if (typeof v === 'number') v = v.toLocaleString('es-CO');
    return `<strong>${k}:</strong> ${v ?? 'N/A'}`;
  });

  if (keys.length > show.length) rows.push(`<em>… +${keys.length - show.length} campos</em>`);
  return rows.join('<br>');
}

// =============================
// Eventos de clic (sin duplicados)
// =============================
const clickHandlers = {}; // { [layerId]: fn }

function bindClickPopup(layerId, popupFields) {
  // quitar si existía
  if (clickHandlers[layerId]) {
    map.off('click', layerId, clickHandlers[layerId]);
  }

  const fn = (e) => {
    const feature = e.features && e.features[0];
    if (!feature) return;

    const html = buildPopupContent(feature, popupFields) + `<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`;

    popup
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  };

  clickHandlers[layerId] = fn;
  map.on('click', layerId, fn);

  // cursor pointer
  map.on('mouseenter', layerId, () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', layerId, () => (map.getCanvas().style.cursor = ''));
}

// =============================
// addLayer seguro
// =============================
function addLayer({
  geojsonFile,
  sourceId,
  layerId,
  color,
  opacity = 0.65,
  outline = '#ffffff',
  popupFields = null
}) {
  fetch(`${DATA_PATH}${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      // guardar datasets por si necesitas luego
      if (sourceId === 'oportunidad') OPORTUNIDAD_DATA = data;
      if (sourceId === 'perdidas') PERDIDAS_DATA = data;

      // source safe
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }

      // layer safe
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          minzoom: 10,
          paint: {
            'fill-color': color,
            'fill-opacity': opacity,
            'fill-outline-color': outline
          }
        });
      }

      // popup por clic
      bindClickPopup(layerId, popupFields);
    })
    .catch((err) => console.error('Error cargando GeoJSON:', geojsonFile, err));
}

// =============================
// Cargar capas
// =============================
map.on('style.load', () => {
  // 1) OPORTUNIDAD (Bosque actual)
  addLayer({
    geojsonFile: 'bosque_actual_final_ajustado_UNIDO.geojson',
    sourceId: 'oportunidad',
    layerId: 'oportunidad_layer',
    color: '#2ec4b6',
    opacity: 0.60,
    popupFields: null // automático (o define campos si quieres)
  });

  // 2) PERDIDAS (Pérdida de bosque con carbono)
  addLayer({
    geojsonFile: 'perdida_bosque_con_carbono_2001_2024.geojson',
    sourceId: 'perdidas',
    layerId: 'perdidas_layer',
    color: '#ff595e',
    opacity: 0.60,
    popupFields: null
  });
});
