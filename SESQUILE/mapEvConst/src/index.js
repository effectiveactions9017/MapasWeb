// =====================================================
// VISOR EVOLUCIÓN DE CONSTRUCCIONES — SESQUILÉ
// =====================================================
// ✅ Mapa satelital
// ✅ Evolución construcciones 1985 - 2024
// ✅ Autoplay automático una sola vez
// ✅ Slider manual
// ✅ Contorno blanco fino en construcciones
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21iOWY1eGtiMGQ2cjJqcG9xbTRjZnQxMiJ9.8p55iS2R45-p8lxTerDL9Q';


// =====================================================
// MAPA
// =====================================================

const map =
  new mapboxgl.Map({

    container:
      'map',

    // MAPA SATELITAL
    style:
      'mapbox://styles/mapbox/satellite-streets-v12',

    center:
      [-73.79724, 5.04463],

    zoom:
      14,

    pitch:
      0,

    bearing:
      0,

    antialias:
      true

  });


// =====================================================
// CONTROL DE NAVEGACIÓN
// =====================================================

map.addControl(
  new mapboxgl.NavigationControl()
);


// =====================================================
// DATOS
// =====================================================

let geojsonData =
  null;


// =====================================================
// POPUP
// =====================================================

const popup =
  new mapboxgl.Popup({

    closeButton:
      false,

    closeOnClick:
      false,

    className:
      'custom-popup'

  });


// =====================================================
// AUTOPLAY
// =====================================================

const AUTOPLAY_START_YEAR =
  1985;


const AUTOPLAY_END_YEAR =
  2024;


// 350 ms por año.
// Recorrido aproximado: 14 segundos.
const AUTOPLAY_INTERVAL =
  350;


// Evita ejecutar dos veces la animación.
let autoplayEjecutado =
  false;


// Intervalo del autoplay.
let autoplayTimer =
  null;


// Timeout inicial.
// Nos permite cancelar también el segundo de espera
// si el usuario toca el slider.
let autoplayStartTimeout =
  null;


// =====================================================
// CONFIGURAR SLIDER + AUTOPLAY
// =====================================================

