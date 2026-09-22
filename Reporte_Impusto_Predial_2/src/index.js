// =====================================================
// VISOR PREDIAL SESQUILÉ
// =====================================================
//
// 🔵 Predios públicos
// 🟣 Predios exentos
// 🔴 Predios con mora
// 🟢 Predios al día
// 🟠 Posibles sin pagar
//
// PRIORIDAD:
// 1. PÚBLICO
// 2. EXENTO
// 3. MORA
// 4. AL DÍA
// 5. POSIBLE SIN PAGAR
//
// ✅ Mapa satelital
// ✅ Excel de exentos
// ✅ Cruce por NUMERO_PREDIAL
// ✅ Eliminación de geometrías duplicadas
// ✅ Transparencia uniforme 0.68
// ✅ Zoom automático
// ✅ Leyenda ON/OFF
// ✅ Buscador
// ✅ Highlight
// ✅ Popup
// ✅ Street View
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';


// =====================================================
// RUTAS
// =====================================================

const DATA_PATH =
  '../src/data/';


const PREDIOS_URL =
  `${DATA_PATH}PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson`;


const EXENTOS_URL =
  `${DATA_PATH}PREDIOS EXCENTOS.xlsx`;


// =====================================================
// MAPA
// =====================================================

const map =
  new mapboxgl.Map({

    container:
      'map',

    style:
      'mapbox://styles/mapbox/satellite-streets-v12',

    // Vista temporal.
    // Después se ajustará automáticamente a Sesquilé.
    center:
      [-73.79724, 5.04463],

    zoom:
      11,

    pitch:
      0,

    bearing:
      0,

    antialias:
      true

  });


// =====================================================
// CONTROLES
// =====================================================

map.addControl(

  new mapboxgl.NavigationControl(),

  'top-right'

);


// =====================================================
// POPUP
// =====================================================

const popup =
  new mapboxgl.Popup({

    closeButton:
      true,

    closeOnClick:
      true,

    className:
      'custom-popup'

  });


// =====================================================
// DATOS EN MEMORIA
// =====================================================

let PREDIOS_DATA =
  null;


let EXENTOS_DATA =
  null;


let EXENTOS_SET =
  new Set();


// =====================================================
// CONFIGURACIÓN DE ESTADOS
// =====================================================

const ESTADOS = {


  // ===================================================
  // PÚBLICOS
  // ===================================================

  PUBLICO: {

    codigo:
      'PUBLICO',

    nombre:
      'Predios públicos',

    color:
      '#48b9e8',

    layerId:
      'predios_publicos'

  },


  // ===================================================
  // EXENTOS
  // ===================================================

  EXENTO: {

    codigo:
      'EXENTO',

    nombre:
      'Predios exentos',

    color:
      '#9b5de5',

    layerId:
      'predios_exentos'

  },


  // ===================================================
  // MORA
  // ===================================================

  MORA: {

    codigo:
      'MORA',

    nombre:
      'Predios con mora',

    color:
      '#ef3340',

    layerId:
      'predios_mora'

  },


  // ===================================================
  // AL DÍA
  // ===================================================

  AL_DIA: {

    codigo:
      'AL_DIA',

    nombre:
      'Predios al día',

    color:
      '#2ec4b6',

    layerId:
      'predios_al_dia'

  },


  // ===================================================
  // POSIBLES SIN PAGAR
  // ===================================================

  POSIBLE_SIN_PAGAR: {

    codigo:
      'POSIBLE_SIN_PAGAR',

    nombre:
      'Posibles sin pagar',

    color:
      '#ffb000',

    layerId:
      'predios_sin_pagar'

  }

};


// =====================================================
// ORDEN DE LA LEYENDA
// =====================================================

const ORDEN_ESTADOS = [

  ESTADOS.PUBLICO,

  ESTADOS.EXENTO,

  ESTADOS.MORA,

  ESTADOS.AL_DIA,

  ESTADOS.POSIBLE_SIN_PAGAR

];


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function norm(
  value
) {

  return (

    value ??
    ''

  )

    .toString()

    .toUpperCase()

    .replace(
      /\s+/g,
      ' '
    )

    .trim();

}


// =====================================================
// NORMALIZAR NUMERO_PREDIAL
// =====================================================
//
// Se mantiene como TEXTO para no perder
// posibles ceros iniciales.
//
// =====================================================

function normalizarNumeroPredial(
  value
) {

  if (

    value === null

    ||

    value === undefined

  ) {

    return '';

  }


  return value

    .toString()

    .trim()

    .replace(
      /\s+/g,
      ''
    );

}


// =====================================================
// CONVERTIR VALOR A NÚMERO
// =====================================================

function numeroSeguro(
  value
) {

  if (

    value === null

    ||

    value === undefined

    ||

    value === ''

  ) {

    return 0;

  }


  // Si ya es número
  if (
    typeof value ===
    'number'
  ) {

    return Number.isFinite(value)

      ? value

      : 0;

  }


  let texto =
    value

      .toString()

      .trim()

      .replace(
        /[$\s]/g,
        ''
      );


  if (
    !texto
  ) {

    return 0;

  }


  // ===================================================
  // FORMATO:
  // 1.234.567
  // ===================================================

  if (
    /^\d{1,3}(\.\d{3})+$/.test(
      texto
    )
  ) {

    texto =
      texto.replace(
        /\./g,
        ''
      );

  }


  // ===================================================
  // FORMATO:
  // 1.234.567,89
  // ===================================================

  else if (
    /^\d{1,3}(\.\d{3})+,\d+$/.test(
      texto
    )
  ) {

    texto =
      texto

        .replace(
          /\./g,
          ''
        )

        .replace(
          ',',
          '.'
        );

  }


  // ===================================================
  // FORMATO:
  // 1234,56
  // ===================================================

  else if (
    /^\d+,\d+$/.test(
      texto
    )
  ) {

    texto =
      texto.replace(
        ',',
        '.'
      );

  }


  // ===================================================
  // LIMPIAR CARACTERES RESTANTES
  // ===================================================

  texto =
    texto.replace(
      /[^0-9.-]/g,
      ''
    );


  const numero =
    Number(
      texto
    );


  return Number.isFinite(
    numero
  )

    ? numero

    : 0;

}


// =====================================================
// FORMATO MONEDA
// =====================================================

function formatoMoneda(
  value
) {

  const numero =
    numeroSeguro(
      value
    );


  return (

    '$ ' +

    Math
      .round(numero)
      .toLocaleString(
        'es-CO'
      )

  );

}


// =====================================================
// FORMATO ÁREA
// =====================================================

