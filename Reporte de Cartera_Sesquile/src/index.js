// =====================================================
// VISOR PREDIAL SESQUILÉ — RIESGO DE CARTERA
// =====================================================
//
// ✅ Todos los predios visibles
// ✅ Sin categoría = solo contorno
// ✅ Con categoría = color por nivel de riesgo
// ✅ Filtro por vigencia
// ✅ Transparencia inicial 50%
// ✅ Contornos reducidos a la mitad
// ✅ Zoom inicial a toda la extensión de Sesquilé
// ✅ Popup
// ✅ Street View
// ✅ Buscador local
// ✅ Slider de transparencia
//
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';


// =====================================================
// RUTA DEL GEOJSON
// =====================================================

const PREDIOS_URL =
  '../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson';


// =====================================================
// MAPA
// =====================================================

const map =
  new mapboxgl.Map({

    container:
      'map',

    style:
      'mapbox://styles/mapbox/satellite-v9',

    // Vista temporal.
    // Cuando cargue el GeoJSON se reemplaza
    // automáticamente por la extensión completa
    // del municipio.
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
// DATA GLOBAL
// =====================================================

let PREDIOS_DATA =
  null;


// =====================================================
// FILTROS ACTIVOS
// =====================================================

let activeFilters = {

  riesgo:
    new Set([
      'BAJO',
      'MEDIO',
      'ALTO'
    ]),

  vigencia:
    new Set([
      '1-2',
      '3-5',
      '5+'
    ])

};


// =====================================================
// OPACIDAD DINÁMICA
// =====================================================
//
// Antes:
// 0.85
//
// Ahora:
// 0.50
//
// El usuario puede seguir modificándola
// mediante el slider.
//
// =====================================================

let polygonOpacity =
  0.50;


// =====================================================
// FORMATEAR AVALÚO / VALORES
// =====================================================

function formatAvaluo(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return 'N/A';

  }


  const n =
    Number(
      value
    );


  return isNaN(n)

    ? String(value)

    : n.toLocaleString(
        'es-CO'
      );

}


// =====================================================
// FORMATEAR ÁREA
// =====================================================

function formatArea(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return 'N/A';

  }


  const n =
    Number(
      value
    );


  return isNaN(n)

    ? String(value)

    : String(
        Math.round(n)
      );

}


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

    .toLowerCase()

    .replace(
      /\s+/g,
      ''
    )

    .trim();

}


// =====================================================
// OBTENER PUNTO REPRESENTATIVO DEL PREDIO
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

    return turf
      .pointOnFeature(
        feature
      )
      .geometry
      .coordinates;

  }

  catch (error) {

    return [

      -73.79724,

      5.04463

    ];

  }

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
// POPUP
// =====================================================

function buildPopupHTML(
  props,
  lngLat = null
) {


  // ===================================================
  // STREET VIEW
  // ===================================================

  const svBtn =

    lngLat

      ? `

        <div
          style="
            margin-top:10px;
          "
        >

          <a
            href="${streetViewUrl(lngLat)}"
            target="_blank"
            rel="noopener"

            style="
              display:inline-block;
              padding:6px 10px;
              background:#00bcd4;
              color:#000;
              border-radius:6px;
              font-weight:700;
              text-decoration:none;
            "
          >

            📷 Street View

          </a>

        </div>

      `

      : '';


  // ===================================================
  // HTML
  // ===================================================

  return `

    <strong>
      Código:
    </strong>

    ${props.codigo ?? 'N/A'}

    <br>


    <strong>
      Nombre:
    </strong>

    ${props.NOMBRE ?? 'N/A'}

    <br>


    <strong>
      Documento:
    </strong>

    ${props.NUMERO_DOCUMENTO ?? 'N/A'}

    <br>


    <hr
      style="
        border:0.5px solid #555;
        margin:6px 0;
      "
    >


    <strong>
      Total acumulado:
    </strong>

    ${formatAvaluo(
      props.total_acumulado
    )}

    <br>


    <strong>
      Categoría vigencia:
    </strong>

    ${props.categoria_vigencia ?? 'N/A'}

    <br>


    <strong>
      Nivel de riesgo:
    </strong>

    ${props.nivel_riesgo ?? 'N/A'}

    <br>


    <strong>
      Vereda:
    </strong>

    ${props.vereda ?? 'N/A'}

    <br>


    <hr
      style="
        border:0.5px solid #555;
        margin:6px 0;
      "
    >


    <strong>
      Avalúo 2026:
    </strong>

    ${formatAvaluo(

      props['AVALUO.2026']

      ??

      props['AVALUO 2026']

      ??

      props['AVALUO_2026']

    )}

    <br>


    <strong>
      Área:
    </strong>

    ${formatArea(
      props.Shape_Area
    )}

    m²


    ${svBtn}


    <br>

    <a
      style="
        font-size:9px;
      "
    >

      &#9400; EffectiveActions

    </a>

  `;

}