function configurarSliderYAutoplay() {


  const yearSlider =
    document.getElementById(
      'year-slider'
    );


  const yearLabel =
    document.getElementById(
      'year-label'
    );


  if (
    !yearSlider ||
    !yearLabel
  ) {

    console.warn(
      'No se encontró year-slider o year-label.'
    );

    return;

  }


  // ===================================================
  // CONFIGURACIÓN DEL SLIDER
  // ===================================================

  yearSlider.min =
    AUTOPLAY_START_YEAR;


  yearSlider.max =
    AUTOPLAY_END_YEAR;


  yearSlider.step =
    1;


  // ===================================================
  // APLICAR AÑO
  // ===================================================

  function aplicarAnio(
    year
  ) {


    const selectedYear =
      Number(year);


    if (
      !Number.isFinite(
        selectedYear
      )
    ) {

      return;

    }


    // Actualizar slider
    yearSlider.value =
      selectedYear;


    // Actualizar etiqueta
    yearLabel.textContent =
      `${selectedYear}`;


    // =================================================
    // FILTRO ACUMULATIVO
    // =================================================
    //
    // Ejemplo:
    //
    // 1995 = construcciones hasta 1995
    // 2010 = construcciones hasta 2010
    // 2024 = todas
    //
    // =================================================

    const filtroAnio = [

      '<=',

      [
        'get',
        'const_year'
      ],

      selectedYear

    ];


    // =================================================
    // FILTRAR RELLENO
    // =================================================

    if (
      map.getLayer(
        'buildings'
      )
    ) {

      map.setFilter(

        'buildings',

        filtroAnio

      );

    }


    // =================================================
    // FILTRAR CONTORNO
    // =================================================
    //
    // MUY IMPORTANTE:
    // El contorno debe recibir exactamente el mismo
    // filtro que el relleno.
    //
    // =================================================

    if (
      map.getLayer(
        'buildings_outline'
      )
    ) {

      map.setFilter(

        'buildings_outline',

        filtroAnio

      );

    }

  }


  // ===================================================
  // DETENER AUTOPLAY
  // ===================================================

  function detenerAutoplay() {


    // Detener intervalo
    if (
      autoplayTimer
    ) {

      clearInterval(
        autoplayTimer
      );


      autoplayTimer =
        null;

    }


    // Detener espera inicial
    if (
      autoplayStartTimeout
    ) {

      clearTimeout(
        autoplayStartTimeout
      );


      autoplayStartTimeout =
        null;

    }

  }


  // ===================================================
  // SLIDER MANUAL
  // ===================================================

  yearSlider.addEventListener(

    'input',

    (event) => {


      // Si el usuario interviene,
      // detener la animación.
      detenerAutoplay();


      const selectedYear =
        Number(
          event.target.value
        );


      aplicarAnio(
        selectedYear
      );

    }

  );


  // ===================================================
  // EVITAR SEGUNDO AUTOPLAY
  // ===================================================

  if (
    autoplayEjecutado
  ) {

    return;

  }


  autoplayEjecutado =
    true;


  // ===================================================
  // COMENZAR EN 1985
  // ===================================================

  let currentYear =
    AUTOPLAY_START_YEAR;


  aplicarAnio(
    currentYear
  );


  // ===================================================
  // ESPERAR 1 SEGUNDO EN 1985
  // ===================================================

  autoplayStartTimeout =
    setTimeout(
      () => {


        autoplayStartTimeout =
          null;


        // =============================================
        // INICIAR ANIMACIÓN
        // =============================================

        autoplayTimer =
          setInterval(
            () => {


              currentYear +=
                1;


              // =======================================
              // SEGURIDAD
              // =======================================

              if (
                currentYear >
                AUTOPLAY_END_YEAR
              ) {

                aplicarAnio(
                  AUTOPLAY_END_YEAR
                );


                detenerAutoplay();


                return;

              }


              // =======================================
              // MOSTRAR SIGUIENTE AÑO
              // =======================================

              aplicarAnio(
                currentYear
              );


              // =======================================
              // TERMINAR EN 2024
              // =======================================

              if (
                currentYear ===
                AUTOPLAY_END_YEAR
              ) {

                detenerAutoplay();

              }

            },

            AUTOPLAY_INTERVAL

          );

      },

      1000

    );

}
// =====================================================
// PARTE 2 DE 3
// CONSTRUCCIONES + CONTORNO + POPUP + LÍMITES
// =====================================================


// =====================================================
// CARGA PRINCIPAL DEL MAPA
// =====================================================

