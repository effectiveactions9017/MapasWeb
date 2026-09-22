// =====================================================
// PREDIAL SESQUILÉ
// Mapbox GL JS + Placa Huellas + Límite Municipal
// =====================================================
//
// ✅ Predios: solo contorno
// ✅ Límite municipal Sesquilé
// ✅ Zoom inicial a la extensión TOTAL del municipio
// ✅ Placa huellas por vereda
// ✅ Leyenda interactiva
// ✅ Veredas ON / OFF
// ✅ Buscador predial
// ✅ Highlight
// ✅ Popup
// ✅ Street View
//
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


const LIMITE_URL =
  `${DATA_PATH}Limite_sesquile (1).geojson`;


const PREDIOS_URL =
  `${DATA_PATH}PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson`;


const PLACA_URL =
  `${DATA_PATH}Placa_huellas_con_vereda.geojson`;


// =====================================================
// MAPA
// =====================================================

const map =
  new mapboxgl.Map({

    container:
      'map',

    style:
      'mapbox://styles/mapbox/satellite-v9',

    // Vista temporal mientras carga el límite.
    // Después se reemplaza automáticamente
    // por la extensión real de Sesquilé.
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


let PLACA_DATA =
  null;


let LIMITE_DATA =
  null;


let TODAS_VEREDAS =
  [];


// =====================================================
// CONTROL DE VISTA INICIAL
// =====================================================
//
// Evita que el mapa vuelva a hacer fitBounds()
// después de que el usuario ya empezó a navegar.
//
// =====================================================

let vistaInicialAplicada =
  false;


// =====================================================
// PALETA DE COLORES DE VEREDAS
// =====================================================

const paletteVeredas = [

  '#ff8800',

  '#00c853',

  '#2979ff',

  '#d500f9',

  '#ff1744',

  '#00bcd4',

  '#ffd600',

  '#8bc34a',

  '#ff6d00',

  '#7c4dff',

  '#00e5ff',

  '#c6ff00',

  '#ff4081',

  '#40c4ff',

  '#aeea00',

  '#f06292',

  '#4db6ac',

  '#ba68c8',

  '#ffb74d',

  '#90caf9'

];


let coloresVereda =
  {};


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

    .trim();

}


// =====================================================
// OBTENER PUNTO REPRESENTATIVO
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

    const pt =
      turf
        .pointOnFeature(
          feature
        )
        .geometry
        .coordinates;


    return [

      Number(
        pt[0]
      ),

      Number(
        pt[1]
      )

    ];

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

    `https://www.google.com/maps/@?api=1`

    +

    `&map_action=pano`

    +

    `&viewpoint=${lat},${lng}`

  );

}


// =====================================================
// POPUP GENÉRICO
// =====================================================

function buildPopupFromFields(
  feature,
  lngLatForPopup,
  popupFields,
  lngLatForSV
) {

  const props =
    feature.properties || {};


  // ===================================================
  // CREAR FILAS
  // ===================================================

  const popupContent =
    popupFields

      .map(
        (field) => {


          let value =
            props?.[field.key];


          // ===========================================
          // ÁREA
          // ===========================================

          if (

            field.key ===
              'Shape_Area'

            &&

            value !== null

            &&

            value !== undefined

          ) {

            value =
              Math.round(
                Number(value)
              );

          }


          // ===========================================
          // AVALÚO 2026
          // ===========================================

          if (

            field.key ===
              'AVALUO 2026'

            &&

            value !== null

            &&

            value !== undefined

            &&

            value !== ''

          ) {

            const n =
              Number(
                value
              );


            value =
              isNaN(n)

                ? value

                : `$ ${n.toLocaleString('es-CO')}`;

          }


          // ===========================================
          // LONGITUD
          // ===========================================

          if (

            field.key ===
              'longitud'

            &&

            value !== null

            &&

            value !== undefined

            &&

            value !== ''

          ) {

            const n =
              Number(
                value
              );


            value =
              isNaN(n)

                ? value

                : `${n.toLocaleString(
                    'es-CO',
                    {
                      maximumFractionDigits:
                        2
                    }
                  )} m`;

          }


          return (

            `<strong>${field.label}:</strong> ` +

            `${value ?? 'N/A'}`

          );

        }
      )

      .join(
        '<br>'
      );


  // ===================================================
  // STREET VIEW
  // ===================================================

  const svBtn = `

    <div
      style="
        margin-top:10px;
      "
    >

      <a
        href="${streetViewUrl(lngLatForSV)}"

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

  `;


  // ===================================================
  // MOSTRAR POPUP
  // ===================================================

  popup

    .setLngLat(
      lngLatForPopup
    )

    .setHTML(

      `${popupContent}` +

      `${svBtn}` +

      `<br>` +

      `<a style="font-size:9px;">` +

      `&#9400; EffectiveActions` +

      `</a>`

    )

    .addTo(
      map
    );

}


