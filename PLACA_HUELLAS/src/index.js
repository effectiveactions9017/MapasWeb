// =====================================================
// ✅ Predial Sesquilé - Mapbox GL JS + Placa Huellas
// ✅ Predios: SOLO CONTORNO, sin relleno
// ✅ Placa huellas: encima de predios y coloreada por vereda
// ✅ Leyenda sin scroll
// ✅ Cada vereda se prende/apaga independiente
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
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});

let PREDIOS_DATA = null;
let PLACA_DATA = null;
let TODAS_VEREDAS = [];

const paletteVeredas = [
  '#ff8800', '#00c853', '#2979ff', '#d500f9', '#ff1744',
  '#00bcd4', '#ffd600', '#8bc34a', '#ff6d00', '#7c4dff',
  '#00e5ff', '#c6ff00', '#ff4081', '#40c4ff', '#aeea00',
  '#f06292', '#4db6ac', '#ba68c8', '#ffb74d', '#90caf9'
];

let coloresVereda = {};

function norm(v) {
  return (v ?? '').toString().trim();
}

function getFeatureLngLat(feature, fallbackLngLat = null) {
  if (
    fallbackLngLat &&
    typeof fallbackLngLat.lng === 'number' &&
    typeof fallbackLngLat.lat === 'number'
  ) {
    return [fallbackLngLat.lng, fallbackLngLat.lat];
  }

  try {
    const pt = turf.pointOnFeature(feature).geometry.coordinates;
    return [Number(pt[0]), Number(pt[1])];
  } catch (e) {
    return [-73.79724, 5.04463];
  }
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function buildPopupFromFields(feature, lngLatForPopup, popupFields, lngLatForSV) {
  const props = feature.properties || {};

  const popupContent = popupFields
    .map((field) => {
      let value = props?.[field.key];

      if (field.key === 'Shape_Area' && value !== null && value !== undefined) {
        value = Math.round(Number(value));
      }

      if (field.key === 'AVALUO 2026' && value !== null && value !== undefined && value !== '') {
        const n = Number(value);
        value = isNaN(n) ? value : `$ ${n.toLocaleString('es-CO')}`;
      }

      if (field.key === 'longitud' && value !== null && value !== undefined && value !== '') {
        const n = Number(value);
        value = isNaN(n)
          ? value
          : `${n.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m`;
      }

      return `<strong>${field.label}:</strong> ${value ?? 'N/A'}`;
    })
    .join('<br>');

  const svBtn = `
    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLatForSV)}" target="_blank" rel="noopener"
         style="display:inline-block; padding:6px 10px; border-radius:6px;
                background:#00bcd4; color:#000; font-weight:700; font-size:12px; text-decoration:none;">
        📷 Street View
      </a>
    </div>
  `;

  popup
    .setLngLat(lngLatForPopup)
    .setHTML(`${popupContent}${svBtn}<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`)
    .addTo(map);
}

// =====================================================
// LEYENDA
// =====================================================
function crearLeyenda() {
  let legend = document.getElementById('legend-terri');

  if (!legend) {
    legend = document.createElement('div');
    legend.id = 'legend-terri';
    document.body.appendChild(legend);
  }

  legend.style.position = 'absolute';
  legend.style.bottom = '25px';
  legend.style.left = '15px';
  legend.style.zIndex = '9999';
  legend.style.background = 'rgba(15, 23, 42, 0.94)';
  legend.style.color = '#fff';
  legend.style.padding = '12px';
  legend.style.borderRadius = '12px';
  legend.style.fontFamily = 'Libre Franklin, Arial, sans-serif';
  legend.style.fontSize = '12px';
  legend.style.maxHeight = 'none';
  legend.style.overflowY = 'visible';
  legend.style.boxShadow = '0 8px 22px rgba(0,0,0,.45)';
  legend.style.border = '1px solid rgba(255,255,255,.22)';
  legend.style.minWidth = '230px';

  legend.innerHTML = `
    <div style="font-weight:800; font-size:14px; margin-bottom:8px;">
      🗺️ Predial Sesquilé
    </div>

    <label style="display:flex; align-items:center; gap:7px; margin-bottom:10px; cursor:pointer;">
      <input type="checkbox" id="toggle-predial" checked>
      <span style="width:18px; height:3px; background:#cfcfcf; display:inline-block; border-radius:3px;"></span>
      Base predial
    </label>

    <div style="font-weight:800; margin:8px 0 6px;">
      Placa huellas por vereda
    </div>

    <div id="legend-veredas"></div>

    <div style="margin-top:8px;">
      <a style="font-size:9px; color:#00bcd4;">&#9400 EffectiveActions</a>
    </div>
  `;

  document.getElementById('toggle-predial').addEventListener('change', function () {
    const visibility = this.checked ? 'visible' : 'none';

    [
      'predios_ssk_layer',
      'predios_highlight_fill',
      'predios_highlight_line'
    ].forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visibility);
      }
    });
  });
}

