// =====================================================
// ✅ Visor Bonos de Carbono Sesquilé - Mapbox GL JS
// ✅ 4 GeoJSON: Límite municipal, Urbano, Oportunidad y Pérdidas
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
// addLayer seguro (line / fill)
// =============================
function addLayer({
  geojsonFile,
  sourceId,
  layerId,
  type = 'fill',
  color,
  opacity = 0.65,
  outline = '#ffffff',
  width = 2
}) {
  fetch(`${DATA_PATH}${geojsonFile}`)
    .then(r => r.json())
    .then(data => {

      if (sourceId === 'limite_municipal') LIMITE_MUNICIPAL_DATA = data;
      if (sourceId === 'limite_urbano') LIMITE_URBANO_DATA = data;
      if (sourceId === 'oportunidad') OPORTUNIDAD_DATA = data;
      if (sourceId === 'perdidas') PERDIDAS_DATA = data;

      // Source seguro
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }

      // Layer seguro
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
    })
    .catch(err =>
      console.error('Error cargando:', geojsonFile, err)
    );
}

// =============================
// CARGA DE CAPAS
// =============================
map.on('style.load', () => {

  // 1) LÍMITE MUNICIPAL
  addLayer({
    geojsonFile: 'Limite_sesquile.geojson',
    sourceId: 'limite_municipal',
    layerId: 'limite_municipal_layer',
    type: 'line',
    color: '#adb5bd',
    width: 1.5,
    opacity: 0.7
  });

  // 2) OPORTUNIDAD (bosque actual)
  addLayer({
    geojsonFile: 'bosque_actual_final_ajustado_UNIDO.geojson',
    sourceId: 'oportunidad',
    layerId: 'oportunidad_layer',
    color: '#2ec4b6',
    opacity: 0.6
  });

  // 3) PÉRDIDAS (deforestación)
  addLayer({
    geojsonFile: 'perdida_bosque_con_carbono_2001_2024.geojson',
    sourceId: 'perdidas',
    layerId: 'perdidas_layer',
    color: '#ff595e',
    opacity: 0.6
  });

  // 4) LÍMITE URBANO (SIEMPRE ARRIBA)
  addLayer({
    geojsonFile: 'LIMITE_URBANO_SESQUILE.geojson',
    sourceId: 'limite_urbano',
    layerId: 'limite_urbano_layer',
    type: 'line',
    color: '#ffd166',
    width: 4,
    opacity: 1
  });
});