// =====================================================
// EXPRESIÓN DE RIESGO
// =====================================================

function riskExpression() {

  return [

    'case',


    // ALTO
    [
      'in',
      'ALTO',
      [
        'upcase',
        [
          'coalesce',
          [
            'get',
            'nivel_riesgo'
          ],
          ''
        ]
      ]
    ],

    'ALTO',


    // MEDIO
    [
      'in',
      'MEDIO',
      [
        'upcase',
        [
          'coalesce',
          [
            'get',
            'nivel_riesgo'
          ],
          ''
        ]
      ]
    ],

    'MEDIO',


    // BAJO
    [
      'in',
      'BAJO',
      [
        'upcase',
        [
          'coalesce',
          [
            'get',
            'nivel_riesgo'
          ],
          ''
        ]
      ]
    ],

    'BAJO',


    // SIN CLASIFICACIÓN
    ''

  ];

}


// =====================================================
// EXPRESIÓN DE VIGENCIA
// =====================================================

function vigenciaExpression() {

  return [

    'case',


    // =================================================
    // 1 A 2 AÑOS
    // =================================================

    [
      'any',

      [
        'in',
        '1 A 2',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ],

      [
        'in',
        '1-2',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ]

    ],

    '1-2',


    // =================================================
    // 3 A 5 AÑOS
    // =================================================

    [
      'any',

      [
        'in',
        '3 A 5',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ],

      [
        'in',
        '3-5',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ]

    ],

    '3-5',


    // =================================================
    // MÁS DE 5 AÑOS
    // =================================================

    [
      'any',

      [
        'in',
        'MAS DE 5',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ],

      [
        'in',
        'MÁS DE 5',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ],

      [
        'in',
        '5+',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ],

      [
        'in',
        '>5',
        [
          'upcase',
          [
            'coalesce',
            [
              'get',
              'categoria_vigencia'
            ],
            ''
          ]
        ]
      ]

    ],

    '5+',


    // SIN CATEGORÍA
    ''

  ];

}
// =====================================================
// PARTE 2 DE 4
// ESTILO DINÁMICO
// =====================================================


// =====================================================
// ACTUALIZAR ESTILO DEL MAPA
// =====================================================