// =====================================================
// AJUSTAR VISTA A TODO SESQUILÉ
// =====================================================
//
// Esta función es el cambio principal.
//
// Utiliza:
//
// Limite_sesquile (1).geojson
//
// para calcular la extensión TOTAL del municipio.
//
// =====================================================

function ajustarVistaAlMunicipio(
  data
) {


  // ===================================================
  // EVITAR REPETIR EL AJUSTE
  // ===================================================

  if (
    vistaInicialAplicada
  ) {

    return;

  }


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
      'No existe geometría municipal para ajustar la vista.'
    );

    return;

  }


  try {


    // =================================================
    // CALCULAR BBOX
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
        'BBox municipal inválido:',
        bounds
      );


      return;

    }


    // =================================================
    // MARCAR COMO APLICADO
    // =================================================

    vistaInicialAplicada =
      true;


    // =================================================
    // AJUSTAR MAPA
    // =================================================

    map.fitBounds(

      bounds,

      {

        // Margen pequeño para que Sesquilé
        // ocupe casi toda la pantalla.
        padding: {

          top:
            25,

          bottom:
            25,

          left:
            25,

          right:
            25

        },


        // Animación suave
        duration:
          1000,


        // Sin inclinación
        pitch:
          0,


        // Norte arriba
        bearing:
          0,


        // Evitar acercamiento excesivo
        maxZoom:
          15

      }

    );


    console.log(
      'Vista ajustada a Sesquilé:',
      bounds
    );


  }


  catch (error) {

    console.error(
      'Error ajustando vista al municipio:',
      error
    );

  }

}
// =====================================================
// PARTE 2 DE 4
// LEYENDA + FILTROS + LÍMITE MUNICIPAL
// =====================================================


// =====================================================
// CREAR LEYENDA
// =====================================================