function formatoArea(
  value
) {

  const numero =
    numeroSeguro(
      value
    );


  return (

    Math
      .round(numero)
      .toLocaleString(
        'es-CO'
      )

    +

    ' m²'

  );

}


// =====================================================
// OBTENER PROPIEDAD
// =====================================================

function obtenerPropiedad(
  props,
  alternativas
) {

  for (
    const key of alternativas
  ) {

    if (

      props[key] !== undefined

      &&

      props[key] !== null

      &&

      props[key] !== ''

    ) {

      return props[key];

    }

  }


  return null;

}


// =====================================================
// FORMATEAR DIRECCIÓN
// =====================================================

function formatearDireccion(
  direccion
) {

  if (

    direccion === null

    ||

    direccion === undefined

    ||

    direccion === ''

  ) {

    return 'N/A';

  }


  let dir =
    direccion

      .toString()

      .trim()

      .replace(
        /\s+/g,
        ' '
      );


  // ===================================================
  // TIPO DE VÍA
  // ===================================================

  dir =
    dir

      .replace(
        /^C\s+/i,
        'Calle '
      )

      .replace(
        /^CL\s+/i,
        'Calle '
      )

      .replace(
        /^CLL\s+/i,
        'Calle '
      )

      .replace(
        /^CR\s+/i,
        'Carrera '
      )

      .replace(
        /^CRA\s+/i,
        'Carrera '
      )

      .replace(
        /^KR\s+/i,
        'Carrera '
      )

      .replace(
        /^K\s+/i,
        'Carrera '
      );


  // ===================================================
  // NOMENCLATURA
  // ===================================================

  dir =
    dir.replace(

      /^(Calle|Carrera)\s+(\d+[A-Za-z]?)\s+(\d+[A-Za-z]?)\s+(\d+[A-Za-z]?)(.*)$/i,

      '$1 $2 # $3-$4$5'

    );


  // ===================================================
  // COMPLEMENTOS
  // ===================================================

  dir =
    dir

      .replace(
        /\bLo\b/gi,
        'Lote'
      )

      .replace(
        /\bLt\b/gi,
        'Lote'
      )

      .replace(
        /\bIn\b/gi,
        'Interior'
      )

      .replace(
        /\bInt\b/gi,
        'Interior'
      );


  return dir

    .replace(
      /\s+/g,
      ' '
    )

    .trim();

}


// =====================================================
// COORDENADA PARA STREET VIEW
// =====================================================

function getFeatureLngLat(
  feature,
  fallbackLngLat = null
) {

  if (

    fallbackLngLat

    &&

    typeof fallbackLngLat.lng ===
      'number'

    &&

    typeof fallbackLngLat.lat ===
      'number'

  ) {

    return [

      fallbackLngLat.lng,

      fallbackLngLat.lat

    ];

  }


  try {

    const punto =
      turf

        .pointOnFeature(
          feature
        )

        .geometry

        .coordinates;


    return [

      Number(
        punto[0]
      ),

      Number(
        punto[1]
      )

    ];

  }

  catch (error) {}


  return [

    -73.79724,

    5.04463

  ];

}


// =====================================================
// URL STREET VIEW
// =====================================================

function streetViewUrl(
  [lng, lat]
) {

  return (

    `https://www.google.com/maps/@?api=1`

    +

    `&map_action=pano`

    +

    `&viewpoint=${lat},${lng}`

  );

}


// =====================================================
// OBTENER NOMBRE DEL ESTADO
// =====================================================

function nombreEstado(
  codigo
) {

  const estado =
    ORDEN_ESTADOS.find(
      item =>
        item.codigo ===
        codigo
    );


  return estado

    ? estado.nombre

    : 'Sin clasificar';

}
// =====================================================
// PARTE 2 DE 5
// CLASIFICACIÓN + DUPLICADOS + CAPAS
// =====================================================


// =====================================================
// IDENTIFICAR PREDIO PÚBLICO
// =====================================================
//
// Regla:
//
// NOMBRE = MUNICIPIO DE SESQUILE
//
// =====================================================

function esPredioPublico(
  props
) {

  const nombre =
    norm(
      props?.NOMBRE
    );


  return (
    nombre ===
    'MUNICIPIO DE SESQUILE'
  );

}


// =====================================================
// IDENTIFICAR PREDIO EXENTO
// =====================================================
//
// Cruce:
//
// GeoJSON.NUMERO_PREDIAL
//              ↕
// Excel.NUMERO_PREDIAL
//
// =====================================================

function esPredioExento(
  props
) {

  const numeroPredial =
    normalizarNumeroPredial(
      props?.NUMERO_PREDIAL
    );


  if (
    !numeroPredial
  ) {

    return false;

  }


  return EXENTOS_SET.has(
    numeroPredial
  );

}


// =====================================================
// IDENTIFICAR PREDIO CON MORA
// =====================================================
//
// Regla:
//
// total.valor.mora > 0
//
// =====================================================

function predioTieneMora(
  props
) {

  const mora =
    numeroSeguro(
      props?.['total.valor.mora']
    );


  return (
    mora > 0
  );

}


// =====================================================
// IDENTIFICAR PREDIO CON PAGO
// =====================================================
//
// Se considera con pago cuando:
//
// valor.ultimo.pago > 0
//
// O
//
// pago.marzo > 0
//
// =====================================================

function predioTienePago(
  props
) {

  const ultimoPago =
    numeroSeguro(
      props?.['valor.ultimo.pago']
    );


  const pagoMarzo =
    numeroSeguro(
      props?.['pago.marzo']
    );


  return (

    ultimoPago > 0

    ||

    pagoMarzo > 0

  );

}


// =====================================================
// CLASIFICAR UN PREDIO
// =====================================================
//
// PRIORIDAD:
//
// 1. PÚBLICO
// 2. EXENTO
// 3. MORA
// 4. AL DÍA
// 5. POSIBLE SIN PAGAR
//
// Cada feature queda en UNA sola categoría.
//
// =====================================================

function clasificarPredio(
  feature
) {

  const props =
    feature.properties || {};


  // ===================================================
  // 1. PÚBLICO
  // ===================================================

  if (
    esPredioPublico(
      props
    )
  ) {

    return 'PUBLICO';

  }


  // ===================================================
  // 2. EXENTO
  // ===================================================

  if (
    esPredioExento(
      props
    )
  ) {

    return 'EXENTO';

  }


  // ===================================================
  // 3. MORA
  // ===================================================

  if (
    predioTieneMora(
      props
    )
  ) {

    return 'MORA';

  }


  // ===================================================
  // 4. AL DÍA
  // ===================================================

  if (
    predioTienePago(
      props
    )
  ) {

    return 'AL_DIA';

  }


  // ===================================================
  // 5. POSIBLE SIN PAGAR
  // ===================================================

  return 'POSIBLE_SIN_PAGAR';

}


