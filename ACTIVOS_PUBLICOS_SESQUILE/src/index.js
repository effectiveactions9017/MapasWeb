// =====================================================
// ✅ Visor Predios Públicos – Sesquilé
// =====================================================
// 🔵 Base: Predios municipio de Sesquilé
// 🟢 Interactiva: Predios públicos Sesquilé
// 🟡 Highlight: Predio seleccionado
//
// MEJORAS:
// ✅ Mapa base satelital
// ✅ Líneas prediales más delgadas
// ✅ Zoom inicial a la extensión de predios públicos
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";


// =====================================================
// MAPA
// =====================================================

const map =
  new mapboxgl.Map({

    container:
      "map",

    // 🛰️ MAPA SATELITAL
    style:
      "mapbox://styles/mapbox/satellite-streets-v12",

    // Posición temporal mientras carga la capa
    // de predios públicos.
    center:
      [-73.79724, 5.04463],

    zoom:
      12,

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
// POPUP
// =====================================================

const popup =
  new mapboxgl.Popup({

    closeButton:
      true,

    closeOnClick:
      true,

    className:
      "custom-popup"

  });


// =====================================================
// DATASETS
// =====================================================

let PUBLICOS_DATA =
  null;


// =====================================================
// CONTROL DEL ZOOM INICIAL
// =====================================================

let ZOOM_INICIAL_REALIZADO =
  false;


// =====================================================
// CONFIGURACIÓN DEL POPUP
// =====================================================
//
// Se conserva exactamente la información que tenía
// el visor original.
//
// =====================================================

const CAMPOS_POPUP = [

  {
    key:
      "codigo",

    label:
      "Código predial"
  },

  {
    key:
      "NOMBRE",

    label:
      "Nombre"
  },

  {
    key:
      "DESTINO_ECONOMICO",

    label:
      "Destino económico"
  }

];


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function norm(v) {

  return (
    v ??
    ""
  )

    .toString()

    .toLowerCase()

    .replace(
      /\s+/g,
      ""
    )

    .trim();

}


// =====================================================
// QUITAR EVENTOS ANTERIORES
// =====================================================

function safeOff(
  evt,
  layer
) {

  try {

    map.off(
      evt,
      layer
    );

  } catch (e) {}

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
// POPUP DE PREDIO PÚBLICO
// =====================================================

function popupHTML(
  props,
  center
) {

  props =
    props || {};


  // ===================================================
  // CONSTRUIR CAMPOS
  // ===================================================

  const rows =

    CAMPOS_POPUP

      .map(
        ({
          key,
          label
        }) => {


          let v =
            props[key];


          if (
            v === null ||
            v === undefined ||
            v === ""
          ) {

            v =
              "N/A";

          }


          return (

            `<strong>${label}:</strong> ${v}`

          );

        }

      )

      .join(
        "<br>"
      );


  // ===================================================
  // HTML DEL POPUP
  // ===================================================

  return `

    <div
      style="
        font-weight:700;
        margin-bottom:6px;
      "
    >

      Predio público

    </div>


    ${rows}


    <div
      style="
        margin-top:10px;
      "
    >

      <a
        href="${streetViewUrl(center)}"

        target="_blank"

        rel="noopener"

        style="
          display:inline-block;
          padding:6px 10px;
          background:#00bcd4;
          color:#000;
          font-weight:700;
          border-radius:6px;
          text-decoration:none;
          font-size:12px;
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

}
// =====================================================
// PARTE 2
// PREDIOS BASE + PREDIOS PÚBLICOS + ZOOM INICIAL
// =====================================================


// =====================================================
// CAPA BASE
// PREDIOS MUNICIPIO DE SESQUILÉ
// SOLO CONTORNO
// =====================================================

function addBaseOutlineLayer() {

  fetch(
    "../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson"
  )

    .then(
      (r) => r.json()
    )

    .then(
      (data) => {


        // =============================================
        // SOURCE
        // =============================================

        if (
          map.getSource(
            "predios_base"
          )
        ) {

          map
            .getSource(
              "predios_base"
            )
            .setData(
              data
            );

        } else {

          map.addSource(

            "predios_base",

            {

              type:
                "geojson",

              data:
                data

            }

          );

        }


        // =============================================
        // CONTORNO DE PREDIOS
        // =============================================
        //
        // Antes:
        // line-width = 1.2
        //
        // Ahora:
        // line-width = 0.6
        //
        // También reducimos ligeramente la intensidad
        // para que el satélite se pueda apreciar mejor.
        //
        // =============================================

        if (
          !map.getLayer(
            "predios_base_outline"
          )
        ) {

          map.addLayer({

            id:
              "predios_base_outline",

            type:
              "line",

            source:
              "predios_base",

            paint: {

              "line-color":
                "#ffffff",

              "line-width":
                0.6,

              "line-opacity":
                0.50

            }

          });

        }

      }

    )


    .catch(
      (error) => {

        console.error(

          "Error cargando predios base:",

          error

        );

      }
    );

}


// =====================================================
// CAPA DE PREDIOS PÚBLICOS
// =====================================================

function addPublicosLayer() {

  fetch(
    "../src/data/PREDIOS_PUBLICOS_SESQUILE.geojson"
  )

    .then(
      (r) => r.json()
    )

    .then(
      (data) => {


        // =============================================
        // GUARDAR DATASET
        // =============================================

        PUBLICOS_DATA =
          data;


        // =============================================
        // SOURCE
        // =============================================

        if (
          map.getSource(
            "predios_publicos"
          )
        ) {

          map
            .getSource(
              "predios_publicos"
            )
            .setData(
              data
            );

        } else {

          map.addSource(

            "predios_publicos",

            {

              type:
                "geojson",

              data:
                data

            }

          );

        }


        // =============================================
        // CAPA DE PREDIOS PÚBLICOS
        // =============================================
        //
        // Conservamos el verde original.
        //
        // Bajamos un poco la opacidad para que,
        // sobre el satélite, se pueda identificar
        // mejor si se trata de parque, plaza,
        // edificio, cancha, etc.
        //
        // =============================================

        if (
          !map.getLayer(
            "predios_publicos_layer"
          )
        ) {

          map.addLayer({

            id:
              "predios_publicos_layer",

            type:
              "fill",

            source:
              "predios_publicos",

            paint: {

              "fill-color":
                "#2ec4b6",

              "fill-opacity":
                0.50,

              "fill-outline-color":
                "#ffffff"

            }

          });

        }


        // =============================================
        // ZOOM INICIAL A LOS PREDIOS PÚBLICOS
        // =============================================

        if (

          !ZOOM_INICIAL_REALIZADO &&

          data &&

          Array.isArray(
            data.features
          ) &&

          data.features.length > 0

        ) {

          try {


            // Calcula:
            // oeste, sur, este, norte
            const bbox =
              turf.bbox(
                data
              );


            if (

              Array.isArray(
                bbox
              ) &&

              bbox.length === 4 &&

              bbox.every(
                Number.isFinite
              )

            ) {


              map.fitBounds(

                bbox,

                {

                  // Espacio entre los activos
                  // y los bordes de la pantalla
                  padding:
                    50,

                  // Movimiento suave
                  duration:
                    1200,

                  // Evita acercarse demasiado
                  // si la extensión fuera pequeña
                  maxZoom:
                    17

                }

              );


              ZOOM_INICIAL_REALIZADO =
                true;

            }


          } catch (error) {


            console.error(

              "Error ajustando zoom a predios públicos:",

              error

            );

          }

        }


        // =============================================
        // LIMPIAR EVENTOS ANTERIORES
        // =============================================

        safeOff(
          "mouseenter",
          "predios_publicos_layer"
        );


        safeOff(
          "mouseleave",
          "predios_publicos_layer"
        );


        safeOff(
          "click",
          "predios_publicos_layer"
        );


        // =============================================
        // CURSOR
        // =============================================

        map.on(

          "mouseenter",

          "predios_publicos_layer",

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              "pointer";

          }

        );


        map.on(

          "mouseleave",

          "predios_publicos_layer",

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              "";

          }

        );


        // =============================================
        // CLICK SOBRE PREDIO PÚBLICO
        // =============================================

        map.on(

          "click",

          "predios_publicos_layer",

          (e) => {


            const f =

              e.features &&

              e.features[0];


            if (
              !f
            ) {

              return;

            }


            // =========================================
            // CENTRO DEL POLÍGONO
            // =========================================

            const center =

              turf
                .centroid(f)
                .geometry
                .coordinates;


            // =========================================
            // POPUP
            // =========================================

            popup

              .setLngLat(
                center
              )

              .setHTML(

                popupHTML(

                  f.properties || {},

                  center

                )

              )

              .addTo(map);


            // =========================================
            // ACTUALIZAR HIGHLIGHT
            // =========================================

            const highlight =
              map.getSource(
                "highlight"
              );


            if (
              highlight
            ) {

              highlight.setData({

                type:
                  "FeatureCollection",

                features:
                  [f]

              });

            }

          }

        );

      }

    )


    .catch(
      (error) => {

        console.error(

          "Error cargando predios públicos:",

          error

        );

      }
    );

}
// =====================================================
// PARTE 3 — FINAL
// HIGHLIGHT + BUSCADOR + CARGA FINAL
// =====================================================


// =====================================================
// HIGHLIGHT DEL PREDIO SELECCIONADO
// =====================================================

function addHighlight() {


  // ===================================================
  // SOURCE
  // ===================================================

  if (
    !map.getSource(
      "highlight"
    )
  ) {

    map.addSource(

      "highlight",

      {

        type:
          "geojson",

        data: {

          type:
            "FeatureCollection",

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
      "highlight_fill"
    )
  ) {

    map.addLayer({

      id:
        "highlight_fill",

      type:
        "fill",

      source:
        "highlight",

      paint: {

        "fill-color":
          "#ffff00",

        "fill-opacity":
          0.25

      }

    });

  }


  // ===================================================
  // CONTORNO AMARILLO
  // ===================================================

  if (
    !map.getLayer(
      "highlight_line"
    )
  ) {

    map.addLayer({

      id:
        "highlight_line",

      type:
        "line",

      source:
        "highlight",

      paint: {

        "line-color":
          "#ffff00",

        "line-width":
          2

      }

    });

  }

}


// =====================================================
// BUSCADOR LOCAL
// SOLO PREDIOS PÚBLICOS
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
      "Buscar predio público",


    // =================================================
    // FUNCIÓN DE BÚSQUEDA
    // =================================================

    localGeocoder:
      (q) => {


        const query =
          norm(q);


        if (
          !query ||
          !PUBLICOS_DATA ||
          !Array.isArray(
            PUBLICOS_DATA.features
          )
        ) {

          return [];

        }


        return PUBLICOS_DATA.features


          // ===========================================
          // BUSCAR
          // ===========================================

          .filter(
            (f) => {


              const props =
                f.properties || {};


              return (

                norm(
                  props.codigo
                ).includes(
                  query
                )

                ||

                norm(
                  props.NOMBRE
                ).includes(
                  query
                )

                ||

                norm(
                  props.DESTINO_ECONOMICO
                ).includes(
                  query
                )

              );

            }

          )


          // Máximo 10 resultados
          .slice(
            0,
            10
          )


          // ===========================================
          // CONVERTIR A RESULTADOS DEL GEOCODER
          // ===========================================

          .map(
            (f) => {


              const props =
                f.properties || {};


              const center =

                turf

                  .centroid(f)

                  .geometry

                  .coordinates;


              return {

                type:
                  "Feature",

                geometry:
                  f.geometry,

                center:
                  center,

                place_name:

                  `${
                    props.codigo ??
                    "N/A"
                  } | ${
                    props.NOMBRE ??
                    "N/A"
                  }`,

                text:

                  (
                    props.codigo ??
                    props.NOMBRE ??
                    "Predio público"
                  )

                    .toString(),

                properties:
                  props,

                place_type:
                  ["place"]

              };

            }

          );

      }

  });


// =====================================================
// AGREGAR BUSCADOR AL MAPA
// =====================================================

map.addControl(

  geocoder,

  "top-left"

);


// =====================================================
// RESULTADO DEL BUSCADOR
// =====================================================

geocoder.on(

  "result",

  (e) => {


    const f =
      e.result;


    if (
      !f
    ) {

      return;

    }


    // =================================================
    // CENTRO
    // =================================================

    const center =

      f.center ||

      turf
        .centroid(f)
        .geometry
        .coordinates;


    // =================================================
    // HIGHLIGHT
    // =================================================

    const highlight =
      map.getSource(
        "highlight"
      );


    if (
      highlight
    ) {

      highlight.setData({

        type:
          "FeatureCollection",

        features:
          [f]

      });

    }


    // =================================================
    // ZOOM AL PREDIO ENCONTRADO
    // =================================================

    try {


      const bbox =
        turf.bbox(
          f
        );


      map.fitBounds(

        bbox,

        {

          padding:
            60,

          maxZoom:
            18,

          duration:
            800

        }

      );


    } catch (error) {


      map.flyTo({

        center:
          center,

        zoom:
          18

      });

    }


    // =================================================
    // POPUP
    // =================================================

    popup

      .setLngLat(
        center
      )

      .setHTML(

        popupHTML(

          f.properties || {},

          center

        )

      )

      .addTo(map);

  }

);


// =====================================================
// CARGA FINAL
// =====================================================

map.on(

  "style.load",

  () => {


    // =================================================
    // 1. PREDIOS MUNICIPALES
    // =================================================

    addBaseOutlineLayer();


    // =================================================
    // 2. PREDIOS / ACTIVOS PÚBLICOS
    //
    // Esta función también realiza el zoom inicial
    // a toda la extensión de los activos públicos.
    // =================================================

    addPublicosLayer();


    // =================================================
    // 3. HIGHLIGHT
    // =================================================

    addHighlight();


    // =================================================
    // ORDENAR LAS CAPAS
    // =================================================

    setTimeout(

      () => {


        try {


          // ===========================================
          // PREDIOS MUNICIPALES ABAJO
          // ===========================================

          if (
            map.getLayer(
              "predios_base_outline"
            )
          ) {

            map.moveLayer(
              "predios_base_outline"
            );

          }


          // ===========================================
          // ACTIVOS PÚBLICOS ENCIMA
          // ===========================================

          if (
            map.getLayer(
              "predios_publicos_layer"
            )
          ) {

            map.moveLayer(
              "predios_publicos_layer"
            );

          }


          // ===========================================
          // HIGHLIGHT SIEMPRE ARRIBA
          // ===========================================

          if (
            map.getLayer(
              "highlight_fill"
            )
          ) {

            map.moveLayer(
              "highlight_fill"
            );

          }


          if (
            map.getLayer(
              "highlight_line"
            )
          ) {

            map.moveLayer(
              "highlight_line"
            );

          }


        } catch (error) {


          console.error(

            "Error organizando las capas:",

            error

          );

        }

      },

      500

    );

  }

);