function actualizarLeyendaVeredas(veredas) {
  const cont = document.getElementById('legend-veredas');
  if (!cont) return;

  cont.innerHTML = '';

  veredas.forEach((v, index) => {
    const color = coloresVereda[v];
    const id = `vereda_${index}`;

    const item = document.createElement('label');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '7px';
    item.style.marginBottom = '6px';
    item.style.cursor = 'pointer';

    item.innerHTML = `
      <input type="checkbox" id="${id}" data-vereda="${v}" checked>
      <span style="width:18px; height:4px; background:${color}; display:inline-block; border-radius:3px;"></span>
      <span>${v || 'Sin vereda'}</span>
    `;

    cont.appendChild(item);

    document.getElementById(id).addEventListener('change', aplicarFiltroVeredas);
  });
}

function aplicarFiltroVeredas() {
  const checks = document.querySelectorAll('#legend-veredas input[type="checkbox"]');

  const veredasVisibles = Array.from(checks)
    .filter(chk => chk.checked)
    .map(chk => chk.dataset.vereda);

  if (!map.getLayer('placa_huellas_layer')) return;

  if (veredasVisibles.length === 0) {
    map.setFilter('placa_huellas_layer', ['==', ['get', 'vereda'], '__NINGUNA__']);
    return;
  }

  map.setFilter('placa_huellas_layer', [
    'in',
    ['coalesce', ['get', 'vereda'], 'Sin vereda'],
    ['literal', veredasVisibles]
  ]);
}

// =====================================================
// CAPA PREDIAL: SOLO CONTORNO
// =====================================================
function addPredialLayer() {
  fetch('../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson')
    .then((response) => response.json())
    .then((data) => {
      PREDIOS_DATA = data;

      if (map.getSource('predios_ssk')) {
        map.getSource('predios_ssk').setData(data);
      } else {
        map.addSource('predios_ssk', {
          type: 'geojson',
          data: data
        });
      }

      if (!map.getLayer('predios_ssk_layer')) {
        map.addLayer({
          id: 'predios_ssk_layer',
          source: 'predios_ssk',
          type: 'line',
          minzoom: 12,
          paint: {
            'line-color': '#cfcfcf',
            'line-width': 1.1,
            'line-opacity': 0.85
          }
        });
      }

      map.on('mouseenter', 'predios_ssk_layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'predios_ssk_layer', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'predios_ssk_layer', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const svLngLat = getFeatureLngLat(feature, e.lngLat);

        buildPopupFromFields(
          feature,
          e.lngLat,
          [
            { label: 'Código', key: 'codigo' },
            { label: 'Destino', key: 'DESTINO' },
            { label: 'Nombre', key: 'NOMBRE' },
            { label: 'Documento', key: 'NUMERO_DOCUMENTO' },
            { label: 'Avalúo 2026', key: 'AVALUO 2026' },
            { label: 'Área (㎡)', key: 'Shape_Area' }
          ],
          svLngLat
        );
      });

      ordenarCapas();
    })
    .catch((err) => console.error('Error cargando predios:', err));
}