function updateMapStyle() {


  // ===================================================
  // FILTROS ACTIVOS
  // ===================================================

  const riesgos =
    Array.from(
      activeFilters.riesgo
    );


  const vigencias =
    Array.from(
      activeFilters.vigencia
    );


  // ===================================================
  // EXPRESIONES
  // ===================================================

  const riskExpr =
    riskExpression();


  const vigExpr =
    vigenciaExpression();


  // ===================================================
  // RIESGO ALTO
  // ===================================================

  const isAlto = [

    'all',

    [
      '==',
      riskExpr,
      'ALTO'
    ],

    [
      'in',
      'ALTO',
      [
        'literal',
        riesgos
      ]
    ],

    [
      'in',
      vigExpr,
      [
        'literal',
        vigencias
      ]
    ]

  ];


  // ===================================================
  // RIESGO MEDIO
  // ===================================================

  const isMedio = [

    'all',

    [
      '==',
      riskExpr,
      'MEDIO'
    ],

    [
      'in',
      'MEDIO',
      [
        'literal',
        riesgos
      ]
    ],

    [
      'in',
      vigExpr,
      [
        'literal',
        vigencias
      ]
    ]

  ];


  // ===================================================
  // RIESGO BAJO
  // ===================================================

  const isBajo = [

    'all',

    [
      '==',
      riskExpr,
      'BAJO'
    ],

    [
      'in',
      'BAJO',
      [
        'literal',
        riesgos
      ]
    ],

    [
      'in',
      vigExpr,
      [
        'literal',
        vigencias
      ]
    ]

  ];


  // ===================================================
  // COLORES DE LOS POLÍGONOS
  // ===================================================
  //
  // 🔴 ALTO
  // 🟡 MEDIO
  // 🟢 BAJO
  //
  // Los predios sin clasificación no tienen relleno.
  //
  // ===================================================

  map.setPaintProperty(

    'predios_ssk_fill_color',

    'fill-color',

    [

      'case',


      // ALTO
      isAlto,
      '#e74c3c',


      // MEDIO
      isMedio,
      '#f1c40f',


      // BAJO
      isBajo,
      '#2ecc71',


      // SIN CLASIFICACIÓN
      'rgba(0,0,0,0)'

    ]

  );


  // ===================================================
  // TRANSPARENCIA DE LOS POLÍGONOS
  // ===================================================
  //
  // polygonOpacity inicia en:
  //
  // 0.50 = 50%
  //
  // El slider puede modificar posteriormente
  // este valor.
  //
  // ===================================================

  map.setPaintProperty(

    'predios_ssk_fill_color',

    'fill-opacity',

    [

      'case',

      [
        'any',
        isAlto,
        isMedio,
        isBajo
      ],

      polygonOpacity,

      0

    ]

  );


  // ===================================================
  // COLOR DE LOS CONTORNOS
  // ===================================================
  //
  // Predios clasificados:
  // blanco
  //
  // Predios sin clasificación:
  // gris claro
  //
  // ===================================================

  map.setPaintProperty(

    'predios_ssk_line_base',

    'line-color',

    [

      'case',

      [
        'any',
        isAlto,
        isMedio,
        isBajo
      ],

      '#ffffff',

      '#bfc5cc'

    ]

  );


  // ===================================================
  // CALIBRE DE LOS CONTORNOS
  // ===================================================
  //
  // SOLICITUD:
  // disminuir a la mitad.
  //
  // ANTES:
  //
  // Clasificados:
  // 2.2 px
  //
  // Sin clasificación:
  // 1.6 px
  //
  // AHORA:
  //
  // Clasificados:
  // 1.1 px
  //
  // Sin clasificación:
  // 0.8 px
  //
  // ===================================================

  map.setPaintProperty(

    'predios_ssk_line_base',

    'line-width',

    [

      'case',

      [
        'any',
        isAlto,
        isMedio,
        isBajo
      ],

      1.1,

      0.8

    ]

  );


  // ===================================================
  // OPACIDAD DEL CONTORNO
  // ===================================================

  map.setPaintProperty(

    'predios_ssk_line_base',

    'line-opacity',

    [

      'case',

      [
        'any',
        isAlto,
        isMedio,
        isBajo
      ],

      1,

      0.95

    ]

  );

}


// =====================================================
// AJUSTAR MAPA A TODA LA EXTENSIÓN DEL MUNICIPIO
// =====================================================
//
// La extensión se calcula directamente usando
// todos los polígonos de:
//
// PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson
//
// Así no dependemos de un zoom manual.
//
// =====================================================

