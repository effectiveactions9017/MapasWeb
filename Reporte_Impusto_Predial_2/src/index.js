// =====================================================
// VISOR PREDIAL SESQUILÉ
// =====================================================
//
// CLASIFICACIÓN:
//
// 🔵 Predios públicos
// 🟣 Predios exentos
// 🔴 Predios con mora
// 🟢 Predios al día
// 🟠 Posibles sin pagar
//
// PRIORIDAD:
//
// 1. PÚBLICO
// 2. EXENTO
// 3. MORA
// 4. AL DÍA
// 5. POSIBLE SIN PAGAR
//
// FUNCIONES:
//
// ✅ Mapa satelital
// ✅ Excel de predios exentos
// ✅ Cruce por NUMERO_PREDIAL
// ✅ Zoom automático a Sesquilé
// ✅ Leyenda ON / OFF
// ✅ Buscador
// ✅ Highlight amarillo
// ✅ Popup corregido
// ✅ Dirección formateada
// ✅ Street View
//
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';


// =====================================================
// RUTAS DE DATOS
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

    // Mapa satelital
    style:
      'mapbox://styles/mapbox/satellite-streets-v12',

    // Vista temporal.
    // Luego se ajustará automáticamente a Sesquilé.
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
// CONTROLES DEL MAPA
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


// Aquí se guardarán los NUMERO_PREDIAL
// encontrados en el Excel de exentos.

let EXENTOS_SET =
  new Set();


// =====================================================
// CONFIGURACIÓN DE LAS CINCO CATEGORÍAS
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
// IMPORTANTE:
//
// Se mantiene como TEXTO.
//
// No lo convertimos a número porque un número predial
// puede contener ceros iniciales.
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
// CONVERTIR VALORES A NÚMERO
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


  // Ya es número
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
  // FORMATO COLOMBIANO:
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


  // Limpiar cualquier otro carácter
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
// BUSCAR UNA PROPIEDAD ENTRE VARIAS ALTERNATIVAS
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
  //
  // Calle 8 3 35
  // →
  // Calle 8 # 3-35
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


  // Si viene de un click
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


  // Punto representativo del polígono
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
// CLASIFICACIÓN PREDIAL
// =====================================================


