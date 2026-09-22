// =====================================================
// VISOR BONOS DE CARBONO — SESQUILÉ
// =====================================================
//
// CAPAS:
//
// 1. Límite municipal
// 2. Oportunidad de carbono / bosque actual
// 3. Pérdidas de bosque y carbono
// 4. Límite urbano
//
// MEJORAS:
//
// ✅ Mapa base satelital
// ✅ Zoom inicial automático al límite municipal
// ✅ Popup por clic
// ✅ Leyenda con límite municipal y límite urbano
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

    // 🛰️ MAPA SATELITAL
    style:
      'mapbox://styles/mapbox/satellite-streets-v12',

    // Vista provisional.
    // Después se ajustará al límite municipal.
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
// NAVEGACIÓN
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
// RUTA DE DATOS
// =====================================================

const DATA_PATH =
  '../src/data/';


// =====================================================
// DATASETS EN MEMORIA
// =====================================================

let LIMITE_MUNICIPAL_DATA =
  null;


let LIMITE_URBANO_DATA =
  null;


let OPORTUNIDAD_DATA =
  null;


let PERDIDAS_DATA =
  null;


// =====================================================
// CONTROL DEL ZOOM INICIAL
// =====================================================

let ZOOM_MUNICIPAL_REALIZADO =
  false;


// =====================================================
// POPUP — OPORTUNIDAD
// =====================================================
//
// bosque_actual_final_ajustado_UNIDO.geojson
//
// =====================================================

const POPUP_OPORTUNIDAD_FIELDS = [

  {

    label:
      'Toneladas de Carbono',

    key:
      'sum_Stock_Carbono_Total_tC',

    format:
      'number'

  },

  {

    label:
      'Área (ha)',

    key:
      'sum_Area_Poligono_ha',

    format:
      'number'

  },

  {

    label:
      'Tipo de bosque',

    key:
      'vals_Nombre_Tipo_Bosque_Predom'

  }

];


// =====================================================
// POPUP — PÉRDIDAS
// =====================================================
//
// perdida_bosque_con_carbono_2001_2024.geojson
//
// =====================================================

const POPUP_PERDIDAS_FIELDS = [

  {

    label:
      'Toneladas de Carbono',

    key:
      'Carbono_Perdido_tC',

    format:
      'number'

  },

  {

    label:
      'Área (ha)',

    key:
      'Area_ha',

    format:
      'number'

  },

  {

    label:
      'Tipo de bosque',

    key:
      'Nombre_Tipo_Bosque_Predom'

  }

];


// =====================================================
// CONSTRUIR POPUP
// =====================================================

function buildPopupContent(
  feature,
  popupFields
) {

  const props =
    feature.properties || {};


  // ===================================================
  // CAMPOS DEFINIDOS
  // ===================================================

  if (
    Array.isArray(
      popupFields
    ) &&
    popupFields.length
  ) {

    return popupFields

      .map(
        ({
          label,
          key,
          format
        }) => {


          let v =
            props[key];


          // ===========================================
          // FORMATO NUMÉRICO
          // ===========================================

          if (

            format ===
              'number' &&

            v !== null &&

            v !== undefined &&

            v !== ''

          ) {

            const n =
              Number(v);


            v =

              Number.isFinite(n)

                ? n.toLocaleString(
                    'es-CO',
                    {
                      maximumFractionDigits:
                        2
                    }
                  )

                : v;

          }


          // ===========================================
          // REDONDEO
          // ===========================================

          if (

            format ===
              'round' &&

            v !== null &&

            v !== undefined &&

            v !== ''

          ) {

            const n =
              Number(v);


            v =

              Number.isFinite(n)

                ? Math.round(n)

                : v;

          }


          return (

            `<strong>${label}:</strong> ` +

            `${v ?? 'N/A'}`

          );

        }

      )

      .join(
        '<br>'
      );

  }


  // ===================================================
  // POPUP AUTOMÁTICO
  // ===================================================

  const keys =
    Object
      .keys(props)
      .sort();


  const show =
    keys.slice(
      0,
      18
    );


  const rows =
    show.map(
      (k) => {


        let v =
          props[k];


        if (
          typeof v ===
          'number'
        ) {

          v =
            v.toLocaleString(
              'es-CO'
            );

        }


        return (

          `<strong>${k}:</strong> ` +

          `${v ?? 'N/A'}`

        );

      }

    );


  if (
    keys.length >
    show.length
  ) {

    rows.push(

      `<em>… +${
        keys.length -
        show.length
      } campos</em>`

    );

  }


  return rows.join(
    '<br>'
  );

}
// =====================================================
// PARTE 2
// EVENTOS + CARGA SEGURA + ZOOM AL LÍMITE MUNICIPAL
// =====================================================