function ajustarVistaMunicipio(
  data
) {


  // ===================================================
  // VALIDAR GEOJSON
  // ===================================================

  if (

    !data

    ||

    !Array.isArray(
      data.features
    )

    ||

    !data.features.length

  ) {

    console.warn(
      'No hay geometrías disponibles para ajustar la vista.'
    );

    return;

  }


  try {


    // =================================================
    // CALCULAR EXTENSIÓN
    // =================================================

    const bounds =
      turf.bbox(
        data
      );


    // =================================================
    // VALIDAR BBOX
    // =================================================

    if (

      !Array.isArray(
        bounds
      )

      ||

      bounds.length !==
        4

      ||

      !bounds.every(
        Number.isFinite
      )

    ) {

      console.error(
        'Extensión municipal inválida:',
        bounds
      );

      return;

    }


    // =================================================
    // AJUSTAR VISTA
    // =================================================
    //
    // padding 12:
    //
    // deja un margen pequeño y permite que
    // prácticamente todo el espacio de pantalla
    // sea ocupado por el municipio.
    //
    // =================================================

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

  catch (error) {

    console.error(
      'Error ajustando la vista a Sesquilé:',
      error
    );

  }

}
// =====================================================
// PARTE 3 DE 4
// CARGA DE GEOJSON + CAPAS + BUSCADOR
// =====================================================


// =====================================================
// AGREGAR CAPAS PREDIALES
// =====================================================

function addLayer() {


  // ===================================================
  // CARGAR GEOJSON
  // ===================================================

  fetch(
    PREDIOS_URL
  )


    .then(
      (response) => {


        if (
          !response.ok
        ) {

          throw new Error(
            `Error HTTP ${response.status}`
          );

        }


        return response.json();

      }
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

        }

        else {

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


        // =============================================
        // CAPA INVISIBLE PARA INTERACCIÓN
        // =============================================
        //
        // Esta capa permite:
        //
        // - click
        // - popup
        // - cursor
        //
        // sin alterar visualmente el mapa.
        //
        // =============================================

        if (
          !map.getLayer(
            'predios_ssk_hit'
          )
        ) {

          map.addLayer({

            id:
              'predios_ssk_hit',

            type:
              'fill',

            source:
              'predios_ssk',

            paint: {

              'fill-color':
                'rgba(0,0,0,0)',

              'fill-opacity':
                0.01

            }

          });

        }


        // =============================================
        // CAPA DE RELLENO
        // =============================================
        //
        // updateMapStyle() asignará:
        //
        // 🔴 Alto
        // 🟡 Medio
        // 🟢 Bajo
        //
        // con 50% de transparencia inicial.
        //
        // =============================================

        if (
          !map.getLayer(
            'predios_ssk_fill_color'
          )
        ) {

          map.addLayer({

            id:
              'predios_ssk_fill_color',

            type:
              'fill',

            source:
              'predios_ssk',

            paint: {

              'fill-color':
                'rgba(0,0,0,0)',

              'fill-opacity':
                0

            }

          });

        }


        // =============================================
        // CONTORNO DE TODOS LOS PREDIOS
        // =============================================
        //
        // El calibre inicial base es ahora:
        //
        // 0.8 px
        //
        // updateMapStyle() lo cambiará a:
        //
        // 1.1 px → predios clasificados
        // 0.8 px → demás predios
        //
        // =============================================

        if (
          !map.getLayer(
            'predios_ssk_line_base'
          )
        ) {

          map.addLayer({

            id:
              'predios_ssk_line_base',

            type:
              'line',

            source:
              'predios_ssk',

            paint: {

              'line-color':
                '#bfc5cc',

              'line-width':
                0.8,

              'line-opacity':
                0.95

            }

          });

        }


        // =============================================
        // APLICAR COLORES, FILTROS Y TRANSPARENCIA
        // =============================================

        updateMapStyle();


        // =============================================
        // AJUSTAR ZOOM A TODA LA EXTENSIÓN MUNICIPAL
        // =============================================
        //
        // Se utiliza el bbox real de TODOS los predios.
        //
        // =============================================

        ajustarVistaMunicipio(
          data
        );


        // =============================================
        // CLICK SOBRE PREDIO
        // =============================================

        map.on(

          'click',

          'predios_ssk_hit',

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


            // =========================================
            // COORDENADA STREET VIEW
            // =========================================

            const coords =
              getFeatureLngLat(

                feature,

                e.lngLat

              );


            // =========================================
            // POPUP
            // =========================================

            popup

              .setLngLat(
                e.lngLat
              )

              .setHTML(
                buildPopupHTML(

                  feature.properties || {},

                  coords

                )
              )

              .addTo(
                map
              );

          }

        );


        // =============================================
        // CURSOR
        // =============================================

        map.on(

          'mouseenter',

          'predios_ssk_hit',

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

          'predios_ssk_hit',

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              '';

          }

        );


        // =============================================
        // CONTROL DE NAVEGACIÓN
        // =============================================

        map.addControl(

          new mapboxgl.NavigationControl(),

          'top-right'

        );


        // =============================================
        // BUSCADOR
        // =============================================

        addLocalGeocoder();

      }
    )


    .catch(
      (error) => {

        console.error(
          'Error cargando GeoJSON:',
          error
        );

      }
    );

}


