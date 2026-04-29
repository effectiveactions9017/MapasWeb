// =====================================================
// ✅ Predial Sesquilé - Mapbox GL JS (ACTUALIZADO + PLACA HUELLAS)
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463],
  zoom: 15,
  container: 'map'
});

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});

let PREDIOS_DATA = null;

// =====================================================
// 📷 STREET VIEW
// =====================================================
function getFeatureLngLat(feature, fallbackLngLat = null) {
  if (fallbackLngLat) return [fallbackLngLat.lng, fallbackLngLat.lat];

  const c = feature?.geometry?.coordinates;

  if (Array.isArray(c) && typeof c[0] === 'number') {
    return c;
  }

  return turf.pointOnFeature(feature).geometry.coordinates;
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// =====================================================
// 🧩 POPUP
// =====================================================
function buildPopupFromFields(feature, lngLat, popupFields, svLngLat) {
  const props = feature.properties || {};

  const content = popupFields.map(f => {
    let val = props[f.key];

    if (f.key === 'Shape_Area' && val) {
      val = Math.round(Number(val));
    }

    if (f.key === 'AVALUO 2026' && val) {
      val = Number(val).toLocaleString('es-CO');
    }

    return `<strong>${f.label}:</strong> ${val ?? 'N/A'}`;
  }).join('<br>');

  popup
    .setLngLat(lngLat)
    .setHTML(`
      ${content}
      <div style="margin-top:10px;">
        <a href="${streetViewUrl(svLngLat)}" target="_blank"
        style="background:#00bcd4;padding:6px 10px;border-radius:6px;font-weight:bold;">
        📷 Street View</a>
      </div>
    `)
    .addTo(map);
}

// =====================================================
// 🧠 FUNCIÓN UNIVERSAL PARA CAPAS
// =====================================================
function addLayer(file, sourceId, layerId, color, popupFields) {
  fetch(`../src/data/${file}`)
    .then(r => r.json())
    .then(data => {

      if (sourceId === 'predios_ssk') PREDIOS_DATA = data;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: 'geojson', data });
      } else {
        map.getSource(sourceId).setData(data);
      }

      const isLine = data.features[0].geometry.type.includes('Line');

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type: isLine ? 'line' : 'fill',
          paint: isLine
            ? {
                'line-color': color,
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  12, 2,
                  18, 6
                ]
              }
            : {
                'fill-color': color,
                'fill-opacity': 0.7,
                'fill-outline-color': '#fff'
              }
        });
      }

      map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');

      map.on('click', layerId, (e) => {
        const f = e.features[0];
        const sv = getFeatureLngLat(f, e.lngLat);

        buildPopupFromFields(
          f,
          e.lngLat,
          popupFields,
          sv
        );
      });

    });
}

// =====================================================
// 🔥 CARGA DE CAPAS
// =====================================================
map.on('style.load', () => {

  // 🟢 PREDIOS
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

  // 🟠 PLACA HUELLAS (NUEVA)
  addLayer(
    'Placa_huellas_con_vereda.geojson',
    'placa_huellas',
    'placa_huellas_layer',
    '#ff8800',
    [
      { label: 'Longitud', key: 'longitud' },
      { label: 'Vereda', key: 'vereda' }
    ]
  );

  // highlight
  map.addSource('predios_highlight', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  map.addLayer({
    id: 'predios_highlight_line',
    type: 'line',
    source: 'predios_highlight',
    paint: { 'line-color': '#ffff00', 'line-width': 4 }
  });
});

// =====================================================
// 🔎 BUSCADOR
// =====================================================
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  localGeocoderOnly: true,
  placeholder: 'Buscar por código, nombre o documento',

  localGeocoder: function (query) {
    const q = query.toLowerCase();
    const results = [];

    (PREDIOS_DATA?.features || []).forEach(f => {
      const p = f.properties;

      if (
        p.codigo?.toLowerCase().includes(q) ||
        p.NOMBRE?.toLowerCase().includes(q) ||
        p.NUMERO_DOCUMENTO?.toLowerCase().includes(q)
      ) {
        results.push({
          ...f,
          place_name: `${p.codigo} | ${p.NOMBRE}`,
          center: turf.centroid(f).geometry.coordinates
        });
      }
    });

    return results.slice(0, 10);
  }
});

map.addControl(geocoder);
map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// 🎯 RESULTADO BUSCADOR
// =====================================================
geocoder.on('result', (e) => {
  const f = e.result;

  map.fitBounds(turf.bbox(f), { padding: 40 });

  map.getSource('predios_highlight').setData({
    type: 'FeatureCollection',
    features: [f]
  });

  buildPopupFromFields(
    f,
    f.center,
    [
      { label: 'Código', key: 'codigo' },
      { label: 'Nombre', key: 'NOMBRE' }
    ],
    f.center
  );
});