// =====================================================
// EVENTOS DE CLICK
// EVITA DUPLICAR HANDLERS
// =====================================================

const clickHandlers = {};


// =====================================================
// POPUP POR CLICK
// =====================================================

function bindClickPopup(
  layerId,
  popupFields
) {


  // ===================================================
  // QUITAR CLICK ANTERIOR
  // ===================================================

  if (
    clickHandlers[layerId]
  ) {

    try {

      map.off(
        'click',
        layerId,
        clickHandlers[layerId]
      );

    } catch (e) {}

  }


  // ===================================================
  // FUNCIÓN CLICK
  // ===================================================

  const fn =
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
      // CONTENIDO DEL POPUP
      // ===============================================

      const html =

        buildPopupContent(
          feature,
          popupFields
        )

        +

        `<br>
         <a style="font-size:9px;">
           &#9400; EffectiveActions
         </a>`;


      // ===============================================
      // MOSTRAR POPUP
      // ===============================================

      popup

        .setLngLat(
          e.lngLat
        )

        .setHTML(
          html
        )

        .addTo(map);

    };


  // ===================================================
  // GUARDAR HANDLER
  // ===================================================

  clickHandlers[layerId] =
    fn;


  // ===================================================
  // ACTIVAR CLICK
  // ===================================================

  map.on(
    'click',
    layerId,
    fn
  );


  // ===================================================
  // CURSOR
  // ===================================================

  map.on(

    'mouseenter',

    layerId,

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

    layerId,

    () => {

      map
        .getCanvas()
        .style
        .cursor =
        '';

    }

  );

}


// =====================================================
// ZOOM AUTOMÁTICO AL LÍMITE MUNICIPAL
// =====================================================

function ajustarZoomMunicipal(
  data
) {


  // Evitar ejecutar varias veces
  if (
    ZOOM_MUNICIPAL_REALIZADO
  ) {

    return;

  }


  // Validar GeoJSON
  if (
    !data ||
    !Array.isArray(data.features) ||
    !data.features.length
  ) {

    console.warn(
      'El límite municipal no contiene geometrías válidas.'
    );

    return;

  }


  try {


    // ===============================================
    // CALCULAR EXTENSIÓN REAL
    // ===============================================

    const bounds =
      turf.bbox(
        data
      );


    // ===============================================
    // VALIDAR BBOX
    // ===============================================

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

      console.warn(
        'No fue posible calcular la extensión del límite municipal.'
      );

      return;

    }


    // ===============================================
    // AJUSTAR MAPA
    // ===============================================

    map.fitBounds(

      bounds,

      {

        // Margen alrededor del municipio
        padding:
          35,

        // Movimiento suave
        duration:
          1200,

        // Evita acercamiento excesivo
        maxZoom:
          15

      }

    );


    // ===============================================
    // MARCAR COMO REALIZADO
    // ===============================================

    ZOOM_MUNICIPAL_REALIZADO =
      true;


  } catch (error) {


    console.error(

      'Error ajustando zoom al límite municipal:',

      error

    );

  }

}


// =====================================================
// FUNCIÓN GENERAL PARA AGREGAR CAPAS
// =====================================================
//
// Funciona para:
//
// - line
// - fill
//
// y agrega popup por click.
//
// =====================================================

function addLayer({

  geojsonFile,

  sourceId,

  layerId,

  type =
    'fill',

  color,

  opacity =
    0.65,

  outline =
    '#ffffff',

  width =
    2,

  popupFields =
    null

}) {


  // ===================================================
  // CARGAR GEOJSON
  // ===================================================

  fetch(
    `${DATA_PATH}${geojsonFile}`
  )

    .then(
      (r) =>
        r.json()
    )

    .then(
      (data) => {


        // =============================================
        // GUARDAR DATASET
        // =============================================

        if (
          sourceId ===
          'limite_municipal'
        ) {

          LIMITE_MUNICIPAL_DATA =
            data;


          // ===========================================
          // ZOOM INICIAL
          // ===========================================
          //
          // IMPORTANTE:
          // El zoom se calcula directamente desde:
          //
          // Limite_sesquile.geojson
          //
          // ===========================================

          ajustarZoomMunicipal(
            data
          );

        }


        if (
          sourceId ===
          'limite_urbano'
        ) {

          LIMITE_URBANO_DATA =
            data;

        }


        if (
          sourceId ===
          'oportunidad'
        ) {

          OPORTUNIDAD_DATA =
            data;

        }


        if (
          sourceId ===
          'perdidas'
        ) {

          PERDIDAS_DATA =
            data;

        }


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
        // CREAR CAPA
        // =============================================

        if (
          !map.getLayer(
            layerId
          )
        ) {


          // ===========================================
          // CAPA DE LÍNEA
          // ===========================================

          if (
            type ===
            'line'
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
                  color,

                'line-width':
                  width,

                'line-opacity':
                  opacity

              }

            });

          }


          // ===========================================
          // CAPA DE POLÍGONO
          // ===========================================

          else {

            map.addLayer({

              id:
                layerId,

              type:
                'fill',

              source:
                sourceId,

              minzoom:
                10,

              paint: {

                'fill-color':
                  color,

                'fill-opacity':
                  opacity,

                'fill-outline-color':
                  outline

              }

            });

          }

        }


        // =============================================
        // POPUP POR CLICK
        // =============================================

        bindClickPopup(
          layerId,
          popupFields
        );

      }

    )


    // =================================================
    // ERROR
    // =================================================

    .catch(
      (err) => {

        console.error(

          `Error cargando ${geojsonFile}:`,

          err

        );

      }
    );

}
// =====================================================
// PARTE 3 — FINAL
// CARGA DE CAPAS + ORDEN FINAL
// =====================================================

