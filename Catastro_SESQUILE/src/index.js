// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda local por: codigo (cédula), NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios (vinculados al mismo codigo o documento)
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

// =====================================================
// Función para agregar capas (GeoJSON)
// =====================================================
function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((data) => {
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

            // Formatear avalúo con miles (si quieres moneda, agrega "$ ")
            if (field.key === 'AVALUO2026' && value !== null && value !== undefined && value !== '') {
              const n = Number(value);
              value = isNaN(n) ? value : n.toLocaleString('es-CO');
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

  // ✅ Fuente + capas de resaltado (para iluminar 1 o varios predios)
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
// Geocoder local: busca por codigo, NOMBRE, NUMERO_DOCUMENTO
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  localGeocoder: function (query) {
    const matchingFeatures = [];
    const q = (query || '').toString().toLowerCase().trim();
    if (!q) return matchingFeatures;

    // OJO: requiere que el source ya exista (cargado por style.load + addLayer)
    let features = [];
    try {
      features = map.querySourceFeatures('predios_ssk');
    } catch (err) {
      return matchingFeatures;
    }

    features.forEach((feature) => {
      const props = feature.properties || {};

      const codigo = (props.codigo ?? '').toString().toLowerCase();
      const nombre = (props.NOMBRE ?? '').toString().toLowerCase();
      const documento = (props.NUMERO_DOCUMENTO ?? '').toString().toLowerCase();

      const match =
        (codigo && codigo.includes(q)) ||
        (nombre && nombre.includes(q)) ||
        (documento && documento.includes(q));

      if (match) {
        const centro = turf.centroid(feature).geometry.coordinates;

        const codTxt = (props.codigo ?? '').toString().trim();
        const nomTxt = (props.NOMBRE ?? '').toString().trim();
        const docTxt = (props.NUMERO_DOCUMENTO ?? '').toString().trim();

        // Detectar el campo que disparó el match (prioridad: codigo > documento > nombre)
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

        // Guardamos metadata para usarla en geocoder.on('result')
        const props2 = { ...props, __matchField: matchField, __matchValue: matchValue };

        matchingFeatures.push({
          type: 'Feature',
          geometry: feature.geometry,
          properties: props2,

          place_name: `Código: ${codTxt || 'N/A'} | Nombre: ${nomTxt || 'N/A'} | Doc: ${docTxt || 'N/A'}`,
          text: codTxt || nomTxt || docTxt || 'Resultado',
          center: centro,
          place_type: ['place']
        });
      }
    });

    // Limitar resultados para que no se vuelva pesado
    return matchingFeatures.slice(0, 10);
  },
  placeholder: 'Buscar por código, nombre o documento',
  localGeocoderOnly: true
});

// Agregar controles al mapa
map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// Al seleccionar resultado: zoom + resaltar 1 o varios predios vinculados
// =====================================================
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  const properties = result.properties || {};
  const matchField = properties.__matchField; // 'codigo' | 'NUMERO_DOCUMENTO' | 'NOMBRE'
  const matchValue = (properties.__matchValue ?? '').toString().trim();

  // Normalizador simple (para comparar sin espacios)
  const norm = (v) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').trim();

  // Traer todas las features del source
  let features = [];
  try {
    features = map.querySourceFeatures('predios_ssk');
  } catch (err) {
    features = [];
  }

  // ✅ Si el match fue por DOCUMENTO o por CODIGO: resaltar TODOS los predios con el mismo valor exacto
  // Si fue por NOMBRE: resaltar solo el seleccionado (para no pintar demasiados)
  let toHighlight = [];

  if ((matchField === 'NUMERO_DOCUMENTO' || matchField === 'codigo') && matchValue) {
    const mv = norm(matchValue);

    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      const v = matchField === 'NUMERO_DOCUMENTO' ? p.NUMERO_DOCUMENTO : p.codigo;
      return norm(v) === mv;
    });
  }

  // Fallback: si no encontró grupo, resalta el seleccionado solamente
  if (!toHighlight.length) toHighlight = [result];

  // ✅ Pintar todos los predios encontrados
  const fc = { type: 'FeatureCollection', features: toHighlight };
  const hlSource = map.getSource('predios_highlight');
  if (hlSource) hlSource.setData(fc);

  // ✅ Zoom al conjunto
  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  // ✅ Lista de códigos para saber cuáles son
  const codigos = toHighlight
    .map((f) => (f.properties?.codigo ?? '').toString().trim())
    .filter(Boolean);

  const listaCodigos = codigos.length
    ? `<br><strong>Predios vinculados (${codigos.length}):</strong><br>${codigos
        .slice(0, 10)
        .join('<br>')}${codigos.length > 10 ? '<br>…' : ''}`
    : '';

  // Formatear avalúo con miles
  const avaluoTxt =
    properties.AVALUO2026 !== null && properties.AVALUO2026 !== undefined && properties.AVALUO2026 !== ''
      ? (() => {
          const n = Number(properties.AVALUO2026);
          return isNaN(n) ? properties.AVALUO2026 : n.toLocaleString('es-CO');
        })()
      : 'N/A';

  const popupContent = `
    <strong>Código:</strong> ${properties.codigo || 'N/A'}<br>
    <strong>Destino:</strong> ${properties.DESTINO || 'N/A'}<br>
    <strong>Nombre:</strong> ${properties.NOMBRE || 'N/A'}<br>
    <strong>Documento:</strong> ${properties.NUMERO_DOCUMENTO || 'N/A'}<br>
    <strong>Avalúo 2026:</strong> ${avaluoTxt}<br>
    <strong>Área (㎡):</strong> ${Math.round(properties.shap_Ar || 0)}<br>
    ${listaCodigos}
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;

  popup
    .setLngLat(result.center || turf.centroid(result).geometry.coordinates)
    .setHTML(popupContent)
    .addTo(map);
});