function crearLeyenda() {


  let legend =
    document.getElementById(
      'legend-terri'
    );


  // ===================================================
  // CREAR CONTENEDOR SI NO EXISTE
  // ===================================================

  if (
    !legend
  ) {

    legend =
      document.createElement(
        'div'
      );


    legend.id =
      'legend-terri';


    document.body.appendChild(
      legend
    );

  }


  // ===================================================
  // ESTILO DE LA LEYENDA
  // ===================================================

  legend.style.position =
    'absolute';

  legend.style.bottom =
    '25px';

  legend.style.right =
    '15px';

  legend.style.left =
    'auto';

  legend.style.zIndex =
    '9999';

  legend.style.background =
    'rgba(15, 23, 42, 0.94)';

  legend.style.color =
    '#fff';

  legend.style.padding =
    '12px';

  legend.style.borderRadius =
    '12px';

  legend.style.fontFamily =
    'Libre Franklin, Arial, sans-serif';

  legend.style.fontSize =
    '12px';

  legend.style.maxHeight =
    'none';

  legend.style.overflowY =
    'visible';

  legend.style.boxShadow =
    '0 8px 22px rgba(0,0,0,.45)';

  legend.style.border =
    '1px solid rgba(255,255,255,.22)';

  legend.style.minWidth =
    '230px';


  // ===================================================
  // CONTENIDO
  // ===================================================

  legend.innerHTML = `

    <div
      style="
        font-weight:800;
        font-size:14px;
        margin-bottom:8px;
      "
    >
      🗺️ Predial Sesquilé
    </div>


    <!-- ============================================= -->
    <!-- BASE PREDIAL -->
    <!-- ============================================= -->

    <label
      style="
        display:flex;
        align-items:center;
        gap:7px;
        margin-bottom:10px;
        cursor:pointer;
      "
    >

      <input
        type="checkbox"
        id="toggle-predial"
        checked
      >

      <span
        style="
          width:18px;
          height:3px;
          background:#cfcfcf;
          display:inline-block;
          border-radius:3px;
        "
      >
      </span>

      Base predial

    </label>


    <!-- ============================================= -->
    <!-- LÍMITE MUNICIPAL -->
    <!-- ============================================= -->

    <label
      style="
        display:flex;
        align-items:center;
        gap:7px;
        margin-bottom:10px;
        cursor:pointer;
      "
    >

      <input
        type="checkbox"
        id="toggle-limite"
        checked
      >

      <span
        style="
          width:18px;
          height:4px;
          background:#00ffff;
          display:inline-block;
          border-radius:3px;
        "
      >
      </span>

      Límite Sesquilé

    </label>


    <!-- ============================================= -->
    <!-- PLACA HUELLAS -->
    <!-- ============================================= -->

    <div
      style="
        font-weight:800;
        margin:8px 0 6px;
      "
    >
      Placa huellas por vereda
    </div>


    <div
      id="legend-veredas"
    >
    </div>


    <!-- ============================================= -->
    <!-- CRÉDITO -->
    <!-- ============================================= -->

    <div
      style="
        margin-top:8px;
      "
    >

      <a
        style="
          font-size:9px;
          color:#00bcd4;
        "
      >
        &#9400; EffectiveActions
      </a>

    </div>

  `;


  // ===================================================
  // PRENDER / APAGAR BASE PREDIAL
  // ===================================================

  document
    .getElementById(
      'toggle-predial'
    )
    .addEventListener(
      'change',
      function () {


        const visibility =
          this.checked

            ? 'visible'

            : 'none';


        [

          'predios_ssk_layer',

          'predios_highlight_fill',

          'predios_highlight_line'

        ]

          .forEach(
            (id) => {


              if (
                map.getLayer(
                  id
                )
              ) {

                map.setLayoutProperty(

                  id,

                  'visibility',

                  visibility

                );

              }

            }
          );

      }
    );


  // ===================================================
  // PRENDER / APAGAR LÍMITE
  // ===================================================

  document
    .getElementById(
      'toggle-limite'
    )
    .addEventListener(
      'change',
      function () {


        const visibility =
          this.checked

            ? 'visible'

            : 'none';


        [

          'limite_sesquile_fill',

          'limite_sesquile_line'

        ]

          .forEach(
            (id) => {


              if (
                map.getLayer(
                  id
                )
              ) {

                map.setLayoutProperty(

                  id,

                  'visibility',

                  visibility

                );

              }

            }
          );

      }
    );

}


// =====================================================
// ACTUALIZAR LEYENDA DE VEREDAS
// =====================================================

function actualizarLeyendaVeredas(
  veredas
) {


  const cont =
    document.getElementById(
      'legend-veredas'
    );


  if (
    !cont
  ) {

    return;

  }


  cont.innerHTML =
    '';


  // ===================================================
  // CREAR ITEM PARA CADA VEREDA
  // ===================================================

  veredas.forEach(
    (vereda, index) => {


      const color =
        coloresVereda[
          vereda
        ];


      const id =
        `vereda_${index}`;


      const item =
        document.createElement(
          'label'
        );


      item.style.display =
        'flex';

      item.style.alignItems =
        'center';

      item.style.gap =
        '7px';

      item.style.marginBottom =
        '6px';

      item.style.cursor =
        'pointer';


      item.innerHTML = `

        <input
          type="checkbox"
          id="${id}"
          data-vereda="${vereda}"
          checked
        >


        <span
          style="
            width:18px;
            height:4px;
            background:${color};
            display:inline-block;
            border-radius:3px;
          "
        >
        </span>


        <span>
          ${vereda || 'Sin vereda'}
        </span>

      `;


      cont.appendChild(
        item
      );


      // ===============================================
      // EVENTO ON/OFF
      // ===============================================

      document
        .getElementById(
          id
        )
        .addEventListener(
          'change',
          aplicarFiltroVeredas
        );

    }
  );

}


