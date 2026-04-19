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
  if (!value) return 'N/A';
  return Number(value).toLocaleString('es-CO');
}

function formatArea(value) {
  if (!value) return 'N/A';
  return Math.round(Number(value)).toLocaleString('es-CO');
}

function norm(v) {
  return (v ?? '').toString().toLowerCase().replace(/\s+/g, '').trim();
}

// =====================================================
// Deduplicar
// =====================================================
function deduplicateGeoJSONByTerreno(fc) {
  const seen = new Set();
  const unique = [];

  for (const f of fc.features) {
    const cod = norm(f.properties?.TERRENO_CO);
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

  const esPublico =
    (props.nombre_completo || '').toUpperCase() === 'MUNICIPIO';

  const publicoHTML = esPublico
    ? `<br><strong style="color:#1d4ed8;">🏛️ Predio público</strong><br>`
    : '';

  return `
    <strong>Código:</strong> ${props.TERRENO_CO ?? 'N/A'}<br>
    <strong>Destino:</strong> ${props['destino.economico'] ?? 'N/A'}<br>
    <strong>Nombre:</strong> ${props.nombre_completo ?? 'N/A'}<br>
    <strong>Documento:</strong> ${props.documento ?? 'N/A'}<br>
    <strong>Avalúo:</strong> ${formatAvaluo(props.avaluo)}<br>
    <strong>Área (m²):</strong> ${formatArea((props['terreno.ha'] || 0) * 10000)}<br>
    ${publicoHTML}
    ${extraHTML}
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

      map.addSource('predios', {
        type: 'geojson',
        data: PREDIOS_DATA_RENDER
      });

      map.addLayer({
        id: 'predios-layer',
        type: 'fill',
        source: 'predios',
        paint: {
          'fill-color': [
            'case',

            // 🔵 Predios públicos (azul)
            ['==', ['upcase', ['coalesce', ['get', 'nombre_completo'], '']], 'MUNICIPIO'],
            '#3b82f6',

            // 🟠 Sin nombre
            ['==', ['coalesce', ['get', 'nombre_completo'], ''], ''],
            '#ffb703',

            // 🟢 Normal
            '#2ec4b6'
          ],
          'fill-opacity': 0.7,
          'fill-outline-color': '#ffffff'
        }
      });

      map.on('click', 'predios-layer', (e) => {
        const f = e.features[0];

        popup
          .setLngLat(e.lngLat)
          .setHTML(buildPopupHTML(f.properties))
          .addTo(map);
      });

      map.on('mouseenter', 'predios-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'predios-layer', () => {
        map.getCanvas().style.cursor = '';
      });

      addLegend();
    });
}

// =====================================================
// Leyenda
// =====================================================
function addLegend() {
  const legend = document.createElement('div');

  legend.innerHTML = `
    <div style="
      position:absolute;
      bottom:20px;
      left:10px;
      background:white;
      padding:10px;
      border-radius:8px;
      font-size:12px;
      box-shadow:0 0 10px rgba(0,0,0,0.2);
    ">
      <strong>Convenciones</strong><br><br>

      <div>
        <span style="background:#3b82f6;width:12px;height:12px;display:inline-block;"></span>
        Predio público
      </div>

      <div>
        <span style="background:#2ec4b6;width:12px;height:12px;display:inline-block;"></span>
        Predio normal
      </div>

      <div>
        <span style="background:#ffb703;width:12px;height:12px;display:inline-block;"></span>
        Sin nombre
      </div>
    </div>
  `;

  document.body.appendChild(legend);
}

// =====================================================
map.on('load', () => {
  addLayer();
  map.addControl(new mapboxgl.NavigationControl());
});
