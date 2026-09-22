// =====================================================
// COMPARADOR SESQUILÉ 2017 vs 2024
// =====================================================
// ✅ Límite municipal en ambos mapas
// ✅ Zoom automático al límite REAL de Sesquilé
// ✅ Municipio centrado y ocupando la pantalla
// ✅ Misma cámara exacta en ambos mapas
// ✅ Comparador 2017 / 2024 perfectamente alineado
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';


// =====================================================
// RUTA DEL LÍMITE MUNICIPAL
// =====================================================
//
// index.js está dentro de src
// y el GeoJSON está en src/data
//
// =====================================================

const LIMITE_URL =
  '../src/data/Limite_sesquile.geojson';


// =====================================================
// MAPA 2017
// =====================================================

const beforeMap =
  new mapboxgl.Map({

    container:
      'before',

    style:
      'mapbox://styles/effectiveactions9017/cmkhiq4hy007901qq4jw7c79j',

    // Vista temporal mientras carga el límite
    center:
      [-73.79724, 5.04463],

    zoom:
      11,

    minZoom:
      6,

    maxZoom:
      18,

    pitch:
      0,

    bearing:
      0,

    antialias:
      true

  });


// =====================================================
// MAPA 2024
// =====================================================

const afterMap =
  new mapboxgl.Map({

    container:
      'after',

    style:
      'mapbox://styles/effectiveactions9017/cmklt68zl006t01ry16zhajul',

    // Misma vista temporal
    center:
      [-73.79724, 5.04463],

    zoom:
      11,

    minZoom:
      6,

    maxZoom:
      18,

    pitch:
      0,

    bearing:
      0,

    antialias:
      true

  });


// =====================================================
// VARIABLES DE CONTROL
// =====================================================

let readyBefore =
  false;

let readyAfter =
  false;

let compare =
  null;

let limiteData =
  null;

let limiteCargado =
  false;

let vistaInicialAplicada =
  false;


// =====================================================
// CARGAR LÍMITE MUNICIPAL
// =====================================================

fetch(LIMITE_URL)

  .then(
    response => {

      if (
        !response.ok
      ) {

        throw new Error(
          `No se pudo cargar el límite: ${response.status}`
        );

      }

      return response.json();

    }
  )

  .then(
    data => {

      // Guardar GeoJSON
      limiteData =
        data;


      // Marcar límite como cargado
      limiteCargado =
        true;


      // Intentar inicializar
      intentarInicializar();

    }
  )

  .catch(
    error => {

      console.error(
        'Error cargando Limite_sesquile.geojson:',
        error
      );

    }
  );


// =====================================================
// AGREGAR LÍMITE MUNICIPAL A UN MAPA
// =====================================================

function agregarLimiteMunicipal(
  mapa
) {

  if (
    !limiteData
  ) {

    return;

  }


  // ===================================================
  // SOURCE
  // ===================================================

  if (
    !mapa.getSource(
      'limite_sesquile'
    )
  ) {

    mapa.addSource(

      'limite_sesquile',

      {

        type:
          'geojson',

        data:
          limiteData

      }

    );

  }


  // ===================================================
  // CAPA DEL LÍMITE
  // ===================================================

  if (
    !mapa.getLayer(
      'limite_sesquile_line'
    )
  ) {

    mapa.addLayer({

      id:
        'limite_sesquile_line',

      type:
        'line',

      source:
        'limite_sesquile',

      paint: {

        // Amarillo para destacar
        // sobre ambos mapas
        'line-color':
          '#ffd166',

        // Contorno visible pero no exagerado
        'line-width':
          2.5,

        'line-opacity':
          1

      }

    });

  }


  // ===================================================
  // MANTENER LÍMITE ARRIBA
  // ===================================================

  try {

    mapa.moveLayer(
      'limite_sesquile_line'
    );

  } catch (e) {}

}


// =====================================================
// AJUSTAR VISTA INICIAL AL MUNICIPIO
// =====================================================
//
// IMPORTANTE:
//
// Se calcula la extensión directamente desde:
//
// Limite_sesquile.geojson
//
// No usamos coordenadas aproximadas.
//
// Sesquilé ocupará prácticamente toda la pantalla.
//
// =====================================================