// =====================================================
// FILTRAR PLACA HUELLAS POR VEREDA
// =====================================================

function aplicarFiltroVeredas() {


  const checks =
    document.querySelectorAll(
      '#legend-veredas input[type="checkbox"]'
    );


  // ===================================================
  // VEREDAS ACTIVAS
  // ===================================================

  const veredasVisibles =
    Array.from(
      checks
    )

      .filter(
        (chk) =>
          chk.checked
      )

      .map(
        (chk) =>
          chk.dataset.vereda
      );


  // ===================================================
  // VALIDAR CAPA
  // ===================================================

  if (
    !map.getLayer(
      'placa_huellas_layer'
    )
  ) {

    return;

  }


  // ===================================================
  // NINGUNA VEREDA
  // ===================================================

  if (
    veredasVisibles.length ===
    0
  ) {

    map.setFilter(

      'placa_huellas_layer',

      [

        '==',

        [
          'get',
          'vereda'
        ],

        '__NINGUNA__'

      ]

    );


    return;

  }


  // ===================================================
  // APLICAR FILTRO
  // ===================================================

  map.setFilter(

    'placa_huellas_layer',

    [

      'in',

      [
        'coalesce',

        [
          'get',
          'vereda'
        ],

        'Sin vereda'
      ],

      [
        'literal',
        veredasVisibles
      ]

    ]

  );

}


// =====================================================
// CAPA LÍMITE MUNICIPAL SESQUILÉ
// =====================================================
//
// IMPORTANTE:
//
// Esta capa controla la VISTA INICIAL.
//
// Cuando termina de cargar:
//
// ajustarVistaAlMunicipio(data)
//
// calcula la extensión exacta del municipio
// y hace fitBounds().
//
// =====================================================

function addLimiteSesquileLayer() {


  fetch(
    LIMITE_URL
  )


    .then(
      (response) => {


        // =============================================
        // VALIDAR RESPUESTA
        // =============================================

        if (
          !response.ok
        ) {

          throw new Error(
            `Error cargando límite municipal: HTTP ${response.status}`
          );

        }


        return response.json();

      }
    )


    .then(
      (data) => {


        // =============================================
        // GUARDAR DATA
        // =============================================

        LIMITE_DATA =
          data;


        // =============================================
        // SOURCE
        // =============================================

        if (
          map.getSource(
            'limite_sesquile'
          )
        ) {

          map
            .getSource(
              'limite_sesquile'
            )
            .setData(
              data
            );

        }


        else {

          map.addSource(

            'limite_sesquile',

            {

              type:
                'geojson',

              data:
                data

            }

          );

        }


        // =============================================
        // RELLENO MUY SUAVE DEL MUNICIPIO
        // =============================================

        if (
          !map.getLayer(
            'limite_sesquile_fill'
          )
        ) {

          map.addLayer({

            id:
              'limite_sesquile_fill',

            source:
              'limite_sesquile',

            type:
              'fill',

            paint: {

              'fill-color':
                '#00ffff',

              'fill-opacity':
                0.04

            }

          });

        }


        // =============================================
        // CONTORNO MUNICIPAL
        // =============================================

        if (
          !map.getLayer(
            'limite_sesquile_line'
          )
        ) {

          map.addLayer({

            id:
              'limite_sesquile_line',

            source:
              'limite_sesquile',

            type:
              'line',

            paint: {

              'line-color':
                '#00ffff',

              'line-width':
                3,

              'line-opacity':
                0.95,

              'line-dasharray':
                [2, 1]

            }

          });

        }


        // =============================================
        // ⭐ ZOOM A TODA LA EXTENSIÓN DEL MUNICIPIO
        // =============================================
        //
        // Esta es la modificación principal.
        //
        // Se ejecuta DESPUÉS de tener cargado
        // Limite_sesquile (1).geojson.
        //
        // =============================================

        ajustarVistaAlMunicipio(
          data
        );


        // =============================================
        // CURSOR
        // =============================================

        map.on(

          'mouseenter',

          'limite_sesquile_line',

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

          'limite_sesquile_line',

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              '';

          }

        );


        // =============================================
        // CLICK SOBRE EL LÍMITE
        // =============================================

        map.on(

          'click',

          'limite_sesquile_line',

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
            // STREET VIEW
            // =========================================

            const svLngLat =
              getFeatureLngLat(

                feature,

                e.lngLat

              );


            // =========================================
            // POPUP
            // =========================================

            buildPopupFromFields(

              feature,

              e.lngLat,

              [

                {
                  label:
                    'Capa',

                  key:
                    'nombre'
                }

              ],

              svLngLat

            );

          }

        );


        // =============================================
        // ORDENAR CAPAS
        // =============================================

        ordenarCapas();

      }
    )


    .catch(
      (error) => {

        console.error(
          'Error cargando límite Sesquilé:',
          error
        );

      }
    );

}
// =====================================================
// PARTE 3 DE 4
// BASE PREDIAL + PLACA HUELLAS + ORDEN DE CAPAS
// =====================================================


