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
// ✅ Zoom automático a todo Sesquilé
// ✅ Leyenda ON / OFF
// ✅ Buscador por código, nombre y documento
// ✅ Highlight amarillo
// ✅ Popup corregido
// ✅ Dirección formateada
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
    // Luego se ajusta automáticamente a todo Sesquilé.
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
// DATASETS EN MEMORIA
// =====================================================

let PREDIOS_DATA =
  null;


let EXENTOS_DATA =
  null;


// Set con números prediales exentos.
// Esto permite búsquedas rápidas.
let EXENTOS_SET =
  new Set();


// =====================================================
// CONFIGURACIÓN DE ESTADOS
// =====================================================

const ESTADOS = {

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
// NORMALIZAR NÚMERO PREDIAL
// =====================================================
//
// MUY IMPORTANTE:
//
// NUMERO_PREDIAL debe tratarse como TEXTO.
//
// No lo convertimos a Number porque puede contener
// ceros iniciales.
//
// =====================================================

function normalizarNumeroPredial(
  value
) {

  if (
    value === null ||
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
//
// Soporta:
//
// 123456
// "123456"
// "123.456"
// "$ 123.456"
// "1,234.56"
//
// =====================================================

function numeroSeguro(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return 0;

  }


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
      .trim();


  if (
    !texto
  ) {

    return 0;

  }


  // Eliminar símbolo monetario y espacios
  texto =
    texto.replace(
      /[$\s]/g,
      ''
    );


  // Formato colombiano:
  // 1.234.567
  if (
    /^\d{1,3}(\.\d{3})+$/.test(texto)
  ) {

    texto =
      texto.replace(
        /\./g,
        ''
      );

  }


  // 1.234.567,89
  else if (
    /^\d{1,3}(\.\d{3})+,\d+$/.test(texto)
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


  // 1234,56
  else if (
    /^\d+,\d+$/.test(texto)
  ) {

    texto =
      texto.replace(
        ',',
        '.'
      );

  }


  // Eliminar cualquier carácter restante
  // que no corresponda a número.
  texto =
    texto.replace(
      /[^0-9.-]/g,
      ''
    );


  const n =
    Number(texto);


  return Number.isFinite(n)
    ? n
    : 0;

}


// =====================================================
// FORMATEAR MONEDA
// =====================================================

function formatoMoneda(
  value
) {

  const n =
    numeroSeguro(
      value
    );


  if (
    !Number.isFinite(n)
  ) {

    return 'N/A';

  }


  return '$ ' +

    Math.round(n)

      .toLocaleString(
        'es-CO'
      );

}


// =====================================================
// FORMATEAR ÁREA
// =====================================================

function formatoArea(
  value
) {

  const n =
    numeroSeguro(
      value
    );


  if (
    !Number.isFinite(n)
  ) {

    return 'N/A';

  }


  return Math.round(n)

    .toLocaleString(
      'es-CO'
    ) +

    ' m²';

}


// =====================================================
// FORMATEAR DIRECCIÓN
// =====================================================

function formatearDireccion(
  direccion
) {

  if (
    direccion === null ||
    direccion === undefined ||
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
  //
  // Calle 8 3 35
  // →
  // Calle 8 # 3-35
  //
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
// OBTENER COORDENADA PARA STREET VIEW
// =====================================================

function getFeatureLngLat(
  feature,
  fallbackLngLat = null
) {


  // Si viene del click
  if (

    fallbackLngLat &&

    typeof fallbackLngLat.lng ===
      'number' &&

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

    const pt =
      turf

        .pointOnFeature(
          feature
        )

        .geometry

        .coordinates;


    return [

      Number(pt[0]),

      Number(pt[1])

    ];

  }

  catch (e) {}


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

    `https://www.google.com/maps/@?api=1` +

    `&map_action=pano` +

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
        item.codigo === codigo
    );


  return estado
    ? estado.nombre
    : 'Sin clasificar';

}
// =====================================================
// PARTE 2
// CARGA DE EXENTOS + CLASIFICACIÓN + CAPAS
// =====================================================


// =====================================================
// COMPROBAR SI EL PREDIO ES PÚBLICO
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
// COMPROBAR SI EL PREDIO ES EXENTO
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
// COMPROBAR SI TIENE MORA
// =====================================================

function predioTieneMora(
  props
) {

  // Campo principal de la base
  const mora =
    numeroSeguro(
      props?.['total.valor.mora']
    );


  return (
    mora > 0
  );

}


// =====================================================
// COMPROBAR SI TIENE ALGÚN PAGO
// =====================================================

function predioTienePago(
  props
) {

  // ===================================================
  // VALOR ÚLTIMO PAGO
  // ===================================================

  const ultimoPago =
    numeroSeguro(
      props?.['valor.ultimo.pago']
    );


  // ===================================================
  // PAGO MARZO
  // ===================================================

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
// Cada predio queda en UNA SOLA categoría.
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
// PREPARAR GEOJSON CLASIFICADO
// =====================================================

function clasificarGeoJSON(
  data
) {

  if (
    !data ||
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


      // ===============================================
      // ASIGNAR ESTADO
      // ===============================================

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
// CONTAR CLASIFICACIÓN
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
    data &&
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


  console.log(
    '=============================='
  );

  console.log(
    'RESUMEN PREDIAL SESQUILÉ'
  );

  console.log(
    'Públicos:',
    resumen.PUBLICO
  );

  console.log(
    'Exentos:',
    resumen.EXENTO
  );

  console.log(
    'Con mora:',
    resumen.MORA
  );

  console.log(
    'Al día:',
    resumen.AL_DIA
  );

  console.log(
    'Posibles sin pagar:',
    resumen.POSIBLE_SIN_PAGAR
  );

  console.log(
    'Total:',
    Object
      .values(resumen)
      .reduce(
        (a, b) =>
          a + b,
        0
      )
  );

  console.log(
    '=============================='
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
// CREAR CAPA PARA UN ESTADO
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
    // FILTRAR POR ESTADO
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
      // COLOR DE LA CATEGORÍA
      // ===============================================

      'fill-color':
        estado.color,


      // ===============================================
      // TRANSPARENCIA
      // ===============================================
      //
      // Se conserva visible el mapa satelital.
      //
      // ===============================================

      'fill-opacity':
        0.68,


      // ===============================================
      // BORDE FINO BLANCO
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
  // CLICK EN EL PREDIO
  // ===================================================

  map.on(

    'click',

    estado.layerId,

    (e) => {


      const feature =

        e.features &&

        e.features[0];


      if (
        !feature
      ) {

        return;

      }


      // ===============================================
      // RESALTAR EL PREDIO
      // ===============================================

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
      // MOSTRAR POPUP
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
  // BORDE AMARILLO
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
    !data ||
    !Array.isArray(
      data.features
    ) ||
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

      Array.isArray(bounds)

      &&

      bounds.length === 4

      &&

      bounds.every(
        Number.isFinite
      )

    ) {

      map.fitBounds(

        bounds,

        {

          // Margen pequeño para que Sesquilé
          // ocupe la mayor parte de la pantalla.
          padding:
            12,

          duration:
            1000,

          maxZoom:
            16

        }

      );

    }


  } catch (error) {

    console.error(

      'Error ajustando vista a Sesquilé:',

      error

    );

  }

}
// =====================================================
// PARTE 3
// CARGA DE DATOS + CLASIFICACIÓN + POPUP
// =====================================================


// =====================================================
// OBTENER UNA PROPIEDAD ENTRE VARIAS ALTERNATIVAS
// =====================================================
//
// Esto nos ayuda porque algunas versiones de la base
// pueden tener:
//
// AVALUO 2026
// AVALUO.2026
//
// =====================================================

function obtenerPropiedad(
  props,
  alternativas
) {

  for (
    const key of alternativas
  ) {

    if (
      props[key] !== undefined &&
      props[key] !== null &&
      props[key] !== ''
    ) {

      return props[key];

    }

  }


  return null;

}


// =====================================================
// CREAR SET DE PREDIOS EXENTOS
// =====================================================

function prepararExentos(
  data
) {

  EXENTOS_SET =
    new Set();


  if (
    !data
  ) {

    return;

  }


  // ===================================================
  // FORMATO 1:
  //
  // [
  //   "25736...",
  //   "25736..."
  // ]
  // ===================================================

  if (
    Array.isArray(data)
  ) {

    data.forEach(
      (item) => {


        // Si es directamente un string/número
        if (
          typeof item === 'string' ||
          typeof item === 'number'
        ) {

          const numero =
            normalizarNumeroPredial(
              item
            );


          if (
            numero
          ) {

            EXENTOS_SET.add(
              numero
            );

          }


          return;

        }


        // Si es objeto
        if (
          item &&
          typeof item === 'object'
        ) {

          const numero =
            normalizarNumeroPredial(

              item.NUMERO_PREDIAL ??

              item.numero_predial ??

              item.Numero_Predial ??

              ''

            );


          if (
            numero
          ) {

            EXENTOS_SET.add(
              numero
            );

          }

        }

      }
    );

  }


  // ===================================================
  // FORMATO 2:
  //
  // {
  //   "exentos": [...]
  // }
  // ===================================================

  else if (
    Array.isArray(
      data.exentos
    )
  ) {

    data.exentos.forEach(
      (item) => {


        const numero =
          normalizarNumeroPredial(

            typeof item === 'object'

              ? (
                  item.NUMERO_PREDIAL ??
                  item.numero_predial ??
                  ''
                )

              : item

          );


        if (
          numero
        ) {

          EXENTOS_SET.add(
            numero
          );

        }

      }
    );

  }


  console.log(
    'Predios exentos cargados:',
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
    ) ?? 'N/A';


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
    ) ?? 'N/A';


  // ===================================================
  // DIRECCIÓN
  // ===================================================

  const direccionRaw =
    obtenerPropiedad(
      props,
      [
        'DIRECCION',
        'direccion',
        'Dirección',
        'DIRECCIÓN'
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
    ) ?? 'N/A';


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
    ) ?? 'N/A';


  // ===================================================
  // ESTADO
  // ===================================================

  const estadoCodigo =
    props.__ESTADO_PREDIAL ??
    '';


  const estadoNombre =
    props.__ESTADO_NOMBRE ??
    nombreEstado(
      estadoCodigo
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


    <strong>
      Código:
    </strong>
    ${codigo}

    <br>


    <strong>
      Número predial:
    </strong>
    ${numeroPredial}

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
    ${estadoNombre}

    <br>


    <strong>
      Avalúo 2026:
    </strong>
    ${avaluo}

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


  popup

    .setLngLat(
      lngLatPopup
    )

    .setHTML(
      html
    )

    .addTo(map);

}


// =====================================================
// CARGAR GEOJSON + EXCEL DE EXENTOS
// =====================================================

function cargarDatosPrediales() {

  Promise.all([

    // ===============================================
    // BASE PREDIAL GEOJSON
    // ===============================================

    fetch(PREDIOS_URL)

      .then(response => {

        if (!response.ok) {

          throw new Error(
            `Error cargando predios: ${response.status}`
          );

        }

        return response.json();

      }),


    // ===============================================
    // EXCEL DE PREDIOS EXENTOS
    // ===============================================

    fetch(EXENTOS_URL)

      .then(response => {

        if (!response.ok) {

          throw new Error(
            `Error cargando Excel de exentos: ${response.status}`
          );

        }

        return response.arrayBuffer();

      })

      .then(buffer => {

        // Leer archivo XLSX
        const workbook =
          XLSX.read(
            buffer,
            {
              type: 'array'
            }
          );


        // Tomar la primera hoja
        const primeraHoja =
          workbook.SheetNames[0];


        const worksheet =
          workbook.Sheets[
            primeraHoja
          ];


        // Convertir Excel a objetos JavaScript
        const registros =
          XLSX.utils.sheet_to_json(
            worksheet,
            {
              defval: '',
              raw: false
            }
          );


        console.log(
          'Registros encontrados en Excel de exentos:',
          registros.length
        );


        return registros;

      })

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
      // CREAR SET MEDIANTE NUMERO_PREDIAL
      // =============================================

      prepararExentos(
        exentos
      );


      console.log(
        'Números prediales exentos únicos:',
        EXENTOS_SET.size
      );


      // =============================================
      // CLASIFICAR TODOS LOS PREDIOS
      // =============================================

      const prediosClasificados =
        clasificarGeoJSON(
          predios
        );


      PREDIOS_DATA =
        prediosClasificados;


      // =============================================
      // MOSTRAR CONTEOS EN CONSOLA
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
      // CREAR LAS 5 CAPAS
      // =============================================

      crearCapasPrediales();


      // =============================================
      // HIGHLIGHT
      // =============================================

      crearHighlight();


      // =============================================
      // HIGHLIGHT ENCIMA DE TODO
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

      } catch (e) {}


      // =============================================
      // ZOOM INICIAL A SESQUILÉ
      // =============================================

      ajustarVistaMunicipio(
        PREDIOS_DATA
      );


      // =============================================
      // LEYENDA ON/OFF
      // =============================================

      crearLeyendaEstados();

    }

  )


  .catch(
    error => {

      console.error(
        'Error cargando datos prediales:',
        error
      );

    }
  );

}
// =====================================================
// PARTE 4
// LEYENDA INTERACTIVA + BUSCADOR
// =====================================================


// =====================================================
// CREAR LEYENDA DE ESTADOS
// =====================================================
//
// Requiere en el HTML:
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
      // LADO IZQUIERDO
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
      // ARMAR INFORMACIÓN
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


          const visibleActual =

            boton.dataset.visible ===
            'true';


          const nuevaVisibilidad =
            !visibleActual;


          boton.dataset.visible =
            nuevaVisibilidad
              ? 'true'
              : 'false';


          // ===========================================
          // CAMBIAR CAPA
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
          // CAMBIAR BOTÓN
          // ===========================================

          boton.textContent =
            nuevaVisibilidad
              ? 'ON'
              : 'OFF';


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

          } catch (e) {}

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
// NORMALIZAR TEXTO PARA EL BUSCADOR
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
// GEOCODER LOCAL
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
      'Buscar por código, nombre o documento',


    // =================================================
    // BÚSQUEDA LOCAL
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
        // VALIDAR DATASET
        // =============================================

        const features =

          (
            PREDIOS_DATA &&
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
            // CAMPOS
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
            // COINCIDENCIA
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


            const coincideNumeroPredial =
              numeroPredial &&
              numeroPredial.includes(q);


            if (
              !coincideCodigo &&
              !coincideNombre &&
              !coincideDocumento &&
              !coincideNumeroPredial
            ) {

              return;

            }


            // =========================================
            // CENTRO
            // =========================================

            let centro;


            try {

              centro =
                turf
                  .centroid(
                    feature
                  )
                  .geometry
                  .coordinates;

            }

            catch (e) {

              centro = [
                -73.79724,
                5.04463
              ];

            }


            // =========================================
            // IDENTIFICAR CAMPO QUE COINCIDIÓ
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
              coincideNumeroPredial
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

            const propsResultado = {

              ...props,

              __matchField:
                matchField,

              __matchValue:
                matchValue

            };


            // =========================================
            // TEXTO DEL RESULTADO
            // =========================================

            const codigoTexto =
              props.codigo ??
              'N/A';


            const nombreTexto =
              props.NOMBRE ??
              'N/A';


            const estadoTexto =
              props.__ESTADO_NOMBRE ??
              'Sin clasificar';


            // =========================================
            // AGREGAR RESULTADO
            // =========================================

            resultados.push({

              type:
                'Feature',

              geometry:
                feature.geometry,

              properties:
                propsResultado,

              center:
                centro,

              place_name:

                `Código: ${codigoTexto} | ` +

                `${nombreTexto} | ` +

                `${estadoTexto}`,

              text:
                codigoTexto
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
// AGREGAR BUSCADOR
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
    // TODOS LOS PREDIOS
    // =================================================

    const features =

      (
        PREDIOS_DATA &&
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
    // SI BUSCA POR CÓDIGO, DOCUMENTO O NÚMERO PREDIAL
    // RESALTAR TODAS LAS COINCIDENCIAS EXACTAS
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


            const valor =

              matchField ===
                'codigo'

                ? p.codigo

                : matchField ===
                    'NUMERO_DOCUMENTO'

                  ? p.NUMERO_DOCUMENTO

                  : p.NUMERO_PREDIAL;


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
    // RESALTAR
    // =================================================

    const source =
      map.getSource(
        'predios_highlight'
      );


    if (
      source
    ) {

      source.setData(
        fc
      );

    }


    // =================================================
    // ZOOM A LA SELECCIÓN
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
        'Error haciendo zoom al predio:',
        error
      );

    }


    // =================================================
    // POPUP
    // =================================================

    let center;


    try {

      center =
        result.center ||

        turf
          .pointOnFeature(
            result
          )
          .geometry
          .coordinates;

    }

    catch (e) {

      center =
        result.center ||
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
            fc
          )
          .geometry
          .coordinates;


      svLngLat = [
        punto[0],
        punto[1]
      ];

    }

    catch (e) {

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
// PARTE 5 — FINAL
// CARGA DEL MAPA + ORDEN DE CAPAS
// =====================================================


// =====================================================
// CUANDO EL ESTILO DEL MAPA ESTÉ LISTO
// =====================================================

map.on(
  'style.load',
  () => {


    // =================================================
    // CARGAR DATOS PREDIALES
    // =================================================
    //
    // Esta función:
    //
    // 1. Carga la base predial
    // 2. Carga predios_exentos.json
    // 3. Cruza NUMERO_PREDIAL
    // 4. Clasifica cada predio
    // 5. Crea las cinco capas
    // 6. Crea el highlight
    // 7. Ajusta el mapa a Sesquilé
    // 8. Crea la leyenda ON/OFF
    //
    // =================================================

    cargarDatosPrediales();

  }
);


// =====================================================
// ASEGURAR ORDEN DE CAPAS
// =====================================================
//
// El highlight amarillo debe quedar siempre
// por encima de todas las categorías.
//
// =====================================================

map.on(
  'idle',
  () => {

    try {


      // =================================================
      // HIGHLIGHT — RELLENO
      // =================================================

      if (
        map.getLayer(
          'predios_highlight_fill'
        )
      ) {

        map.moveLayer(
          'predios_highlight_fill'
        );

      }


      // =================================================
      // HIGHLIGHT — CONTORNO
      // =================================================

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
        'Error organizando capas:',
        error
      );

    }

  }
);


// =====================================================
// CERRAR POPUP Y SELECCIÓN
// AL HACER CLICK FUERA DE LOS PREDIOS
// =====================================================

map.on(
  'click',
  (e) => {


    // =================================================
    // CAPAS PREDIALES DISPONIBLES
    // =================================================

    const capasExistentes =
      ORDEN_ESTADOS

        .map(
          estado =>
            estado.layerId
        )

        .filter(
          layerId =>
            map.getLayer(
              layerId
            )
        );


    if (
      !capasExistentes.length
    ) {

      return;

    }


    // =================================================
    // BUSCAR SI EL CLICK TOCÓ ALGÚN PREDIO
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
    // SI HIZO CLICK FUERA DE LOS PREDIOS
    // =================================================

    if (
      !features.length
    ) {

      limpiarHighlight();


      try {

        popup.remove();

      }

      catch (error) {}

    }

  }
);


// =====================================================
// RESIZE
// =====================================================
//
// Mantiene el mapa correctamente ajustado si cambia
// el tamaño de la ventana.
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