// =====================================================
// CLASIFICAR TODO EL GEOJSON
// =====================================================

function clasificarGeoJSON(
  data
) {

  if (

    !data

    ||

    !Array.isArray(
      data.features
    )

  ) {

    return data;

  }


  data.features.forEach(
    (feature) => {


      if (
        !feature.properties
      ) {

        feature.properties =
          {};

      }


      const estado =
        clasificarPredio(
          feature
        );


      feature.properties.__ESTADO_PREDIAL =
        estado;


      feature.properties.__ESTADO_NOMBRE =
        nombreEstado(
          estado
        );

    }
  );


  return data;

}


// =====================================================
// ELIMINAR GEOMETRÍAS EXACTAMENTE DUPLICADAS
// =====================================================
//
// OBJETIVO:
//
// Mantener:
//
// fill-opacity = 0.68
//
// pero evitar que Mapbox pinte varias veces
// exactamente el mismo polígono.
//
// IMPORTANTE:
//
// NO eliminamos registros simplemente porque tengan
// el mismo NUMERO_PREDIAL.
//
// Solo se elimina un feature cuando:
//
// - su geometría es exactamente igual
// - y pertenece a la misma categoría.
//
// =====================================================

function eliminarGeometriasDuplicadas(
  data
) {

  if (

    !data

    ||

    !Array.isArray(
      data.features
    )

  ) {

    return data;

  }


  // ===================================================
  // GEOMETRÍAS YA ENCONTRADAS
  // ===================================================

  const vistos =
    new Set();


  // ===================================================
  // FEATURES QUE CONSERVAREMOS
  // ===================================================

  const featuresUnicos =
    [];


  // ===================================================
  // RECORRER FEATURES
  // ===================================================

  data.features.forEach(
    (feature) => {


      const estado =
        feature.properties
          ?.__ESTADO_PREDIAL

        ??

        '';


      // ===============================================
      // CONVERTIR GEOMETRÍA EN TEXTO
      // ===============================================

      const geometria =
        JSON.stringify(
          feature.geometry
        );


      // ===============================================
      // CLAVE
      // ===============================================
      //
      // Combinamos:
      //
      // estado + geometría
      //
      // ===============================================

      const clave =
        `${estado}|${geometria}`;


      // ===============================================
      // SI YA EXISTE
      // ===============================================

      if (
        vistos.has(
          clave
        )
      ) {

        return;

      }


      // ===============================================
      // REGISTRAR
      // ===============================================

      vistos.add(
        clave
      );


      // ===============================================
      // CONSERVAR FEATURE
      // ===============================================

      featuresUnicos.push(
        feature
      );

    }
  );


  // ===================================================
  // DIAGNÓSTICO
  // ===================================================

  console.log(
    '========================================'
  );


  console.log(
    'CONTROL DE GEOMETRÍAS DUPLICADAS'
  );


  console.log(
    'Predios originales:',
    data.features.length
  );


  console.log(
    'Predios después de limpiar:',
    featuresUnicos.length
  );


  console.log(
    'Duplicados eliminados:',
    data.features.length -
    featuresUnicos.length
  );


  console.log(
    '========================================'
  );


  // ===================================================
  // DEVOLVER GEOJSON LIMPIO
  // ===================================================

  return {

    ...data,

    features:
      featuresUnicos

  };

}


// =====================================================
// RESUMEN DE CLASIFICACIÓN
// =====================================================

function mostrarResumenClasificacion(
  data
) {

  const resumen = {

    PUBLICO:
      0,

    EXENTO:
      0,

    MORA:
      0,

    AL_DIA:
      0,

    POSIBLE_SIN_PAGAR:
      0

  };


  if (

    !data

    ||

    !Array.isArray(
      data.features
    )

  ) {

    return;

  }


  data.features.forEach(
    (feature) => {


      const estado =
        feature.properties
          ?.__ESTADO_PREDIAL;


      if (
        Object.prototype.hasOwnProperty.call(
          resumen,
          estado
        )
      ) {

        resumen[estado] +=
          1;

      }

    }
  );


  const total =
    Object
      .values(
        resumen
      )
      .reduce(
        (a, b) =>
          a + b,
        0
      );


  console.log(
    '========================================'
  );


  console.log(
    'RESUMEN PREDIAL SESQUILÉ'
  );


  console.log(
    '🔵 Predios públicos:',
    resumen.PUBLICO
  );


  console.log(
    '🟣 Predios exentos:',
    resumen.EXENTO
  );


  console.log(
    '🔴 Predios con mora:',
    resumen.MORA
  );


  console.log(
    '🟢 Predios al día:',
    resumen.AL_DIA
  );


  console.log(
    '🟠 Posibles sin pagar:',
    resumen.POSIBLE_SIN_PAGAR
  );


  console.log(
    'TOTAL:',
    total
  );


  console.log(
    '========================================'
  );

}


// =====================================================
// CREAR SOURCE PREDIAL
// =====================================================

function crearSourcePredial(
  data
) {

  if (
    map.getSource(
      'predios_ssk'
    )
  ) {

    map
      .getSource(
        'predios_ssk'
      )
      .setData(
        data
      );


    return;

  }


  map.addSource(

    'predios_ssk',

    {

      type:
        'geojson',

      data:
        data

    }

  );

}


// =====================================================
// CREAR CAPA PARA CADA ESTADO
// =====================================================