// =====================================================
// CAPA PREDIAL
// SOLO CONTORNO
// =====================================================

function addPredialLayer() {


  fetch(
    PREDIOS_URL
  )


    .then(
      (response) => {


        // =============================================
        // VALIDAR RESPUESTA
        // =============================================

        if (
          !response.ok
        ) {

          throw new Error(
            `Error cargando predios: HTTP ${response.status}`
          );

        }


        return response.json();

      }
    )


    .then(
      (data) => {


        // =============================================
        // GUARDAR DATA
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
        // CAPA PREDIAL
        // =============================================

        if (
          !map.getLayer(
            'predios_ssk_layer'
          )
        ) {

          map.addLayer({

            id:
              'predios_ssk_layer',

            source:
              'predios_ssk',

            type:
              'line',

            minzoom:
              12,

            paint: {

              'line-color':
                '#cfcfcf',

              'line-width':
                1.1,

              'line-opacity':
                0.85

            }

          });

        }


        // =============================================
        // CURSOR
        // =============================================

        map.on(

          'mouseenter',

          'predios_ssk_layer',

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

          'predios_ssk_layer',

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              '';

          }

        );


        // =============================================
        // CLICK SOBRE PREDIO
        // =============================================

        map.on(

          'click',

          'predios_ssk_layer',

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
            // STREET VIEW
            // =========================================

            const svLngLat =
              getFeatureLngLat(

                feature,

                e.lngLat

              );


            // =========================================
            // POPUP
            // =========================================

            buildPopupFromFields(

              feature,

              e.lngLat,

              [

                {
                  label:
                    'Código',

                  key:
                    'codigo'
                },

                {
                  label:
                    'Destino',

                  key:
                    'DESTINO'
                },

                {
                  label:
                    'Nombre',

                  key:
                    'NOMBRE'
                },

                {
                  label:
                    'Documento',

                  key:
                    'NUMERO_DOCUMENTO'
                },

                {
                  label:
                    'Avalúo 2026',

                  key:
                    'AVALUO 2026'
                },

                {
                  label:
                    'Área (㎡)',

                  key:
                    'Shape_Area'
                }

              ],

              svLngLat

            );

          }

        );


        // =============================================
        // ORDENAR CAPAS
        // =============================================

        ordenarCapas();

      }
    )


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
// CAPA PLACA HUELLAS
// COLOR POR VEREDA
// =====================================================

