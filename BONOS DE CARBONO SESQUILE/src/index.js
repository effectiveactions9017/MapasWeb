// =====================================================
// ✅ Visor Bonos de Carbono Sesquilé - Mapbox GL JS
// ✅ 4 GeoJSON: Límite municipal, Urbano, Oportunidad y Pérdidas
// ✅ Popup SOLO con clic en TODAS las capas
// ✅ Oportunidad y Pérdidas: popup con 3 campos (Carbono, Area (ha), Tipo de bosque)
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463],
  zoom: 12,
  container: 'map',
  antialias: true
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});

// =============================
// RUTA DE DATOS
// =============================
const DATA_PATH = '../src/data/';

// =============================
// DATASETS (en memoria)
// =============================
let LIMITE_MUNICIPAL_DATA = null;
let LIMITE_URBANO_DATA = null;
let OPORTUNIDAD_DATA = null;
let PERDIDAS_DATA = null;

// =============================
// PopupFields personalizados
// =============================

// ✅ OPORTUNIDAD (bosque actual)
// Campos reales:
// - sum_Stock_Carbono_Total_tC
// - sum_Area_Poligono_ha
// - vals_Nombre_Tipo_Bosque_Predom
const POPUP_OPORTUNIDAD_FIELDS = [
  {
    label: 'Toneladas de Carbono',
    key: 'sum_Stock_Carbono_Total_tC',
    format: 'number'
  },
  {
    label: 'Area (ha)',
    key: 'sum_Area_Poligono_ha',
    format: 'number'
  },
  {
    label: 'Tipo de bosque',
    key: 'vals_Nombre_Tipo_Bosque_Predom'
  }
];

// ✅ PÉRDIDAS (pérdida de bosque)
// Campos reales:
// - Carbono_Perdido_tC
// - Area_ha
// - Nombre_Tipo_Bosque_Predom
const POPUP_PERDIDAS_FIELDS = [
  {
    label: 'Toneladas de Carbono',
    key: 'Carbono_Perdido_tC',
    format: 'number'
  },
  {
    label: 'Area (ha)',
    key: 'Area_ha',
    format: 'number'
  },
  {
    label: 'Tipo de bosque',
    key: 'Nombre_Tipo_Bosque_Predom'
  }
];

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
// addLayer seguro (line / fill) + popup por clic
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
      if (sourceId === 'limite_municipal') LIMITE_MUNICIPAL_DATA = data;
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

      // ✅ Popup por clic (siempre)
      bindClickPopup(layerId, popupFields);
    })
    .catch((err) => console.error('Error cargando:', geojsonFile, err));
}

// =============================
// CARGA DE CAPAS
// =============================
map.on('style.load', () => {
  // 1) LÍMITE MUNICIPAL (popup automático)
  addLayer({
    geojsonFile: 'Limite_sesquile.geojson',
    sourceId: 'limite_municipal',
    layerId: 'limite_municipal_layer',
    type: 'line',
    color: '#adb5bd',
    width: 3.5,
    opacity: 0.8,
    popupFields: null
  });

  // 2) OPORTUNIDAD (popup 3 campos)
  addLayer({
    geojsonFile: 'bosque_actual_final_ajustado_UNIDO.geojson',
    sourceId: 'oportunidad',
    layerId: 'oportunidad_layer',
    type: 'fill',
    color: '#2ec4b6',
    opacity: 0.6,
    popupFields: POPUP_OPORTUNIDAD_FIELDS
  });

  // 3) PÉRDIDAS (popup 3 campos)
  addLayer({
    geojsonFile: 'perdida_bosque_con_carbono_2001_2024.geojson',
    sourceId: 'perdidas',
    layerId: 'perdidas_layer',
    type: 'fill',
    color: '#ff595e',
    opacity: 0.6,
    popupFields: POPUP_PERDIDAS_FIELDS
  });

  // 4) LÍMITE URBANO (popup automático) ✅ ARRIBA
  addLayer({
    geojsonFile: 'LIMITE_URBANO_SESQUILE.geojson',
    sourceId: 'limite_urbano',
    layerId: 'limite_urbano_layer',
    type: 'line',
    color: '#ffd166',
    width: 5,
    opacity: 1,
    popupFields: null
  });
});