function crearCapaEstado(
  estado
) {

  if (
    map.getLayer(
      estado.layerId
    )
  ) {

    return;

  }


  // ===================================================
  // CAPA
  // ===================================================

  map.addLayer({

    id:
      estado.layerId,

    type:
      'fill',

    source:
      'predios_ssk',


    // =================================================
    // FILTRO
    // =================================================

    filter: [

      '==',

      [
        'get',
        '__ESTADO_PREDIAL'
      ],

      estado.codigo

    ],


    // =================================================
    // SIMBOLOGÍA
    // =================================================

    paint: {


      // ===============================================
      // COLOR
      // ===============================================

      'fill-color':
        estado.color,


      // ===============================================
      // TRANSPARENCIA
      // ===============================================
      //
      // IMPORTANTE:
      //
      // Conservamos 0.68 para que siga viéndose
      // la imagen satelital.
      //
      // Las geometrías duplicadas se eliminan antes
      // de llegar al mapa.
      //
      // ===============================================

      'fill-opacity':
        0.68,


      // ===============================================
      // BORDE
      // ===============================================

      'fill-outline-color':
        'rgba(255,255,255,0.70)'

    }

  });


  // ===================================================
  // CURSOR AL ENTRAR
  // ===================================================

  map.on(

    'mouseenter',

    estado.layerId,

    () => {

      map
        .getCanvas()
        .style
        .cursor =
        'pointer';

    }

  );


  // ===================================================
  // CURSOR AL SALIR
  // ===================================================

  map.on(

    'mouseleave',

    estado.layerId,

    () => {

      map
        .getCanvas()
        .style
        .cursor =
        '';

    }

  );


  // ===================================================
  // CLICK SOBRE PREDIO
  // ===================================================

  map.on(

    'click',

    estado.layerId,

    (e) => {


      const feature =

        e.features

        &&

        e.features[0];


      if (
        !feature
      ) {

        return;

      }


      // ===============================================
      // HIGHLIGHT
      // ===============================================

      const highlightSource =
        map.getSource(
          'predios_highlight'
        );


      if (
        highlightSource
      ) {

        highlightSource.setData({

          type:
            'FeatureCollection',

          features:
            [feature]

        });

      }


      // ===============================================
      // STREET VIEW
      // ===============================================

      const svLngLat =
        getFeatureLngLat(

          feature,

          e.lngLat

        );


      // ===============================================
      // POPUP
      // ===============================================

      mostrarPopupPredial(

        feature,

        e.lngLat,

        svLngLat

      );

    }

  );

}


// =====================================================
// CREAR LAS CINCO CAPAS
// =====================================================

function crearCapasPrediales() {

  ORDEN_ESTADOS.forEach(
    (estado) => {

      crearCapaEstado(
        estado
      );

    }
  );

}


// =====================================================
// CREAR HIGHLIGHT
// =====================================================

function crearHighlight() {


  // ===================================================
  // SOURCE
  // ===================================================

  if (
    !map.getSource(
      'predios_highlight'
    )
  ) {

    map.addSource(

      'predios_highlight',

      {

        type:
          'geojson',

        data: {

          type:
            'FeatureCollection',

          features:
            []

        }

      }

    );

  }


  // ===================================================
  // RELLENO AMARILLO
  // ===================================================

  if (
    !map.getLayer(
      'predios_highlight_fill'
    )
  ) {

    map.addLayer({

      id:
        'predios_highlight_fill',

      type:
        'fill',

      source:
        'predios_highlight',

      paint: {

        'fill-color':
          '#ffff00',

        'fill-opacity':
          0.30

      }

    });

  }


  // ===================================================
  // CONTORNO AMARILLO
  // ===================================================

  if (
    !map.getLayer(
      'predios_highlight_line'
    )
  ) {

    map.addLayer({

      id:
        'predios_highlight_line',

      type:
        'line',

      source:
        'predios_highlight',

      paint: {

        'line-color':
          '#ffff00',

        'line-width':
          2

      }

    });

  }

}


// =====================================================
// LIMPIAR HIGHLIGHT
// =====================================================

function limpiarHighlight() {

  const source =
    map.getSource(
      'predios_highlight'
    );


  if (
    source
  ) {

    source.setData({

      type:
        'FeatureCollection',

      features:
        []

    });

  }

}


// =====================================================
// ZOOM INICIAL A TODO SESQUILÉ
// =====================================================

function ajustarVistaMunicipio(
  data
) {

  if (

    !data

    ||

    !Array.isArray(
      data.features
    )

    ||

    !data.features.length

  ) {

    return;

  }


  try {


    const bounds =
      turf.bbox(
        data
      );


    if (

      Array.isArray(
        bounds
      )

      &&

      bounds.length ===
        4

      &&

      bounds.every(
        Number.isFinite
      )

    ) {

      map.fitBounds(

        bounds,

        {

          padding:
            12,

          duration:
            1000,

          maxZoom:
            16

        }

      );

    }

  }

  catch (error) {

    console.error(

      'Error ajustando vista a Sesquilé:',

      error

    );

  }

}
// =====================================================
// PARTE 3 DE 5
// EXCEL DE EXENTOS + POPUP + CARGA DE DATOS
// =====================================================


// =====================================================
// PREPARAR PREDIOS EXENTOS
// =====================================================
//
// El Excel contiene:
//
// NUMERO_PREDIAL
//
// Se cruza contra NUMERO_PREDIAL del GeoJSON.
//
// =====================================================

function prepararExentos(
  registros
) {

  EXENTOS_SET =
    new Set();


  if (
    !Array.isArray(
      registros
    )
  ) {

    console.error(
      'El archivo de exentos no produjo una lista válida.'
    );

    return;

  }


  registros.forEach(
    (fila) => {


      if (
        !fila ||
        typeof fila !== 'object'
      ) {

        return;

      }


      // ===============================================
      // NUMERO_PREDIAL DEL EXCEL
      // ===============================================

      const numeroPredial =
        normalizarNumeroPredial(

          fila.NUMERO_PREDIAL

          ??

          fila.numero_predial

          ??

          fila.Numero_Predial

          ??

          ''

        );


      if (
        numeroPredial
      ) {

        EXENTOS_SET.add(
          numeroPredial
        );

      }

    }
  );


  console.log(
    '🟣 Números prediales exentos únicos:',
    EXENTOS_SET.size
  );

}


// =====================================================
// POPUP PREDIAL
// =====================================================
//
// SE CONSERVA EL DISEÑO QUE YA TENÍAMOS.
//
// MUESTRA:
//
// - Código
// - Dirección
// - Nombre
// - Documento
// - Estado
// - Avalúo 2026
// - Valor de mora SOLO si existe
// - Área
// - Street View
//
// Se eliminó la fila redundante:
//
// "Número predial"
//
// =====================================================