function addPlacaHuellasLayer() {


  fetch(
    PLACA_URL
  )


    .then(
      (response) => {


        // =============================================
        // VALIDAR RESPUESTA
        // =============================================

        if (
          !response.ok
        ) {

          throw new Error(
            `Error cargando placa huellas: HTTP ${response.status}`
          );

        }


        return response.json();

      }
    )


    .then(
      (data) => {


        // =============================================
        // GUARDAR DATA
        // =============================================

        PLACA_DATA =
          data;


        // =============================================
        // OBTENER VEREDAS ÚNICAS
        // =============================================

        const veredas = [

          ...new Set(

            data.features.map(
              (feature) =>

                norm(
                  feature.properties?.vereda
                )

                ||

                'Sin vereda'

            )

          )

        ]

          .sort();


        TODAS_VEREDAS =
          veredas;


        // =============================================
        // ASIGNAR COLOR A CADA VEREDA
        // =============================================

        coloresVereda =
          {};


        veredas.forEach(
          (vereda, index) => {

            coloresVereda[
              vereda
            ] =

              paletteVeredas[

                index %

                paletteVeredas.length

              ];

          }
        );


        // =============================================
        // EXPRESIÓN DE COLOR
        // =============================================

        const colorExpression = [

          'match',

          [
            'coalesce',

            [
              'get',
              'vereda'
            ],

            'Sin vereda'
          ]

        ];


        // =============================================
        // AGREGAR COLORES
        // =============================================

        veredas.forEach(
          (vereda) => {


            colorExpression.push(

              vereda,

              coloresVereda[
                vereda
              ]

            );

          }
        );


        // Color de respaldo
        colorExpression.push(
          '#ff8800'
        );


        // =============================================
        // SOURCE
        // =============================================

        if (
          map.getSource(
            'placa_huellas'
          )
        ) {

          map
            .getSource(
              'placa_huellas'
            )
            .setData(
              data
            );

        }


        else {

          map.addSource(

            'placa_huellas',

            {

              type:
                'geojson',

              data:
                data

            }

          );

        }


        // =============================================
        // CAPA PLACA HUELLAS
        // =============================================

        if (
          !map.getLayer(
            'placa_huellas_layer'
          )
        ) {

          map.addLayer({

            id:
              'placa_huellas_layer',

            source:
              'placa_huellas',

            type:
              'line',

            minzoom:
              10,

            paint: {


              // =======================================
              // COLOR POR VEREDA
              // =======================================

              'line-color':
                colorExpression,


              // =======================================
              // CALIBRE SEGÚN ZOOM
              // =======================================

              'line-width': [

                'interpolate',

                [
                  'linear'
                ],

                [
                  'zoom'
                ],

                10,
                2,

                15,
                4,

                18,
                7

              ],


              // =======================================
              // OPACIDAD
              // =======================================

              'line-opacity':
                0.98

            }

          });

        }


        // =============================================
        // CURSOR
        // =============================================

        map.on(

          'mouseenter',

          'placa_huellas_layer',

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

          'placa_huellas_layer',

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              '';

          }

        );


        // =============================================
        // CLICK SOBRE PLACA HUELLA
        // =============================================

        map.on(

          'click',

          'placa_huellas_layer',

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
            // STREET VIEW
            // =========================================

            const svLngLat =
              getFeatureLngLat(

                feature,

                e.lngLat

              );


            // =========================================
            // POPUP
            // =========================================

            buildPopupFromFields(

              feature,

              e.lngLat,

              [

                {
                  label:
                    'Longitud',

                  key:
                    'longitud'
                },

                {
                  label:
                    'Vereda',

                  key:
                    'vereda'
                }

              ],

              svLngLat

            );

          }

        );


        // =============================================
        // ACTUALIZAR LEYENDA
        // =============================================

        actualizarLeyendaVeredas(
          veredas
        );


        // =============================================
        // ORDENAR CAPAS
        // =============================================

        ordenarCapas();

      }
    )


    .catch(
      (error) => {

        console.error(
          'Error cargando placa huellas:',
          error
        );

      }
    );

}


// =====================================================
// ORDEN DE CAPAS
// =====================================================
//
// Orden visual:
//
// 1. Límite - relleno
// 2. Límite - línea
// 3. Predios
// 4. Highlight
// 5. Placa huellas
//
// La placa huellas queda encima.
//
// =====================================================