function ajustarVistaAlMunicipio() {


  // Evitar repetir el ajuste inicial
  if (
    vistaInicialAplicada
  ) {

    return;

  }


  if (
    !limiteData
  ) {

    return;

  }


  try {


    // =================================================
    // CALCULAR EXTENSIÓN REAL DEL MUNICIPIO
    // =================================================

    const bbox =
      turf.bbox(
        limiteData
      );


    // =================================================
    // VALIDAR BBOX
    // =================================================

    if (

      !Array.isArray(
        bbox
      )

      ||

      bbox.length !==
        4

      ||

      !bbox.every(
        Number.isFinite
      )

    ) {

      console.error(
        'BBox municipal inválido:',
        bbox
      );

      return;

    }


    // =================================================
    // AJUSTAR MAPA 2017
    // =================================================
    //
    // padding = 8
    //
    // Deja solamente un margen mínimo para que
    // el contorno municipal no quede cortado.
    //
    // =================================================

    beforeMap.fitBounds(

      bbox,

      {

        padding:
          8,

        duration:
          0,

        bearing:
          0,

        pitch:
          0,

        maxZoom:
          16

      }

    );


    // =================================================
    // OBTENER LA CÁMARA RESULTANTE
    // =================================================
    //
    // Esta será la cámara MAESTRA.
    //
    // El mapa 2024 recibirá exactamente:
    //
    // - centro
    // - zoom
    // - bearing
    // - pitch
    //
    // =================================================

    const center =
      beforeMap.getCenter();


    const zoom =
      beforeMap.getZoom();


    const bearing =
      beforeMap.getBearing();


    const pitch =
      beforeMap.getPitch();


    // =================================================
    // COPIAR EXACTAMENTE LA CÁMARA AL MAPA 2024
    // =================================================

    afterMap.jumpTo({

      center: [

        center.lng,

        center.lat

      ],

      zoom:
        zoom,

      bearing:
        bearing,

      pitch:
        pitch

    });


    // =================================================
    // FORZAR RESIZE
    // =================================================
    //
    // Importante para que Mapbox calcule correctamente
    // las dimensiones reales de ambos contenedores.
    //
    // =================================================

    beforeMap.resize();

    afterMap.resize();


    // =================================================
    // VOLVER A COPIAR LA CÁMARA DESPUÉS DEL RESIZE
    // =================================================
    //
    // Garantiza que los dos lados queden idénticos.
    //
    // =================================================

    const centerFinal =
      beforeMap.getCenter();


    afterMap.jumpTo({

      center: [

        centerFinal.lng,

        centerFinal.lat

      ],

      zoom:
        beforeMap.getZoom(),

      bearing:
        beforeMap.getBearing(),

      pitch:
        beforeMap.getPitch()

    });


    // =================================================
    // MARCAR VISTA COMO APLICADA
    // =================================================

    vistaInicialAplicada =
      true;


  } catch (error) {

    console.error(
      'Error ajustando vista al municipio:',
      error
    );

  }

}


// =====================================================
// INICIALIZAR COMPARADOR
// =====================================================

function intentarInicializar() {


  // ===================================================
  // ESPERAR TODO
  // ===================================================
  //
  // 1. Mapa 2017
  // 2. Mapa 2024
  // 3. Limite_sesquile.geojson
  //
  // ===================================================

  if (

    !readyBefore

    ||

    !readyAfter

    ||

    !limiteCargado

    ||

    !limiteData

  ) {

    return;

  }


  // ===================================================
  // EVITAR INICIALIZACIÓN DOBLE
  // ===================================================

  if (
    compare
  ) {

    return;

  }


  // ===================================================
  // 1. AGREGAR EL MISMO LÍMITE AL MAPA 2017
  // ===================================================

  agregarLimiteMunicipal(
    beforeMap
  );


  // ===================================================
  // 2. AGREGAR EL MISMO LÍMITE AL MAPA 2024
  // ===================================================

  agregarLimiteMunicipal(
    afterMap
  );


  // ===================================================
  // 3. CENTRAR Y AJUSTAR AL MUNICIPIO
  // ===================================================

  ajustarVistaAlMunicipio();


  // ===================================================
  // 4. CREAR EL COMPARADOR
  // ===================================================
  //
  // Los mapas ya tienen exactamente la misma cámara
  // antes de crear el swipe.
  //
  // ===================================================

  compare =
    new mapboxgl.Compare(

      beforeMap,

      afterMap,

      '#comparison-container'

    );


  // ===================================================
  // 5. RESIZE FINAL
  // ===================================================
  //
  // Una vez creado Compare, Mapbox puede modificar
  // dimensiones internas de los contenedores.
  //
  // ===================================================

  requestAnimationFrame(
    () => {


      beforeMap.resize();

      afterMap.resize();


      // ===============================================
      // SINCRONIZAR UNA ÚLTIMA VEZ
      // ===============================================

      const c =
        beforeMap.getCenter();


      afterMap.jumpTo({

        center: [

          c.lng,

          c.lat

        ],

        zoom:
          beforeMap.getZoom(),

        bearing:
          beforeMap.getBearing(),

        pitch:
          beforeMap.getPitch()

      });

    }
  );

}


// =====================================================
// MAPA 2017 CARGADO
// =====================================================

beforeMap.on(
  'load',
  () => {

    readyBefore =
      true;


    intentarInicializar();

  }
);


// =====================================================
// MAPA 2024 CARGADO
// =====================================================

afterMap.on(
  'load',
  () => {

    readyAfter =
      true;


    intentarInicializar();

  }
);


// =====================================================
// REDIMENSIONAMIENTO DE VENTANA
// =====================================================
//
// Si el usuario cambia el tamaño del navegador,
// rota el celular o entra/sale de pantalla completa,
// los mapas mantienen sus dimensiones correctamente.
//
// =====================================================

window.addEventListener(
  'resize',
  () => {

    beforeMap.resize();

    afterMap.resize();

  }
);


// =====================================================
// DEBUG MAPA 2017
// =====================================================

beforeMap.on(
  'error',
  e => {

    console.error(
      'BEFORE map error:',
      e
    );

  }
);


// =====================================================
// DEBUG MAPA 2024
// =====================================================

afterMap.on(
  'error',
  e => {

    console.error(
      'AFTER map error:',
      e
    );

  }
);
