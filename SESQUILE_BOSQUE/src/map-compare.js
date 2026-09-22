// =====================================================
// COMPARADOR SESQUILÉ 2017 vs 2024
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21raGliOTM1MGl3ejNkb25kOWF6ZzRleCJ9.S_kG8hu35MYRvWrNyKdfWA';


// =====================================================
// EXTENSIÓN DEL MUNICIPIO DE SESQUILÉ
// =====================================================
//
// Formato:
//
// [oeste, sur]
// [este, norte]
//
// Esta extensión se usa únicamente como vista inicial.
//
// =====================================================

const SESQUILE_BOUNDS = [
  [-73.90, 4.95],
  [-73.70, 5.15]
];


// =====================================================
// MAPA 2017
// =====================================================

const beforeMap =
  new mapboxgl.Map({

    container:
      'before',

    style:
      'mapbox://styles/effectiveactions9017/cmkhiq4hy007901qq4jw7c79j',

    // Vista temporal mientras carga
    center:
      [-73.80, 5.05],

    zoom:
      11,

    minZoom:
      6,

    maxZoom:
      18

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

    // Vista temporal mientras carga
    center:
      [-73.80, 5.05],

    zoom:
      11,

    minZoom:
      6,

    maxZoom:
      18

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


let vistaInicialAplicada =
  false;


// =====================================================
// AJUSTAR VISTA A SESQUILÉ
// =====================================================

function ajustarVistaMunicipio() {

  if (
    vistaInicialAplicada
  ) {

    return;

  }


  if (
    !readyBefore ||
    !readyAfter
  ) {

    return;

  }


  vistaInicialAplicada =
    true;


  // ===================================================
  // MAPA 2017
  // ===================================================

  beforeMap.fitBounds(

    SESQUILE_BOUNDS,

    {

      padding:
        35,

      duration:
        0

    }

  );


  // ===================================================
  // MAPA 2024
  // ===================================================

  afterMap.fitBounds(

    SESQUILE_BOUNDS,

    {

      padding:
        35,

      duration:
        0

    }

  );

}


// =====================================================
// INICIALIZAR COMPARADOR
// =====================================================

function initCompare() {

  if (
    readyBefore &&
    readyAfter &&
    !compare
  ) {


    // ===============================================
    // PRIMERO AJUSTAR LA VISTA
    // ===============================================

    ajustarVistaMunicipio();


    // ===============================================
    // DESPUÉS CREAR EL SWIPE
    // ===============================================

    compare =
      new mapboxgl.Compare(

        beforeMap,

        afterMap,

        '#comparison-container'

      );

  }

}


// =====================================================
// MAPA 2017 CARGADO
// =====================================================

beforeMap.on(
  'load',
  () => {

    readyBefore =
      true;

    initCompare();

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

    initCompare();

  }
);


// =====================================================
// DEBUG
// =====================================================

beforeMap.on(
  'error',
  (e) => {

    console.error(
      'BEFORE map error:',
      e
    );

  }
);


afterMap.on(
  'error',
  (e) => {

    console.error(
      'AFTER map error:',
      e
    );

  }
);
