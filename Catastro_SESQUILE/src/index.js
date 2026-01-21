// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda 100% completa (NO depende de querySourceFeatures)
// ✅ Busca por: codigo (cédula), NOMBRE, NUMERO_DOCUMENTO
// ✅ Autocompletar por NOMBRE (opciones únicas + conteo)
// ✅ Resalta 1 o varios predios (mismo codigo / documento / NOMBRE exacto)
// =====================================================

// Usar token propio de Mapbox
mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463], // Sesquilé
  zoom: 15,
  pitch: 0,
  bearing: 0,
  container: 'map',
  antialias: true
});

let popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'custom-popup'
});

// ✅ Guardamos TODO el GeoJSON aquí para búsquedas completas
let PREDIOS_DATA = null;

// =====================================================
// Helpers (normalización robusta)
// =====================================================
function normText(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD') // separa tildes
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/\s+/g, ' ') // espacios múltiples
    .trim();
}

function onlyDigits(v) {
  return (v ?? '').toString().replace(/\D/g, '').trim();
}

// =====================================================
// Función para agregar capas (GeoJSON)
// =====================================================
function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((data) => {
      // ✅ Guardar dataset completo en memoria (para búsquedas 100% completas)
      if (sourceId === 'predios_ssk') {
        PREDIOS_DATA = data; // FeatureCollection completo
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: data
      });

      map.addLayer({
        id: layerId,
        source: sourceId,
        type: 'fill',
        minzoom: 12,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.75,
          'fill-outline-color': '#ffffff'
       I’ve reviewed the JavaScript you’re using to load the GeoJSON layer, show popups, and perform local search using `MapboxGeocoder`. To fix the issue where some records exist in the dataset but don’t appear in your search results, we need to stop relying on `map.querySourceFeatures()` (which only reliably returns features currently “loaded/rendered” in memory).

✅ **Fix:** store the full GeoJSON in a global variable when it loads, and run search + highlight using that full dataset.

Below is the **complete corrected `main.js`** with:
- Search by **`codigo`**, **`NOMBRE`**, **`NUMERO_DOCUMENTO`**
- Autocomplete for names (unique suggestions with count)
- Highlighting **1 or many polygons** (e.g., if 4 predios share the same `NUMERO_DOCUMENTO`, all 4 are highlighted)
- Robust matching (removes accents, normalizes spaces, handles numeric document matching)

---

## ✅ CÓDIGO COMPLETO CORREGIDO (main.js)

```js
// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda 100% completa (NO depende de querySourceFeatures)
// ✅ Busca por: codigo (cédula), NOMBRE, NUMERO_DOCUMENTO
// ✅ Autocompletar por NOMBRE (opciones únicas + conteo)
// ✅ Resalta 1 o varios predios vinculados (mismo código/documento/nombre exacto)
// =====================================================

// Usar token propio de Mapbox
mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463], // Sesquilé
  zoom: 15,
  pitch: 0,
  bearing: 0,
  container: 'map',
  antialias: true
});

let popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'custom-popup'
});

// ✅ Guardamos TODO el GeoJSON aquí para búsquedas completas
let PREDIOS_DATA = null;

// =====================================================
// Helpers (normalización robusta)
// =====================================================
function normText(v) {
  return (v ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD') // separa tildes
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/\s+/g, ' ') // espacios múltiples
    .trim();
}

function onlyDigits(v) {
  return (v ?? '').toString().replace(/\D/g, '').trim();
}

function formatNumberCO(v) {
  const n = Number(v);
  return isNaN(n) ? (v ?? 'N/A') : n.toLocaleString('es-CO');
}

// =====================================================
// Función para agregar capas (GeoJSON)
// =====================================================
function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((data) => {
      // ✅ Guardar dataset completo en memoria
      if (sourceId === 'predios_ssk') {
        PREDIOS_DATA = data; // FeatureCollection completo
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: data
      });

      map.addLayer({
        id: layerId,
        source: sourceId,
        type: 'fill',
        minzoom: 12,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.75,
          'fill-outline-color': '#ffffff'
        }
      });

      // Popup al mover el mouse por encima
      map.on('mousemove', layerId, (e) => {
        const feature = e.features[0];

        const popupContent = popupFields
          .map((field) => {
            let value = feature.properties[field.key];

            // Redondear área sin decimales
            if (field.key === 'shap_Ar' && value !== null && value !== undefined) {
              value = Math.round(Number(value));
            }

            // Formatear avalúo con miles
            if (field.key === 'AVALUO2026' && value !== null && value !== undefined && value !== '') {
              value = formatNumberCO(value);
            }

            return `<strong>${field.label}:</strong> ${value ?? 'N/A'}`;
          })
          .join('<br>');

        popup
          .setLngLat(e.lngLat)
          .setHTML(`${popupContent}<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`)
          .addTo(map);
      });

      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    })
    .catch((err) => console.error('Error cargando GeoJSON:', err));
}

// =====================================================
// Cargar capa predial + capas de resaltado
// =====================================================
map.on('style.load', () => {
  // Capa predial
  addLayer(
    'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',
    'predios_ssk',
    'predios_ssk_layer',
    '#2ec4b6',
    [
      { label: 'Código', key: 'codigo' },
      { label: 'Destino', key: 'DESTINO' },
      { label: 'Nombre', key: 'NOMBRE' },
      { label: 'Documento', key: 'NUMERO_DOCUMENTO' },
      { label: 'Avalúo 2026', key: 'AVALUO2026' },
      { label: 'Área (㎡)', key: 'shap_Ar' }
    ]
  );

  // ✅ Fuente + capas de resaltado
  map.addSource('predios_highlight', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  // Relleno resaltado
  map.addLayer({
    id: 'predios_highlight_fill',
    type: 'fill',
    source: 'predios_highlight',
    paint: {
      'fill-color': '#ffff00',
      'fill-opacity': 0.30
    }
  });

  // Borde resaltado
  map.addLayer({
    id: 'predios_highlight_line',
    type: 'line',
    source: 'predios_highlight',
    paint: {
      'line-color': '#ffff00',
      'line-width': 4
    }
  });
});

// =====================================================
// Geocoder local (usa PREDIOS_DATA completo)
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,

  localGeocoder: function (query) {
    const qRaw = (query || '').toString().trim();
    const q = normText(qRaw);
    if (!q) return [];

    // Esperar dataset completo
    if (!PREDIOS_DATA || !Array.isArray(PREDIOS_DATA.features)) return [];

    const features = PREDIOS_DATA.features;

    // Si parece texto -> sugerencias únicas de NOMBRE
    const qDigits = onlyDigits(qRaw);
    const looksNumeric = qDigits.length >= 4; // umbral para doc/código
    const isTextQuery = !looksNumeric;

    // -------------------------------------------------
    // 1) AUTOCOMPLETE POR NOMBRE (opciones únicas + conteo)
    // -------------------------------------------------
    if (isTextQuery) {
      const groups = new Map(); // nombreNorm -> { nombreOriginal, count, feature }

      for (const f of features) {
        const p = f.properties || {};
        const nombre = (p.NOMBRE ?? '').toString().trim();
        if (!nombre) continue;

        const nombreN = normText(nombre);

        // Match tipo contains
        if (!nombreN.includes(q)) continue;

        if (!groups.has(nombreN)) {
          groups.set(nombreN, { nombreOriginal: nombre, count: 1, feature: f });
        } else {
          groups.get(nombreN).count += 1;
        }
      }

      return Array.from(groups.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((g) => {
          const centro = turf.centroid(g.feature).geometry.coordinates;
          return {
            type: 'Feature',
            geometry: g.feature.geometry,
            properties: {
              ...(g.feature.properties || {}),
              __matchField: 'NOMBRE',
              __matchValue: g.nombreOriginal,
              __groupCount: g.count
            },
            place_name: `${g.nombreOriginal} (${g.count} predio${g.count > 1 ? 's' : ''})`,
            text: g.nombreOriginal,
            center: centro,
            place_type: ['place']
          };
        });
    }

    // -------------------------------------------------
    // 2) BÚSQUEDA POR CÓDIGO / DOCUMENTO (NUMÉRICO)
    // -------------------------------------------------
    const out = [];

    for (const f of features) {
      const p = f.properties || {};

      const codigo = (p.codigo ?? '').toString().trim();
      const documento = (p.NUMERO_DOCUMENTO ?? '').toString().trim();
      const nombre = (p.NOMBRE ?? '').toString().trim();

      const codigoN = normText(codigo);
      const docDigits = onlyDigits(documento);

      // match: si el query numérico está contenido
      const matchCodigo = codigoN.includes(q);
      const matchDoc = docDigits.includes(qDigits);

      if (matchCodigo || matchDoc) {
        const centro = turf.centroid(f).geometry.coordinates;

        const matchField = matchCodigo ? 'codigo' : 'NUMERO_DOCUMENTO';
        const matchValue = matchCodigo ? codigo : documento;

        out.push({
          type: 'Feature',
          geometry: f.geometry,
          properties: { ...p, __matchField: matchField, __matchValue: matchValue },
          place_name: `Código: ${codigo || 'N/A'} | Nombre: ${nombre || 'N/A'} | Doc: ${documento || 'N/A'}`,
          text: codigo || documento || 'Resultado',
          center: centro,
          place_type: ['place']
        });
      }
    }

    return out.slice(0, 10);
  },

  placeholder: 'Buscar por código, nombre o documento',
  localGeocoderOnly: true
});

// Controles
map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// Al seleccionar: resaltar 1 o varios predios (grupo)
// =====================================================
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  if (!PREDIOS_DATA || !Array.isArray(PREDIOS_DATA.features)) return;
  const features = PREDIOS_DATA.features;

  const props = result.properties || {};
  const matchField = props.__matchField;
  const matchValue = (props.__matchValue ?? '').toString().trim();

  // Si no hay match metadata, resaltar solo el seleccionado
  let toHighlight = [];

  if (matchField && matchValue) {
    const mvText = normText(matchValue);
    const mvDigits = onlyDigits(matchValue);

    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      if (matchField === 'codigo') return normText(p.codigo) === mvText;
      if (matchField === 'NUMERO_DOCUMENTO') return onlyDigits(p.NUMERO_DOCUMENTO) === mvDigits;
      if (matchField === 'NOMBRE') return normText(p.NOMBRE) === mvText; // exacto
      return false;
    });
  }

  if (!toHighlight.length) toHighlight = [result];

  const fc = { type: 'FeatureCollection', features: toHighlight };

  const hl = map.getSource('predios_highlight');
  if (hl) hl.setData(fc);

  // Zoom al conjunto
  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  // Lista de códigos para saber cuáles son
  const codigos = toHighlight
    .map((f) => (f.properties?.codigo ?? '').toString().trim())
    .filter(Boolean);

  const listaCodigos = codigos.length
    ? `<br><strong>Predios vinculados (${codigos.length}):</strong><br>${codigos
        .slice(0, 12)
        .join('<br>')}${codigos.length > 12 ? '<br>…' : ''}`
    : '';

  const avaluoTxt =
    props.AVALUO2026 !== null && props.AVALUO2026 !== undefined && props.AVALUO2026 !== ''
      ? formatNumberCO(props.AVALUO2026)
      : 'N/A';

  const popupContent = `
    <strong>Código:</strong> ${props.codigo || 'N/A'}<br>
    <strong>Destino:</strong> ${props.DESTINO || 'N/A'}<br>
    <strong>Nombre:</strong> ${props.NOMBRE || 'N/A'}<br>
    <strong>Documento:</strong> ${props.NUMERO_DOCUMENTO || 'N/A'}<br>
    <strong>Avalúo 2026:</strong> ${avaluoTxt}<br>
    <strong>Área (㎡):</strong> ${Math.round(props.shap_Ar || 0)}<br>
    ${listaCodigos}
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;

  const center = result.center || turf.centroid(result).geometry.coordinates;

  popup.setLngLat(center).setHTML(popupContent).addTo(map);
});
