// =====================================================
// ✅ Visor Predial + Servicios Públicos + Alumbrado
//    + Energía – Sesquilé
//
// CAMBIOS:
// ✅ Puntos más pequeños
// ✅ Bordes blancos más delgados
// ✅ Predios con línea 0.6 y opacidad 50%
// ✅ Basuras Sí / No
// ✅ Popup predios: SOLO Código + Destino
// ✅ Highlight más pequeño
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

    // Mapa satelital
    style:
      "mapbox://styles/mapbox/satellite-v9",

    center:
      [-73.79724, 5.04463],

    zoom:
      15,

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
// POPUP GLOBAL
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

let SERVICIOS_DATA =
  null;


let ALUMBRADO_DATA =
  null;


let ENERGIA_DATA =
  null;


// =====================================================
// MARCADORES DE ENERGÍA
// =====================================================

let ENERGIA_MARKERS_SI =
  [];


let ENERGIA_MARKERS_NO =
  [];


// =====================================================
// HELPERS
// =====================================================


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
// NORMALIZAR TEXTO
// =====================================================

function norm(v) {

  return (
    v ??
    ""
  )

    .toString()

    .toLowerCase()

    .normalize(
      "NFD"
    )

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


// =====================================================
// OBTENER COORDENADA DE FEATURE
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


  } catch {

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
// VALOR DE TEXTO
// =====================================================

function valTxt(v) {

  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {

    return "N/A";

  }


  return v;

}


// =====================================================
// PANEL: CERRAR / ABRIR
// =====================================================

function wireFilterPanelToggle() {

  const panel =
    document.getElementById(
      "spControl"
    );


  const btnClose =
    document.getElementById(
      "spClose"
    );


  const btnOpen =
    document.getElementById(
      "spOpen"
    );


  if (
    !panel ||
    !btnClose ||
    !btnOpen
  ) {

    return;

  }


  // Inicialmente ocultamos el botón de abrir
  btnOpen.style.display =
    "none";


  // ===================================================
  // CERRAR PANEL
  // ===================================================

  btnClose.addEventListener(
    "click",
    () => {

      panel.style.display =
        "none";


      btnOpen.style.display =
        "block";

    }
  );


  // ===================================================
  // ABRIR PANEL
  // ===================================================

  btnOpen.addEventListener(
    "click",
    () => {

      panel.style.display =
        "block";


      btnOpen.style.display =
        "none";

    }
  );

}


// =====================================================
// POPUP PREDIOS
// =====================================================
//
// CAMBIO SOLICITADO:
//
// ANTES:
// Código
// Destino
// Nombre
// Documento
// Avalúo
// Área
//
// AHORA:
// Código
// Destino
//
// =====================================================

function popupHTMLPredio(
  props
) {

  props =
    props || {};


  const codigo =

    props.codigo ??

    props.CODIGO ??

    "N/A";


  const destino =

    props.DESTINO ??

    props.destino ??

    "N/A";


  return `

    <div
      style="
        font-weight:700;
        margin-bottom:6px;
      "
    >

      Predio municipio de Sesquilé

    </div>


    <strong>
      Código:
    </strong>

    ${codigo}

    <br>


    <strong>
      Destino:
    </strong>

    ${destino}


    <br><br>


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
// CAMPOS DEL POPUP DE SERVICIOS PÚBLICOS
// =====================================================

const CAMPOS_SERVICIOS = [

  {
    label:
      "Número predial",

    field:
      "n_mero_pre"
  },

  {
    label:
      "Nombre del propietario",

    field:
      "nombre_del"
  },

  {
    label:
      "Tipo de predio",

    field:
      "tipo_de_pr"
  },

  {
    label:
      "Otro - Tipo de predio",

    field:
      "tipo_de__1"
  },

  {
    label:
      "Uso actual del predio",

    field:
      "uso_actual"
  },

  {
    label:
      "Tiene servicio de acueducto?",

    field:
      "tiene_serv"
  },

  {
    label:
      "Entidad prestadora acueducto",

    field:
      "entidad_pr"
  },

  {
    label:
      "Tiene servicio de alcantarillado?",

    field:
      "tiene_se_1"
  },

  {
    label:
      "Entidad prestadora alcantarillado",

    field:
      "field_38"
  },

  {
    label:
      "Tiene servicio de recolección de basuras?",

    field:
      "tiene_se_2"
  },

  {
    label:
      "Entidad prestadora basuras",

    field:
      "field_39"
  },

  {
    label:
      "Tiene servicio de Internet?",

    field:
      "tiene_se_3"
  },

  {
    label:
      "Operador de Internet",

    field:
      "field_19"
  },

  {
    label:
      "Tiene servicio de Gas?",

    field:
      "tiene_se_4"
  },

  {
    label:
      "Operador de Gas",

    field:
      "field_50"
  },

  {
    label:
      "La vivienda es",

    field:
      "la_viviend"
  },

  {
    label:
      "Observación",

    field:
      "observacio"
  }

];


// =====================================================
// POPUP SERVICIOS PÚBLICOS
// =====================================================

function popupHTMLServicios(
  props,
  lngLat
) {

  props =
    props || {};


  const rows =

    CAMPOS_SERVICIOS

      .map(
        (item) => {

          return (

            `<strong>${item.label}:</strong> ` +

            `${valTxt(props[item.field])}`

          );

        }
      )

      .join(
        "<br>"
      );


  return `

    <div
      style="
        font-weight:700;
        margin-bottom:6px;
      "
    >

      Situación de servicios públicos

    </div>


    ${rows}


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

}


// =====================================================
// POPUP ALUMBRADO PÚBLICO
// =====================================================

function popupHTMLAlumbrado(
  props,
  lngLat
) {

  props =
    props || {};


  return `

    <div
      style="
        font-weight:700;
        margin-bottom:6px;
      "
    >

      Alumbrado público

    </div>


    <strong>Tipo poste:</strong>
    ${valTxt(props.tipo_poste)}
    <br>


    <strong>Código de poste:</strong>
    ${valTxt(props.codigo_de_poste)}
    <br>


    <strong>Código de lámpara:</strong>
    ${valTxt(props.codigo_de_lampara)}
    <br>


    <strong>Observaciones:</strong>
    ${valTxt(props.observaciones)}
    <br>


    <strong>Vereda:</strong>
    ${valTxt(props.vereda)}
    <br>


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

}
// =====================================================
// FILTROS SÍ / NO ROBUSTOS
// =====================================================


// =====================================================
// EXPRESIÓN NORMALIZADA DEL CAMPO
// =====================================================
//
// Convierte el valor a texto, minúsculas y elimina
// espacios al inicio y al final.
//
// =====================================================

function exprRaw(
  fieldName
) {

  return [

    "downcase",

    [
      "to-string",

      [
        "coalesce",

        ["get", fieldName],

        ""
      ]

    ]

  ];

}


// =====================================================
// TIENE SERVICIO = SÍ
// =====================================================

function exprTieneSi(
  fieldName
) {

  const v =
    exprRaw(
      fieldName
    );


  return [

    "any",


    // "si"
    [
      "==",
      v,
      "si"
    ],


    // "sí"
    [
      "==",
      v,
      "sí"
    ],


    // "s"
    [
      "==",
      v,
      "s"
    ],


    // "1"
    [
      "==",
      v,
      "1"
    ],


    // "true"
    [
      "==",
      v,
      "true"
    ]

  ];

}


// =====================================================
// TIENE SERVICIO = NO
// =====================================================

function exprTieneNo(
  fieldName
) {

  const v =
    exprRaw(
      fieldName
    );


  return [

    "any",


    // "no"
    [
      "==",
      v,
      "no"
    ],


    // "n"
    [
      "==",
      v,
      "n"
    ],


    // "0"
    [
      "==",
      v,
      "0"
    ],


    // "false"
    [
      "==",
      v,
      "false"
    ]

  ];

}


// =====================================================
// CAMPOS DE SERVICIOS
// =====================================================

const SP_FIELDS = {

  GAS:
    "tiene_se_4",

  ACUEDUCTO:
    "tiene_serv",

  ALC:
    "tiene_se_1",

  INTERNET:
    "tiene_se_3",

  // IMPORTANTE:
  // El archivo original identifica Basuras
  // mediante tiene_se_2.
  BASURAS:
    "tiene_se_2"

};


// =====================================================
// GRUPOS DE SERVICIOS
// =====================================================

const SERVICIOS_FILTER_GROUPS = [


  // ===================================================
  // GAS
  // ===================================================

  {

    id:
      "L_GAS_SI",

    label:
      "Gas: Sí",

    field:
      SP_FIELDS.GAS,

    expr:
      () =>
        exprTieneSi(
          SP_FIELDS.GAS
        ),

    color:
      "#00bcd4"

  },


  {

    id:
      "L_GAS_NO",

    label:
      "Gas: No",

    field:
      SP_FIELDS.GAS,

    expr:
      () =>
        exprTieneNo(
          SP_FIELDS.GAS
        ),

    color:
      "#ff4d6d"

  },


  // ===================================================
  // ACUEDUCTO
  // ===================================================

  {

    id:
      "L_ACUEDUCTO_SI",

    label:
      "Acueducto: Sí",

    field:
      SP_FIELDS.ACUEDUCTO,

    expr:
      () =>
        exprTieneSi(
          SP_FIELDS.ACUEDUCTO
        ),

    color:
      "#7c3aed"

  },


  {

    id:
      "L_ACUEDUCTO_NO",

    label:
      "Acueducto: No",

    field:
      SP_FIELDS.ACUEDUCTO,

    expr:
      () =>
        exprTieneNo(
          SP_FIELDS.ACUEDUCTO
        ),

    color:
      "#f59e0b"

  },


  // ===================================================
  // ALCANTARILLADO
  // ===================================================

  {

    id:
      "L_ALC_SI",

    label:
      "Alcantarillado: Sí",

    field:
      SP_FIELDS.ALC,

    expr:
      () =>
        exprTieneSi(
          SP_FIELDS.ALC
        ),

    color:
      "#22c55e"

  },


  {

    id:
      "L_ALC_NO",

    label:
      "Alcantarillado: No",

    field:
      SP_FIELDS.ALC,

    expr:
      () =>
        exprTieneNo(
          SP_FIELDS.ALC
        ),

    color:
      "#ef4444"

  },


  // ===================================================
  // INTERNET
  // ===================================================

  {

    id:
      "L_INTERNET_SI",

    label:
      "Internet: Sí",

    field:
      SP_FIELDS.INTERNET,

    expr:
      () =>
        exprTieneSi(
          SP_FIELDS.INTERNET
        ),

    color:
      "#3b82f6"

  },


  {

    id:
      "L_INTERNET_NO",

    label:
      "Internet: No",

    field:
      SP_FIELDS.INTERNET,

    expr:
      () =>
        exprTieneNo(
          SP_FIELDS.INTERNET
        ),

    color:
      "#a3a3a3"

  },


  // ===================================================
  // BASURAS
  // ===================================================
  //
  // Ambas capas consultan EXACTAMENTE el mismo campo:
  //
  // tiene_se_2
  //
  // Una filtra SÍ y la otra NO.
  //
  // ===================================================

  {

    id:
      "L_BASURAS_SI",

    label:
      "Basuras: Sí",

    field:
      SP_FIELDS.BASURAS,

    expr:
      () =>
        exprTieneSi(
          SP_FIELDS.BASURAS
        ),

    color:
      "#e879f9"

  },


  {

    id:
      "L_BASURAS_NO",

    label:
      "Basuras: No",

    field:
      SP_FIELDS.BASURAS,

    expr:
      () =>
        exprTieneNo(
          SP_FIELDS.BASURAS
        ),

    color:
      "#f97316"

  }

];


// =====================================================
// GRUPOS DE ENERGÍA
// =====================================================
//
// Energía continúa funcionando mediante HTML Markers,
// no como capas circle de Mapbox.
//
// =====================================================

const ENERGIA_FILTER_GROUPS = [


  {

    id:
      "L_ENERGIA_SI",

    label:
      "Energía: Sí",

    color:
      "#FFD700"

  },


  {

    id:
      "L_ENERGIA_NO",

    label:
      "Energía: No",

    color:
      "#FF3B30"

  }

];


// =====================================================
// TODOS LOS GRUPOS
// =====================================================

const ALL_FILTER_GROUPS = [

  ...SERVICIOS_FILTER_GROUPS,

  ...ENERGIA_FILTER_GROUPS

];


// =====================================================
// ALUMBRADO
// =====================================================

const ALUMBRADO_LAYER_ID =
  "L_ALUMBRADO";


const ALUMBRADO_COLOR =
  "#38bdf8";


// =====================================================
// SINCRONIZAR COLORES DEL PANEL CON EL JS
// =====================================================

function syncPanelAccentsFromJS() {


  const list =
    document.getElementById(
      "spToggleList"
    );


  if (
    !list
  ) {

    return;

  }


  // ===================================================
  // SERVICIOS + ENERGÍA
  // ===================================================

  ALL_FILTER_GROUPS.forEach(
    (g) => {


      const row =
        list.querySelector(

          `.sp-row[data-layer="${g.id}"]`

        );


      if (
        !row
      ) {

        return;

      }


      row.style.setProperty(

        "--sp-accent",

        g.color

      );

    }

  );


  // ===================================================
  // TODOS
  // ===================================================

  const rowAll =
    list.querySelector(

      `.sp-row[data-layer="L_ALL"]`

    );


  if (
    rowAll
  ) {

    rowAll.style.setProperty(

      "--sp-accent",

      "#00bcd4"

    );

  }


  // ===================================================
  // ALUMBRADO
  // ===================================================

  const rowAlumbrado =
    list.querySelector(

      `.sp-row[data-layer="${ALUMBRADO_LAYER_ID}"]`

    );


  if (
    rowAlumbrado
  ) {

    rowAlumbrado.style.setProperty(

      "--sp-accent",

      ALUMBRADO_COLOR

    );

  }

}
// =====================================================
// PARTE 3A
// CAPAS DE SERVICIOS PÚBLICOS
// =====================================================

function ensureServiciosFilterLayers() {

  const sourceId =
    "servicios_publicos";


  const baseId =
    "L_BASE";


  // ===================================================
  // CAPA BASE
  // ===================================================
  //
  // Se muestra cuando no hay filtros específicos
  // seleccionados.
  //
  // Antes:
  // radius = 6
  // stroke = 1.5
  //
  // Ahora:
  // radius = 4
  // stroke = 0.75
  //
  // ===================================================

  if (
    !map.getLayer(
      baseId
    )
  ) {

    map.addLayer({

      id:
        baseId,

      type:
        "circle",

      source:
        sourceId,

      paint: {

        "circle-radius":
          4,

        "circle-color":
          "#ffb703",

        "circle-stroke-color":
          "#ffffff",

        "circle-stroke-width":
          0.75,

        "circle-opacity":
          0.95

      }

    });

  }


  // ===================================================
  // CAPAS FILTRADAS
  // ===================================================

  for (
    const g
    of SERVICIOS_FILTER_GROUPS
  ) {


    const newFilter =
      g.expr();


    // =================================================
    // SI LA CAPA YA EXISTE
    // =================================================

    if (
      map.getLayer(
        g.id
      )
    ) {


      // Actualizar filtro
      map.setFilter(

        g.id,

        newFilter

      );


      // Actualizar color
      map.setPaintProperty(

        g.id,

        "circle-color",

        g.color

      );


      // Asegurar tamaño actualizado
      map.setPaintProperty(

        g.id,

        "circle-radius",

        4

      );


      // Asegurar borde actualizado
      map.setPaintProperty(

        g.id,

        "circle-stroke-width",

        0.75

      );


      continue;

    }


    // =================================================
    // CREAR CAPA
    // =================================================

    map.addLayer({

      id:
        g.id,

      type:
        "circle",

      source:
        sourceId,

      // Inicialmente ocultas.
      // El panel decide cuál mostrar.
      layout: {

        visibility:
          "none"

      },

      filter:
        newFilter,

      paint: {

        "circle-radius":
          4,

        "circle-color":
          g.color,

        "circle-stroke-color":
          "#ffffff",

        "circle-stroke-width":
          0.75,

        "circle-opacity":
          0.95

      }

    });

  }

}


// =====================================================
// INTERACCIÓN CON CAPAS DE SERVICIOS
// =====================================================

function wireServiciosLayerInteractions() {


  // ===================================================
  // TODAS LAS CAPAS INTERACTIVAS DE SERVICIOS
  // ===================================================

  const all = [

    "L_BASE",

    ...SERVICIOS_FILTER_GROUPS.map(
      (g) => g.id
    )

  ];


  // ===================================================
  // LIMPIAR EVENTOS ANTERIORES
  // ===================================================

  for (
    const lid
    of all
  ) {


    safeOff(
      "mouseenter",
      lid
    );


    safeOff(
      "mouseleave",
      lid
    );


    safeOff(
      "click",
      lid
    );

  }


  // ===================================================
  // ASIGNAR INTERACCIÓN
  // ===================================================

  function attach(
    lid
  ) {


    // ===============================================
    // CURSOR
    // ===============================================

    map.on(

      "mouseenter",

      lid,

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

      lid,

      () => {

        map
          .getCanvas()
          .style
          .cursor =
          "";

      }

    );


    // ===============================================
    // CLICK
    // ===============================================

    map.on(

      "click",

      lid,

      (e) => {


        const f =

          e.features &&

          e.features[0];


        if (
          !f
        ) {

          return;

        }


        const lngLat =
          getPointLngLat(
            f
          );


        // =============================================
        // POPUP DE SERVICIOS
        // =============================================

        popup

          .setLngLat(
            lngLat
          )

          .setHTML(

            popupHTMLServicios(

              f.properties || {},

              lngLat

            )

          )

          .addTo(map);


        // =============================================
        // RESALTAR SOLO EL PUNTO ACTUAL
        // =============================================

        const hs =
          map.getSource(
            "highlight"
          );


        if (
          hs
        ) {

          hs.setData({

            type:
              "FeatureCollection",

            features:
              [f]

          });

        }

      }

    );

  }


  // ===================================================
  // ACTIVAR EVENTOS
  // ===================================================

  all.forEach(
    attach
  );

}


// =====================================================
// SWITCHES / FILTROS DEL PANEL
// =====================================================

function wireServiciosToggleList() {


  const list =
    document.getElementById(
      "spToggleList"
    );


  if (
    !list
  ) {

    return;

  }


  // ===================================================
  // COLORES DEL PANEL
  // ===================================================

  syncPanelAccentsFromJS();


  // ===================================================
  // FILA "TODOS"
  // ===================================================

  const rowAll =
    list.querySelector(

      `.sp-row[data-layer="L_ALL"]`

    );


  // ===================================================
  // FILA ALUMBRADO
  // ===================================================

  const rowAlumbrado =
    list.querySelector(

      `.sp-row[data-layer="${ALUMBRADO_LAYER_ID}"]`

    );


  // ===================================================
  // TODAS LAS FILAS DE SERVICIOS + ENERGÍA
  // ===================================================

  const groupRows =

    Array.from(

      list.querySelectorAll(
        `.sp-row[data-layer]`
      )

    )

      .filter(
        (r) =>

          r.dataset.layer &&

          r.dataset.layer !==
            "L_ALL" &&

          r.dataset.layer !==
            ALUMBRADO_LAYER_ID
      );


  // ===================================================
  // OBTENER FILTROS ACTIVOS
  // ===================================================

  function getActiveGroups() {

    return groupRows

      .filter(
        (r) =>
          r.classList.contains(
            "is-active"
          )
      )

      .map(
        (r) =>
          r.dataset.layer
      )

      .filter(
        Boolean
      );

  }


  // ===================================================
  // ALUMBRADO ACTIVO
  // ===================================================

  function isAlumbradoActive() {

    return (

      rowAlumbrado &&

      rowAlumbrado.classList.contains(
        "is-active"
      )

    );

  }


  // ===================================================
  // VISIBILIDAD DE CAPAS MAPBOX
  // ===================================================

  function setLayerVisibility(
    id,
    visible
  ) {


    if (
      !map.getLayer(
        id
      )
    ) {

      return;

    }


    map.setLayoutProperty(

      id,

      "visibility",

      visible
        ? "visible"
        : "none"

    );

  }


  // ===================================================
  // VISIBILIDAD DE MARCADORES DE ENERGÍA
  // ===================================================

  function setEnergiaVisible(
    actives
  ) {


    const energiaSiActiva =
      actives.includes(
        "L_ENERGIA_SI"
      );


    const energiaNoActiva =
      actives.includes(
        "L_ENERGIA_NO"
      );


    ENERGIA_MARKERS_SI.forEach(
      (m) => {

        m
          .getElement()
          .style
          .display =

          energiaSiActiva
            ? "block"
            : "none";

      }
    );


    ENERGIA_MARKERS_NO.forEach(
      (m) => {

        m
          .getElement()
          .style
          .display =

          energiaNoActiva
            ? "block"
            : "none";

      }
    );

  }


  // ===================================================
  // SINCRONIZAR MAPA CON EL PANEL
  // ===================================================

  function syncMapLayersFromUI() {


    const actives =
      getActiveGroups();


    const alumbradoActivo =
      isAlumbradoActive();


    // ===============================================
    // ¿HAY ALGÚN SERVICIO SELECCIONADO?
    // ===============================================

    const hayServiciosActivos =

      SERVICIOS_FILTER_GROUPS.some(
        (g) =>
          actives.includes(
            g.id
          )
      );


    // ===============================================
    // ¿HAY ENERGÍA SELECCIONADA?
    // ===============================================

    const hayEnergiaActiva =

      actives.includes(
        "L_ENERGIA_SI"
      )

      ||

      actives.includes(
        "L_ENERGIA_NO"
      );


    // ===============================================
    // SI NO HAY NINGÚN FILTRO:
    // MOSTRAR CAPA BASE
    // ===============================================

    if (

      !hayServiciosActivos &&

      !alumbradoActivo &&

      !hayEnergiaActiva

    ) {


      setLayerVisibility(

        "L_BASE",

        true

      );


      SERVICIOS_FILTER_GROUPS.forEach(
        (g) => {

          setLayerVisibility(

            g.id,

            false

          );

        }
      );


      setEnergiaVisible(
        []
      );

    }


    // ===============================================
    // SI HAY FILTROS
    // ===============================================

    else {


      setLayerVisibility(

        "L_BASE",

        false

      );


      // =============================================
      // MOSTRAR EXACTAMENTE LOS FILTROS ACTIVOS
      // =============================================

      SERVICIOS_FILTER_GROUPS.forEach(
        (g) => {

          setLayerVisibility(

            g.id,

            actives.includes(
              g.id
            )

          );

        }
      );


      // =============================================
      // ENERGÍA
      // =============================================

      setEnergiaVisible(
        actives
      );

    }


    // ===============================================
    // ALUMBRADO
    // ===============================================

    setLayerVisibility(

      ALUMBRADO_LAYER_ID,

      alumbradoActivo

    );


    // ===============================================
    // ACTUALIZAR ESTADO DE "TODOS"
    // ===============================================

    if (
      rowAll
    ) {


      if (

        !hayServiciosActivos &&

        !alumbradoActivo &&

        !hayEnergiaActiva

      ) {

        rowAll
          .classList
          .add(
            "is-active"
          );

      } else {

        rowAll
          .classList
          .remove(
            "is-active"
          );

      }

    }

  }


  // ===================================================
  // EVENTO: TODOS
  // ===================================================

  if (
    rowAll &&
    !rowAll.dataset.wired
  ) {


    rowAll.dataset.wired =
      "1";


    rowAll.addEventListener(
      "click",
      () => {


        // Desactivar filtros individuales
        groupRows.forEach(
          (r) => {

            r.classList.remove(
              "is-active"
            );

          }
        );


        // Desactivar alumbrado
        if (
          rowAlumbrado
        ) {

          rowAlumbrado
            .classList
            .remove(
              "is-active"
            );

        }


        // Activar Todos
        rowAll
          .classList
          .add(
            "is-active"
          );


        syncMapLayersFromUI();


        // Cerrar popup
        try {

          popup.remove();

        } catch (e) {}


        // Limpiar selección
        const hs =
          map.getSource(
            "highlight"
          );


        if (
          hs
        ) {

          hs.setData({

            type:
              "FeatureCollection",

            features:
              []

          });

        }

      }
    );

  }


  // ===================================================
  // EVENTOS: SERVICIOS + ENERGÍA
  // ===================================================

  groupRows.forEach(
    (row) => {


      if (
        row.dataset.wired
      ) {

        return;

      }


      row.dataset.wired =
        "1";


      row.addEventListener(
        "click",
        () => {


          // ===========================================
          // ACTIVAR / DESACTIVAR FILTRO
          // ===========================================

          row
            .classList
            .toggle(
              "is-active"
            );


          // ===========================================
          // SINCRONIZAR
          // ===========================================

          syncMapLayersFromUI();


          // ===========================================
          // CERRAR POPUP
          // ===========================================

          try {

            popup.remove();

          } catch (e) {}


          // ===========================================
          // LIMPIAR SELECCIÓN
          // ===========================================

          const hs =
            map.getSource(
              "highlight"
            );


          if (
            hs
          ) {

            hs.setData({

              type:
                "FeatureCollection",

              features:
                []

            });

          }

        }
      );

    }
  );


  // ===================================================
  // EVENTO: ALUMBRADO
  // ===================================================

  if (

    rowAlumbrado &&

    !rowAlumbrado.dataset.wired

  ) {


    rowAlumbrado.dataset.wired =
      "1";


    rowAlumbrado.addEventListener(
      "click",
      () => {


        rowAlumbrado
          .classList
          .toggle(
            "is-active"
          );


        syncMapLayersFromUI();


        try {

          popup.remove();

        } catch (e) {}


        const hs =
          map.getSource(
            "highlight"
          );


        if (
          hs
        ) {

          hs.setData({

            type:
              "FeatureCollection",

            features:
              []

          });

        }

      }
    );

  }


  // ===================================================
  // APLICAR ESTADO INICIAL
  // ===================================================

  syncMapLayersFromUI();

}
// =====================================================
// PARTE 3B-1
// PRIORIDAD DE CLIC + PREDIOS BASE
// =====================================================


// =====================================================
// PRIORIDAD DE CLIC SOBRE LOS PUNTOS
// =====================================================
//
// Si existe un punto de servicios o alumbrado
// exactamente donde el usuario hace clic,
// evitamos abrir también el popup del predio.
//
// =====================================================

function isServiciosHitAtPoint(
  point
) {

  const layers = [

    "L_BASE",

    ...SERVICIOS_FILTER_GROUPS.map(
      (g) => g.id
    ),

    ALUMBRADO_LAYER_ID

  ]

    .filter(
      (id) =>
        map.getLayer(id)
    );


  const hits =
    map.queryRenderedFeatures(

      point,

      {
        layers:
          layers
      }

    );


  return (
    hits &&
    hits.length > 0
  );

}


// =====================================================
// PREDIOS BASE
// =====================================================
//
// CAMBIOS:
//
// ANTES:
// line-width: 1.2
// line-opacity: 0.9
// minzoom: 12
//
// AHORA:
// line-width: 0.6
// line-opacity: 0.50
// SIN minzoom
//
// Popup:
// SOLO Código + Destino
//
// =====================================================

function addPrediosBase() {


  fetch(
    "../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson"
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
        // CONTORNO PREDIAL
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


        // =============================================
        // CAPA TRANSPARENTE PARA PODER HACER CLIC
        // =============================================
        //
        // Esta capa prácticamente no se ve.
        // Sirve únicamente para detectar clics dentro
        // del polígono.
        //
        // También quitamos minzoom.
        //
        // =============================================

        if (
          !map.getLayer(
            "predios_base_click"
          )
        ) {

          map.addLayer({

            id:
              "predios_base_click",

            type:
              "fill",

            source:
              "predios_base",

            paint: {

              "fill-color":
                "#000000",

              "fill-opacity":
                0.001

            }

          });

        }


        // =============================================
        // LIMPIAR EVENTOS ANTERIORES
        // =============================================

        safeOff(
          "click",
          "predios_base_click"
        );


        safeOff(
          "mouseenter",
          "predios_base_click"
        );


        safeOff(
          "mouseleave",
          "predios_base_click"
        );


        // =============================================
        // CURSOR
        // =============================================

        map.on(

          "mouseenter",

          "predios_base_click",

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

          "predios_base_click",

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              "";

          }

        );


        // =============================================
        // CLICK SOBRE PREDIO
        // =============================================

        map.on(

          "click",

          "predios_base_click",

          (e) => {


            // =========================================
            // DAR PRIORIDAD A PUNTOS DE SERVICIOS
            // =========================================

            if (
              isServiciosHitAtPoint(
                e.point
              )
            ) {

              return;

            }


            const f =

              e.features &&

              e.features[0];


            if (
              !f
            ) {

              return;

            }


            // =========================================
            // CENTRO DEL PREDIO
            // =========================================

            const center =

              turf

                .centroid(f)

                .geometry

                .coordinates;


            // =========================================
            // POPUP
            //
            // popupHTMLPredio() de la Parte 1
            // solamente muestra:
            //
            // Código
            // Destino
            // =========================================

            popup

              .setLngLat(
                center
              )

              .setHTML(

                popupHTMLPredio(

                  f.properties || {}

                )

              )

              .addTo(map);

          }

        );


        // =============================================
        // PREDIOS SIEMPRE DEBAJO DE LOS PUNTOS
        // =============================================

        try {


          if (
            map.getLayer(
              "predios_base_outline"
            )
          ) {

            map.moveLayer(
              "predios_base_outline"
            );

          }


          if (
            map.getLayer(
              "predios_base_click"
            )
          ) {

            map.moveLayer(
              "predios_base_click"
            );

          }


        } catch (e) {}

      }

    )


    // ===============================================
    // ERROR
    // ===============================================

    .catch(
      (err) => {

        console.error(

          "Error cargando predios base:",

          err

        );

      }
    );

}
// =====================================================
// PARTE 3B-2
// SERVICIOS PÚBLICOS + ALUMBRADO PÚBLICO
// =====================================================


// =====================================================
// SERVICIOS PÚBLICOS
// =====================================================

function addServiciosPublicos() {

  const FILE =
    "Servicios_publicos_puntos_nuevo.geojson";


  fetch(
    `../src/data/${FILE}`
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

        SERVICIOS_DATA =
          data;


        // =============================================
        // SOURCE
        // =============================================

        if (
          map.getSource(
            "servicios_publicos"
          )
        ) {

          map
            .getSource(
              "servicios_publicos"
            )
            .setData(
              data
            );

        } else {

          map.addSource(

            "servicios_publicos",

            {

              type:
                "geojson",

              data:
                data

            }

          );

        }


        // =============================================
        // CREAR CAPAS DE SERVICIOS
        // =============================================

        ensureServiciosFilterLayers();


        // =============================================
        // ACTIVAR INTERACCIONES
        // =============================================

        wireServiciosLayerInteractions();


        // =============================================
        // CONECTAR PANEL DE FILTROS
        // =============================================

        setTimeout(
          () => {

            try {

              wireServiciosToggleList();

            } catch (e) {

              console.error(
                "Error conectando filtros:",
                e
              );

            }

          },

          0
        );


        // =============================================
        // BOTÓN ABRIR / CERRAR PANEL
        // =============================================

        setTimeout(
          () => {

            try {

              wireFilterPanelToggle();

            } catch (e) {

              console.error(
                "Error conectando panel:",
                e
              );

            }

          },

          0
        );


        // =============================================
        // ORDEN VISUAL
        // =============================================

        try {


          // Servicios encima de los predios
          [

            "L_BASE",

            ...SERVICIOS_FILTER_GROUPS.map(
              (g) => g.id
            )

          ]

            .forEach(
              (lid) => {


                if (
                  map.getLayer(
                    lid
                  )
                ) {

                  map.moveLayer(
                    lid
                  );

                }

              }
            );


          // Alumbrado encima de servicios
          if (
            map.getLayer(
              ALUMBRADO_LAYER_ID
            )
          ) {

            map.moveLayer(
              ALUMBRADO_LAYER_ID
            );

          }


          // Selección siempre arriba
          if (
            map.getLayer(
              "highlight_circle"
            )
          ) {

            map.moveLayer(
              "highlight_circle"
            );

          }


        } catch (e) {}

      }

    )


    .catch(
      (err) => {

        console.error(

          "Error cargando servicios públicos:",

          err

        );

      }
    );

}


// =====================================================
// ALUMBRADO PÚBLICO
// =====================================================
//
// ANTES:
// circle-radius = 6
// circle-stroke-width = 1.5
//
// AHORA:
// circle-radius = 4
// circle-stroke-width = 0.75
//
// =====================================================

function addAlumbradoPublico() {

  const FILE =
    "alumbrado_publico_con_vereda.geojson";


  fetch(
    `../src/data/${FILE}`
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

        ALUMBRADO_DATA =
          data;


        // =============================================
        // SOURCE
        // =============================================

        if (
          map.getSource(
            "alumbrado_publico"
          )
        ) {

          map
            .getSource(
              "alumbrado_publico"
            )
            .setData(
              data
            );

        } else {

          map.addSource(

            "alumbrado_publico",

            {

              type:
                "geojson",

              data:
                data

            }

          );

        }


        // =============================================
        // CAPA ALUMBRADO
        // =============================================

        if (
          !map.getLayer(
            ALUMBRADO_LAYER_ID
          )
        ) {

          map.addLayer({

            id:
              ALUMBRADO_LAYER_ID,

            type:
              "circle",

            source:
              "alumbrado_publico",

            layout: {

              visibility:
                "none"

            },

            paint: {

              // Punto reducido
              "circle-radius":
                4,

              "circle-color":
                ALUMBRADO_COLOR,

              "circle-stroke-color":
                "#ffffff",

              // Borde blanco reducido
              "circle-stroke-width":
                0.75,

              "circle-opacity":
                0.95

            }

          });

        }


        // =============================================
        // SI LA CAPA YA EXISTÍA,
        // ASEGURAR LOS NUEVOS TAMAÑOS
        // =============================================

        else {

          map.setPaintProperty(

            ALUMBRADO_LAYER_ID,

            "circle-radius",

            4

          );


          map.setPaintProperty(

            ALUMBRADO_LAYER_ID,

            "circle-stroke-width",

            0.75

          );

        }


        // =============================================
        // LIMPIAR EVENTOS ANTERIORES
        // =============================================

        safeOff(
          "mouseenter",
          ALUMBRADO_LAYER_ID
        );


        safeOff(
          "mouseleave",
          ALUMBRADO_LAYER_ID
        );


        safeOff(
          "click",
          ALUMBRADO_LAYER_ID
        );


        // =============================================
        // CURSOR
        // =============================================

        map.on(

          "mouseenter",

          ALUMBRADO_LAYER_ID,

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

          ALUMBRADO_LAYER_ID,

          () => {

            map
              .getCanvas()
              .style
              .cursor =
              "";

          }

        );


        // =============================================
        // CLICK SOBRE ALUMBRADO
        // =============================================

        map.on(

          "click",

          ALUMBRADO_LAYER_ID,

          (e) => {


            const f =

              e.features &&

              e.features[0];


            if (
              !f
            ) {

              return;

            }


            const lngLat =
              getPointLngLat(
                f
              );


            // =========================================
            // POPUP
            // =========================================

            popup

              .setLngLat(
                lngLat
              )

              .setHTML(

                popupHTMLAlumbrado(

                  f.properties || {},

                  lngLat

                )

              )

              .addTo(map);


            // =========================================
            // RESALTAR PUNTO
            // =========================================

            const hs =
              map.getSource(
                "highlight"
              );


            if (
              hs
            ) {

              hs.setData({

                type:
                  "FeatureCollection",

                features:
                  [f]

              });

            }

          }

        );


        // =============================================
        // ACTUALIZAR COLORES DEL PANEL
        // =============================================

        syncPanelAccentsFromJS();


        // =============================================
        // RECONECTAR PANEL
        // =============================================

        setTimeout(
          () => {

            try {

              wireServiciosToggleList();

            } catch (e) {}

          },

          0
        );


        // =============================================
        // ORDEN VISUAL
        // =============================================

        try {


          if (
            map.getLayer(
              ALUMBRADO_LAYER_ID
            )
          ) {

            map.moveLayer(
              ALUMBRADO_LAYER_ID
            );

          }


          if (
            map.getLayer(
              "highlight_circle"
            )
          ) {

            map.moveLayer(
              "highlight_circle"
            );

          }


        } catch (e) {}

      }

    )


    .catch(
      (err) => {

        console.error(

          "Error cargando alumbrado público:",

          err

        );

      }
    );

}
// =====================================================
// PARTE 3B-3
// ENERGÍA ELÉCTRICA — HTML MARKERS
// =====================================================
//
// ANTES:
// 12 x 12 px
// borde blanco = 1.5 px
//
// AHORA:
// 8 x 8 px
// borde blanco = 0.75 px
//
// =====================================================

function addEnergiaMarkers() {

  const FILE =
    "energia_1.geojson";


  // ===================================================
  // ELIMINAR MARCADORES ANTERIORES
  // ===================================================

  ENERGIA_MARKERS_SI.forEach(
    (m) => {

      m.remove();

    }
  );


  ENERGIA_MARKERS_NO.forEach(
    (m) => {

      m.remove();

    }
  );


  ENERGIA_MARKERS_SI =
    [];


  ENERGIA_MARKERS_NO =
    [];


  // ===================================================
  // CARGAR GEOJSON
  // ===================================================

  fetch(
    `../src/data/${FILE}`
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

        ENERGIA_DATA =
          data;


        // =============================================
        // VALIDAR FEATURES
        // =============================================

        if (

          !data ||

          !Array.isArray(
            data.features
          )

        ) {

          console.warn(

            "energia_1.geojson no tiene features válidos"

          );


          return;

        }


        // =============================================
        // RECORRER PUNTOS
        // =============================================

        data.features.forEach(
          (feature) => {


            const coords =
              getPointLngLat(
                feature
              );


            const props =
              feature.properties || {};


            // =========================================
            // VALOR DEL SERVICIO DE ENERGÍA
            // =========================================

            const tieneLuz =

              props.Tiene_Luz ??

              props.tiene_luz ??

              props.tiene_luz_ ??

              props.energia ??

              "No";


            const tieneLuzNorm =
              norm(
                tieneLuz
              );


            // =========================================
            // IDENTIFICAR SÍ
            // =========================================

            const esSi =

              [
                "si",
                "sí",
                "s",
                "1",
                "true"
              ]

                .includes(
                  tieneLuzNorm
                );


            // =========================================
            // CREAR ELEMENTO HTML
            // =========================================

            const el =
              document.createElement(
                "div"
              );


            el.className =
              "marker-energia";


            // =========================================
            // TAMAÑO REDUCIDO
            // =========================================

            el.style.width =
              "8px";


            el.style.height =
              "8px";


            el.style.borderRadius =
              "50%";


            // =========================================
            // COLOR
            // =========================================

            el.style.backgroundColor =

              esSi

                ? "#FFD700"

                : "#FF3B30";


            // =========================================
            // BORDE BLANCO REDUCIDO
            // =========================================

            el.style.border =
              "0.75px solid #ffffff";


            el.style.boxShadow =
              "none";


            el.style.opacity =
              "0.95";


            el.style.cursor =
              "pointer";


            // Inicialmente oculto.
            // El panel controla la visibilidad.
            el.style.display =
              "none";


            el.style.zIndex =
              "10";


            el.style.pointerEvents =
              "auto";


            // =========================================
            // POPUP DE ENERGÍA
            // =========================================

            const htmlEnergia = `

              <div
                style="
                  font-size:13px;
                "
              >

                <div
                  style="
                    font-weight:700;
                    margin-bottom:6px;
                  "
                >

                  Energía eléctrica

                </div>


                <strong>
                  Tiene Luz:
                </strong>

                ${valTxt(tieneLuz)}

                <br>


                <div
                  style="
                    margin-top:10px;
                  "
                >

                  <a
                    href="${streetViewUrl(coords)}"

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

              </div>

            `;


            // =========================================
            // CREAR MARKER MAPBOX
            // =========================================

            const marker =

              new mapboxgl.Marker({

                element:
                  el,

                anchor:
                  "center"

              })

                .setLngLat(
                  coords
                )

                .addTo(map);


            // =========================================
            // CLICK SOBRE MARCADOR
            // =========================================

            el.addEventListener(

              "click",

              function (ev) {


                // Evitar que el clic llegue al predio
                // que está debajo.
                ev.preventDefault();

                ev.stopPropagation();


                // =====================================
                // LIMPIAR HIGHLIGHT ANTERIOR
                // =====================================

                const hs =
                  map.getSource(
                    "highlight"
                  );


                if (
                  hs
                ) {

                  hs.setData({

                    type:
                      "FeatureCollection",

                    features:
                      []

                  });

                }


                // =====================================
                // POPUP
                // =====================================

                popup

                  .setLngLat(
                    coords
                  )

                  .setHTML(
                    htmlEnergia
                  )

                  .addTo(map);


                // Popup encima de marcadores
                if (
                  popup.getElement()
                ) {

                  popup
                    .getElement()
                    .style
                    .zIndex =
                    "2000";

                }

              }

            );


            // =========================================
            // CLASIFICAR MARCADOR
            // =========================================

            if (
              esSi
            ) {

              ENERGIA_MARKERS_SI.push(
                marker
              );

            } else {

              ENERGIA_MARKERS_NO.push(
                marker
              );

            }

          }

        );


        // =============================================
        // VOLVER A SINCRONIZAR EL PANEL
        // =============================================
        //
        // Esto es importante porque los marcadores
        // HTML se crean de manera asíncrona.
        //
        // =============================================

        try {

          wireServiciosToggleList();

        } catch (e) {

          console.error(

            "Error sincronizando filtros de energía:",

            e

          );

        }

      }

    )


    // =================================================
    // ERROR
    // =================================================

    .catch(
      (error) => {

        console.error(

          "Error cargando energia_1.geojson:",

          error

        );

      }
    );

}
// =====================================================
// PARTE 4A
// HIGHLIGHT + BUSCADOR LOCAL
// =====================================================


// =====================================================
// HIGHLIGHT
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
  // CAPA DE RESALTADO
  // ===================================================
  //
  // ANTES:
  // radius = 10
  // opacity = 0.35
  // stroke = 4
  //
  // AHORA:
  // radius = 7
  // opacity = 0.30
  // stroke = 2
  //
  // ===================================================

  if (
    !map.getLayer(
      "highlight_circle"
    )
  ) {

    map.addLayer({

      id:
        "highlight_circle",

      type:
        "circle",

      source:
        "highlight",

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
// LIMPIAR HIGHLIGHT
// =====================================================

function clearHighlight() {


  const hs =
    map.getSource(
      "highlight"
    );


  if (
    hs
  ) {

    hs.setData({

      type:
        "FeatureCollection",

      features:
        []

    });

  }

}


// =====================================================
// BUSCADOR LOCAL
// SERVICIOS + ALUMBRADO + ENERGÍA
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
      "Buscar predial, propietario, servicio, poste, lámpara, energía...",


    // =================================================
    // FUNCIÓN DE BÚSQUEDA
    // =================================================

    localGeocoder:
      (q) => {


        const query =
          norm(q);


        if (
          !query
        ) {

          return [];

        }


        const results =
          [];


        // =================================================
        // 1. SERVICIOS PÚBLICOS
        // =================================================

        if (

          SERVICIOS_DATA &&

          Array.isArray(
            SERVICIOS_DATA.features
          )

        ) {


          for (
            const feature
            of SERVICIOS_DATA.features
          ) {


            const p =
              feature.properties || {};


            // Buscar en todos los atributos
            const big =
              norm(

                Object
                  .values(p)
                  .join(" ")

              );


            const ok =
              big.includes(
                query
              );


            if (
              !ok
            ) {

              continue;

            }


            const center =
              getPointLngLat(
                feature
              );


            const placeName =

              `${
                p["n_mero_pre"] ??
                "N/A"
              } | ` +

              `${
                p["nombre_del"] ??
                "N/A"
              }`;


            results.push({

              type:
                "Feature",

              geometry:
                feature.geometry,

              center:
                center,

              place_name:

                `Servicios públicos | ${placeName}`,

              text:

                (
                  p["n_mero_pre"] ??

                  p["nombre_del"] ??

                  "Resultado"
                )

                  .toString(),

              properties: {

                ...p,

                __tipo_busqueda:
                  "servicios"

              },

              place_type:
                ["place"]

            });


            if (
              results.length >= 10
            ) {

              break;

            }

          }

        }


        // =================================================
        // 2. ALUMBRADO PÚBLICO
        // =================================================

        if (

          ALUMBRADO_DATA &&

          Array.isArray(
            ALUMBRADO_DATA.features
          ) &&

          results.length < 10

        ) {


          for (
            const feature
            of ALUMBRADO_DATA.features
          ) {


            const p =
              feature.properties || {};


            const big =
              norm(

                Object
                  .values(p)
                  .join(" ")

              );


            const ok =
              big.includes(
                query
              );


            if (
              !ok
            ) {

              continue;

            }


            const center =
              getPointLngLat(
                feature
              );


            results.push({

              type:
                "Feature",

              geometry:
                feature.geometry,

              center:
                center,

              place_name:

                `Alumbrado público | ` +

                `Poste: ${
                  p.codigo_de_poste ??
                  "N/A"
                } | ` +

                `Lámpara: ${
                  p.codigo_de_lampara ??
                  "N/A"
                }`,

              text:

                (
                  p.codigo_de_poste ??

                  p.codigo_de_lampara ??

                  "Alumbrado"
                )

                  .toString(),

              properties: {

                ...p,

                __tipo_busqueda:
                  "alumbrado"

              },

              place_type:
                ["place"]

            });


            if (
              results.length >= 10
            ) {

              break;

            }

          }

        }


        // =================================================
        // 3. ENERGÍA
        // =================================================

        if (

          ENERGIA_DATA &&

          Array.isArray(
            ENERGIA_DATA.features
          ) &&

          results.length < 10

        ) {


          for (
            const feature
            of ENERGIA_DATA.features
          ) {


            const p =
              feature.properties || {};


            const big =
              norm(

                Object
                  .values(p)
                  .join(" ")

              );


            const ok =
              big.includes(
                query
              );


            if (
              !ok
            ) {

              continue;

            }


            const center =
              getPointLngLat(
                feature
              );


            const tieneLuz =

              p.Tiene_Luz ??

              p.tiene_luz ??

              p.tiene_luz_ ??

              p.energia ??

              "N/A";


            results.push({

              type:
                "Feature",

              geometry:
                feature.geometry,

              center:
                center,

              place_name:

                `Energía eléctrica | ` +

                `Tiene luz: ${tieneLuz}`,

              text:

                `Energía ${tieneLuz}`,

              properties: {

                ...p,

                __tipo_busqueda:
                  "energia"

              },

              place_type:
                ["place"]

            });


            if (
              results.length >= 10
            ) {

              break;

            }

          }

        }


        // =================================================
        // MÁXIMO 10 RESULTADOS
        // =================================================

        return results.slice(
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

  "top-left"

);
// =====================================================
// PARTE 4B — FINAL
// RESULTADO DEL BUSCADOR + CARGA FINAL
// =====================================================


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
    // COORDENADA
    // =================================================

    const lngLat =

      f.center ||

      getPointLngLat(
        f
      );


    // =================================================
    // LIMPIAR SELECCIÓN ANTERIOR
    // =================================================

    clearHighlight();


    // =================================================
    // RESALTAR NUEVO RESULTADO
    // =================================================

    const hs =
      map.getSource(
        "highlight"
      );


    if (
      hs
    ) {

      hs.setData({

        type:
          "FeatureCollection",

        features:
          [f]

      });

    }


    // =================================================
    // ZOOM AL RESULTADO
    // =================================================

    map.flyTo({

      center:
        lngLat,

      zoom:
        18

    });


    // =================================================
    // IDENTIFICAR TIPO DE RESULTADO
    // =================================================

    const tipo =
      f.properties?.__tipo_busqueda;


    // =================================================
    // ENERGÍA
    // =================================================

    if (
      tipo ===
      "energia"
    ) {


      const p =
        f.properties || {};


      const tieneLuz =

        p.Tiene_Luz ??

        p.tiene_luz ??

        p.tiene_luz_ ??

        p.energia ??

        "N/A";


      popup

        .setLngLat(
          lngLat
        )

        .setHTML(`

          <div
            style="
              font-size:13px;
            "
          >

            <div
              style="
                font-weight:700;
                margin-bottom:6px;
              "
            >

              Energía eléctrica

            </div>


            <strong>
              Tiene Luz:
            </strong>

            ${valTxt(tieneLuz)}

            <br>


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

          </div>

        `)

        .addTo(map);


      return;

    }


    // =================================================
    // ALUMBRADO
    // =================================================

    if (
      tipo ===
      "alumbrado"
    ) {


      popup

        .setLngLat(
          lngLat
        )

        .setHTML(

          popupHTMLAlumbrado(

            f.properties || {},

            lngLat

          )

        )

        .addTo(map);


      return;

    }


    // =================================================
    // SERVICIOS PÚBLICOS
    // =================================================

    popup

      .setLngLat(
        lngLat
      )

      .setHTML(

        popupHTMLServicios(

          f.properties || {},

          lngLat

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
    // 1. PREDIOS
    // =================================================

    addPrediosBase();


    // =================================================
    // 2. SERVICIOS PÚBLICOS
    // =================================================

    addServiciosPublicos();


    // =================================================
    // 3. ALUMBRADO
    // =================================================

    addAlumbradoPublico();


    // =================================================
    // 4. ENERGÍA
    // =================================================

    addEnergiaMarkers();


    // =================================================
    // 5. HIGHLIGHT
    // =================================================

    addHighlight();


    // =================================================
    // ESPERAR A QUE LAS CAPAS ESTÉN CREADAS
    // =================================================

    setTimeout(
      () => {


        try {


          // ===========================================
          // PREDIOS ABAJO
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


          if (
            map.getLayer(
              "predios_base_click"
            )
          ) {

            map.moveLayer(
              "predios_base_click"
            );

          }


          // ===========================================
          // SERVICIOS ENCIMA DE PREDIOS
          // ===========================================

          [

            "L_BASE",

            ...SERVICIOS_FILTER_GROUPS.map(
              (g) => g.id
            )

          ]

            .forEach(
              (lid) => {


                if (
                  map.getLayer(
                    lid
                  )
                ) {

                  map.moveLayer(
                    lid
                  );

                }

              }
            );


          // ===========================================
          // ALUMBRADO ENCIMA
          // ===========================================

          if (
            map.getLayer(
              ALUMBRADO_LAYER_ID
            )
          ) {

            map.moveLayer(
              ALUMBRADO_LAYER_ID
            );

          }


          // ===========================================
          // HIGHLIGHT ARRIBA DE TODO
          // ===========================================

          if (
            map.getLayer(
              "highlight_circle"
            )
          ) {

            map.moveLayer(
              "highlight_circle"
            );

          }


        } catch (error) {


          console.error(

            "Error organizando las capas:",

            error

          );


        }


        // =============================================
        // SINCRONIZAR PANEL
        // =============================================

        try {

          syncPanelAccentsFromJS();

        } catch (e) {}


        try {

          wireServiciosToggleList();

        } catch (e) {}


        try {

          wireFilterPanelToggle();

        } catch (e) {}


      },

      500

    );

  }

);
