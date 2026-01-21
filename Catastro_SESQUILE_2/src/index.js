// =====================================================
// ✅ Predial Sesquilé - Mapbox GL JS
// ✅ Búsqueda por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios (mismo codigo o documento)
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
  closeButton: false,
  closeOnClick: false,
  className: 'custom-popup'
});

// ✅ Guardar dataset completo para búsquedas completas
let PREDIOS_DATA = null;

function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
  fetch(`../src/data/${geojsonFile}`)
    .then((response) => response.json())
    .then((data) => {
      if (sourceId === 'predios_ssk') PREDIOS_DATA = data;

      // Source seguro
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: data });
      }

      // Layer seguro (UNA SOLA SIMBOLOGÍA)
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

      // Popup al mover el mouse
      map.on('mousemove', layerId, (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const popupContent = popupFields
          .map((field) => {
            let value = feature.properties?.[field.key];

            // Área (m²) - usa Shape_Area
            if (field.key === 'Shape_Area' && value !== null && value !== undefined) {
              value = Math.round(Number(value));
            }

            // Avalúo (campo con espacio)
            if (field.key === 'AVALUO 2026' && value !== null && value !== undefined && value !== '') {
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

// Cargar capa predial + resaltado
map.on('style.load', () => {
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
      { label: 'Avalúo 2026', key: 'AVALUO 2026' },
      { label: 'Área (㎡)', key: 'Shape_Area' }
    ]
  );

  // Highlight source/layers
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
      paint: { 'fill-color': '#ffff00', 'fill-opacity': 0.30 }
    });
  }

  if (!map.getLayer('predios_highlight_line')) {
    map.addLayer({
      id: 'predios_highlight_line',
      type: 'line',
      source: 'predios_highlight',
      paint: { 'line-color': '#ffff00', 'line-width': 4 }
    });
  }
});

// Geocoder local
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

    const features = (PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features)) ? PREDIOS_DATA.features : [];
    if (!features.length) return matchingFeatures;

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

        let matchField = null;
        let matchValue = null;

        if (codigo && codigo.includes(q)) { matchField = 'codigo'; matchValue = codTxt; }
        else if (documento && documento.includes(q)) { matchField = 'NUMERO_DOCUMENTO'; matchValue = docTxt; }
        else if (nombre && nombre.includes(q)) { matchField = 'NOMBRE'; matchValue = nomTxt; }

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

    return matchingFeatures.slice(0, 10);
  }
});

map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());

// Al seleccionar resultado: resaltar grupo + zoom + popup
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  const properties = result.properties || {};
  const matchField = properties.__matchField;
  const matchValue = (properties.__matchValue ?? '').toString().trim();

  const norm = (v) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').trim();
  const features = (PREDIOS_DATA && Array.isArray(PREDIOS_DATA.features)) ? PREDIOS_DATA.features : [];

  let toHighlight = [];

  if ((matchField === 'NUMERO_DOCUMENTO' || matchField === 'codigo') && matchValue) {
    const mv = norm(matchValue);
    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      const v = matchField === 'NUMERO_DOCUMENTO' ? p.NUMERO_DOCUMENTO : p.codigo;
      return norm(v) === mv;
    });
  }

  if (!toHighlight.length) toHighlight = [result];

  const fc = { type: 'FeatureCollection', features: toHighlight };
  const hlSource = map.getSource('predios_highlight');
  if (hlSource) hlSource.setData(fc);

  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  const avaluoRaw = properties['AVALUO 2026'];
  const avaluoTxt =
    avaluoRaw !== null && avaluoRaw !== undefined && avaluoRaw !== ''
      ? (() => {
          const n = Number(avaluoRaw);
          return isNaN(n) ? avaluoRaw : n.toLocaleString('es-CO');
        })()
      : 'N/A';

  const popupContent = `
    <strong>Código:</strong> ${properties.codigo || 'N/A'}<br>
    <strong>Destino:</strong> ${properties.DESTINO || 'N/A'}<br>
    <strong>Nombre:</strong> ${properties.NOMBRE || 'N/A'}<br>
    <strong>Documento:</strong> ${properties.NUMERO_DOCUMENTO || 'N/A'}<br>
    <strong>Avalúo 2026:</strong> ${avaluoTxt}<br>
    <strong>Área (㎡):</strong> ${Math.round(properties.Shape_Area || 0)}<br>
    <br><a style="font-size:9px;">&#9400 EffectiveActions</a>
  `;

  popup
    .setLngLat(result.center || turf.centroid(result).geometry.coordinates)
    .setHTML(popupContent)
    .addTo(map);
});
