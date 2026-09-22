// =====================================================
// VISOR DESTINO ECONÓMICO R1 — SESQUILÉ
// =====================================================
//
// ✅ Mapa satelital
// ✅ Predios coloreados por DESTINO
// ✅ Leyenda interactiva con checkbox
// ✅ Zoom inicial a todo Sesquilé
// ✅ Buscador por código, nombre y documento
// ✅ Popup con destino económico
// ✅ Street View
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';


// =====================================================
// MAPA
// =====================================================

const map =
  new mapboxgl.Map({

    container:
      'map',

    style:
      'mapbox://styles/mapbox/satellite-streets-v12',

    center:
      [-73.79724, 5.04463],

    // Temporal.
    // Después se ajusta automáticamente al municipio.
    zoom:
      12,

    pitch:
      0,

    bearing:
      0,

    antialias:
      true

  });


// =====================================================
// NAVEGACIÓN
// =====================================================

map.addControl(
  new mapboxgl.NavigationControl()
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
// DATASET
// =====================================================

let PREDIOS_DATA =
  null;


// =====================================================
// CONFIGURACIÓN DESTINOS ECONÓMICOS
// =====================================================
//
// El "codigo" es exactamente el valor existente
// en el atributo DESTINO del GeoJSON.
//
// =====================================================

const DESTINOS = [

  {
    codigo:
      'A',

    nombre:
      'Habitacional',

    color:
      '#2a9d8f',

    layerId:
      'destino_A'
  },


  {
    codigo:
      'D2',

    nombre:
      'D2',

    color:
      '#e63946',

    layerId:
      'destino_D2'
  },


  {
    codigo:
      'L',

    nombre:
      'Agrícola',

    color:
      '#9b5de5',

    layerId:
      'destino_L'
  },


  {
    codigo:
      'N',

    nombre:
      'Agroindustrial',

    color:
      '#f4a261',

    layerId:
      'destino_N'
  },


  {
    codigo:
      'O',

    nombre:
      'Forestal',

    color:
      '#3a86ff',

    layerId:
      'destino_O'
  },


  {
    codigo:
      'P',

    nombre:
      'Uso público',

    color:
      '#ffd166',

    layerId:
      'destino_P'
  },


  {
    codigo:
      'R',

    nombre:
      'R',

    color:
      '#ff2d95',

    layerId:
      'destino_R'
  }

];


// =====================================================
// OTROS / SIN INFORMACIÓN
// =====================================================

const DESTINO_OTROS = {

  codigo:
    'OTROS',

  nombre:
    'Otros / Sin información',

  color:
    '#8d99ae',

  layerId:
    'destino_OTROS'

};


// =====================================================
// CÓDIGOS CONOCIDOS
// =====================================================

const CODIGOS_DESTINO =
  DESTINOS.map(
    (d) => d.codigo
  );


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function norm(v) {

  return (
    v ??
    ''
  )

    .toString()

    .toLowerCase()

    .replace(
      /\s+/g,
      ''
    )

    .trim();

}


// =====================================================
// NORMALIZAR DESTINO
// =====================================================

function normalizarDestino(v) {

  return (
    v ??
    ''
  )

    .toString()

    .toUpperCase()

    .trim();

}


// =====================================================
// OBTENER NOMBRE DEL DESTINO
// =====================================================

function obtenerNombreDestino(
  codigo
) {

  const cod =
    normalizarDestino(
      codigo
    );


  const destino =
    DESTINOS.find(
      (d) =>
        d.codigo === cod
    );


  if (
    destino
  ) {

    return destino.nombre;

  }


  return DESTINO_OTROS.nombre;

}


// =====================================================
// OBTENER COORDENADA PARA STREET VIEW
// =====================================================

function getFeatureLngLat(
  feature,
  fallbackLngLat = null
) {


  // Si viene de un clic, usamos el lugar exacto
  // donde hizo clic el usuario.
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


  // Para polígonos buscamos un punto
  // representativo dentro del predio.
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

  } catch (e) {}


  return [
    -73.79724,
    5.04463
  ];

}


// =====================================================
// STREET VIEW
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
// PARTE 2
// CARGA PREDIAL + CAPAS POR DESTINO + POPUP
// =====================================================