// =====================================================
// BUSCADOR LOCAL
// =====================================================

function addLocalGeocoder() {


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


      // ===============================================
      // BÚSQUEDA
      // ===============================================

      localGeocoder:
        function (
          query
        ) {


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


          // ===========================================
          // FEATURES
          // ===========================================

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

            return matchingFeatures;

          }


          // ===========================================
          // RECORRER PREDIOS
          // ===========================================

          for (
            const feature of features
          ) {


            const props =
              feature.properties || {};


            // =========================================
            // CAMPOS
            // =========================================

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
                codigo

                &&

                codigo.includes(
                  q
                )
              )

              ||

              (
                nombre

                &&

                nombre.includes(
                  q
                )
              )

              ||

              (
                documento

                &&

                documento.includes(
                  q
                )
              );


            if (
              !match
            ) {

              continue;

            }


            // =========================================
            // CENTRO DEL PREDIO
            // =========================================

            const centro =
              getFeatureLngLat(
                feature
              );


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


            // =========================================
            // RESULTADO
            // =========================================

            matchingFeatures.push({

              type:
                'Feature',

              geometry:
                feature.geometry,

              properties:
                props,

              place_name:

                `Código: ${codTxt || 'N/A'} | ` +

                `Nombre: ${nomTxt || 'N/A'} | ` +

                `Doc: ${docTxt || 'N/A'}`,

              center:
                centro,

              place_type:
                ['place']

            });


            // =========================================
            // MÁXIMO 10 RESULTADOS
            // =========================================

            if (
              matchingFeatures.length >=
              10
            ) {

              break;

            }

          }


          return matchingFeatures;

        }

    });


  // ===================================================
  // AGREGAR BUSCADOR
  // ===================================================

  map.addControl(

    geocoder,

    'top-left'

  );


  // ===================================================
  // RESULTADO DEL BUSCADOR
  // ===================================================

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


      // ===============================================
      // CENTRO
      // ===============================================

      const center =

        result.center

        ||

        getFeatureLngLat(
          result
        );


      // ===============================================
      // BBOX DEL RESULTADO
      // ===============================================

      const bbox =
        turf.bbox(
          result
        );


      // ===============================================
      // ZOOM AL PREDIO
      // ===============================================

      map.fitBounds(

        bbox,

        {

          padding:
            60,

          maxZoom:
            18,

          duration:
            700

        }

      );


      // ===============================================
      // POPUP
      // ===============================================

      popup

        .setLngLat(
          center
        )

        .setHTML(
          buildPopupHTML(

            result.properties || {},

            center

          )
        )

        .addTo(
          map
        );

    }

  );

}
// =====================================================
// PARTE 4 DE 4 — FINAL
// CARGA + FILTROS + SLIDER DE TRANSPARENCIA
// =====================================================