function ordenarCapas() {


  try {


    // ===============================================
    // LÍMITE RELLENO
    // ===============================================

    if (
      map.getLayer(
        'limite_sesquile_fill'
      )
    ) {

      map.moveLayer(
        'limite_sesquile_fill'
      );

    }


    // ===============================================
    // LÍMITE CONTORNO
    // ===============================================

    if (
      map.getLayer(
        'limite_sesquile_line'
      )
    ) {

      map.moveLayer(
        'limite_sesquile_line'
      );

    }


    // ===============================================
    // BASE PREDIAL
    // ===============================================

    if (
      map.getLayer(
        'predios_ssk_layer'
      )
    ) {

      map.moveLayer(
        'predios_ssk_layer'
      );

    }


    // ===============================================
    // HIGHLIGHT RELLENO
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
    // HIGHLIGHT CONTORNO
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


    // ===============================================
    // PLACA HUELLAS
    // ===============================================

    if (
      map.getLayer(
        'placa_huellas_layer'
      )
    ) {

      map.moveLayer(
        'placa_huellas_layer'
      );

    }


  }


  catch (error) {

    console.warn(
      'No se pudo ordenar capas todavía:',
      error
    );

  }

}


// =====================================================
// CARGA PRINCIPAL
// =====================================================

map.on(
  'style.load',
  () => {


    // ===============================================
    // LEYENDA
    // ===============================================

    crearLeyenda();


    // ===============================================
    // LÍMITE MUNICIPAL
    // ===============================================
    //
    // IMPORTANTE:
    //
    // Esta función carga primero el límite y dentro
    // de ella ejecuta:
    //
    // ajustarVistaAlMunicipio(data)
    //
    // Por eso el mapa terminará centrado en toda
    // la extensión municipal.
    //
    // ===============================================

    addLimiteSesquileLayer();


    // ===============================================
    // BASE PREDIAL
    // ===============================================

    addPredialLayer();


    // ===============================================
    // PLACA HUELLAS
    // ===============================================

    addPlacaHuellasLayer();


    // ===============================================
    // SOURCE HIGHLIGHT
    // ===============================================

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


    // ===============================================
    // HIGHLIGHT RELLENO
    // ===============================================

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
            0.18

        }

      });

    }


    // ===============================================
    // HIGHLIGHT CONTORNO
    // ===============================================

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
            4

        }

      });

    }


    // ===============================================
    // ORDEN INICIAL
    // ===============================================

    ordenarCapas();

  }
);
// =====================================================
// PARTE 4 DE 4 — FINAL
// BUSCADOR + HIGHLIGHT + CONTROLES
// =====================================================


