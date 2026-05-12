// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Públicos
// ✅ Exentos
// ✅ Mora
// ✅ Al día
// ✅ Posibles sin pagar
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-v9',
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

// =====================================================
// Categorías
// =====================================================
const CATEGORY_CONFIG = {

  publicos: {
    label: 'Predios públicos',
    color: '#4fc3f7',
    layerId: 'predios_publicos_layer'
  },

  exentos: {
    label: 'Predios exentos',
    color: '#9b5de5',
    layerId: 'predios_exentos_layer'
  },

  mora: {
    label: 'Predios con mora',
    color: '#e63946',
    layerId: 'predios_mora_layer'
  },

  aldia: {
    label: 'Predios al día',
    color: '#2ec4b6',
    layerId: 'predios_aldia_layer'
  },

  sinpago: {
    label: 'Posibles predios sin pagar',
    color: '#ffb703',
    layerId: 'predios_sinpago_layer'
  }
};

// =====================================================
// Helpers
// =====================================================
function norm(v) {
  return (v ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function formatCOP(value, fallback = 'N/A') {

  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const n = Number(value);

  return isNaN(n)
    ? fallback
    : '$ ' + n.toLocaleString('es-CO');
}

function hasValue(v) {
  return v !== null && v !== undefined && v !== '';
}

function toNumberSafe(v) {

  if (v === null || v === undefined || v === '') {
    return 0;
  }

  const cleaned = String(v).replace(/[^\d.-]/g, '');

  const n = Number(cleaned);

  return isNaN(n) ? 0 : n;
}

// =====================================================
// Públicos
// =====================================================
const PUBLICOS_NOMBRES = [

  'municipio de sesquile',
  'municpio de sesquile'

];

// =====================================================
// Exentos
// =====================================================
const EXENTOS_NOMBRES = [

  'ferrocarriles-nacionales',

  'iglesia de jesucristo de los santos de los ultimos dias en colombia',

  'iglesia del sagrado corazon de sesquile',

  'iglesia pentecostal unida de colombia',

  'inco instituto nacional de concesiones',

  'institucion-nacional-de-concesion',

  'instituto-nacional-de-concesiones',

  'instituto-nacional-de concesiones-inco',

  'instituto de concesiones inco',

  'instituto nacional de concesiones inco',

  'instituto nacional de vias invias',

  'junta de accion comunal de la vereda boitiva del municipio de sesquile',

  'junta de accion comunal de la vereda el gobernador',

  'la-nacion',

  'la nacion',

  'ministerio de obras publicas',

  'parroquia-de-sesquile',

  'parroquia de sesquile',

  'policia-nacional'

];

// =====================================================
// Eliminar duplicados
// =====================================================
function deduplicateGeoJSONByCodigo(fc) {

  if (!fc || !Array.isArray(fc.features)) {
    return fc;
  }

  const seen = new Set();
  const uniqueFeatures = [];

  for (const feature of fc.features) {

    const codigo = norm(feature?.properties?.codigo);

    if (!codigo) {
      uniqueFeatures.push(feature);
      continue;
    }

    if (!seen.has(codigo)) {
      seen.add(codigo);
      uniqueFeatures.push(feature);
    }
  }

  return {
    ...fc,
    features: uniqueFeatures
  };
}

// =====================================================
// Clasificación
// =====================================================
function getCategoriaPredio(props = {}) {

  const nombre = norm(props.NOMBRE);

  const esPublico = PUBLICOS_NOMBRES.includes(nombre);

  const esExento = EXENTOS_NOMBRES.includes(nombre);

  const tienePagoMarzo =
    hasValue(props['pago marzo']);

  const tienePagoFebrero =
    hasValue(props['valor.ultimo.pago']);

  const tieneValorMora =
    hasValue(props['total.valor.mora']);

  if (esPublico) {
    return 'publicos';
  }

  if (esExento) {
    return 'exentos';
  }

  if (tieneValorMora) {
    return 'mora';
  }

  if (tienePagoMarzo || tienePagoFebrero) {
    return 'aldia';
  }

  return 'sinpago';
}

function getCategoriaLabel(cat) {
  return CATEGORY_CONFIG[cat]?.label || 'Sin categoría';
}

// =====================================================
// Punto representativo
// =====================================================
function getFeatureLngLat(feature, fallbackLngLat = null) {

  if (
    fallbackLngLat &&
    typeof fallbackLngLat.lng === 'number' &&
    typeof fallbackLngLat.lat === 'number'
  ) {
    return [
      fallbackLngLat.lng,
      fallbackLngLat.lat
    ];
  }

  const c = feature?.geometry?.coordinates;

  if (
    Array.isArray(c) &&
    c.length >= 2 &&
    typeof c[0] === 'number' &&
    typeof c[1] === 'number'
  ) {
    return [
      Number(c[0]),
      Number(c[1])
    ];
  }

  try {

    const pt =
      turf.pointOnFeature(feature)
      .geometry.coordinates;

    return [
      Number(pt[0]),
      Number(pt[1])
    ];

  } catch (e) {}

  return [-73.79724, 5.04463];
}

function streetViewUrl([lng, lat]) {

  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// =====================================================
// Popup
// =====================================================
function buildPopupHTML(props, lngLat = null) {

  props = props || {};

  const categoria =
    getCategoriaPredio(props);

  const tienePagoMarzo =
    hasValue(props['pago marzo']);

  const tienePagoFebrero =
    hasValue(props['valor.ultimo.pago']);

  const tieneValorMora =
    hasValue(props['total.valor.mora']);

  const pagoMarzoTxt =
    tienePagoMarzo
      ? formatCOP(props['pago marzo'], 'N/A')
      : '';

  const pagoFebreroTxt =
    tienePagoFebrero
      ? formatCOP(props['valor.ultimo.pago'], 'N/A')
      : '';

  const valorMoraTxt =
    tieneValorMora
      ? formatCOP(props['total.valor.mora'], '$ 0')
      : '';

  let infoPagoHTML = '';

  // =====================================================
  // Categoría
  // =====================================================

  if (categoria === 'publicos') {

    infoPagoHTML += `
      <strong>Categoría:</strong>
      Predio público<br>
    `;

  } else if (categoria === 'exentos') {

    infoPagoHTML += `
      <strong>Categoría:</strong>
      Predio exento<br>
    `;

  } else if (categoria === 'mora') {

    infoPagoHTML += `
      <strong>Categoría:</strong>
      Predio con mora<br>
    `;

  } else if (categoria === 'aldia') {

    infoPagoHTML += `
      <strong>Categoría:</strong>
      Predio al día<br>
    `;

  } else {

    infoPagoHTML += `
      <strong>Categoría:</strong>
      Posible predio sin pagar<br>
    `;
  }

  // =====================================================
  // Información de pago
  // =====================================================

  if (categoria === 'exentos') {

    infoPagoHTML += `
      <strong>Estado tributario:</strong>
      Exento<br>
    `;

  } else if (categoria === 'mora') {

    infoPagoHTML += `
      <strong>Valor en mora:</strong>
      ${valorMoraTxt}<br>
    `;

  } else if (categoria === 'aldia') {

    if (tienePagoMarzo) {

      infoPagoHTML += `
        <strong>Pago marzo:</strong>
        ${pagoMarzoTxt}<br>
      `;

    } else if (tienePagoFebrero) {

      infoPagoHTML += `
        <strong>Pago febrero:</strong>
        ${pagoFebreroTxt}<br>
      `;
    }

  } else if (categoria === 'sinpago') {

    infoPagoHTML += `
      <strong>Información de pago:</strong>
      No se tiene información<br>
    `;
  }

  const svBtn = lngLat
    ? `
      <a href="${streetViewUrl(lngLat)}"
         target="_blank"
         rel="noopener"
         style="
           display:inline-block;
           padding:6px 10px;
           border-radius:6px;
           background:#00bcd4;
           color:#000;
           font-weight:700;
           font-size:12px;
           text-decoration:none;
         ">
        📷 Street View
      </a>
    `
    : '';

  return `

    <strong>Código:</strong>
    ${props.codigo ?? 'N/A'}<br>

    <strong>Nombre:</strong>
    ${props.NOMBRE ?? 'N/A'}<br>

    <strong>Documento:</strong>
    ${props.NUMERO_DOCUMENTO ?? 'N/A'}<br>

    ${infoPagoHTML}

    <div style="
      margin-top:10px;
      display:flex;
      gap:6px;
      flex-wrap:wrap;
    ">
      ${svBtn}
    </div>

    <br>

    <a style="font-size:9px;">
      &#9400; EffectiveActions
    </a>
  `;
}

// =====================================================
// Procesar dataset
// =====================================================
function enrichPrediosData(rawFC) {

  const dedup =
    deduplicateGeoJSONByCodigo(rawFC);

  const features =
    (dedup.features || []).map((feature) => {

      const props = {
        ...(feature.properties || {})
      };

      props.__categoria =
        getCategoriaPredio(props);

      return {
        ...feature,
        properties: props
      };
    });

  return {
    ...dedup,
    features
  };
}