// =====================================================
// 1. IDENTIFICAR PREDIO PÚBLICO
// =====================================================
//
// Regla:
//
// NOMBRE = MUNICIPIO DE SESQUILE
//
// Tiene prioridad sobre todas las demás categorías.
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
// 2. IDENTIFICAR PREDIO EXENTO
// =====================================================
//
// Cruce:
//
// GeoJSON:
// NUMERO_PREDIAL
//
// Excel:
// NUMERO_PREDIAL
//
// Los números del Excel estarán almacenados
// previamente en EXENTOS_SET.
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
// 3. IDENTIFICAR PREDIO CON MORA
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
// 4. IDENTIFICAR PREDIO CON ALGÚN PAGO
// =====================================================
//
// Un predio se considera AL DÍA si:
//
// valor.ultimo.pago > 0
//
// O
//
// pago.marzo > 0
//
// siempre que NO haya sido clasificado previamente
// como público, exento o con mora.
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
// PRIORIDAD OBLIGATORIA:
//
// 1. PÚBLICO
// 2. EXENTO
// 3. MORA
// 4. AL DÍA
// 5. POSIBLE SIN PAGAR
//
// Así cada polígono queda en UNA SOLA categoría.
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
//
// A cada feature se le agregan dos propiedades:
//
// __ESTADO_PREDIAL
// __ESTADO_NOMBRE
//
// Ejemplo:
//
// __ESTADO_PREDIAL = "MORA"
// __ESTADO_NOMBRE  = "Predios con mora"
//
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
// RESUMEN DE CLASIFICACIÓN
// =====================================================
//
// Nos permitirá comprobar en la consola del navegador
// cuántos predios quedaron en cada categoría.
//
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

    data

    &&

    Array.isArray(
      data.features
    )

  ) {


    data.features.forEach(
      (feature) => {


        const estado =
          feature
            .properties
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

  }


  // ===================================================
  // TOTAL
  // ===================================================

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


  // ===================================================
  // MOSTRAR EN CONSOLA
  // ===================================================

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


  map.addLayer({

    id:
      estado.layerId,

    type:
      'fill',

    source:
      'predios_ssk',


    // =================================================
    // FILTRAR POR CATEGORÍA
    // =================================================

    filter: [

      '==',

      [
        'get',
        '__ESTADO_PREDIAL'
      ],

      estado.codigo

    ],


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
      // Permite seguir viendo la imagen satelital.
      //
      // ===============================================

      'fill-opacity':
        0.68,


      // ===============================================
      // BORDE BLANCO
      // ===============================================

      'fill-outline-color':
        'rgba(255,255,255,0.70)'

    }

  });


  // ===================================================
  // CURSOR
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
      // RESALTAR PREDIO
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
      //
      // Esta función se define en la Parte 3.
      //
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

          // Margen pequeño para que el municipio
          // ocupe casi toda la pantalla.
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
// El Excel contiene la columna:
//
// NUMERO_PREDIAL
//
// Cada valor se guarda en EXENTOS_SET.
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
      // BUSCAR NUMERO_PREDIAL
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


      // ===============================================
      // AGREGAR AL SET
      // ===============================================

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
  // NÚMERO PREDIAL
  // ===================================================

  const numeroPredial =
    obtenerPropiedad(
      props,
      [
        'NUMERO_PREDIAL',
        'Numero_Predial',
        'numero_predial'
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
  // ESTADO PREDIAL
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
  //
  // Soportamos distintas variantes del nombre.
  //
  // ===================================================

  const avaluoRaw =
    obtenerPropiedad(
      props,
      [
        'AVALUO 2026',
        'AVALUO.2026',
        'AVALUO_2026',
        'AVALUO2026'
      ]
    );


  const avaluo =
    avaluoRaw !== null

      ? formatoMoneda(
          avaluoRaw
        )

      : 'N/A';


  // ===================================================
  // ÁREA
  // ===================================================

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


  // ===================================================
  // HTML DEL POPUP
  // ===================================================

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


    <strong>Código:</strong>
    ${codigo}

    <br>


    <strong>Número predial:</strong>
    ${numeroPredial}

    <br>


    <strong>Dirección:</strong>
    ${direccion}

    <br>


    <strong>Nombre:</strong>
    ${nombre}

    <br>


    <strong>Documento:</strong>
    ${documento}

    <br>


    <strong>Estado:</strong>
    ${estado}

    <br>


    <strong>Avalúo 2026:</strong>
    ${avaluo}

    <br>


    <strong>Área:</strong>
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
// LEER EXCEL DE PREDIOS EXENTOS
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
        // COMPROBAR QUE SHEETJS ESTÉ CARGADO
        // =============================================

        if (
          typeof XLSX ===
          'undefined'
        ) {

          throw new Error(

            'SheetJS no está cargado. ' +

            'Debes incluir xlsx.full.min.js antes de index.js.'

          );

        }


        // =============================================
        // LEER WORKBOOK
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
        // VALIDAR HOJAS
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
        // CONVERTIR A OBJETOS JAVASCRIPT
        // =============================================

        const registros =
          XLSX.utils.sheet_to_json(

            hoja,

            {

              // Si una celda está vacía
              defval:
                '',

              // Mantener valores como texto cuando sea posible
              raw:
                false

            }

          );


        console.log(
          'Hoja Excel de exentos:',
          nombreHoja
        );


        console.log(
          'Filas leídas del Excel:',
          registros.length
        );


        // =============================================
        // DIAGNÓSTICO DE COLUMNAS
        // =============================================

        if (
          registros.length
        ) {

          console.log(
            'Columnas encontradas en Excel:',
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
// CARGAR BASE PREDIAL
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
//
// Primero se cargan:
//
// 1. GeoJSON predial
// 2. Excel de exentos
//
// Después:
//
// 3. Se crea EXENTOS_SET
// 4. Se clasifican los predios
// 5. Se crean las capas
// 6. Se crea el highlight
// 7. Se ajusta la vista
// 8. Se crea la leyenda
//
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
        // GUARDAR EXCEL
        // =============================================

        EXENTOS_DATA =
          exentos;


        // =============================================
        // PREPARAR LISTADO DE EXENTOS
        // =============================================

        prepararExentos(
          exentos
        );


        // =============================================
        // CLASIFICAR GEOJSON
        // =============================================

        PREDIOS_DATA =
          clasificarGeoJSON(
            predios
          );


        // =============================================
        // MOSTRAR CONTEOS
        // =============================================

        mostrarResumenClasificacion(
          PREDIOS_DATA
        );


        // =============================================
        // CREAR SOURCE
        // =============================================

        crearSourcePredial(
          PREDIOS_DATA
        );


        // =============================================
        // CREAR LAS CINCO CAPAS
        // =============================================

        crearCapasPrediales();


        // =============================================
        // CREAR HIGHLIGHT
        // =============================================

        crearHighlight();


        // =============================================
        // HIGHLIGHT SIEMPRE ARRIBA
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
        // ZOOM INICIAL
        // =============================================

        ajustarVistaMunicipio(
          PREDIOS_DATA
        );


        // =============================================
        // CREAR LEYENDA
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


        // Mostrar un mensaje visible
        // para facilitar diagnóstico.
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
// LEYENDA INTERACTIVA + BUSCADOR PREDIAL
// =====================================================


// =====================================================
// CREAR LEYENDA INTERACTIVA
// =====================================================
//
// El HTML debe contener:
//
// <div id="estado-legend-list"></div>
//
// JavaScript insertará automáticamente:
//
// 🔵 Predios públicos        ON
// 🟣 Predios exentos         ON
// 🔴 Predios con mora        ON
// 🟢 Predios al día          ON
// 🟠 Posibles sin pagar      ON
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


  // Limpiar contenido anterior
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
      // COLOR
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
      // EVENTO DEL BOTÓN
      // ===============================================

      boton.addEventListener(
        'click',
        () => {


          const estaVisible =
            boton.dataset.visible ===
            'true';


          const nuevaVisibilidad =
            !estaVisible;


          // Guardar estado
          boton.dataset.visible =
            nuevaVisibilidad
              ? 'true'
              : 'false';


          // ===========================================
          // PRENDER / APAGAR CAPA
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
          // CLASE VISUAL
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
      // ARMAR FILA COMPLETA
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
// NORMALIZAR TEXTO PARA BÚSQUEDA
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
            // IDENTIFICAR CAMPO DE COINCIDENCIA
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
            // COPIAR PROPIEDADES
            // =========================================

            const properties = {

              ...props,

              __matchField:
                matchField,

              __matchValue:
                matchValue

            };


            // =========================================
            // RESULTADO
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
                  props.codigo ??
                  props.NUMERO_PREDIAL ??
                  'Resultado'
                ).toString(),

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
// AL SELECCIONAR UN RESULTADO
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
    // OBTENER TODOS LOS PREDIOS
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
    // CÓDIGO / DOCUMENTO / NUMERO_PREDIAL
    //
    // Si hay varios predios con el mismo valor,
    // se resaltan todos.
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


            const normalizado =

              matchField ===
                'NUMERO_PREDIAL'

                ? normalizarNumeroPredial(
                    valor
                  )

                : norm(
                    valor
                  );


            return (
              normalizado ===
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
    // ZOOM A RESULTADO
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

        [-73.79724, 5.04463];

    }


    // =================================================
    // STREET VIEW
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
    // POPUP
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
    // CARGAR TODO
    // =================================================
    //
    // cargarDatosPrediales() realiza:
    //
    // 1. Carga:
    //    PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson
    //
    // 2. Carga:
    //    PREDIOS EXCENTOS.xlsx
    //
    // 3. Cruza NUMERO_PREDIAL
    //
    // 4. Clasifica:
    //    PÚBLICO
    //    EXENTO
    //    MORA
    //    AL DÍA
    //    POSIBLE SIN PAGAR
    //
    // 5. Crea las cinco capas
    //
    // 6. Crea highlight
    //
    // 7. Ajusta zoom a Sesquilé
    //
    // 8. Crea leyenda ON/OFF
    //
    // =================================================

    cargarDatosPrediales();

  }
);


// =====================================================
// MANTENER HIGHLIGHT ENCIMA
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
// Si el usuario hace click FUERA de cualquier predio:
//
// - limpia el highlight
// - cierra el popup
//
// Si hace click SOBRE un predio:
//
// - NO limpia la selección
// - el evento específico de la capa muestra el popup
//
// =====================================================

map.on(
  'click',
  (e) => {


    // =================================================
    // OBTENER CAPAS QUE EXISTEN
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


    // Si las capas todavía no cargaron
    if (
      !capasExistentes.length
    ) {

      return;

    }


    // =================================================
    // COMPROBAR SI HIZO CLICK SOBRE ALGÚN PREDIO
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


      // Limpiar selección
      limpiarHighlight();


      // Cerrar popup
      try {

        popup.remove();

      }

      catch (error) {}

    }

  }
);


// =====================================================
// CAMBIO DE TAMAÑO DE PANTALLA
// =====================================================
//
// Importante para:
//
// - computador
// - celular
// - tablet
// - rotación de pantalla
// - cambio de tamaño de ventana
//
// =====================================================

window.addEventListener(
  'resize',
  () => {

    map.resize();

  }
);


// =====================================================
// DEBUG DEL MAPA
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
