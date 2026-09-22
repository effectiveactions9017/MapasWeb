// =====================================================
// COMPARADOR SESQUILÉ 2017 vs 2024
// =====================================================
// ✅ Límite municipal en ambos mapas
// ✅ Zoom automático al límite real de Sesquilé
// ✅ Misma cámara en ambos lados
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

    // Vista temporal
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

    // EXACTAMENTE la misma vista temporal
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
// VARIABLES
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


// =====================================================
// CARGAR LÍMITE MUNICIPAL
// =====================================================

fetch(LIMITE_URL)

  .then(
    response => {

      if (!response.ok) {

        throw new Error(
          `No se pudo cargar el límite: ${response.status}`
        );

      }

      return response.json();

    }
  )

  .then(
    data => {

      limiteData =
        data;

      limiteCargado =
        true;

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
// AGREGAR LÍMITE A UN MAPA
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
  // CAPA DE LÍNEA
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

        // Amarillo para que se vea bien
        // tanto en 2017 como en 2024
        'line-color':
          '#ffd166',

        'line-width':
          2.5,

        'line-opacity':
          1

      }

    });

  }


  // Mantener límite encima
  try {

    mapa.moveLayer(
      'limite_sesquile_line'
    );

  } catch (e) {}

}


// =====================================================
// AJUSTAR AMBOS MAPAS AL MISMO LÍMITE
// =====================================================

function ajustarVistaAlMunicipio() {

  if (
    !limiteData
  ) {

    return;

  }


  try {


    // =================================================
    // EXTENSIÓN REAL DEL MUNICIPIO
    // =================================================

    const bbox =
      turf.bbox(
        limiteData
      );


    if (

      !Array.isArray(bbox)

      ||

      bbox.length !== 4

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
    // IMPORTANTE
    //
    // Aplicamos EXACTAMENTE:
    //
    // - mismo bbox
    // - mismo padding
    // - mismo bearing
    // - mismo pitch
    //
    // a los dos mapas.
    //
    // =================================================

    const opciones = {

      padding:
        35,

      duration:
        0,

      bearing:
        0,

      pitch:
        0,

      maxZoom:
        15

    };


    // MAPA 2017
    beforeMap.fitBounds(
      bbox,
      opciones
    );


    // MAPA 2024
    afterMap.fitBounds(
      bbox,
      opciones
    );


    // =================================================
    // FORZAR EXACTAMENTE LA MISMA CÁMARA
    // =================================================
    //
    // Después del fitBounds tomamos la cámara del
    // mapa izquierdo y la copiamos al derecho.
    //
    // Esto elimina pequeñas diferencias.
    //
    // =================================================

    const center =
      beforeMap.getCenter();


    const zoom =
      beforeMap.getZoom();


    afterMap.jumpTo({

      center: [
        center.lng,
        center.lat
      ],

      zoom:
        zoom,

      bearing:
        beforeMap.getBearing(),

      pitch:
        beforeMap.getPitch()

    });


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

  // Esperar:
  //
  // 1. mapa 2017
  // 2. mapa 2024
  // 3. límite municipal

  if (
    !readyBefore ||
    !readyAfter ||
    !limiteCargado ||
    !limiteData
  ) {

    return;

  }


  // Evitar inicialización doble
  if (
    compare
  ) {

    return;

  }


  // ===================================================
  // 1. AGREGAR EL MISMO LÍMITE A LOS DOS MAPAS
  // ===================================================

  agregarLimiteMunicipal(
    beforeMap
  );


  agregarLimiteMunicipal(
    afterMap
  );


  // ===================================================
  // 2. CENTRAR LOS DOS AL MISMO MUNICIPIO
  // ===================================================

  ajustarVistaAlMunicipio();


  // ===================================================
  // 3. CREAR EL COMPARADOR
  // ===================================================

  compare =
    new mapboxgl.Compare(

      beforeMap,

      afterMap,

      '#comparison-container'

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
// DEBUG
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


afterMap.on(
  'error',
  e => {

    console.error(
      'AFTER map error:',
      e
    );

  }
);