function mostrarPopupPredial(
  feature,
  lngLatPopup,
  lngLatStreetView
) {

  const props =
    feature.properties || {};


  // ===================================================
  // CÓDIGO
  // ===================================================

  const codigo =
    obtenerPropiedad(
      props,
      [
        'codigo',
        'CODIGO'
      ]
    )

    ??

    'N/A';


  // ===================================================
  // DIRECCIÓN
  // ===================================================

  const direccionRaw =
    obtenerPropiedad(
      props,
      [
        'DIRECCION',
        'direccion',
        'DIRECCIÓN',
        'Dirección'
      ]
    );


  const direccion =
    formatearDireccion(
      direccionRaw
    );


  // ===================================================
  // NOMBRE
  // ===================================================

  const nombre =
    obtenerPropiedad(
      props,
      [
        'NOMBRE',
        'nombre'
      ]
    )

    ??

    'N/A';


  // ===================================================
  // DOCUMENTO
  // ===================================================

  const documento =
    obtenerPropiedad(
      props,
      [
        'NUMERO_DOCUMENTO',
        'numero_documento'
      ]
    )

    ??

    'N/A';


  // ===================================================
  // ESTADO
  // ===================================================

  const estado =
    props.__ESTADO_NOMBRE

    ??

    nombreEstado(
      props.__ESTADO_PREDIAL
    );


  // ===================================================
  // AVALÚO 2026
  // ===================================================

  const avaluoRaw =
    obtenerPropiedad(
      props,
      [
        'AVALUO 2026',
        'AVALUO.2026',
        'AVALUO_2026',
        'AVALUO2026',
        'avaluo 2026',
        'avaluo.2026'
      ]
    );


  let avaluo =
    'N/A';


  if (

    avaluoRaw !== null

    &&

    avaluoRaw !== undefined

    &&

    avaluoRaw !== ''

  ) {


    // ===============================================
    // SI YA ES NÚMERO
    // ===============================================

    if (
      typeof avaluoRaw ===
      'number'
    ) {

      avaluo =

        '$ ' +

        Math
          .round(
            avaluoRaw
          )
          .toLocaleString(
            'es-CO'
          );

    }


    // ===============================================
    // SI VIENE COMO TEXTO
    // ===============================================

    else {


      let textoAvaluo =
        String(
          avaluoRaw
        )

          .trim()

          .replace(
            /\$/g,
            ''
          )

          .replace(
            /\s/g,
            ''
          );


      // =============================================
      // 425.000.000
      // =============================================

      if (
        /^\d{1,3}(\.\d{3})+$/.test(
          textoAvaluo
        )
      ) {

        textoAvaluo =
          textoAvaluo.replace(
            /\./g,
            ''
          );

      }


      // =============================================
      // 425.000.000,00
      // =============================================

      else if (
        /^\d{1,3}(\.\d{3})+,\d+$/.test(
          textoAvaluo
        )
      ) {

        textoAvaluo =
          textoAvaluo

            .replace(
              /\./g,
              ''
            )

            .replace(
              ',',
              '.'
            );

      }


      // =============================================
      // 425000000,00
      // =============================================

      else if (
        /^\d+,\d+$/.test(
          textoAvaluo
        )
      ) {

        textoAvaluo =
          textoAvaluo.replace(
            ',',
            '.'
          );

      }


      const numeroAvaluo =
        Number(
          textoAvaluo
        );


      if (
        Number.isFinite(
          numeroAvaluo
        )
      ) {

        avaluo =

          '$ ' +

          Math
            .round(
              numeroAvaluo
            )
            .toLocaleString(
              'es-CO'
            );

      }

    }

  }


// =====================================================
// VALOR DE LA MORA
// =====================================================

  const moraRaw =
    obtenerPropiedad(
      props,
      [
        'total.valor.mora',
        'TOTAL.VALOR.MORA',
        'total_valor_mora'
      ]
    );


  const valorMora =
    numeroSeguro(
      moraRaw
    );


// =====================================================
// FILA DE MORA
// =====================================================
//
// Solamente aparece cuando:
//
// total.valor.mora > 0
//
// =====================================================

  const filaMora =

    valorMora > 0

      ? `

        <br>

        <strong>
          Valor de la mora:
        </strong>

        $ ${Math
            .round(valorMora)
            .toLocaleString('es-CO')}

      `

      : '';


// =====================================================
// ÁREA
// =====================================================

  const areaRaw =
    obtenerPropiedad(
      props,
      [
        'Shape_Area',
        'SHAPE_AREA',
        'shape_area'
      ]
    );


  const area =
    areaRaw !== null

      ? formatoArea(
          areaRaw
        )

      : 'N/A';


// =====================================================
// HTML DEL POPUP
// =====================================================

  const html = `

    <div
      style="
        font-size:14px;
        font-weight:700;
        margin-bottom:8px;
      "
    >

      Información del predio

    </div>


    <strong>
      Código:
    </strong>

    ${codigo}


    <br>


    <strong>
      Dirección:
    </strong>

    ${direccion}


    <br>


    <strong>
      Nombre:
    </strong>

    ${nombre}


    <br>


    <strong>
      Documento:
    </strong>

    ${documento}


    <br>


    <strong>
      Estado:
    </strong>

    ${estado}


    <br>


    <strong>
      Avalúo 2026:
    </strong>

    ${avaluo}


    ${filaMora}


    <br>


    <strong>
      Área:
    </strong>

    ${area}


    <div
      style="
        margin-top:10px;
      "
    >

      <a

        href="${streetViewUrl(lngLatStreetView)}"

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
        "

      >

        📷 Street View

      </a>

    </div>


    <div
      style="
        margin-top:8px;
        font-size:9px;
        color:#00bcd4;
      "
    >

      &#9400; EffectiveActions

    </div>

  `;


// =====================================================
// MOSTRAR POPUP
// =====================================================

  popup

    .setLngLat(
      lngLatPopup
    )

    .setHTML(
      html
    )

    .addTo(
      map
    );

}


// =====================================================
// CARGAR EXCEL DE EXENTOS
// =====================================================

function cargarExcelExentos() {


  return fetch(
    EXENTOS_URL
  )


    .then(
      (response) => {


        if (
          !response.ok
        ) {

          throw new Error(

            `No se pudo cargar PREDIOS EXCENTOS.xlsx. ` +

            `HTTP ${response.status}`

          );

        }


        return response.arrayBuffer();

      }
    )


    .then(
      (buffer) => {


        // =============================================
        // COMPROBAR SHEETJS
        // =============================================

        if (
          typeof XLSX ===
          'undefined'
        ) {

          throw new Error(

            'SheetJS no está cargado. ' +

            'Debes cargar xlsx.full.min.js antes de index.js.'

          );

        }


        // =============================================
        // LEER EXCEL
        // =============================================

        const workbook =
          XLSX.read(

            buffer,

            {

              type:
                'array'

            }

          );


        // =============================================
        // VALIDAR HOJA
        // =============================================

        if (
          !workbook.SheetNames.length
        ) {

          throw new Error(
            'El Excel de exentos no contiene hojas.'
          );

        }


        // =============================================
        // PRIMERA HOJA
        // =============================================

        const nombreHoja =
          workbook.SheetNames[0];


        const hoja =
          workbook.Sheets[
            nombreHoja
          ];


        // =============================================
        // CONVERTIR EXCEL A OBJETOS
        // =============================================

        const registros =
          XLSX.utils.sheet_to_json(

            hoja,

            {

              defval:
                '',

              raw:
                false

            }

          );


        console.log(
          'Hoja de exentos:',
          nombreHoja
        );


        console.log(
          'Filas leídas del Excel:',
          registros.length
        );


        if (
          registros.length
        ) {

          console.log(
            'Columnas Excel:',
            Object.keys(
              registros[0]
            )
          );

        }


        return registros;

      }
    );

}