map.on(
  'style.load',
  () => {


    // =================================================
    // IDENTIFICAR CAPA DE ETIQUETAS DEL MAPA
    // =================================================

    const layers =
      map.getStyle().layers;


    const labelLayerId =
      layers.find(

        (layer) =>

          layer.type === 'symbol' &&

          layer.layout &&

          layer.layout['text-field']

      )?.id;


    // =================================================
    // CARGAR CONSTRUCCIONES
    // =================================================

    fetch(
      '../src/data/resultado_completo_final.geojson'
    )

      .then(
        (response) =>
          response.json()
      )

      .then(
        (data) => {


          // ===========================================
          // GUARDAR DATASET
          // ===========================================

          geojsonData =
            data;


          // ===========================================
          // SOURCE
          // ===========================================

          if (
            map.getSource(
              'buildings'
            )
          ) {

            map
              .getSource(
                'buildings'
              )
              .setData(
                geojsonData
              );

          } else {

            map.addSource(

              'buildings',

              {

                type:
                  'geojson',

                data:
                  geojsonData

              }

            );

          }


          // ===========================================
          // CAPA DE RELLENO DE CONSTRUCCIONES
          // ===========================================

          if (
            !map.getLayer(
              'buildings'
            )
          ) {

            map.addLayer(

              {

                id:
                  'buildings',

                source:
                  'buildings',

                type:
                  'fill',

                minzoom:
                  12,

                paint: {


                  // ===================================
                  // COLOR SEGÚN AÑO
                  // ===================================

                  'fill-color': [

                    'interpolate',

                    ['linear'],

                    ['get', 'const_year'],


                    1985,
                    '#D53E4F',


                    1990,
                    '#F46D43',


                    1995,
                    '#FDAE61',


                    2000,
                    '#FEE08B',


                    2005,
                    '#FFFFBF',


                    2010,
                    '#E6F598',


                    2015,
                    '#ABDDA4',


                    2020,
                    '#66C2A5',


                    2024,
                    '#3288BD'

                  ],


                  // ===================================
                  // OPACIDAD
                  // ===================================
                  //
                  // Permite apreciar el satélite
                  // debajo de las construcciones.
                  //
                  // ===================================

                  'fill-opacity':
                    0.82

                }

              },


              // Debajo de las etiquetas del mapa
              labelLayerId

            );

          }


          // ===========================================
          // NUEVO:
          // CONTORNO DE CADA CONSTRUCCIÓN
          // ===========================================
          //
          // Creamos una capa independiente porque
          // así podemos controlar exactamente:
          //
          // color
          // grosor
          // opacidad
          //
          // ===========================================

          if (
            !map.getLayer(
              'buildings_outline'
            )
          ) {

            map.addLayer(

              {

                id:
                  'buildings_outline',

                source:
                  'buildings',

                type:
                  'line',

                minzoom:
                  12,

                paint: {

                  // Contorno blanco
                  'line-color':
                    '#ffffff',

                  // Borde fino
                  'line-width':
                    0.6,

                  // Visible pero no demasiado fuerte
                  'line-opacity':
                    0.80

                }

              },


              // También debajo de las etiquetas
              labelLayerId

            );

          }


          // ===========================================
          // ASEGURAR ORDEN:
          //
          // relleno
          // ↓
          // contorno
          // ↓
          // etiquetas
          // ===========================================

          try {


            if (
              map.getLayer(
                'buildings'
              ) &&
              map.getLayer(
                'buildings_outline'
              )
            ) {

              map.moveLayer(

                'buildings_outline',

                labelLayerId

              );

            }


          } catch (e) {}


          // ===========================================
          // LIMPIAR EVENTOS ANTERIORES
          // ===========================================

          try {

            map.off(
              'mousemove',
              'buildings'
            );

          } catch (e) {}


          try {

            map.off(
              'mouseenter',
              'buildings'
            );

          } catch (e) {}


          try {

            map.off(
              'mouseleave',
              'buildings'
            );

          } catch (e) {}


          // ===========================================
          // POPUP SOBRE CONSTRUCCIONES
          // ===========================================

          map.on(

            'mousemove',

            'buildings',

            (e) => {


              const feature =

                e.features &&

                e.features[0];


              if (
                !feature
              ) {

                return;

              }


              // =======================================
              // AÑO
              // =======================================

              const year =

                feature
                  .properties
                  ?.const_year ??

                'N/A';


              // =======================================
              // ÁREA
              // =======================================

              const area =

                feature
                  .properties
                  ?.area_in_me;


              const areaNumero =
                Number(area);


              const areaRedondeada =

                area !== null &&

                area !== undefined &&

                area !== '' &&

                Number.isFinite(
                  areaNumero
                )

                  ? Math.round(
                      areaNumero
                    )

                  : 'N/A';


              // =======================================
              // CONTENIDO POPUP
              // =======================================

              const popupContent = `

                <strong>
                  Año:
                </strong>

                ${year}

                <br>


                <strong>
                  Área:
                </strong>

                ${areaRedondeada} &#x33A1;

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
                  e.lngLat
                )

                .setHTML(
                  popupContent
                )

                .addTo(map);

            }

          );


          // ===========================================
          // CURSOR SOBRE CONSTRUCCIONES
          // ===========================================

          map.on(

            'mouseenter',

            'buildings',

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

            'buildings',

            () => {

              map
                .getCanvas()
                .style
                .cursor =
                '';


              popup.remove();

            }

          );


          // ===========================================
          // LÍMITE URBANO
          // ===========================================

          addOutlineOnly({

            geojsonFile:
              'LIMITE_URBANO_SESQUILE.geojson',

            sourceId:
              'limite_urbano',

            layerId:
              'limite_urbano_outline',

            lineColor:
              '#00bcd4',

            lineWidth:
              2.5,

            lineOpacity:
              0.95

          });


          // ===========================================
          // LÍMITE MUNICIPAL
          // ===========================================

          addOutlineOnly({

            geojsonFile:
              'Limite_sesquile.geojson',

            sourceId:
              'limite_municipal',

            layerId:
              'limite_municipal_outline',

            lineColor:
              '#ffffff',

            lineWidth:
              2,

            lineOpacity:
              0.85

          });


          // ===========================================
          // LÍMITES ENCIMA DE LAS CONSTRUCCIONES
          // ===========================================

          setTimeout(
            () => {

              try {


                if (
                  map.getLayer(
                    'limite_urbano_outline'
                  )
                ) {

                  map.moveLayer(
                    'limite_urbano_outline'
                  );

                }


                if (
                  map.getLayer(
                    'limite_municipal_outline'
                  )
                ) {

                  map.moveLayer(
                    'limite_municipal_outline'
                  );

                }


              } catch (e) {}

            },

            250

          );


          // ===========================================
          // INICIAR SLIDER + AUTOPLAY
          // ===========================================

          configurarSliderYAutoplay();

        }

      )


      // =================================================
      // ERROR
      // =================================================

      .catch(
        (err) => {

          console.error(

            'Error cargando buildings:',

            err

          );

        }
      );

  }

);
// =====================================================
// PARTE 3 DE 3 — FINAL
// FUNCIÓN PARA AGREGAR CONTORNOS
// =====================================================
//
// Se utiliza para:
//
// 1. Límite urbano
// 2. Límite municipal
//
// Los límites son únicamente contornos.
// NO tienen relleno.
// =====================================================

function addOutlineOnly({

  geojsonFile,

  sourceId,

  layerId,

  lineColor =
    '#ffffff',

  lineWidth =
    2,

  lineOpacity =
    0.9

}) {


  // ===================================================
  // CARGAR GEOJSON
  // ===================================================

  fetch(
    `../src/data/${geojsonFile}`
  )

    .then(
      (r) =>
        r.json()
    )

    .then(
      (data) => {


        // =============================================
        // SOURCE
        // =============================================

        if (
          map.getSource(
            sourceId
          )
        ) {

          map
            .getSource(
              sourceId
            )
            .setData(
              data
            );

        } else {

          map.addSource(

            sourceId,

            {

              type:
                'geojson',

              data:
                data

            }

          );

        }


        // =============================================
        // CAPA DE CONTORNO
        // =============================================

        if (
          !map.getLayer(
            layerId
          )
        ) {

          map.addLayer({

            id:
              layerId,

            type:
              'line',

            source:
              sourceId,

            minzoom:
              10,

            paint: {

              'line-color':
                lineColor,

              'line-width':
                lineWidth,

              'line-opacity':
                lineOpacity

            }

          });

        }


        // =============================================
        // MANTENER EL LÍMITE ENCIMA
        // =============================================

        try {

          if (
            map.getLayer(
              layerId
            )
          ) {

            map.moveLayer(
              layerId
            );

          }

        } catch (e) {}


      }

    )


    // =================================================
    // ERROR
    // =================================================

    .catch(
      (err) => {

        console.error(

          `Error cargando límite ${geojsonFile}:`,

          err

        );

      }
    );

}