// =====================================================
// POPUP DEL PREDIO
// =====================================================

function mostrarPopupPredio(
  feature,
  lngLatPopup,
  lngLatStreetView
) {

  const props =
    feature.properties || {};


  const codigo =
    props.codigo ??
    'N/A';


  const destinoCodigo =
    normalizarDestino(
      props.DESTINO
    );


  const destinoNombre =
    obtenerNombreDestino(
      destinoCodigo
    );


  const nombre =
    props.NOMBRE ??
    'N/A';


  const documento =
    props.NUMERO_DOCUMENTO ??
    'N/A';


  // ===================================================
  // AVALÚO
  // ===================================================

  const avaluoRaw =
    props['AVALUO 2026'];


  let avaluo =
    'N/A';


  if (
    avaluoRaw !== null &&
    avaluoRaw !== undefined &&
    avaluoRaw !== ''
  ) {

    const numero =
      Number(
        avaluoRaw
      );


    avaluo =

      Number.isFinite(
        numero
      )

        ? numero.toLocaleString(
            'es-CO'
          )

        : avaluoRaw;

  }


  // ===================================================
  // ÁREA
  // ===================================================

  const areaRaw =
    props.Shape_Area;


  let area =
    'N/A';


  if (
    areaRaw !== null &&
    areaRaw !== undefined &&
    areaRaw !== ''
  ) {

    const numero =
      Number(
        areaRaw
      );


    area =

      Number.isFinite(
        numero
      )

        ? Math.round(
            numero
          ).toLocaleString(
            'es-CO'
          )

        : areaRaw;

  }


  // ===================================================
  // DESTINO PARA MOSTRAR
  // ===================================================

  const destinoMostrar =

    destinoCodigo

      ? `${destinoCodigo} — ${destinoNombre}`

      : DESTINO_OTROS.nombre;


  // ===================================================
  // HTML
  // ===================================================

  const html = `

    <div
      style="
        font-weight:700;
        margin-bottom:7px;
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
      Destino económico:
    </strong>

    ${destinoMostrar}

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
      Avalúo 2026:
    </strong>

    $ ${avaluo}

    <br>


    <strong>
      Área:
    </strong>

    ${area} m²


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


    <br>


    <a
      style="
        font-size:9px;
      "
    >

      &#9400; EffectiveActions

    </a>

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
// CREAR CAPA PARA UN DESTINO
// =====================================================

function crearCapaDestino(
  destino
) {


  if (
    map.getLayer(
      destino.layerId
    )
  ) {

    return;

  }


  map.addLayer({

    id:
      destino.layerId,

    source:
      'predios_ssk',

    type:
      'fill',

    minzoom:
      10,

    // =================================================
    // FILTRO
    // =================================================
    //
    // Ejemplo:
    //
    // destino_A  -> DESTINO == A
    // destino_D2 -> DESTINO == D2
    //
    // =================================================

    filter: [

      '==',

      [
        'upcase',

        [
          'to-string',

          [
            'coalesce',

            ['get', 'DESTINO'],

            ''
          ]

        ]

      ],

      destino.codigo

    ],


    paint: {

      // Color particular del destino
      'fill-color':
        destino.color,

      // Transparencia para conservar visible
      // la fotografía satelital.
      'fill-opacity':
        0.68,

      // Línea blanca fina entre predios
      'fill-outline-color':
        '#ffffff'

    }

  });


  // ===================================================
  // CURSOR
  // ===================================================

  map.on(

    'mouseenter',

    destino.layerId,

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

    destino.layerId,

    () => {

      map
        .getCanvas()
        .style
        .cursor =
        '';

    }

  );


  // ===================================================
  // CLICK
  // ===================================================

  map.on(

    'click',

    destino.layerId,

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

      mostrarPopupPredio(

        feature,

        e.lngLat,

        svLngLat

      );


      // ===============================================
      // HIGHLIGHT
      // ===============================================

      const highlight =
        map.getSource(
          'predios_highlight'
        );


      if (
        highlight
      ) {

        highlight.setData({

          type:
            'FeatureCollection',

          features:
            [feature]

        });

      }

    }

  );

}


// =====================================================
// CREAR CAPA OTROS / SIN INFORMACIÓN
// =====================================================

function crearCapaOtros() {


  if (
    map.getLayer(
      DESTINO_OTROS.layerId
    )
  ) {

    return;

  }


  map.addLayer({

    id:
      DESTINO_OTROS.layerId,

    source:
      'predios_ssk',

    type:
      'fill',

    minzoom:
      10,


    // =================================================
    // FILTRO
    // =================================================
    //
    // Todo lo que NO sea:
    //
    // A, D2, L, N, O, P o R
    //
    // también incluye vacío / sin información.
    //
    // =================================================

    filter: [

      '!',

      [

        'in',

        [
          'upcase',

          [
            'to-string',

            [
              'coalesce',

              ['get', 'DESTINO'],

              ''
            ]

          ]

        ],

        [
          'literal',
          CODIGOS_DESTINO
        ]

      ]

    ],


    paint: {

      'fill-color':
        DESTINO_OTROS.color,

      'fill-opacity':
        0.55,

      'fill-outline-color':
        '#ffffff'

    }

  });


  // ===================================================
  // CURSOR
  // ===================================================

  map.on(

    'mouseenter',

    DESTINO_OTROS.layerId,

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

    DESTINO_OTROS.layerId,

    () => {

      map
        .getCanvas()
        .style
        .cursor =
        '';

    }

  );


  // ===================================================
  // CLICK
  // ===================================================

  map.on(

    'click',

    DESTINO_OTROS.layerId,

    (e) => {


      const feature =

        e.features &&

        e.features[0];


      if (
        !feature
      ) {

        return;

      }


      const svLngLat =
        getFeatureLngLat(
          feature,
          e.lngLat
        );


      mostrarPopupPredio(

        feature,

        e.lngLat,

        svLngLat

      );


      const highlight =
        map.getSource(
          'predios_highlight'
        );


      if (
        highlight
      ) {

        highlight.setData({

          type:
            'FeatureCollection',

          features:
            [feature]

        });

      }

    }

  );

}


// =====================================================
// CARGAR DATASET PREDIAL
// =====================================================

function cargarPredios() {


  fetch(
    '../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson'
  )

    .then(
      (response) =>
        response.json()
    )

    .then(
      (data) => {


        // =============================================
        // GUARDAR DATASET
        // =============================================

        PREDIOS_DATA =
          data;


        // =============================================
        // SOURCE
        // =============================================

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

        } else {

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
// CREAR UNA CAPA POR DESTINO
// =====================================================

DESTINOS.forEach(
  (destino) => {

    crearCapaDestino(
      destino
    );

  }
);


// =====================================================
// OTROS / SIN INFORMACIÓN
// =====================================================

crearCapaOtros();


// =====================================================
// CREAR LEYENDA INTERACTIVA
// =====================================================

crearLeyendaDestinos();


// =====================================================
// ZOOM INICIAL A TODO SESQUILÉ
// =====================================================

try {


  const municipioBounds =
    turf.bbox(
      data
    );


  if (

    municipioBounds &&

    municipioBounds.length ===
      4 &&

    municipioBounds.every(
      Number.isFinite
    )

  ) {

    map.fitBounds(

      municipioBounds,

      {

        padding:
          35,

        duration:
          1200,

        maxZoom:
          16

      }

    );

  }


} catch (error) {


  console.error(

    'Error ajustando vista al municipio:',

    error

  );

}

}

)


// =====================================================
// ERROR CARGANDO LOS PREDIOS
// =====================================================

.catch(
  (error) => {

    console.error(

      'Error cargando predios:',

      error

    );

  }
);

}
// =====================================================
// PARTE 3
// HIGHLIGHT + BUSCADOR + CARGA FINAL
// =====================================================


// =====================================================
// HIGHLIGHT
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

        // Más fino que el visor anterior
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
      function (query) {


        const matchingFeatures =
          [];


        const q =

          (
            query ||
            ''
          )

            .toString()

            .toLowerCase()

            .trim();


        if (
          !q
        ) {

          return matchingFeatures;

        }


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

          return matchingFeatures;

        }


        // =============================================
        // RECORRER PREDIOS
        // =============================================

        features.forEach(
          (feature) => {


            const props =
              feature.properties || {};


            const codigo =

              (
                props.codigo ??
                ''
              )

                .toString()

                .toLowerCase();


            const nombre =

              (
                props.NOMBRE ??
                ''
              )

                .toString()

                .toLowerCase();


            const documento =

              (
                props.NUMERO_DOCUMENTO ??
                ''
              )

                .toString()

                .toLowerCase();


            // =========================================
            // COINCIDENCIA
            // =========================================

            const match =

              (
                codigo &&
                codigo.includes(q)
              )

              ||

              (
                nombre &&
                nombre.includes(q)
              )

              ||

              (
                documento &&
                documento.includes(q)
              );


            if (
              !match
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
                  .centroid(feature)
                  .geometry
                  .coordinates;

            } catch (e) {

              centro =
                [-73.79724, 5.04463];

            }


            // =========================================
            // TEXTOS
            // =========================================

            const codTxt =

              (
                props.codigo ??
                ''
              )

                .toString()

                .trim();


            const nomTxt =

              (
                props.NOMBRE ??
                ''
              )

                .toString()

                .trim();


            const docTxt =

              (
                props.NUMERO_DOCUMENTO ??
                ''
              )

                .toString()

                .trim();


            const destinoCodigo =
              normalizarDestino(
                props.DESTINO
              );


            const destinoNombre =
              obtenerNombreDestino(
                destinoCodigo
              );


            // =========================================
            // IDENTIFICAR CAMPO DE COINCIDENCIA
            // =========================================

            let matchField =
              null;


            let matchValue =
              null;


            if (
              codigo &&
              codigo.includes(q)
            ) {

              matchField =
                'codigo';

              matchValue =
                codTxt;

            }


            else if (
              documento &&
              documento.includes(q)
            ) {

              matchField =
                'NUMERO_DOCUMENTO';

              matchValue =
                docTxt;

            }


            else if (
              nombre &&
              nombre.includes(q)
            ) {

              matchField =
                'NOMBRE';

              matchValue =
                nomTxt;

            }


            // =========================================
            // PROPIEDADES DEL RESULTADO
            // =========================================

            const props2 = {

              ...props,

              __matchField:
                matchField,

              __matchValue:
                matchValue

            };


            // =========================================
            // RESULTADO
            // =========================================

            matchingFeatures.push({

              type:
                'Feature',

              geometry:
                feature.geometry,

              properties:
                props2,

              place_name:

                `Código: ${
                  codTxt || 'N/A'
                } | ` +

                `Destino: ${
                  destinoCodigo || 'N/A'
                } — ${
                  destinoNombre
                } | ` +

                `Nombre: ${
                  nomTxt || 'N/A'
                }`,

              text:

                codTxt ||

                nomTxt ||

                docTxt ||

                'Resultado',

              center:
                centro,

              place_type:
                ['place']

            });

          }

        );


        // =============================================
        // MÁXIMO 10 RESULTADOS
        // =============================================

        return matchingFeatures.slice(
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


    const properties =
      result.properties || {};


    const matchField =
      properties.__matchField;


    const matchValue =

      (
        properties.__matchValue ??
        ''
      )

        .toString()

        .trim();


    // =================================================
    // FEATURES ORIGINALES
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


    let toHighlight =
      [];


    // =================================================
    // SI BUSCÓ POR CÓDIGO O DOCUMENTO:
    // SELECCIONAR TODAS LAS COINCIDENCIAS
    // =================================================

    if (

      (
        matchField ===
          'NUMERO_DOCUMENTO'

        ||

        matchField ===
          'codigo'
      )

      &&

      matchValue

    ) {


      const mv =
        norm(
          matchValue
        );


      toHighlight =

        features.filter(
          (f) => {


            const p =
              f.properties || {};


            const value =

              matchField ===
              'NUMERO_DOCUMENTO'

                ? p.NUMERO_DOCUMENTO

                : p.codigo;


            return (
              norm(value) === mv
            );

          }

        );

    }


    // =================================================
    // SI NO HAY GRUPO:
    // SOLO EL RESULTADO
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

    const highlight =
      map.getSource(
        'predios_highlight'
      );


    if (
      highlight
    ) {

      highlight.setData(
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
            55,

          maxZoom:
            18,

          duration:
            800

        }

      );


    } catch (error) {


      const center =
        result.center ||
        [-73.79724, 5.04463];


      map.flyTo({

        center:
          center,

        zoom:
          18

      });

    }


    // =================================================
    // POPUP DEL RESULTADO PRINCIPAL
    // =================================================

    const center =

      result.center ||

      turf
        .centroid(result)
        .geometry
        .coordinates;


    const svLngLat =
      getFeatureLngLat(
        result
      );


    mostrarPopupPredio(

      result,

      center,

      svLngLat

    );

  }

);

// =====================================================
// LEYENDA INTERACTIVA — DESTINO ECONÓMICO R1
// =====================================================

function crearLeyendaDestinos() {

  const container =
    document.getElementById('destino-legend-list');

  const btnTodos =
    document.getElementById('destino-all');

  const btnNinguno =
    document.getElementById('destino-none');


  if (!container) {
    console.warn('No existe #destino-legend-list');
    return;
  }


  // Limpiar para evitar duplicados
  container.innerHTML = '';


  // Todas las categorías
  const categorias = [
    ...DESTINOS,
    DESTINO_OTROS
  ];


  // ===================================================
  // CREAR ITEMS
  // ===================================================

  categorias.forEach((destino) => {

    // Fila
    const item =
      document.createElement('label');

    item.className =
      'destino-item';


    // Checkbox
    const checkbox =
      document.createElement('input');

    checkbox.type =
      'checkbox';

    checkbox.checked =
      true;

    checkbox.dataset.layer =
      destino.layerId;


    // Color
    const color =
      document.createElement('span');

    color.className =
      'destino-color';

    color.style.backgroundColor =
      destino.color;


    // Texto
    const texto =
      document.createElement('span');

    texto.className =
      'destino-texto';


    if (destino.codigo === 'OTROS') {

      texto.textContent =
        destino.nombre;

    } else {

      texto.textContent =
        `${destino.codigo} — ${destino.nombre}`;

    }


    // =================================================
    // PRENDER / APAGAR
    // =================================================

    checkbox.addEventListener(
      'change',
      () => {

        if (
          map.getLayer(destino.layerId)
        ) {

          map.setLayoutProperty(
            destino.layerId,
            'visibility',
            checkbox.checked
              ? 'visible'
              : 'none'
          );

        }


        // Limpiar selección anterior
        limpiarHighlight();

        try {
          popup.remove();
        } catch (e) {}

      }
    );


    // Agregar elementos
    item.appendChild(checkbox);
    item.appendChild(color);
    item.appendChild(texto);

    container.appendChild(item);

  });


  // ===================================================
  // BOTÓN TODOS
  // ===================================================

  if (btnTodos) {

    btnTodos.onclick = () => {

      const checks =
        container.querySelectorAll(
          'input[type="checkbox"]'
        );


      checks.forEach((checkbox) => {

        checkbox.checked = true;

        const layerId =
          checkbox.dataset.layer;


        if (
          map.getLayer(layerId)
        ) {

          map.setLayoutProperty(
            layerId,
            'visibility',
            'visible'
          );

        }

      });


      limpiarHighlight();

      try {
        popup.remove();
      } catch (e) {}

    };

  }


  // ===================================================
  // BOTÓN NINGUNO
  // ===================================================

  if (btnNinguno) {

    btnNinguno.onclick = () => {

      const checks =
        container.querySelectorAll(
          'input[type="checkbox"]'
        );


      checks.forEach((checkbox) => {

        checkbox.checked = false;

        const layerId =
          checkbox.dataset.layer;


        if (
          map.getLayer(layerId)
        ) {

          map.setLayoutProperty(
            layerId,
            'visibility',
            'none'
          );

        }

      });


      limpiarHighlight();

      try {
        popup.remove();
      } catch (e) {}

    };

  }

}
// =====================================================
// CARGA FINAL
// =====================================================

map.on(

  'style.load',

  () => {


    // =================================================
    // 1. CREAR HIGHLIGHT
    // =================================================

    crearHighlight();


    // =================================================
    // 2. CARGAR PREDIOS
    // =================================================

    cargarPredios();


    // =================================================
    // 3. ORDENAR HIGHLIGHT ARRIBA
    // =================================================

    setTimeout(
      () => {


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


        } catch (error) {

          console.error(
            'Error organizando highlight:',
            error
          );

        }

      },

      500

    );

  }

);