// =====================================================
// CAPA PLACA HUELLAS: COLOR POR VEREDA
// =====================================================
function addPlacaHuellasLayer() {
  fetch('../src/data/Placa_huellas_con_vereda.geojson')
    .then((response) => response.json())
    .then((data) => {
      PLACA_DATA = data;

      const veredas = [...new Set(
        data.features.map(f => norm(f.properties?.vereda) || 'Sin vereda')
      )].sort();

      TODAS_VEREDAS = veredas;

      coloresVereda = {};
      veredas.forEach((v, i) => {
        coloresVereda[v] = paletteVeredas[i % paletteVeredas.length];
      });

      const colorExpression = ['match', ['coalesce', ['get', 'vereda'], 'Sin vereda']];

      veredas.forEach((v) => {
        colorExpression.push(v, coloresVereda[v]);
      });

      colorExpression.push('#ff8800');

      if (map.getSource('placa_huellas')) {
        map.getSource('placa_huellas').setData(data);
      } else {
        map.addSource('placa_huellas', {
          type: 'geojson',
          data: data
        });
      }

      if (!map.getLayer('placa_huellas_layer')) {
        map.addLayer({
          id: 'placa_huellas_layer',
          source: 'placa_huellas',
          type: 'line',
          minzoom: 10,
          paint: {
            'line-color': colorExpression,
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 2,
              15, 4,
              18, 7
            ],
            'line-opacity': 0.98
          }
        });
      }

      map.on('mouseenter', 'placa_huellas_layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'placa_huellas_layer', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'placa_huellas_layer', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const svLngLat = getFeatureLngLat(feature, e.lngLat);

        buildPopupFromFields(
          feature,
          e.lngLat,
          [
            { label: 'Longitud', key: 'longitud' },
            { label: 'Vereda', key: 'vereda' }
          ],
          svLngLat
        );
      });

      actualizarLeyendaVeredas(veredas);
      ordenarCapas();
    })
    .catch((err) => console.error('Error cargando placa huellas:', err));
}

// =====================================================
// ORDEN DE CAPAS
// =====================================================
function ordenarCapas() {
  try {
    if (map.getLayer('predios_ssk_layer')) {
      map.moveLayer('predios_ssk_layer');
    }

    if (map.getLayer('predios_highlight_fill')) {
      map.moveLayer('predios_highlight_fill');
    }

    if (map.getLayer('predios_highlight_line')) {
      map.moveLayer('predios_highlight_line');
    }

    if (map.getLayer('placa_huellas_layer')) {
      map.moveLayer('placa_huellas_layer');
    }
  } catch (e) {
    console.warn('No se pudo ordenar capas todavía:', e);
  }
}

// =====================================================
// CARGA PRINCIPAL
// =====================================================
map.on('style.load', () => {
  crearLeyenda();

  addPredialLayer();
  addPlacaHuellasLayer();

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
        'fill-opacity': 0.18
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

  ordenarCapas();
});

// =====================================================
// BUSCADOR LOCAL PREDIAL
// =====================================================
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

    const features = PREDIOS_DATA?.features || [];
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

        const props2 = {
          ...props,
          __matchField: matchField,
          __matchValue: matchValue
        };

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

// =====================================================
// RESULTADO BUSCADOR
// =====================================================
geocoder.on('result', (e) => {
  const result = e.result;
  if (!result || !result.geometry) return;

  const properties = result.properties || {};
  const matchField = properties.__matchField;
  const matchValue = (properties.__matchValue ?? '').toString().trim();

  const normLocal = (v) =>
    (v ?? '').toString().toLowerCase().replace(/\s+/g, '').trim();

  const features = PREDIOS_DATA?.features || [];

  let toHighlight = [];

  if ((matchField === 'NUMERO_DOCUMENTO' || matchField === 'codigo') && matchValue) {
    const mv = normLocal(matchValue);

    toHighlight = features.filter((f) => {
      const p = f.properties || {};
      const v = matchField === 'NUMERO_DOCUMENTO' ? p.NUMERO_DOCUMENTO : p.codigo;
      return normLocal(v) === mv;
    });
  }

  if (!toHighlight.length) toHighlight = [result];

  const fc = {
    type: 'FeatureCollection',
    features: toHighlight
  };

  const hlSource = map.getSource('predios_highlight');
  if (hlSource) hlSource.setData(fc);

  const bounds = turf.bbox(fc);
  map.fitBounds(bounds, { padding: 40 });

  const popupFields = [
    { label: 'Código', key: 'codigo' },
    { label: 'Destino', key: 'DESTINO' },
    { label: 'Nombre', key: 'NOMBRE' },
    { label: 'Documento', key: 'NUMERO_DOCUMENTO' },
    { label: 'Avalúo 2026', key: 'AVALUO 2026' },
    { label: 'Área (㎡)', key: 'Shape_Area' }
  ];

  const b = turf.bbox(fc);
  const svCenter = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

  const center = result.center || turf.centroid(result).geometry.coordinates;

  const featureLike = {
    properties: properties
  };

  buildPopupFromFields(
    featureLike,
    center,
    popupFields,
    svCenter
  );

  ordenarCapas();
});
