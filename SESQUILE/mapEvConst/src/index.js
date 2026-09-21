// =====================================================
// VISOR EVOLUCIÓN DE CONSTRUCCIONES — SESQUILÉ
// =====================================================
//
// ✅ Mapa satelital
// ✅ Evolución construcciones 1985 - 2024
// ✅ Autoplay automático una sola vez
// ✅ Slider manual después de la animación
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

    // 🛰️ MAPA SATELITAL
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
// DATOS
// =====================================================

let geojsonData =
  null;


// =====================================================
// POPUP
// =====================================================

let popup =
  new mapboxgl.Popup({

    closeButton:
      false,

    closeOnClick:
      false,

    className:
      'custom-popup'

  });


// =====================================================
// CONFIGURACIÓN AUTOPLAY
// =====================================================
//
// La animación:
//
// 1985 → 1986 → 1987 → ... → 2024
//
// y se ejecuta UNA SOLA VEZ.
//
// =====================================================

const AUTOPLAY_START_YEAR =
  1985;


const AUTOPLAY_END_YEAR =
  2024;


// Tiempo entre cada año.
//
// 350 ms = animación relativamente fluida.
//
// 39 pasos x 350 ms ≈ 14 segundos.
//
const AUTOPLAY_INTERVAL =
  350;


// Evita que se ejecute dos veces.
let autoplayEjecutado =
  false;


// Guarda el temporizador.
let autoplayTimer =
  null;
// =====================================================
// PARTE 2
// CONSTRUCCIONES + POPUP + LÍMITES
// =====================================================


// =====================================================
// CARGA PRINCIPAL DEL MAPA
// =====================================================

map.on(
  'style.load',
  () => {


    // =================================================
    // IDENTIFICAR CAPA DE ETIQUETAS
    // =================================================
    //
    // Esto permite colocar las construcciones debajo
    // de los nombres y etiquetas del mapa satelital.
    //
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
    // 1. CARGAR CONSTRUCCIONES
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
          // CAPA DE CONSTRUCCIONES
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
                  // TRANSPARENCIA
                  //
                  // Dejamos un poco visible el
                  // satélite debajo.
                  // ===================================

                  'fill-opacity':
                    0.82

                }

              },


              // Debajo de las etiquetas
              labelLayerId

            );

          }


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
          // POPUP AL PASAR EL MOUSE
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
          // CURSOR
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
          // 2. LÍMITE URBANO
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
          // 3. LÍMITE MUNICIPAL
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
          // ASEGURAR LÍMITES ARRIBA
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
          // EL SLIDER + AUTOPLAY SE CONFIGURAN
          // EN LA PARTE 3
          // ===========================================

          configurarSliderYAutoplay();

        }

      )


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
// PARTE 3
// SLIDER + AUTOPLAY 1985 → 2024
// =====================================================


// =====================================================
// CONFIGURAR SLIDER Y AUTOPLAY
// =====================================================

function configurarSliderYAutoplay() {


  // ===================================================
  // OBTENER ELEMENTOS DEL HTML
  // ===================================================

  const yearSlider =
    document.getElementById(
      'year-slider'
    );


  const yearLabel =
    document.getElementById(
      'year-label'
    );


  // Si el HTML no tiene slider o etiqueta,
  // no hacemos nada.
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
  // CONFIGURAR RANGO
  // ===================================================

  yearSlider.min =
    AUTOPLAY_START_YEAR;


  yearSlider.max =
    AUTOPLAY_END_YEAR;


  yearSlider.step =
    1;


  // ===================================================
  // FUNCIÓN CENTRAL PARA CAMBIAR AÑO
  // ===================================================
  //
  // Esta misma función será utilizada por:
  //
  // 1. El autoplay.
  // 2. El movimiento manual del slider.
  //
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


    // ===============================================
    // ACTUALIZAR SLIDER
    // ===============================================

    yearSlider.value =
      selectedYear;


    // ===============================================
    // ACTUALIZAR TEXTO
    // ===============================================

    yearLabel.textContent =
      `${selectedYear}`;


    // ===============================================
    // FILTRAR CONSTRUCCIONES
    // ===============================================
    //
    // Se conserva tu comportamiento original:
    //
    // const_year <= año seleccionado
    //
    // Por tanto, la evolución es ACUMULATIVA.
    //
    // ===============================================

    if (
      map.getLayer(
        'buildings'
      )
    ) {

      map.setFilter(

        'buildings',

        [

          '<=',

          [
            'get',
            'const_year'
          ],

          selectedYear

        ]

      );

    }

  }


  // ===================================================
  // DETENER AUTOPLAY
  // ===================================================

  function detenerAutoplay() {


    if (
      autoplayTimer
    ) {

      clearInterval(
        autoplayTimer
      );


      autoplayTimer =
        null;

    }

  }


  // ===================================================
  // MOVIMIENTO MANUAL DEL SLIDER
  // ===================================================
  //
  // Si el usuario toca el slider mientras se está
  // reproduciendo la animación, detenemos el autoplay
  // y le damos el control inmediatamente.
  //
  // ===================================================

  yearSlider.addEventListener(

    'input',

    (event) => {


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
  // EVITAR AUTOPLAY DUPLICADO
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
  // PEQUEÑA ESPERA ANTES DE EMPEZAR
  // ===================================================
  //
  // Dejamos aproximadamente 1 segundo mostrando 1985
  // antes de comenzar el recorrido.
  //
  // ===================================================

  setTimeout(
    () => {


      // Si por alguna razón ya existe un timer,
      // no crear otro.
      if (
        autoplayTimer
      ) {

        return;

      }


      // ===============================================
      // INICIAR AUTOPLAY
      // ===============================================

      autoplayTimer =
        setInterval(
          () => {


            // =========================================
            // SIGUIENTE AÑO
            // =========================================

            currentYear +=
              1;


            // =========================================
            // ¿LLEGAMOS AL FINAL?
            // =========================================

            if (
              currentYear >
              AUTOPLAY_END_YEAR
            ) {


              // Asegurar que quede exactamente en 2024
              aplicarAnio(
                AUTOPLAY_END_YEAR
              );


              detenerAutoplay();


              return;

            }


            // =========================================
            // MOSTRAR AÑO
            // =========================================

            aplicarAnio(
              currentYear
            );


            // =========================================
            // SI ESTAMOS EN 2024, DETENER
            // =========================================

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
// FUNCIÓN PARA AGREGAR CONTORNOS
// =====================================================
//
// Se conserva para:
//
// - Límite urbano
// - Límite municipal
//
// Sin relleno.
//
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
        // CAPA
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

      }

    )


    .catch(
      (err) => {

        console.error(

          `Error cargando límite ${geojsonFile}:`,

          err

        );

      }
    );

}