// =====================================================
// CARGAR GEOJSON PREDIAL
// =====================================================

function cargarGeoJSONPredial() {


  return fetch(
    PREDIOS_URL
  )


    .then(
      (response) => {


        if (
          !response.ok
        ) {

          throw new Error(

            `No se pudo cargar la base predial. ` +

            `HTTP ${response.status}`

          );

        }


        return response.json();

      }
    );

}


// =====================================================
// CARGAR TODOS LOS DATOS
// =====================================================

function cargarDatosPrediales() {


  Promise.all([

    cargarGeoJSONPredial(),

    cargarExcelExentos()

  ])


    .then(
      ([
        predios,
        exentos
      ]) => {


        // =============================================
        // GUARDAR EXENTOS
        // =============================================

        EXENTOS_DATA =
          exentos;


        // =============================================
        // PREPARAR CRUCE DE EXENTOS
        // =============================================

        prepararExentos(
          exentos
        );


        // =============================================
        // 1. CLASIFICAR TODOS LOS PREDIOS
        // =============================================

        const prediosClasificados =
          clasificarGeoJSON(
            predios
          );


        // =============================================
        // 2. ELIMINAR GEOMETRÍAS DUPLICADAS
        // =============================================
        //
        // ESTE ES EL CAMBIO IMPORTANTE.
        //
        // Conservamos:
        //
        // fill-opacity = 0.68
        //
        // pero evitamos que exactamente el mismo
        // polígono se pinte varias veces.
        //
        // =============================================

        PREDIOS_DATA =
          eliminarGeometriasDuplicadas(
            prediosClasificados
          );


        // =============================================
        // 3. MOSTRAR CONTEOS
        // =============================================

        mostrarResumenClasificacion(
          PREDIOS_DATA
        );


        // =============================================
        // 4. CREAR SOURCE
        // =============================================

        crearSourcePredial(
          PREDIOS_DATA
        );


        // =============================================
        // 5. CREAR CINCO CAPAS
        // =============================================

        crearCapasPrediales();


        // =============================================
        // 6. CREAR HIGHLIGHT
        // =============================================

        crearHighlight();


        // =============================================
        // 7. HIGHLIGHT ENCIMA
        // =============================================

        try {


          if (
            map.getLayer(
              'predios_highlight_fill'
            )
          ) {

            map.moveLayer(
              'predios_highlight_fill'
            );

          }


          if (
            map.getLayer(
              'predios_highlight_line'
            )
          ) {

            map.moveLayer(
              'predios_highlight_line'
            );

          }


        }

        catch (error) {}


        // =============================================
        // 8. ZOOM INICIAL
        // =============================================

        ajustarVistaMunicipio(
          PREDIOS_DATA
        );


        // =============================================
        // 9. CREAR LEYENDA
        // =============================================
        //
        // Esta función viene en la Parte 4.
        //
        // =============================================

        crearLeyendaEstados();

      }
    )


    .catch(
      (error) => {


        console.error(
          'ERROR CARGANDO VISOR PREDIAL:',
          error
        );


        // =============================================
        // MOSTRAR ERROR EN PANTALLA
        // =============================================

        const infoBox =
          document.querySelector(
            '.info-box'
          );


        if (
          infoBox
        ) {

          infoBox.style.display =
            'block';


          const content =
            infoBox.querySelector(
              '.info-content'
            );


          if (
            content
          ) {

            content.innerHTML =

              '<strong>Error cargando los datos.</strong><br>' +

              'Revisa la consola del navegador.';

          }

        }

      }
    );

}
// =====================================================
// PARTE 4 DE 5
// LEYENDA INTERACTIVA + BUSCADOR
// =====================================================


// =====================================================
// CREAR LEYENDA INTERACTIVA
// =====================================================
//
// El HTML debe contener:
//
// <div id="estado-legend-list"></div>
//
// =====================================================

function crearLeyendaEstados() {

  const container =
    document.getElementById(
      'estado-legend-list'
    );


  if (
    !container
  ) {

    console.warn(
      'No existe #estado-legend-list en el HTML.'
    );

    return;

  }


  // Limpiar para evitar duplicados
  container.innerHTML =
    '';


  // ===================================================
  // CREAR UNA FILA POR CATEGORÍA
  // ===================================================

  ORDEN_ESTADOS.forEach(
    (estado) => {


      // ===============================================
      // FILA
      // ===============================================

      const item =
        document.createElement(
          'div'
        );


      item.className =
        'estado-item';


      // ===============================================
      // INFORMACIÓN IZQUIERDA
      // ===============================================

      const info =
        document.createElement(
          'div'
        );


      info.className =
        'estado-info';


      // ===============================================
      // CUADRO DE COLOR
      // ===============================================

      const color =
        document.createElement(
          'span'
        );


      color.className =
        'estado-color';


      color.style.backgroundColor =
        estado.color;


      // ===============================================
      // NOMBRE
      // ===============================================

      const texto =
        document.createElement(
          'span'
        );


      texto.className =
        'estado-texto';


      texto.textContent =
        estado.nombre;


      // ===============================================
      // ARMAR IZQUIERDA
      // ===============================================

      info.appendChild(
        color
      );


      info.appendChild(
        texto
      );


      // ===============================================
      // BOTÓN ON / OFF
      // ===============================================

      const boton =
        document.createElement(
          'button'
        );


      boton.type =
        'button';


      boton.className =
        'estado-toggle activo';


      boton.textContent =
        'ON';


      boton.dataset.layer =
        estado.layerId;


      boton.dataset.visible =
        'true';


      // ===============================================
      // EVENTO ON / OFF
      // ===============================================

      boton.addEventListener(
        'click',
        () => {


          const estaVisible =
            boton.dataset.visible ===
            'true';


          const nuevaVisibilidad =
            !estaVisible;


          boton.dataset.visible =
            nuevaVisibilidad
              ? 'true'
              : 'false';


          // ===========================================
          // MOSTRAR / OCULTAR CAPA
          // ===========================================

          if (
            map.getLayer(
              estado.layerId
            )
          ) {

            map.setLayoutProperty(

              estado.layerId,

              'visibility',

              nuevaVisibilidad
                ? 'visible'
                : 'none'

            );

          }


          // ===========================================
          // CAMBIAR TEXTO
          // ===========================================

          boton.textContent =
            nuevaVisibilidad
              ? 'ON'
              : 'OFF';


          // ===========================================
          // CAMBIAR ESTILO
          // ===========================================

          boton.classList.toggle(
            'activo',
            nuevaVisibilidad
          );


          boton.classList.toggle(
            'inactivo',
            !nuevaVisibilidad
          );


          // ===========================================
          // LIMPIAR SELECCIÓN
          // ===========================================

          limpiarHighlight();


          try {

            popup.remove();

          }

          catch (error) {}

        }
      );


      // ===============================================
      // ARMAR FILA
      // ===============================================

      item.appendChild(
        info
      );


      item.appendChild(
        boton
      );


      container.appendChild(
        item
      );

    }
  );

}