// =====================================================
// BUSCADOR LOCAL PREDIAL
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


        // =============================================
        // CONSULTA VACÍA
        // =============================================

        if (
          !q
        ) {

          return matchingFeatures;

        }


        // =============================================
        // FEATURES PREDIALES
        // =============================================

        const features =
          PREDIOS_DATA?.features ||
          [];


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
              feature.properties ||
              {};


            // =========================================
            // CAMPOS BUSCABLES
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
            // COMPROBAR COINCIDENCIA
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

              return;

            }


            // =========================================
            // CENTRO DEL PREDIO
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


            catch (error) {

              centro =
                getFeatureLngLat(
                  feature
                );

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


            // =========================================
            // IDENTIFICAR CAMPO DE COINCIDENCIA
            // =========================================

            let matchField =
              null;


            let matchValue =
              null;


            if (
              codigo

              &&

              codigo.includes(
                q
              )
            ) {

              matchField =
                'codigo';


              matchValue =
                codTxt;

            }


            else if (
              documento

              &&

              documento.includes(
                q
              )
            ) {

              matchField =
                'NUMERO_DOCUMENTO';


              matchValue =
                docTxt;

            }


            else if (
              nombre

              &&

              nombre.includes(
                q
              )
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
            // AGREGAR RESULTADO
            // =========================================

            matchingFeatures.push({

              type:
                'Feature',

              geometry:
                feature.geometry,

              properties:
                props2,

              place_name:

                `Código: ${codTxt || 'N/A'} | ` +

                `Nombre: ${nomTxt || 'N/A'} | ` +

                `Doc: ${docTxt || 'N/A'}`,

              text:

                codTxt

                ||

                nomTxt

                ||

                docTxt

                ||

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
// CONTROL DE NAVEGACIÓN
// =====================================================

map.addControl(

  new mapboxgl.NavigationControl(),

  'top-right'

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


    // =================================================
    // PROPIEDADES
    // =================================================

    const properties =
      result.properties ||
      {};


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
    // NORMALIZACIÓN LOCAL
    // =================================================

    const normLocal =
      (value) =>

        (
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


    // =================================================
    // TODOS LOS PREDIOS
    // =================================================

    const features =
      PREDIOS_DATA?.features ||
      [];


    // =================================================
    // PREDIOS A RESALTAR
    // =================================================

    let toHighlight =
      [];


    // =================================================
    // SI BUSCA POR DOCUMENTO O CÓDIGO
    // =================================================
    //
    // Se resaltan todos los polígonos que tengan
    // exactamente el mismo valor.
    //
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
        normLocal(
          matchValue
        );


      toHighlight =
        features.filter(
          (feature) => {


            const props =
              feature.properties ||
              {};


            const value =

              matchField ===
                'NUMERO_DOCUMENTO'

                ? props.NUMERO_DOCUMENTO

                : props.codigo;


            return (

              normLocal(
                value
              )

              ===

              mv

            );

          }
        );

    }


    // =================================================
    // SI NO HAY COINCIDENCIAS AGRUPADAS
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
    // ACTUALIZAR HIGHLIGHT
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
            40,

          maxZoom:
            18,

          duration:
            700

        }

      );


    }


    catch (error) {

      console.error(
        'Error ajustando vista al resultado:',
        error
      );

    }


    // =================================================
    // CAMPOS DEL POPUP
    // =================================================

    const popupFields = [

      {
        label:
          'Código',

        key:
          'codigo'
      },

      {
        label:
          'Destino',

        key:
          'DESTINO'
      },

      {
        label:
          'Nombre',

        key:
          'NOMBRE'
      },

      {
        label:
          'Documento',

        key:
          'NUMERO_DOCUMENTO'
      },

      {
        label:
          'Avalúo 2026',

        key:
          'AVALUO 2026'
      },

      {
        label:
          'Área (㎡)',

        key:
          'Shape_Area'
      }

    ];


    // =================================================
    // CENTRO PARA STREET VIEW
    // =================================================

    let svCenter;


    try {


      const bounds =
        turf.bbox(
          fc
        );


      svCenter = [

        (
          bounds[0] +
          bounds[2]
        ) / 2,

        (
          bounds[1] +
          bounds[3]
        ) / 2

      ];


    }


    catch (error) {

      svCenter =
        getFeatureLngLat(
          result
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
          .centroid(
            result
          )
          .geometry
          .coordinates;


    }


    catch (error) {

      center =
        svCenter;

    }


    // =================================================
    // FEATURE PARA POPUP
    // =================================================

    const featureLike = {

      properties:
        properties

    };


    // =================================================
    // MOSTRAR POPUP
    // =================================================

    buildPopupFromFields(

      featureLike,

      center,

      popupFields,

      svCenter

    );


    // =================================================
    // ORDENAR CAPAS
    // =================================================

    ordenarCapas();

  }
);


// =====================================================
// CERRAR SELECCIÓN AL HACER CLICK FUERA
// =====================================================

map.on(
  'click',
  (e) => {


    // =================================================
    // SI LA CAPA PREDIAL TODAVÍA NO EXISTE
    // =================================================

    if (
      !map.getLayer(
        'predios_ssk_layer'
      )
    ) {

      return;

    }


    // =================================================
    // COMPROBAR CLICK SOBRE PREDIO
    // =================================================

    const features =
      map.queryRenderedFeatures(

        e.point,

        {

          layers: [

            'predios_ssk_layer',

            'placa_huellas_layer',

            'limite_sesquile_line'

          ].filter(
            (id) =>
              map.getLayer(
                id
              )
          )

        }

      );


    // =================================================
    // CLICK FUERA DE LAS CAPAS
    // =================================================

    if (
      !features.length
    ) {


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
            []

        });

      }


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
