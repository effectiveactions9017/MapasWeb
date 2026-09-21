// =====================================================
// ✅ Visor Contribuyentes Sesquilé
// ✅ SOLO PUNTOS: Persona Natural + Persona Jurídica
// ✅ Mapa base SATELITAL
// ✅ Zoom inicial automático a contribuyentes
// ✅ Predios base: solo contorno
// ✅ Puntos más pequeños
// ✅ Popup simplificado SIN código predial
// ✅ Street View
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";


// =====================================================
// COLORES
// =====================================================

const COLOR_NATURAL =
  "#2ec4b6"; // Verde


const COLOR_JURIDICO =
  "#ff006e"; // Rojo


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

    // Vista temporal mientras cargan los puntos
    center:
      [-73.79724, 5.04463],

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
// CONTROLES DE NAVEGACIÓN
// =====================================================

map.addControl(
  new mapboxgl.NavigationControl()
);


// =====================================================
// POPUP
// =====================================================

let popup =
  new mapboxgl.Popup({

    closeButton:
      true,

    closeOnClick:
      true,

    className:
      "custom-popup"

  });


// =====================================================
// DATASETS PARA EL BUSCADOR
// =====================================================

let PERSONA_NATURAL_DATA =
  null;


let PERSONA_JURIDICA_DATA =
  null;


// =====================================================
// CONTROL DE ZOOM INICIAL
// =====================================================
//
// Esperaremos a que carguen Natural + Jurídica.
// Luego calcularemos la extensión conjunta.
//
// =====================================================

let NATURAL_CARGADO =
  false;


let JURIDICA_CARGADO =
  false;


let ZOOM_INICIAL_REALIZADO =
  false;


// =====================================================
// CAMPOS DEL POPUP
// =====================================================
//
// IMPORTANTE:
// Código predial fue eliminado.
//
// =====================================================

const CAMPOS_POPUP = [

  {
    key:
      "No Documento",

    label:
      "Número documento"
  },

  {
    key:
      "Nombre del contribuyente",

    label:
      "Contribuyente"
  },

  {
    key:
      "Naturaleza Juridica",

    label:
      "Naturaleza jurídica"
  },

  {
    key:
      "Razon Social",

    label:
      "Razón social"
  },

  {
    key:
      "Estado",

    label:
      "Estado"
  }

];


// =====================================================
// QUITAR EVENTOS ANTERIORES
// =====================================================

function safeOff(
  eventName,
  layerId
) {

  try {

    map.off(
      eventName,
      layerId
    );

  } catch (e) {}

}


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
// OBTENER COORDENADA DEL PUNTO
// =====================================================