// =====================================================
// NORMALIZAR TEXTO PARA BUSCADOR
// =====================================================

function normalizarBusqueda(
  value
) {

  return (
    value ??
    ''
  )

    .toString()

    .toLowerCase()

    .trim();

}


// =====================================================
// BUSCADOR LOCAL
// =====================================================

const geocoder =
  new MapboxGeocoder({

    accessToken:
      mapboxgl.accessToken,

    mapboxgl:
      mapboxgl,

    marker:
      false,

    localGeocoderOnly:
      true,

    placeholder:
      'Buscar código, nombre, documento o predial',


    // =================================================
    // FUNCIÓN DE BÚSQUEDA
    // =================================================

    localGeocoder:
      function (
        query
      ) {


        const resultados =
          [];


        const q =
          normalizarBusqueda(
            query
          );


        if (
          !q
        ) {

          return resultados;

        }


        // =============================================
        // OBTENER FEATURES
        // =============================================

        const features =

          (
            PREDIOS_DATA

            &&

            Array.isArray(
              PREDIOS_DATA.features
            )
          )

            ? PREDIOS_DATA.features

            : [];


        if (
          !features.length
        ) {

          return resultados;

        }


        // =============================================
        // RECORRER PREDIOS
        // =============================================

        features.forEach(
          (feature) => {


            const props =
              feature.properties || {};


            // =========================================
            // CAMPOS BUSCABLES
            // =========================================

            const codigo =
              normalizarBusqueda(
                props.codigo
              );


            const nombre =
              normalizarBusqueda(
                props.NOMBRE
              );


            const documento =
              normalizarBusqueda(
                props.NUMERO_DOCUMENTO
              );


            const numeroPredial =
              normalizarBusqueda(
                props.NUMERO_PREDIAL
              );


            // =========================================
            // COINCIDENCIAS
            // =========================================

            const coincideCodigo =
              codigo &&
              codigo.includes(q);


            const coincideNombre =
              nombre &&
              nombre.includes(q);


            const coincideDocumento =
              documento &&
              documento.includes(q);


            const coincidePredial =
              numeroPredial &&
              numeroPredial.includes(q);


            if (

              !coincideCodigo

              &&

              !coincideNombre

              &&

              !coincideDocumento

              &&

              !coincidePredial

            ) {

              return;

            }


            // =========================================
            // CENTRO DEL PREDIO
            // =========================================

            let centro;


            try {

              centro =
                turf
                  .pointOnFeature(
                    feature
                  )
                  .geometry
                  .coordinates;

            }

            catch (error) {

              centro = [
                -73.79724,
                5.04463
              ];

            }


            // =========================================
            // CAMPO QUE PRODUJO LA COINCIDENCIA
            // =========================================

            let matchField =
              null;


            let matchValue =
              null;


            if (
              coincideCodigo
            ) {

              matchField =
                'codigo';

              matchValue =
                props.codigo;

            }


            else if (
              coincideDocumento
            ) {

              matchField =
                'NUMERO_DOCUMENTO';

              matchValue =
                props.NUMERO_DOCUMENTO;

            }


            else if (
              coincidePredial
            ) {

              matchField =
                'NUMERO_PREDIAL';

              matchValue =
                props.NUMERO_PREDIAL;

            }


            else if (
              coincideNombre
            ) {

              matchField =
                'NOMBRE';

              matchValue =
                props.NOMBRE;

            }


            // =========================================
            // PROPIEDADES DEL RESULTADO
            // =========================================

            const properties = {

              ...props,

              __matchField:
                matchField,

              __matchValue:
                matchValue

            };


            // =========================================
            // AGREGAR RESULTADO
            // =========================================

            resultados.push({

              type:
                'Feature',

              geometry:
                feature.geometry,

              properties:
                properties,

              center:
                centro,

              place_name:

                `Código: ${
                  props.codigo ?? 'N/A'
                } | ` +

                `${
                  props.NOMBRE ?? 'N/A'
                } | ` +

                `${
                  props.__ESTADO_NOMBRE ??
                  'Sin clasificar'
                }`,

              text:

                (
                  props.codigo

                  ??

                  props.NUMERO_PREDIAL

                  ??

                  'Resultado'
                )

                  .toString(),

              place_type:
                ['place']

            });

          }
        );


        // =============================================
        // MÁXIMO 10 RESULTADOS
        // =============================================

        return resultados.slice(
          0,
          10
        );

      }

  });


// =====================================================
// AGREGAR BUSCADOR AL MAPA
// =====================================================

map.addControl(

  geocoder,

  'top-left'

);


// =====================================================
// RESULTADO DEL BUSCADOR
// =====================================================

