// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda 100% completa (NO depende de querySourceFeatures)
// ✅ Busca por: codigo (cédula), NOMBRE, NUMERO_DOCUMENTO
// ✅ Autocomplete por NOMBRE (opciones únicas + conteo)
// ✅ Resalta 1 o varios predios vinculados (mismo codigo / documento / nombre exacto)
// =====================================================

// Token Mapbox
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
// Función para agregar capa GeoJSON (con protecciones)
// =====================================================
function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      // Guardar el dataset completo en memoria
      if (sourceId === 'predios_ssk') PREDIOS_DATA = data;

      // Source: si ya existe, solo actualiza
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }

      // Layer: si ya existe, no recrear
      if (!map.getLayer(layerId)) {
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
      }

      // Evitar duplicar eventos si recargas
      map.off('mousemove', layerId, onMovePopup);
      map.off('mouseenter', layerId, onEnterCursor);
      map.off('mouseleave', layerId, onLeavePopup);

      function onMovePopup(e) {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const popupContent = popupFields
          .map((field) => {
            let value = feature.properties?.[field.key];

            if (field.key === 'shap_Ar' && value !== null && value !== undefined) {
              value = Math.round(Number(value));
            }

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
      }

      function onEnterCursor() {
        map.getCanvas().style.cursor = 'pointer';
      }

      function onLeavePopup() {
        map.getCanvas().style.cursor = '';
        popup.remove();
      }

      map.on('mousemove', layerId, onMovePopup);
      map.on('mouseenter', layerId, onEnterCursor);
      map.on('mouseleave', layerId, onLeavePopup);
    })
    .catch((err) => console.error('Error cargando GeoJSON:', err));
}

// =====================================================
// Crear/asegurar capas de resaltado (highlight)
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

// =====================================================
// Al cargar el mapa (NO style.load): crear todo
// =====================================================
map.on('load', () => {
  // 1) Cargar capa predial
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

  // 2) Capas de resaltado
  ensureHighlightLayers();

  // 3) Controles
  map.addControl(geocoder, 'top-left');
  map.addControl(new mapboxgl.NavigationControl());
});

// =====================================================
// Geocoder local (busca en PREDIOS_DATA completo)
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: 'Buscar por código, nombre o documento',

  localGeocoder: function (query) {
    const qRaw = (query || '').toString().trim();
    if (!qRaw) return [];

    if (!PREDIOS_DATA || !Array.isArray(PREDIOS_DATA.features)) return [];
    const feats = PREDIOS_DATA.features;

    const qNorm = normText(qRaw);
    const qDigits = onlyDigits(qRaw);

    // Si tiene suficientes dígitos, asumimos búsqueda por documento/código
    const looksNumeric = qDigits.length >= 4;

    // -----------------------------
    // A) AUTOCOMPLETE POR NOMBRE
    // -----------------------------
    if (!looksNumeric) {
      const groups = new Map(); // nombreNorm -> { nombreOriginal, count, feature }

      for (const f of feats) {
        const p = f.properties || {};
        const nombre = (p.NOMBRE ?? '').toString().trim();
        if (!nombre) continue;

        const nombreN = normText(nombre);
        if (!nombreN.includes(qNorm)) continue;

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

    // -----------------------------
    // B) BÚSQUEDA POR CÓDIGO / DOCUMENTO
    // -----------------------------
    const out = [];

    for (const f of feats) {
      const p = f.properties || {};

      const codigoRaw = (p.codigo ?? '').toString().trim();
      const docRaw = (p.NUMERO_DOCUMENTO ?? '').toString().trim();
      const nombreRaw = (p.NOMBRE ?? '').toString().trim();

      const codigoN = normText(codigoRaw);
      const docD = onlyDigits(docRaw);

      // Match por contiene (código) y por dígitos (documento)
      const matchCodigo = codigoN.includes(qNorm);
      const matchDoc = qDigits && docD.includes(qDigits);

      if (!matchCodigo && !matchDoc) continue;

      const centro = turf.centroid(f).geometry.coordinates;

      const matchField = matchCodigo ? 'codigo' : 'NUMERO_DOCUMENTO';
      const matchValue = matchCodigo ? codigoRaw : docRaw;

      out.push({
        type: 'Feature',
        geometry: f.geometry,
        properties: { ...p, __matchField: matchField, __matchValue: matchValue },
        place_name: `Código: ${codigoRaw || 'N/A'} | Nombre: ${nombreRaw || 'N/A'} | Doc: ${docRaw || 'N/A'}`,
        text: codigoRaw || docRaw || 'Resultado',
        center: centro,
        place_type: ['place']
      });
    }

    return out.slice(0, 10);
  }
});

// =====================================================
// Al seleccionar resultado: resaltar grupo + zoom + popup
// =====================================================
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  if (!PREDIOS_DATA || !Array.isArray(PREDIOS_DATA.features)) return;
  const feats = PREDIOS_DATA.features;

  ensureHighlightLayers();

  const props = result.properties || {};
  const matchField = props.__matchField;
  const matchValue = (props.__matchValue ?? '').toString().trim();

  // Elegir qué resaltar
  let toHighlight = [];

  if (matchField && matchValue) {
    const mvText = normText(matchValue);
    const mvDigits = onlyDigits(matchValue);

    toHighlight = feats.filter((f) => {
      const p = f.properties || {};
      if (matchField === 'codigo') return normText(p.codigo) === mvText;
      if (matchField === 'NUMERO_DOCUMENTO') return onlyDigits(p.NUMERO_DOCUMENTO) === mvDigits;
      if (matchField === 'NOMBRE') return normText(p.NOMBRE) === mvText; // exacto
      return false;
    });
  }

  if (!toHighlight.length) toHighlight = [result];

  const fc = { type: 'FeatureCollection', features: toHighlight };
  map.getSource('predios_highlight').setData(fc);

  // Zoom al conjunto
  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  // Lista de códigos para ver cuáles son
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