function getPointLngLat(
  feature
) {


  const c =
    feature?.geometry?.coordinates;


  if (
    Array.isArray(c) &&
    c.length >= 2
  ) {

    return [

      Number(c[0]),

      Number(c[1])

    ];

  }


  try {


    const cent =

      turf

        .centroid(feature)

        .geometry

        .coordinates;


    return [

      Number(cent[0]),

      Number(cent[1])

    ];


  } catch (error) {


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

function popupHTMLCamposSeleccionados(
  props,
  titulo = "Información",
  lngLatForSV = null
) {


  if (
    !props
  ) {

    props = {};

  }


  // ===================================================
  // CONSTRUIR FILAS
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
  // STREET VIEW
  // ===================================================

  const svBtn =

    lngLatForSV

      ? `

        <div style="margin-top:10px;">

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

      `

      : "";


  // ===================================================
  // HTML FINAL
  // ===================================================

  return `

    <div
      style="
        font-weight:700;
        margin-bottom:6px;
      "
    >

      ${titulo}

    </div>


    ${rows}


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
// QUITAR LEYENDA INYECTADA SI EXISTE
// =====================================================
//
// Seguimos usando únicamente la leyenda del HTML.
//
// =====================================================

function removeInjectedLegendIfExists() {

  const old =
    document.getElementById(
      "ea-legend"
    );


  if (
    old
  ) {

    old.remove();

  }

}


// =====================================================
// ZOOM INICIAL A TODOS LOS CONTRIBUYENTES
// =====================================================

function ajustarZoomInicialContribuyentes() {


  // Esperar ambas capas
  if (
    !NATURAL_CARGADO ||
    !JURIDICA_CARGADO ||
    ZOOM_INICIAL_REALIZADO
  ) {

    return;

  }


  const features =
    [];


  // ===================================================
  // NATURALES
  // ===================================================

  if (
    PERSONA_NATURAL_DATA &&
    Array.isArray(
      PERSONA_NATURAL_DATA.features
    )
  ) {

    features.push(
      ...PERSONA_NATURAL_DATA.features
    );

  }


  // ===================================================
  // JURÍDICOS
  // ===================================================

  if (
    PERSONA_JURIDICA_DATA &&
    Array.isArray(
      PERSONA_JURIDICA_DATA.features
    )
  ) {

    features.push(
      ...PERSONA_JURIDICA_DATA.features
    );

  }


  if (
    !features.length
  ) {

    return;

  }


  // ===================================================
  // FEATURE COLLECTION
  // ===================================================

  const fc = {

    type:
      "FeatureCollection",

    features:
      features

  };


  // ===================================================
  // FIT BOUNDS
  // ===================================================

  try {


    const bounds =
      turf.bbox(
        fc
      );


    if (
      Array.isArray(bounds) &&
      bounds.length === 4 &&
      bounds.every(
        Number.isFinite
      )
    ) {


      map.fitBounds(

        bounds,

        {

          padding:
            55,

          duration:
            1200,

          maxZoom:
            17

        }

      );


      ZOOM_INICIAL_REALIZADO =
        true;

    }


  } catch (error) {


    console.error(

      "Error ajustando zoom inicial a contribuyentes:",

      error

    );

  }

}
// =====================================================
// CAPA BASE DE PREDIOS
// SOLO CONTORNO - SIN RELLENO
// =====================================================

function addBaseOutlineLayer(
  geojsonFile,
  sourceId,
  layerId,
  lineColor = "#ffffff"
) {

  fetch(
    `../src/data/${geojsonFile}`
  )

    .then(
      (r) => r.json()
    )

    .then((data) => {


      // =================================================
      // SOURCE
      // =================================================

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
              "geojson",

            data:
              data

          }

        );

      }


      // =================================================
      // CONTORNO PREDIAL
      // =================================================
      //
      // Antes:
      // minzoom: 12
      // line-width: 1.2
      // line-opacity: 0.9
      //
      // Ahora:
      // SIN minzoom
      // line-width: 0.6
      // line-opacity: 0.50
      //
      // =================================================

      if (
        !map.getLayer(
          layerId
        )
      ) {

        map.addLayer({

          id:
            layerId,

          source:
            sourceId,

          type:
            "line",

          paint: {

            "line-color":
              lineColor,

            "line-width":
              0.6,

            "line-opacity":
              0.50

          }

        });

      }

    })


    .catch(
      (err) => {

        console.error(
          "Error cargando capa base:",
          err
        );

      }
    );

}


// =====================================================
// CAPAS DE PUNTOS INTERACTIVAS
// Persona Natural + Persona Jurídica
// =====================================================

function addInteractivePointLayer({

  geojsonFile,

  sourceId,

  layerId,

  color,

  datasetKey

}) {


  fetch(
    `../src/data/${geojsonFile}`
  )

    .then(
      (r) => r.json()
    )

    .then((data) => {


      // =================================================
      // GUARDAR DATASET
      // =================================================

      if (
        datasetKey ===
        "PERSONA_NATURAL"
      ) {

        PERSONA_NATURAL_DATA =
          data;


        NATURAL_CARGADO =
          true;

      }


      if (
        datasetKey ===
        "PERSONA_JURIDICA"
      ) {

        PERSONA_JURIDICA_DATA =
          data;


        JURIDICA_CARGADO =
          true;

      }


      // =================================================
      // SOURCE
      // =================================================

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
              "geojson",

            data:
              data

          }

        );

      }


      // =================================================
      // CAPA DE PUNTOS
      // =================================================
      //
      // Antes:
      // circle-radius: 6
      // circle-stroke-width: 1.5
      //
      // Ahora:
      // circle-radius: 4
      // circle-stroke-width: 0.75
      //
      // =================================================

      if (
        !map.getLayer(
          layerId
        )
      ) {

        map.addLayer({

          id:
            layerId,

          type:
            "circle",

          source:
            sourceId,

          paint: {

            "circle-radius":
              4,

            "circle-color":
              color,

            "circle-stroke-width":
              0.75,

            "circle-stroke-color":
              "#ffffff",

            "circle-opacity":
              0.95

          }

        });

      }


      // =================================================
      // INTENTAR ZOOM INICIAL
      // =================================================
      //
      // Esta función solamente actuará cuando
      // Natural Y Jurídica hayan terminado de cargar.
      //
      // =================================================

      ajustarZoomInicialContribuyentes();


      // =================================================
      // LIMPIAR EVENTOS ANTERIORES
      // =================================================

      safeOff(
        "mouseenter",
        layerId
      );


      safeOff(
        "mouseleave",
        layerId
      );


      safeOff(
        "click",
        layerId
      );


      // =================================================
      // CURSOR AL ENTRAR
      // =================================================

      map.on(

        "mouseenter",

        layerId,

        () => {

          map
            .getCanvas()
            .style
            .cursor =
            "pointer";

        }

      );


      // =================================================
      // CURSOR AL SALIR
      // =================================================

      map.on(

        "mouseleave",

        layerId,

        () => {

          map
            .getCanvas()
            .style
            .cursor =
            "";

        }

      );


      // =================================================
      // CLICK SOBRE CONTRIBUYENTE
      // =================================================

      map.on(

        "click",

        layerId,

        (e) => {


          const f =

            e.features &&

            e.features[0];


          if (
            !f
          ) {

            return;

          }


          const props =
            f.properties || {};


          const lngLat =
            getPointLngLat(
              f
            );


          // =============================================
          // ACTUALIZAR SELECCIÓN
          // =============================================

          const hl =
            map.getSource(
              "point_highlight"
            );


          if (
            hl
          ) {

            hl.setData({

              type:
                "FeatureCollection",

              features:
                [f]

            });

          }


          // =============================================
          // TÍTULO DEL POPUP
          // =============================================

          const titulo =

            datasetKey ===
            "PERSONA_NATURAL"

              ? "Persona natural"

              : datasetKey ===
                "PERSONA_JURIDICA"

                ? "Persona jurídica"

                : "Información";


          // =============================================
          // MOSTRAR POPUP
          // =============================================

          popup

            .setLngLat(
              lngLat
            )

            .setHTML(

              popupHTMLCamposSeleccionados(

                props,

                titulo,

                lngLat

              )

            )

            .addTo(map);

        }

      );

    })


    .catch(
      (err) => {

        console.error(
          "Error cargando capa de puntos:",
          err
        );

      }
    );

}
// =====================================================
// PARTE 3A
// HIGHLIGHT + CONTROLES DE VISUALIZACIÓN
// =====================================================


// =====================================================
// HIGHLIGHT
// SOLO PARA PUNTOS
// =====================================================

function ensureHighlightLayers() {


  // ===================================================
  // SOURCE DEL ELEMENTO SELECCIONADO
  // ===================================================

  if (
    !map.getSource(
      "point_highlight"
    )
  ) {

    map.addSource(

      "point_highlight",

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
  // CAPA DEL ELEMENTO SELECCIONADO
  // ===================================================
  //
  // Antes:
  // circle-radius: 11
  // circle-stroke-width: 4
  //
  // Ahora:
  // circle-radius: 7
  // circle-stroke-width: 2
  //
  // ===================================================

  if (
    !map.getLayer(
      "point_highlight_circle"
    )
  ) {

    map.addLayer({

      id:
        "point_highlight_circle",

      type:
        "circle",

      source:
        "point_highlight",

      paint: {

        "circle-radius":
          7,

        "circle-color":
          "#ffff00",

        "circle-opacity":
          0.30,

        "circle-stroke-width":
          2,

        "circle-stroke-color":
          "#ffff00"

      }

    });

  }

}


// =====================================================
// LIMPIAR ELEMENTO SELECCIONADO
// =====================================================

function clearPointHighlight() {


  const source =
    map.getSource(
      "point_highlight"
    );


  if (
    source
  ) {

    source.setData({

      type:
        "FeatureCollection",

      features:
        []

    });

  }

}


// =====================================================
// IDs DE LAS CAPAS
// =====================================================

const LAYERS = {

  PERSONA_NATURAL:
    "persona_natural_layer",

  PERSONA_JURIDICO:
    "persona_juridica_layer"

};


// =====================================================
// MOSTRAR / OCULTAR CAPA
// =====================================================

function setLayerVisibility(
  layerId,
  visible
) {


  if (
    !map.getLayer(
      layerId
    )
  ) {

    return;

  }


  map.setLayoutProperty(

    layerId,

    "visibility",

    visible
      ? "visible"
      : "none"

  );

}


// =====================================================
// CONTROLES DE VISUALIZACIÓN
// =====================================================
//
// IMPORTANTE:
//
// Aquí NO generamos texto adicional.
//
// Únicamente conectamos los checkbox que ya existen
// en tu HTML:
//
// toggle_persona_natural
// toggle_persona_juridica
//
// =====================================================

function wireLayerControls() {


  const cbPerNat =
    document.getElementById(
      "toggle_persona_natural"
    );


  const cbPerJur =
    document.getElementById(
      "toggle_persona_juridica"
    );


  // ===================================================
  // SI LOS CHECKBOX NO EXISTEN
  // ===================================================

  if (
    !cbPerNat ||
    !cbPerJur
  ) {

    return;

  }


  // ===================================================
  // APLICAR VISIBILIDAD
  // ===================================================

  const apply =
    () => {


      // ===============================================
      // PERSONA NATURAL
      // ===============================================

      setLayerVisibility(

        LAYERS.PERSONA_NATURAL,

        cbPerNat.checked

      );


      // ===============================================
      // PERSONA JURÍDICA
      // ===============================================

      setLayerVisibility(

        LAYERS.PERSONA_JURIDICO,

        cbPerJur.checked

      );


      // ===============================================
      // QUITAR SELECCIÓN ANTERIOR
      //
      // Esto evita que quede un punto amarillo
      // seleccionado perteneciente a una capa
      // que acaba de ser ocultada.
      // ===============================================

      clearPointHighlight();


      // ===============================================
      // CERRAR POPUP
      // ===============================================

      try {

        popup.remove();

      } catch (e) {}

    };


  // ===================================================
  // EVENTOS CHECKBOX
  // ===================================================

  cbPerNat.addEventListener(

    "change",

    apply

  );


  cbPerJur.addEventListener(

    "change",

    apply

  );


  // ===================================================
  // APLICAR ESTADO INICIAL
  // ===================================================

  apply();

}
// =====================================================
// PARTE 3B
// BUSCADOR LOCAL
// SOLO PERSONA NATURAL + PERSONA JURÍDICA
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
      "Buscar por código, documento o contribuyente",


    // =================================================
    // FUNCIÓN DE BÚSQUEDA
    // =================================================

    localGeocoder:
      function (query) {


        const q =

          (query || "")

            .toString()

            .toLowerCase()

            .trim();


        if (
          !q
        ) {

          return [];

        }


        const results =
          [];


        // =============================================
        // FUNCIÓN PARA RECORRER CADA DATASET
        // =============================================

        function scan(
          fc,
          datasetTag
        ) {


          const feats =

            fc &&
            Array.isArray(
              fc.features
            )

              ? fc.features

              : [];


          feats.forEach(
            (feature) => {


              const p =
                feature.properties ||
                {};


              // =======================================
              // CAMPOS DE BÚSQUEDA
              // =======================================

              const cod =

                (
                  p["codigo"] ??
                  ""
                )

                  .toString()

                  .toLowerCase();


              const doc =

                (
                  p["No Documento"] ??
                  ""
                )

                  .toString()

                  .toLowerCase();


              const nom =

                (
                  p["Nombre del contribuyente"] ??
                  ""
                )

                  .toString()

                  .toLowerCase();


              const razon =

                (
                  p["Razon Social"] ??
                  ""
                )

                  .toString()

                  .toLowerCase();


              // =======================================
              // COINCIDENCIA
              // =======================================

              const match =

                (
                  cod &&
                  cod.includes(q)
                )

                ||

                (
                  doc &&
                  doc.includes(q)
                )

                ||

                (
                  nom &&
                  nom.includes(q)
                )

                ||

                (
                  razon &&
                  razon.includes(q)
                );


              if (
                !match
              ) {

                return;

              }


              // =======================================
              // IDENTIFICAR CAMPO DE COINCIDENCIA
              // =======================================

              let matchField =
                null;


              let matchValue =
                null;


              // Código
              if (
                cod &&
                cod.includes(q)
              ) {

                matchField =
                  "codigo";

                matchValue =

                  (
                    p["codigo"] ??
                    ""
                  )

                    .toString()

                    .trim();

              }


              // Documento
              else if (
                doc &&
                doc.includes(q)
              ) {

                matchField =
                  "No Documento";

                matchValue =

                  (
                    p["No Documento"] ??
                    ""
                  )

                    .toString()

                    .trim();

              }


              // Nombre
              else if (
                nom &&
                nom.includes(q)
              ) {

                matchField =
                  "Nombre del contribuyente";

                matchValue =

                  (
                    p["Nombre del contribuyente"] ??
                    ""
                  )

                    .toString()

                    .trim();

              }


              // Razón social
              else if (
                razon &&
                razon.includes(q)
              ) {

                matchField =
                  "Razon Social";

                matchValue =

                  (
                    p["Razon Social"] ??
                    ""
                  )

                    .toString()

                    .trim();

              }


              // =======================================
              // PROPIEDADES DEL RESULTADO
              // =======================================

              const props2 = {

                ...p,

                __dataset:
                  datasetTag,

                __matchField:
                  matchField,

                __matchValue:
                  matchValue

              };


              // =======================================
              // CENTRO
              // =======================================

              const center =
                getPointLngLat(
                  feature
                );


              // =======================================
              // TEXTOS PARA RESULTADO
              // =======================================

              const documentoTxt =

                (
                  p["No Documento"] ??
                  "N/A"
                )

                  .toString();


              const nombreTxt =

                (
                  p["Nombre del contribuyente"] ??

                  p["Razon Social"] ??

                  "N/A"
                )

                  .toString();


              // =======================================
              // AGREGAR RESULTADO
              //
              // IMPORTANTE:
              // Ya no mostramos el código predial
              // como texto principal del resultado.
              // =======================================

              results.push({

                type:
                  "Feature",

                geometry:
                  feature.geometry,

                properties:
                  props2,

                place_name:

                  `${
                    datasetTag ===
                    "PERSONA_NATURAL"

                      ? "Persona natural"

                      : "Persona jurídica"
                  } | ` +

                  `Documento: ${documentoTxt} | ` +

                  `${nombreTxt}`,

                text:
                  nombreTxt,

                center:
                  center,

                place_type:
                  ["place"]

              });

            }

          );

        }


        // =============================================
        // BUSCAR EN PERSONA NATURAL
        // =============================================

        scan(

          PERSONA_NATURAL_DATA,

          "PERSONA_NATURAL"

        );


        // =============================================
        // BUSCAR EN PERSONA JURÍDICA
        // =============================================

        scan(

          PERSONA_JURIDICA_DATA,

          "PERSONA_JURIDICA"

        );


        // =============================================
        // MÁXIMO 10 RESULTADOS
        // =============================================

        return (
          results.slice(
            0,
            10
          )
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
// PARTE 4 — FINAL
// CARGA DE CAPAS + RESULTADO DEL BUSCADOR
// =====================================================


// =====================================================
// CARGA DE CAPAS
// =====================================================

map.on(
  "style.load",
  () => {


    // =================================================
    // QUITAR LEYENDA INYECTADA
    // =================================================

    removeInjectedLegendIfExists();


    // =================================================
    // 1. PREDIOS BASE
    // =================================================

    addBaseOutlineLayer(

      "PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson",

      "predios_base",

      "predios_base_outline",

      "#ffffff"

    );


    // =================================================
    // 2. PERSONA NATURAL
    // =================================================

    addInteractivePointLayer({

      geojsonFile:
        "Contribuyentes_Persona_Natural.geojson",

      sourceId:
        "persona_natural",

      layerId:
        "persona_natural_layer",

      color:
        COLOR_NATURAL,

      datasetKey:
        "PERSONA_NATURAL"

    });


    // =================================================
    // 3. PERSONA JURÍDICA
    // =================================================

    addInteractivePointLayer({

      geojsonFile:
        "Contribuyentes_Persona_Juridica.geojson",

      sourceId:
        "persona_juridica",

      layerId:
        "persona_juridica_layer",

      color:
        COLOR_JURIDICO,

      datasetKey:
        "PERSONA_JURIDICA"

    });


    // =================================================
    // 4. HIGHLIGHT
    // =================================================

    ensureHighlightLayers();


    // =================================================
    // ESPERAR A QUE LAS CAPAS EXISTAN
    // =================================================

    setTimeout(
      () => {


        // =============================================
        // CONECTAR CHECKBOXES
        // =============================================

        wireLayerControls();


        // =============================================
        // ORDEN VISUAL DE LAS CAPAS
        // =============================================

        try {


          // Predios siempre abajo
          if (
            map.getLayer(
              "predios_base_outline"
            )
          ) {

            map.moveLayer(
              "predios_base_outline"
            );

          }


          // Persona natural
          if (
            map.getLayer(
              "persona_natural_layer"
            )
          ) {

            map.moveLayer(
              "persona_natural_layer"
            );

          }


          // Persona jurídica
          if (
            map.getLayer(
              "persona_juridica_layer"
            )
          ) {

            map.moveLayer(
              "persona_juridica_layer"
            );

          }


          // Highlight siempre arriba
          if (
            map.getLayer(
              "point_highlight_circle"
            )
          ) {

            map.moveLayer(
              "point_highlight_circle"
            );

          }


        } catch (error) {


          console.error(

            "Error organizando las capas:",

            error

          );


        }

      },

      600

    );

  }

);


// =====================================================
// RESULTADO DEL BUSCADOR
// =====================================================

geocoder.on(
  "result",
  (e) => {


    const result =
      e.result;


    if (
      !result
    ) {

      return;

    }


    // =================================================
    // PROPIEDADES
    // =================================================

    const props =
      result.properties || {};


    const dataset =
      props.__dataset;


    const matchField =
      props.__matchField;


    const matchValue =

      (
        props.__matchValue ??
        ""
      )

        .toString()

        .trim();


    // =================================================
    // IDENTIFICAR DATASET
    // =================================================

    let fc =
      null;


    if (
      dataset ===
      "PERSONA_NATURAL"
    ) {

      fc =
        PERSONA_NATURAL_DATA;

    }


    if (
      dataset ===
      "PERSONA_JURIDICA"
    ) {

      fc =
        PERSONA_JURIDICA_DATA;

    }


    // =================================================
    // FEATURES
    // =================================================

    const feats =

      fc &&
      Array.isArray(
        fc.features
      )

        ? fc.features

        : [];


    let toHighlight =
      [];


    // =================================================
    // RESALTAR COINCIDENCIAS
    // =================================================
    //
    // Si la búsqueda fue por documento, puede haber
    // varios puntos asociados al mismo contribuyente.
    //
    // El código predial se conserva internamente para
    // búsqueda, aunque NO aparece en el popup.
    //
    // =================================================

    if (

      (
        matchField ===
          "codigo"

        ||

        matchField ===
          "No Documento"
      )

      &&

      matchValue

      &&

      feats.length

    ) {


      const mv =
        norm(
          matchValue
        );


      toHighlight =

        feats.filter(
          (f) => {


            const p =
              f.properties || {};


            const v =
              p[matchField];


            return (
              norm(v) ===
              mv
            );

          }

        );

    }


    // =================================================
    // SI NO HAY GRUPO
    // RESALTAR SOLO EL RESULTADO
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

    const highlightFC = {

      type:
        "FeatureCollection",

      features:
        toHighlight

    };


    // =================================================
    // ACTUALIZAR HIGHLIGHT
    // =================================================

    const hs =
      map.getSource(
        "point_highlight"
      );


    if (
      hs
    ) {

      hs.setData(
        highlightFC
      );

    }


    // =================================================
    // ZOOM AL RESULTADO
    // =================================================

    try {


      const bounds =
        turf.bbox(
          highlightFC
        );


      map.fitBounds(

        bounds,

        {

          padding:
            55,

          // Evita un acercamiento exagerado
          // cuando solamente hay un punto.
          maxZoom:
            18

        }

      );


    } catch (error) {


      console.error(

        "Error haciendo zoom al resultado:",

        error

      );


    }


    // =================================================
    // CENTRO DEL POPUP
    // =================================================

    const center =

      result.center ||

      getPointLngLat(
        result
      );


    // =================================================
    // TÍTULO
    // =================================================

    const titulo =

      dataset ===
      "PERSONA_NATURAL"

        ? "Persona natural"

        : dataset ===
          "PERSONA_JURIDICA"

          ? "Persona jurídica"

          : "Información";


    // =================================================
    // POPUP
    //
    // IMPORTANTE:
    // Código predial NO aparece.
    // =================================================

    popup

      .setLngLat(
        center
      )

      .setHTML(

        popupHTMLCamposSeleccionados(

          props,

          titulo,

          center

        )

      )

      .addTo(map);

  }

);