geocoder.on(
  'result',
  (e) => {


    const result =
      e.result;


    if (
      !result ||
      !result.geometry
    ) {

      return;

    }


    const props =
      result.properties || {};


    const matchField =
      props.__matchField;


    const matchValue =
      props.__matchValue;


    // =================================================
    // TODOS LOS FEATURES
    // =================================================

    const features =

      (
        PREDIOS_DATA

        &&

        Array.isArray(
          PREDIOS_DATA.features
        )
      )

        ? PREDIOS_DATA.features

        : [];


    // =================================================
    // PREDIOS A RESALTAR
    // =================================================

    let toHighlight =
      [];


    // =================================================
    // BÚSQUEDA EXACTA PARA:
    //
    // - código
    // - documento
    // - NUMERO_PREDIAL
    //
    // Si existen varios polígonos asociados al mismo
    // valor, se resaltan todos.
    // =================================================

    if (

      (
        matchField ===
          'codigo'

        ||

        matchField ===
          'NUMERO_DOCUMENTO'

        ||

        matchField ===
          'NUMERO_PREDIAL'
      )

      &&

      matchValue !== null

      &&

      matchValue !== undefined

      &&

      matchValue !== ''

    ) {


      const valorBuscado =

        matchField ===
          'NUMERO_PREDIAL'

          ? normalizarNumeroPredial(
              matchValue
            )

          : norm(
              matchValue
            );


      toHighlight =
        features.filter(
          (feature) => {


            const p =
              feature.properties || {};


            let valor;


            if (
              matchField ===
              'codigo'
            ) {

              valor =
                p.codigo;

            }


            else if (
              matchField ===
              'NUMERO_DOCUMENTO'
            ) {

              valor =
                p.NUMERO_DOCUMENTO;

            }


            else {

              valor =
                p.NUMERO_PREDIAL;

            }


            const valorNormalizado =

              matchField ===
                'NUMERO_PREDIAL'

                ? normalizarNumeroPredial(
                    valor
                  )

                : norm(
                    valor
                  );


            return (
              valorNormalizado ===
              valorBuscado
            );

          }
        );

    }


    // =================================================
    // SI NO HAY GRUPO
    // =================================================

    if (
      !toHighlight.length
    ) {

      toHighlight =
        [result];

    }


    // =================================================
    // FEATURE COLLECTION
    // =================================================

    const fc = {

      type:
        'FeatureCollection',

      features:
        toHighlight

    };


    // =================================================
    // HIGHLIGHT
    // =================================================

    const highlightSource =
      map.getSource(
        'predios_highlight'
      );


    if (
      highlightSource
    ) {

      highlightSource.setData(
        fc
      );

    }


    // =================================================
    // ZOOM AL RESULTADO
    // =================================================

    try {


      const bounds =
        turf.bbox(
          fc
        );


      map.fitBounds(

        bounds,

        {

          padding:
            45,

          maxZoom:
            18,

          duration:
            700

        }

      );

    }


    catch (error) {

      console.error(
        'Error haciendo zoom al resultado:',
        error
      );

    }


    // =================================================
    // CENTRO DEL POPUP
    // =================================================

    let center;


    try {

      center =

        result.center

        ||

        turf
          .pointOnFeature(
            result
          )
          .geometry
          .coordinates;

    }


    catch (error) {

      center =

        result.center

        ||

        [
          -73.79724,
          5.04463
        ];

    }


    // =================================================
    // COORDENADA STREET VIEW
    // =================================================

    let svLngLat;


    try {

      const punto =
        turf
          .pointOnFeature(
            result
          )
          .geometry
          .coordinates;


      svLngLat = [

        punto[0],

        punto[1]

      ];

    }


    catch (error) {

      svLngLat =
        getFeatureLngLat(
          result
        );

    }


    // =================================================
    // MOSTRAR POPUP
    // =================================================

    mostrarPopupPredial(

      result,

      center,

      svLngLat

    );

  }
);
// =====================================================
// PARTE 5 DE 5 — FINAL
// CARGA DEL MAPA + ORDEN DE CAPAS + LIMPIEZA
// =====================================================


// =====================================================
// CUANDO EL ESTILO DEL MAPA ESTÉ LISTO
// =====================================================

map.on(
  'style.load',
  () => {


    // =================================================
    // CARGAR TODO EL VISOR
    // =================================================
    //
    // cargarDatosPrediales() realiza:
    //
    // 1. Carga el GeoJSON predial
    //
    // 2. Carga PREDIOS EXCENTOS.xlsx
    //
    // 3. Cruza NUMERO_PREDIAL
    //
    // 4. Clasifica:
    //
    //    🔵 Público
    //    🟣 Exento
    //    🔴 Mora
    //    🟢 Al día
    //    🟠 Posible sin pagar
    //
    // 5. Elimina geometrías exactamente duplicadas
    //
    // 6. Conserva transparencia 0.68
    //
    // 7. Crea las cinco capas
    //
    // 8. Crea highlight
    //
    // 9. Ajusta la vista a Sesquilé
    //
    // 10. Crea la leyenda ON/OFF
    //
    // =================================================

    cargarDatosPrediales();

  }
);


// =====================================================
// MANTENER HIGHLIGHT ENCIMA
// =====================================================
//
// Cuando Mapbox termina de renderizar,
// mantenemos las dos capas amarillas por encima
// de las capas prediales.
//
// =====================================================

map.on(
  'idle',
  () => {


    try {


      // ===============================================
      // RELLENO AMARILLO
      // ===============================================

      if (
        map.getLayer(
          'predios_highlight_fill'
        )
      ) {

        map.moveLayer(
          'predios_highlight_fill'
        );

      }


      // ===============================================
      // CONTORNO AMARILLO
      // ===============================================

      if (
        map.getLayer(
          'predios_highlight_line'
        )
      ) {

        map.moveLayer(
          'predios_highlight_line'
        );

      }


    }


    catch (error) {

      console.error(
        'Error organizando highlight:',
        error
      );

    }

  }
);


// =====================================================
// CLICK GENERAL DEL MAPA
// =====================================================
//
// Si el usuario hace clic fuera de los predios:
//
// - limpia el highlight
// - cierra el popup
//
// Si hace clic sobre un predio:
//
// - conserva el highlight
// - conserva el popup
//
// =====================================================

map.on(
  'click',
  (e) => {


    // =================================================
    // CAPAS PREDIALES EXISTENTES
    // =================================================

    const capasExistentes =

      ORDEN_ESTADOS

        .map(
          (estado) =>
            estado.layerId
        )

        .filter(
          (layerId) =>
            map.getLayer(
              layerId
            )
        );


    // =================================================
    // SI TODAVÍA NO HAN CARGADO
    // =================================================

    if (
      !capasExistentes.length
    ) {

      return;

    }


    // =================================================
    // BUSCAR FEATURES EN EL PUNTO DEL CLICK
    // =================================================

    const features =
      map.queryRenderedFeatures(

        e.point,

        {

          layers:
            capasExistentes

        }

      );


    // =================================================
    // CLICK FUERA DE LOS PREDIOS
    // =================================================

    if (
      !features.length
    ) {


      // ===============================================
      // LIMPIAR HIGHLIGHT
      // ===============================================

      limpiarHighlight();


      // ===============================================
      // CERRAR POPUP
      // ===============================================

      try {

        popup.remove();

      }

      catch (error) {}

    }

  }
);


// =====================================================
// REDIMENSIONAMIENTO
// =====================================================
//
// Mantiene correctamente el mapa cuando:
//
// - cambia el tamaño del navegador
// - se usa celular
// - se rota la pantalla
// - se usa tablet
// - cambia la resolución
//
// =====================================================

window.addEventListener(
  'resize',
  () => {

    map.resize();

  }
);


// =====================================================
// DEBUG GENERAL
// =====================================================

map.on(
  'error',
  (e) => {

    console.error(
      'Error del mapa:',
      e
    );

  }
);


// =====================================================
// FIN DEL INDEX.JS
// =====================================================