map.on(
  'style.load',
  () => {


    // =================================================
    // 1. LÍMITE MUNICIPAL
    // =================================================
    //
    // Esta capa además activa automáticamente
    // el zoom inicial a toda la extensión de Sesquilé.
    //
    // =================================================

    addLayer({

      geojsonFile:
        'Limite_sesquile.geojson',

      sourceId:
        'limite_municipal',

      layerId:
        'limite_municipal_layer',

      type:
        'line',

      color:
        '#ffffff',

      width:
        2,

      opacity:
        0.90,

      popupFields:
        null

    });


    // =================================================
    // 2. OPORTUNIDAD DE CARBONO
    // BOSQUE ACTUAL
    // =================================================

    addLayer({

      geojsonFile:
        'bosque_actual_final_ajustado_UNIDO.geojson',

      sourceId:
        'oportunidad',

      layerId:
        'oportunidad_layer',

      type:
        'fill',

      // Verde/turquesa
      color:
        '#2ec4b6',

      // Transparencia para poder apreciar
      // la imagen satelital debajo.
      opacity:
        0.55,

      outline:
        '#ffffff',

      popupFields:
        POPUP_OPORTUNIDAD_FIELDS

    });


    // =================================================
    // 3. PÉRDIDA DE BOSQUE / CARBONO
    // =================================================

    addLayer({

      geojsonFile:
        'perdida_bosque_con_carbono_2001_2024.geojson',

      sourceId:
        'perdidas',

      layerId:
        'perdidas_layer',

      type:
        'fill',

      // Rojo
      color:
        '#ff595e',

      opacity:
        0.60,

      outline:
        '#ffffff',

      popupFields:
        POPUP_PERDIDAS_FIELDS

    });


    // =================================================
    // 4. LÍMITE URBANO
    // =================================================

    addLayer({

      geojsonFile:
        'LIMITE_URBANO_SESQUILE.geojson',

      sourceId:
        'limite_urbano',

      layerId:
        'limite_urbano_layer',

      type:
        'line',

      // Amarillo
      color:
        '#ffd166',

      width:
        2,

      opacity:
        1,

      popupFields:
        null

    });


    // =================================================
    // ORDENAR CAPAS
    // =================================================
    //
    // Como los GeoJSON se cargan de forma asíncrona,
    // esperamos brevemente a que las capas existan.
    //
    // Orden visual deseado:
    //
    // Oportunidad
    // Pérdidas
    // Límite municipal
    // Límite urbano
    //
    // Los límites quedan encima de los polígonos.
    //
    // =================================================

    setTimeout(
      () => {


        try {


          // ===========================================
          // OPORTUNIDAD
          // ===========================================

          if (
            map.getLayer(
              'oportunidad_layer'
            )
          ) {

            map.moveLayer(
              'oportunidad_layer'
            );

          }


          // ===========================================
          // PÉRDIDAS
          // ===========================================

          if (
            map.getLayer(
              'perdidas_layer'
            )
          ) {

            map.moveLayer(
              'perdidas_layer'
            );

          }


          // ===========================================
          // LÍMITE MUNICIPAL
          // ===========================================

          if (
            map.getLayer(
              'limite_municipal_layer'
            )
          ) {

            map.moveLayer(
              'limite_municipal_layer'
            );

          }


          // ===========================================
          // LÍMITE URBANO
          // ===========================================

          if (
            map.getLayer(
              'limite_urbano_layer'
            )
          ) {

            map.moveLayer(
              'limite_urbano_layer'
            );

          }


        } catch (error) {


          console.error(

            'Error organizando las capas:',

            error

          );

        }

      },

      700

    );

  }

);