// =====================================================
// CARGAR MAPA
// =====================================================

map.on(
  'load',
  () => {

    // ===============================================
    // CARGAR CAPA PREDIAL
    // ===============================================

    addLayer();

  }
);


// =====================================================
// LEYENDA / FILTROS INTERACTIVOS
// =====================================================
//
// El HTML utiliza elementos:
//
// class="filter-item"
//
// con:
//
// data-filter="riesgo"
// data-filter="vigencia"
//
// y su respectivo:
//
// data-value
//
// =====================================================

document
  .querySelectorAll(
    '.filter-item'
  )
  .forEach(
    (el) => {


      el.addEventListener(
        'click',
        () => {


          // ===========================================
          // TIPO DE FILTRO
          // ===========================================

          const type =
            el.dataset.filter;


          // ===========================================
          // VALOR
          // ===========================================

          const value =
            el.dataset.value;


          // ===========================================
          // VALIDAR
          // ===========================================

          if (

            !type

            ||

            !value

            ||

            !activeFilters[type]

          ) {

            return;

          }


          // ===========================================
          // CAMBIAR ESTADO VISUAL
          // ===========================================

          el.classList.toggle(
            'active'
          );


          // ===========================================
          // QUITAR FILTRO
          // ===========================================

          if (
            activeFilters[type].has(
              value
            )
          ) {

            activeFilters[type].delete(
              value
            );

          }


          // ===========================================
          // ACTIVAR FILTRO
          // ===========================================

          else {

            activeFilters[type].add(
              value
            );

          }


          // ===========================================
          // ACTUALIZAR MAPA
          // ===========================================

          if (
            map.getLayer(
              'predios_ssk_fill_color'
            )

            &&

            map.getLayer(
              'predios_ssk_line_base'
            )
          ) {

            updateMapStyle();

          }

        }
      );

    }
  );


// =====================================================
// SLIDER DE TRANSPARENCIA
// =====================================================

const opacitySlider =
  document.getElementById(
    'opacitySlider'
  );


const opacityValue =
  document.getElementById(
    'opacityValue'
  );


// =====================================================
// CONFIGURAR SLIDER
// =====================================================

if (
  opacitySlider &&
  opacityValue
) {


  // ===================================================
  // VALOR INICIAL
  // ===================================================
  //
  // El mapa comienza con:
  //
  // polygonOpacity = 0.50
  //
  // Por tanto el slider también debe mostrar:
  //
  // 50%
  //
  // ===================================================

  opacitySlider.value =
    50;


  opacityValue.textContent =
    '50%';


  // ===================================================
  // EVENTO DEL SLIDER
  // ===================================================

  opacitySlider.addEventListener(
    'input',
    (e) => {


      // ===============================================
      // VALOR 0 - 100
      // ===============================================

      const valor =
        Number(
          e.target.value
        );


      // ===============================================
      // CONVERTIR A 0 - 1
      // ===============================================

      polygonOpacity =
        valor / 100;


      // ===============================================
      // ACTUALIZAR TEXTO
      // ===============================================

      opacityValue.textContent =
        `${valor}%`;


      // ===============================================
      // ACTUALIZAR MAPA
      // ===============================================

      if (
        map.getLayer(
          'predios_ssk_fill_color'
        )

        &&

        map.getLayer(
          'predios_ssk_line_base'
        )
      ) {

        updateMapStyle();

      }

    }
  );

}


// =====================================================
// RESIZE
// =====================================================
//
// Para que el mapa responda correctamente
// cuando cambia el tamaño de la ventana.
//
// =====================================================

window.addEventListener(
  'resize',
  () => {

    map.resize();

  }
);


// =====================================================
// DEBUG
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
