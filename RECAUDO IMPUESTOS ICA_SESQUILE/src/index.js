// =====================================================
// ✅ Visor Predial + Recaudo impuesto ICA – Sesquilé
// ✅ Mapa base SATELITAL
// ✅ Zoom inicial: Posible recaudo ICA
// ✅ Puntos optimizados para mejor visualización
// ✅ Predios con línea más delgada y 50% opacidad
// ✅ Selección única entre capas
// ✅ Contribuyentes activos con popup simplificado
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";


// =====================================================
// MAPA
// =====================================================

const map = new mapboxgl.Map({

  container: "map",

  // 🛰️ MAPA SATELITAL
  style: "mapbox://styles/mapbox/satellite-streets-v12",

  // Posición temporal mientras carga Posible recaudo ICA
  center: [-73.79724, 5.04463],

  zoom: 12,

  antialias: true

});


map.addControl(
  new mapboxgl.NavigationControl()
);


// =====================================================
// POPUP
// =====================================================

const popup =
  new mapboxgl.Popup({

    closeButton: true,

    closeOnClick: true,

    className: "custom-popup",

    maxWidth: "360px",

    offset: 18

  });


// =====================================================
// DATASETS COMPLETOS
// =====================================================

let PREDIOS_DATA = null;

let ICA_DATA = null;

let CONTRIB_JURIDICA_DATA = null;

let CONTRIB_NATURAL_DATA = null;

let COINCIDEN_DATA = null;


// =====================================================
// CONTROL DEL ZOOM INICIAL
// Evita repetir fitBounds si la capa se recarga
// =====================================================

let ICA_INITIAL_ZOOM_DONE = false;


// =====================================================
// HELPERS
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

    .replace(/\s+/g, " ")

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
// LIMPIAR TODOS LOS ELEMENTOS SELECCIONADOS
// =====================================================
//
// Esto corrige el problema de selecciones amarillas
// que se quedaban pegadas al seleccionar otra capa.
//
// =====================================================

function clearAllHighlights() {


  const sources = [

    "highlight_ica",

    "highlight_coinciden",

    "highlight_contrib_juridica",

    "highlight_contrib_natural"

  ];


  sources.forEach(
    (sourceId) => {


      const source =
        map.getSource(
          sourceId
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
  );

}


// =====================================================
// SELECCIONAR UN SOLO ELEMENTO
// =====================================================

function setSingleHighlight(
  sourceId,
  feature
) {


  // Primero eliminar cualquier selección anterior
  clearAllHighlights();


  const source =
    map.getSource(
      sourceId
    );


  if (
    source &&
    feature
  ) {

    source.setData({

      type:
        "FeatureCollection",

      features:
        [feature]

    });

  }

}


// =====================================================
// POPUP VISIBLE SMART
// =====================================================

function ensurePopupVisibleSmart(
  padding = 14
) {


  requestAnimationFrame(
    () => {


      const el =
        document.querySelector(
          ".mapboxgl-popup"
        );


      if (
        !el
      ) {

        return;

      }


      const rect =
        el.getBoundingClientRect();


      let dx =
        0;


      let dy =
        0;


      if (
        rect.top <
        padding
      ) {

        dy =
          rect.top -
          padding;

      }


      if (
        rect.bottom >
        window.innerHeight -
        padding
      ) {

        dy =
          rect.bottom -
          (
            window.innerHeight -
            padding
          );

      }


      if (
        rect.left <
        padding
      ) {

        dx =
          rect.left -
          padding;

      }


      if (
        rect.right >
        window.innerWidth -
        padding
      ) {

        dx =
          rect.right -
          (
            window.innerWidth -
            padding
          );

      }


      if (
        dx ||
        dy
      ) {

        map.panBy(

          [
            dx,
            dy
          ],

          {
            duration: 0
          }

        );

      }

    }
  );

}


// =====================================================
// LIGHTBOX PARA AGRANDAR FOTOGRAFÍAS
// =====================================================

function openLightbox(
  url
) {


  if (
    !url
  ) {

    return;

  }


  const old =
    document.getElementById(
      "ea-lightbox"
    );


  if (
    old
  ) {

    old.remove();

  }


  const lb =
    document.createElement(
      "div"
    );


  lb.id =
    "ea-lightbox";


  lb.style.cssText = `

    position:fixed;

    inset:0;

    z-index:99999;

    background:rgba(0,0,0,0.78);

    display:flex;

    align-items:center;

    justify-content:center;

    padding:18px;

  `;


  lb.innerHTML = `

    <div
      style="
        position:relative;
        max-width:92vw;
        max-height:92vh;
      "
    >

      <button
        id="ea-lb-close"
        aria-label="Cerrar"

        style="
          position:absolute;
          top:-12px;
          right:-12px;
          width:36px;
          height:36px;
          border:0;
          cursor:pointer;
          border-radius:999px;
          font-weight:900;
          background:#00bcd4;
          color:#000;
        "
      >

        ✕

      </button>


      <img
        src="${url}"
        alt="Foto ampliada"

        style="
          max-width:92vw;
          max-height:92vh;
          border-radius:14px;
          display:block;
          object-fit:contain;
        "
      />

    </div>

  `;


  lb.addEventListener(
    "click",
    (e) => {

      if (
        e.target === lb
      ) {

        lb.remove();

      }

    }
  );


  lb
    .querySelector(
      "#ea-lb-close"
    )
    .addEventListener(
      "click",
      () => {

        lb.remove();

      }
    );


  document.addEventListener(

    "keydown",

    (ev) => {


      if (
        ev.key ===
        "Escape"
      ) {


        const x =
          document.getElementById(
            "ea-lightbox"
          );


        if (
          x
        ) {

          x.remove();

        }

      }

    },

    {
      once: true
    }

  );


  document.body.appendChild(
    lb
  );

}


// =====================================================
// HACER FUNCIONES DISPONIBLES PARA onclick
// =====================================================

window.openLightbox =
  openLightbox;


window.ensurePopupVisibleSmart =
  ensurePopupVisibleSmart;


// =====================================================
// FOTO ICA
// =====================================================

function sanitizePhotoRelPath(
  p
) {


  let s =

    (
      p ??
      ""
    )

      .toString()

      .trim();


  if (
    !s
  ) {

    return "";

  }


  s =
    s.replace(
      /\\/g,
      "/"
    );


  s =
    s.replace(
      /^\/+/,
      ""
    );


  s =
    s.replace(
      /\.\.\//g,
      ""
    );


  return s;

}


// =====================================================
// CONSTRUIR URL FOTO ICA
// =====================================================

function buildIcaPhotoUrl(
  props
) {


  const rel =

    sanitizePhotoRelPath(

      props?.FOTOS ??

      props?.fotos ??

      props?.Foto ??

      props?.FOTO ??

      ""

    );


  if (
    !rel
  ) {

    return "";

  }


  return (
    `../src/data/fotos_ica/${rel}`
  );

}
// =====================================================
// POPUP: POSIBLE RECAUDO ICA
// =====================================================

function popupHTMLICA(
  props,
  lngLat
) {

  props =
    props || {};


  const nombre =

    (
      props.NOMBRE ??
      "N/A"
    )

      .toString()

      .trim()

    || "N/A";


  const codigo =

    (
      props.codigo ??
      "N/A"
    )

      .toString()

      .trim()

    || "N/A";


  // ===================================================
  // FOTO
  // ===================================================

  const fotoUrl =
    buildIcaPhotoUrl(
      props
    );


  const fotoHTML = `

    <div
      style="
        margin-top:10px;
        border-radius:14px;
        overflow:hidden;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(255,255,255,0.06);
      "
    >

      ${
        fotoUrl

          ? `

            <img
              src="${fotoUrl}"

              alt="Foto del establecimiento"

              loading="lazy"

              style="
                width:100%;
                height:320px;
                object-fit:cover;
                display:block;
                cursor:zoom-in;
              "

              onclick="openLightbox('${fotoUrl}')"

              onload="ensurePopupVisibleSmart()"

              onerror="
                this.outerHTML=
                '<div style=&quot;
                  height:320px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  opacity:.75;
                  font-size:12px;
                  padding:12px;
                  text-align:center;
                &quot;>
                  Sin foto disponible
                </div>'
              "
            />

          `

          : `

            <div
              style="
                height:320px;
                display:flex;
                align-items:center;
                justify-content:center;
                opacity:.75;
                font-size:12px;
                padding:12px;
                text-align:center;
              "
            >

              Sin foto disponible

            </div>

          `
      }

    </div>

  `;


  // ===================================================
  // HTML
  // ===================================================

  return `

    <div
      style="
        width:340px;
        max-width:340px;
        padding:12px;
        box-sizing:border-box;
        border-radius:14px;
        background:rgba(0,0,0,0.45);
        border:1px solid rgba(255,255,255,0.12);
        backdrop-filter:blur(6px);
        color:#fff;
      "
    >


      <div
        style="
          font-weight:800;
          font-size:14px;
          margin-bottom:8px;
        "
      >

        Posible recaudo ICA

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:120px 1fr;
          gap:6px 10px;
          font-size:12px;
          line-height:1.25;
          min-width:0;
        "
      >


        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Nombre

        </div>


        <div
          style="
            font-weight:700;
            min-width:0;
            overflow-wrap:anywhere;
          "
        >

          ${nombre}

        </div>


        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Código predial

        </div>


        <div
          style="
            min-width:0;
            overflow-wrap:anywhere;
            word-break:break-word;
          "
        >

          ${codigo}

        </div>


      </div>


      ${fotoHTML}


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

  `;

}


// =====================================================
// POPUP: LETREROS ENCONTRADOS
// =====================================================

function popupHTMLCoinciden(
  props,
  lngLat
) {

  props =
    props || {};


  const nombre =

    (
      props.NOMBRE ??
      "N/A"
    )

      .toString()

      .trim()

    || "N/A";


  const codigo =

    (
      props.codigo ??
      "N/A"
    )

      .toString()

      .trim()

    || "N/A";


  const fotoUrl =
    buildIcaPhotoUrl(
      props
    );


  // ===================================================
  // FOTO
  // ===================================================

  const fotoHTML = `

    <div
      style="
        margin-top:10px;
        border-radius:14px;
        overflow:hidden;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(255,255,255,0.06);
      "
    >

      ${
        fotoUrl

          ? `

            <img
              src="${fotoUrl}"

              alt="Foto"

              loading="lazy"

              style="
                width:100%;
                height:320px;
                object-fit:cover;
                display:block;
                cursor:zoom-in;
              "

              onclick="openLightbox('${fotoUrl}')"

              onload="ensurePopupVisibleSmart()"

              onerror="
                this.outerHTML=
                '<div style=&quot;
                  height:320px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  opacity:.75;
                  font-size:12px;
                  padding:12px;
                  text-align:center;
                &quot;>
                  Sin foto disponible
                </div>'
              "
            />

          `

          : `

            <div
              style="
                height:320px;
                display:flex;
                align-items:center;
                justify-content:center;
                opacity:.75;
                font-size:12px;
                padding:12px;
                text-align:center;
              "
            >

              Sin foto disponible

            </div>

          `
      }

    </div>

  `;


  // ===================================================
  // HTML
  // ===================================================

  return `

    <div
      style="
        width:340px;
        max-width:340px;
        padding:12px;
        box-sizing:border-box;
        border-radius:14px;
        background:rgba(0,0,0,0.45);
        border:1px solid rgba(255,255,255,0.12);
        backdrop-filter:blur(6px);
        color:#fff;
      "
    >


      <div
        style="
          font-weight:800;
          font-size:14px;
          margin-bottom:8px;
        "
      >

        Letreros encontrados

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:120px 1fr;
          gap:6px 10px;
          font-size:12px;
          line-height:1.25;
          min-width:0;
        "
      >


        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Nombre

        </div>


        <div
          style="
            font-weight:700;
            min-width:0;
            overflow-wrap:anywhere;
          "
        >

          ${nombre}

        </div>


        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Código predial

        </div>


        <div
          style="
            min-width:0;
            overflow-wrap:anywhere;
            word-break:break-word;
          "
        >

          ${codigo}

        </div>


      </div>


      ${fotoHTML}


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

  `;

}


// =====================================================
// POPUP: CONTRIBUYENTES ACTIVOS
// =====================================================
//
// SOLO:
// 1. Documento
// 2. Naturaleza
// 3. Razón social
// 4. Estado
//
// =====================================================

function popupHTMLContribActivos(
  props,
  lngLat
) {

  props =
    props || {};


  // ===================================================
  // DOCUMENTO
  // ===================================================

  const documento =

    props["Número documento"] ??

    props["NUMERO_DOCUMENTO"] ??

    props["No Documento"] ??

    props["NO_DOCUMENTO"] ??

    props["Documento"] ??

    props["DOCUMENTO"] ??

    "N/A";


  // ===================================================
  // NATURALEZA
  // ===================================================

  const naturaleza =

    props["Naturaleza jurídica"] ??

    props["NATURALEZA_JURIDICA"] ??

    props["Naturaleza Juridica"] ??

    props["Naturaleza"] ??

    props["NATURALEZA"] ??

    "N/A";


  // ===================================================
  // RAZÓN SOCIAL
  // ===================================================

  const razonSocial =

    props["Razón social"] ??

    props["RAZON_SOCIAL"] ??

    props["Razon Social"] ??

    props["Contribuyente"] ??

    props["NOMBRE"] ??

    props["Nombre"] ??

    "N/A";


  // ===================================================
  // ESTADO
  // ===================================================

  const estado =

    props["Estado"] ??

    props["ESTADO"] ??

    "N/A";


  // ===================================================
  // WRAP PARA TEXTOS LARGOS
  // ===================================================

  const wrap =
    (v) => `

      <div
        style="
          min-width:0;
          overflow-wrap:anywhere;
          word-break:break-word;
        "
      >

        ${
          (
            v ??
            "N/A"
          )
            .toString()
        }

      </div>

    `;


  // ===================================================
  // HTML
  // ===================================================

  return `

    <div
      style="
        width:340px;
        max-width:340px;
        padding:12px;
        box-sizing:border-box;
        border-radius:14px;
        background:rgba(0,0,0,0.45);
        border:1px solid rgba(255,255,255,0.12);
        backdrop-filter:blur(6px);
        color:#fff;
      "
    >


      <div
        style="
          font-weight:800;
          font-size:14px;
          margin-bottom:10px;
        "
      >

        Contribuyentes activos

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:105px 1fr;
          gap:8px 10px;
          font-size:12px;
          line-height:1.3;
          min-width:0;
        "
      >


        <!-- DOCUMENTO -->

        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Documento

        </div>

        ${wrap(documento)}


        <!-- NATURALEZA -->

        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Naturaleza

        </div>

        ${wrap(naturaleza)}


        <!-- RAZÓN SOCIAL -->

        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Razón social

        </div>

        ${wrap(razonSocial)}


        <!-- ESTADO -->

        <div
          style="
            opacity:.75;
            font-weight:700;
          "
        >

          Estado

        </div>

        ${wrap(estado)}


      </div>


      <!-- STREET VIEW -->

      <div
        style="
          margin-top:12px;
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

  `;

}
// =====================================================
// CAPA PREDIOS BASE
// SOLO VISUAL
// =====================================================

function addPrediosBase() {

  fetch("../src/data/PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson")
    .then((r) => r.json())
    .then((data) => {

      PREDIOS_DATA = data;

      // SOURCE
      if (map.getSource("predios_base")) {

        map
          .getSource("predios_base")
          .setData(data);

      } else {

        map.addSource("predios_base", {
          type: "geojson",
          data: data
        });

      }


      // =================================================
      // PREDIOS
      //
      // Antes:
      // line-width: 1.2
      // line-opacity: 0.9
      //
      // Ahora:
      // line-width: 0.6
      // line-opacity: 0.50
      // =================================================

      if (!map.getLayer("predios_base_outline")) {

        map.addLayer({

          id: "predios_base_outline",

          type: "line",

          source: "predios_base",

          paint: {

            "line-color": "#ffffff",

            "line-width": 0.6,

            "line-opacity": 0.50

          }

        });

      }

    })

    .catch((err) => {

      console.error(
        "Error cargando predios:",
        err
      );

    });

}


// =====================================================
// CAPA POSIBLE RECAUDO ICA
// Archivo: imagenes_limpias.geojson
// Color: VERDE
// =====================================================

function addICALayer() {

  fetch("../src/data/imagenes_limpias.geojson")

    .then((r) => r.json())

    .then((data) => {

      ICA_DATA = data;


      // =================================================
      // SOURCE
      // =================================================

      if (map.getSource("ica_points")) {

        map
          .getSource("ica_points")
          .setData(data);

      } else {

        map.addSource("ica_points", {

          type: "geojson",

          data: data

        });

      }


      // =================================================
      // 🎯 ZOOM INICIAL A POSIBLE RECAUDO ICA
      // =================================================
      //
      // El visor ya NO abre en un zoom fijo.
      //
      // Calculamos la extensión real de todos los puntos
      // de posible recaudo y Mapbox ajusta la cámara.
      // =================================================

      if (
        !ICA_INITIAL_ZOOM_DONE &&
        data &&
        Array.isArray(data.features) &&
        data.features.length > 0
      ) {

        try {

          const bounds =
            turf.bbox(data);


          if (
            Array.isArray(bounds) &&
            bounds.length === 4 &&
            bounds.every(Number.isFinite)
          ) {

            map.fitBounds(
              bounds,
              {

                // Espacio alrededor de los puntos
                padding: 55,

                // Animación suave
                duration: 1200,

                // Evita acercamiento excesivo
                maxZoom: 17

              }
            );


            ICA_INITIAL_ZOOM_DONE = true;

          }

        } catch (error) {

          console.error(
            "Error haciendo zoom inicial a Posible recaudo ICA:",
            error
          );

        }

      }


      // =================================================
      // PUNTOS POSIBLE RECAUDO
      // =================================================
      //
      // Antes:
      // circle-radius: 6
      // circle-stroke-width: 1.5
      //
      // Ahora:
      // circle-radius: 4
      // circle-stroke-width: 0.75
      // =================================================

      if (!map.getLayer("ica_points_layer")) {

        map.addLayer({

          id: "ica_points_layer",

          type: "circle",

          source: "ica_points",

          paint: {

            "circle-radius": 4,

            "circle-color": "#00c853",

            "circle-stroke-width": 0.75,

            "circle-stroke-color": "#ffffff",

            "circle-opacity": 0.95

          }

        });

      }


      // =================================================
      // SOURCE PARA SELECCIÓN
      // =================================================

      if (!map.getSource("highlight_ica")) {

        map.addSource("highlight_ica", {

          type: "geojson",

          data: {

            type: "FeatureCollection",

            features: []

          }

        });

      }


      // =================================================
      // SÍMBOLO DE ELEMENTO SELECCIONADO
      // =================================================
      //
      // También lo hacemos más pequeño que antes.
      //
      // Antes:
      // radius 11
      // stroke 4
      //
      // Ahora:
      // radius 7
      // stroke 2
      // =================================================

      if (!map.getLayer("highlight_ica_circle")) {

        map.addLayer({

          id: "highlight_ica_circle",

          type: "circle",

          source: "highlight_ica",

          paint: {

            "circle-radius": 7,

            "circle-color": "#ffff00",

            "circle-opacity": 0.30,

            "circle-stroke-width": 2,

            "circle-stroke-color": "#ffff00"

          }

        });

      }


      // =================================================
      // LIMPIAR EVENTOS ANTERIORES
      // =================================================

      safeOff(
        "mouseenter",
        "ica_points_layer"
      );

      safeOff(
        "mouseleave",
        "ica_points_layer"
      );

      safeOff(
        "click",
        "ica_points_layer"
      );


      // =================================================
      // CURSOR
      // =================================================

      map.on(
        "mouseenter",
        "ica_points_layer",
        () => {

          map.getCanvas().style.cursor =
            "pointer";

        }
      );


      map.on(
        "mouseleave",
        "ica_points_layer",
        () => {

          map.getCanvas().style.cursor =
            "";

        }
      );


      // =================================================
      // CLICK SOBRE POSIBLE RECAUDO
      // =================================================

      map.on(
        "click",
        "ica_points_layer",
        (e) => {

          const f =
            e.features &&
            e.features[0];


          if (!f) {

            return;

          }


          const lngLat =
            getPointLngLat(f);


          // =============================================
          // CORRECCIÓN:
          // BORRAR SELECCIONES ANTERIORES
          // Y DEJAR SOLO ESTA
          // =============================================

          setSingleHighlight(
            "highlight_ica",
            f
          );


          // =============================================
          // POPUP
          // =============================================

          popup

            .setLngLat(lngLat)

            .setHTML(

              popupHTMLICA(
                f.properties || {},
                lngLat
              )

            )

            .addTo(map);


          ensurePopupVisibleSmart();

        }
      );

    })


    .catch((err) => {

      console.error(
        "Error cargando Posible recaudo ICA:",
        err
      );

    });

}
// =====================================================
// CAPA LETREROS ENCONTRADOS
// Archivo:
// Contrucciones_que_coinciden.geojson
// Color: AZUL
// =====================================================

function addCoincidenLayer() {

  fetch(
    "../src/data/Contrucciones_que_coinciden.geojson"
  )

    .then(
      (r) => r.json()
    )

    .then((data) => {


      // =================================================
      // GUARDAR DATASET
      // =================================================

      COINCIDEN_DATA =
        data;


      // =================================================
      // SOURCE
      // =================================================

      if (
        map.getSource(
          "coinciden_points"
        )
      ) {

        map
          .getSource(
            "coinciden_points"
          )
          .setData(
            data
          );

      } else {

        map.addSource(

          "coinciden_points",

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
      // radius: 6
      // stroke: 1.5
      //
      // Ahora:
      // radius: 4
      // stroke: 0.75
      // =================================================

      if (
        !map.getLayer(
          "coinciden_points_layer"
        )
      ) {

        map.addLayer({

          id:
            "coinciden_points_layer",

          type:
            "circle",

          source:
            "coinciden_points",

          paint: {

            "circle-radius":
              4,

            "circle-color":
              "#00b0ff",

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
      // SOURCE PARA SELECCIÓN
      // =================================================

      if (
        !map.getSource(
          "highlight_coinciden"
        )
      ) {

        map.addSource(

          "highlight_coinciden",

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


      // =================================================
      // SÍMBOLO DE ELEMENTO SELECCIONADO
      // =================================================

      if (
        !map.getLayer(
          "highlight_coinciden_circle"
        )
      ) {

        map.addLayer({

          id:
            "highlight_coinciden_circle",

          type:
            "circle",

          source:
            "highlight_coinciden",

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


      // =================================================
      // LIMPIAR EVENTOS ANTERIORES
      // =================================================

      safeOff(
        "mouseenter",
        "coinciden_points_layer"
      );

      safeOff(
        "mouseleave",
        "coinciden_points_layer"
      );

      safeOff(
        "click",
        "coinciden_points_layer"
      );


      // =================================================
      // CURSOR
      // =================================================

      map.on(

        "mouseenter",

        "coinciden_points_layer",

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

        "coinciden_points_layer",

        () => {

          map
            .getCanvas()
            .style
            .cursor =
            "";

        }

      );


      // =================================================
      // CLICK SOBRE LETRERO
      // =================================================

      map.on(

        "click",

        "coinciden_points_layer",

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
          // SELECCIÓN ÚNICA
          //
          // clearAllHighlights() se ejecuta dentro de
          // setSingleHighlight().
          //
          // Por eso desaparece cualquier selección
          // anterior de ICA, letreros o contribuyentes.
          // =============================================

          setSingleHighlight(

            "highlight_coinciden",

            f

          );


          // =============================================
          // POPUP
          // =============================================

          popup

            .setLngLat(
              lngLat
            )

            .setHTML(

              popupHTMLCoinciden(

                f.properties || {},

                lngLat

              )

            )

            .addTo(map);


          ensurePopupVisibleSmart();

        }

      );

    })


    // ===================================================
    // ERROR
    // ===================================================

    .catch((err) => {

      console.error(

        "Error cargando letreros encontrados:",

        err

      );

    });

}
// =====================================================
// CONTRIBUYENTES ACTIVOS
// PERSONA JURÍDICA
// Color: MORADO
// =====================================================

function addContribJuridicaLayer() {

  fetch(
    "../src/data/Contribuyentes_Persona_Juridica.geojson"
  )

    .then(
      (r) => r.json()
    )

    .then((data) => {


      // =================================================
      // GUARDAR DATASET
      // =================================================

      CONTRIB_JURIDICA_DATA =
        data;


      // =================================================
      // SOURCE
      // =================================================

      if (
        map.getSource(
          "contrib_juridica"
        )
      ) {

        map
          .getSource(
            "contrib_juridica"
          )
          .setData(
            data
          );

      } else {

        map.addSource(

          "contrib_juridica",

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
      // radius: 6
      // stroke: 1.5
      //
      // Ahora:
      // radius: 4
      // stroke: 0.75
      // =================================================

      if (
        !map.getLayer(
          "contrib_juridica_layer"
        )
      ) {

        map.addLayer({

          id:
            "contrib_juridica_layer",

          type:
            "circle",

          source:
            "contrib_juridica",

          paint: {

            "circle-radius":
              4,

            "circle-color":
              "#ff00ff",

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
      // SOURCE PARA SELECCIÓN
      // =================================================

      if (
        !map.getSource(
          "highlight_contrib_juridica"
        )
      ) {

        map.addSource(

          "highlight_contrib_juridica",

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


      // =================================================
      // SÍMBOLO DE SELECCIÓN
      // =================================================

      if (
        !map.getLayer(
          "highlight_contrib_juridica_circle"
        )
      ) {

        map.addLayer({

          id:
            "highlight_contrib_juridica_circle",

          type:
            "circle",

          source:
            "highlight_contrib_juridica",

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


      // =================================================
      // LIMPIAR EVENTOS ANTERIORES
      // =================================================

      safeOff(
        "mouseenter",
        "contrib_juridica_layer"
      );

      safeOff(
        "mouseleave",
        "contrib_juridica_layer"
      );

      safeOff(
        "click",
        "contrib_juridica_layer"
      );


      // =================================================
      // CURSOR
      // =================================================

      map.on(

        "mouseenter",

        "contrib_juridica_layer",

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

        "contrib_juridica_layer",

        () => {

          map
            .getCanvas()
            .style
            .cursor =
            "";

        }

      );


      // =================================================
      // CLICK CONTRIBUYENTE JURÍDICO
      // =================================================

      map.on(

        "click",

        "contrib_juridica_layer",

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
          // SELECCIÓN ÚNICA
          // =============================================

          setSingleHighlight(

            "highlight_contrib_juridica",

            f

          );


          // =============================================
          // POPUP SIMPLIFICADO
          // =============================================

          popup

            .setLngLat(
              lngLat
            )

            .setHTML(

              popupHTMLContribActivos(

                f.properties || {},

                lngLat

              )

            )

            .addTo(map);


          ensurePopupVisibleSmart();

        }

      );

    })


    // ===================================================
    // ERROR
    // ===================================================

    .catch((err) => {

      console.error(

        "Error cargando contribuyentes jurídicos:",

        err

      );

    });

}


// =====================================================
// CONTRIBUYENTES ACTIVOS
// PERSONA NATURAL
// Color: MORADO
// =====================================================

function addContribNaturalLayer() {

  fetch(
    "../src/data/Contribuyentes_Persona_Natural.geojson"
  )

    .then(
      (r) => r.json()
    )

    .then((data) => {


      // =================================================
      // GUARDAR DATASET
      // =================================================

      CONTRIB_NATURAL_DATA =
        data;


      // =================================================
      // SOURCE
      // =================================================

      if (
        map.getSource(
          "contrib_natural"
        )
      ) {

        map
          .getSource(
            "contrib_natural"
          )
          .setData(
            data
          );

      } else {

        map.addSource(

          "contrib_natural",

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

      if (
        !map.getLayer(
          "contrib_natural_layer"
        )
      ) {

        map.addLayer({

          id:
            "contrib_natural_layer",

          type:
            "circle",

          source:
            "contrib_natural",

          paint: {

            "circle-radius":
              4,

            "circle-color":
              "#ff00ff",

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
      // SOURCE PARA SELECCIÓN
      // =================================================

      if (
        !map.getSource(
          "highlight_contrib_natural"
        )
      ) {

        map.addSource(

          "highlight_contrib_natural",

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


      // =================================================
      // SÍMBOLO DE SELECCIÓN
      // =================================================

      if (
        !map.getLayer(
          "highlight_contrib_natural_circle"
        )
      ) {

        map.addLayer({

          id:
            "highlight_contrib_natural_circle",

          type:
            "circle",

          source:
            "highlight_contrib_natural",

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


      // =================================================
      // LIMPIAR EVENTOS ANTERIORES
      // =================================================

      safeOff(
        "mouseenter",
        "contrib_natural_layer"
      );

      safeOff(
        "mouseleave",
        "contrib_natural_layer"
      );

      safeOff(
        "click",
        "contrib_natural_layer"
      );


      // =================================================
      // CURSOR
      // =================================================

      map.on(

        "mouseenter",

        "contrib_natural_layer",

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

        "contrib_natural_layer",

        () => {

          map
            .getCanvas()
            .style
            .cursor =
            "";

        }

      );


      // =================================================
      // CLICK CONTRIBUYENTE NATURAL
      // =================================================

      map.on(

        "click",

        "contrib_natural_layer",

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
          // SELECCIÓN ÚNICA
          // =============================================

          setSingleHighlight(

            "highlight_contrib_natural",

            f

          );


          // =============================================
          // POPUP SIMPLIFICADO
          // =============================================

          popup

            .setLngLat(
              lngLat
            )

            .setHTML(

              popupHTMLContribActivos(

                f.properties || {},

                lngLat

              )

            )

            .addTo(map);


          ensurePopupVisibleSmart();

        }

      );

    })


    // ===================================================
    // ERROR
    // ===================================================

    .catch((err) => {

      console.error(

        "Error cargando contribuyentes naturales:",

        err

      );

    });

}
// =====================================================
// PARTE 4A
// LEYENDA ON/OFF + ORDEN DE CAPAS
// =====================================================


// =====================================================
// MOSTRAR / OCULTAR CAPA
// =====================================================

function setLayerVisible(
  layerId,
  visible
) {

  if (
    !map.getLayer(layerId)
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
// SABER SI UNA CAPA ESTÁ VISIBLE
// =====================================================

function isLayerVisible(
  layerId
) {

  if (
    !map.getLayer(layerId)
  ) {
    return false;
  }


  const visibility =
    map.getLayoutProperty(
      layerId,
      "visibility"
    );


  return (
    visibility !== "none"
  );

}


// =====================================================
// ORDEN VISUAL FIJO DE LAS CAPAS
// =====================================================
//
// De abajo hacia arriba:
//
// Predios
// Contribuyentes activos
// Letreros encontrados
// Posible recaudo ICA
// Highlights
//
// Por eso la leyenda se mostrará:
//
// Posible recaudo ICA
// Letreros encontrados
// Contribuyentes activos
// Predios
//
// =====================================================

function applyFixedOrder() {

  try {


    // =================================================
    // 1. PREDIOS
    // =================================================

    if (
      map.getLayer(
        "predios_base_outline"
      )
    ) {

      map.moveLayer(
        "predios_base_outline"
      );

    }


    // =================================================
    // 2. CONTRIBUYENTES ACTIVOS
    // =================================================

    if (
      map.getLayer(
        "contrib_juridica_layer"
      )
    ) {

      map.moveLayer(
        "contrib_juridica_layer"
      );

    }


    if (
      map.getLayer(
        "contrib_natural_layer"
      )
    ) {

      map.moveLayer(
        "contrib_natural_layer"
      );

    }


    // =================================================
    // 3. LETREROS
    // =================================================

    if (
      map.getLayer(
        "coinciden_points_layer"
      )
    ) {

      map.moveLayer(
        "coinciden_points_layer"
      );

    }


    // =================================================
    // 4. POSIBLE RECAUDO ICA
    // =================================================

    if (
      map.getLayer(
        "ica_points_layer"
      )
    ) {

      map.moveLayer(
        "ica_points_layer"
      );

    }


    // =================================================
    // HIGHLIGHTS SIEMPRE ENCIMA
    // =================================================

    if (
      map.getLayer(
        "highlight_ica_circle"
      )
    ) {

      map.moveLayer(
        "highlight_ica_circle"
      );

    }


    if (
      map.getLayer(
        "highlight_coinciden_circle"
      )
    ) {

      map.moveLayer(
        "highlight_coinciden_circle"
      );

    }


    if (
      map.getLayer(
        "highlight_contrib_juridica_circle"
      )
    ) {

      map.moveLayer(
        "highlight_contrib_juridica_circle"
      );

    }


    if (
      map.getLayer(
        "highlight_contrib_natural_circle"
      )
    ) {

      map.moveLayer(
        "highlight_contrib_natural_circle"
      );

    }


  } catch (error) {

    console.warn(
      "No fue posible reorganizar alguna capa:",
      error
    );

  }

}


// =====================================================
// CONSTRUIR LEYENDA
// =====================================================

function buildLegend() {

  const el =
    document.getElementById(
      "ea-legend"
    );


  if (
    !el
  ) {

    return;

  }


  el.innerHTML = `

    <div
      style="
        font-weight:900;
        font-size:13px;
        margin-bottom:8px;
      "
    >
      Capas
    </div>


    <!-- ============================================= -->
    <!-- POSIBLE RECAUDO ICA -->
    <!-- ============================================= -->

    <div class="row">

      <div class="left">

        <span
          class="dot"
          style="background:#00c853;">
        </span>

        <span class="name">
          Posible recaudo ICA
        </span>

      </div>

      <input
        id="tg_recaudo"
        type="checkbox"
        checked
      />

    </div>


    <!-- ============================================= -->
    <!-- LETREROS ENCONTRADOS -->
    <!-- ============================================= -->

    <div class="row">

      <div class="left">

        <span
          class="dot"
          style="background:#00b0ff;">
        </span>

        <span class="name">
          Letreros encontrados
        </span>

      </div>

      <input
        id="tg_letreros"
        type="checkbox"
        checked
      />

    </div>


    <!-- ============================================= -->
    <!-- CONTRIBUYENTES ACTIVOS -->
    <!-- ============================================= -->

    <div class="row">

      <div class="left">

        <span
          class="dot"
          style="background:#ff00ff;">
        </span>

        <span class="name">
          Contribuyentes activos
        </span>

      </div>

      <input
        id="tg_contrib"
        type="checkbox"
        checked
      />

    </div>


    <!-- ============================================= -->
    <!-- PREDIOS -->
    <!-- ============================================= -->

    <div class="row">

      <div class="left">

        <span
          class="dot"
          style="background:#ffffff;">
        </span>

        <span class="name">
          Predios
        </span>

      </div>

      <input
        id="tg_predios"
        type="checkbox"
        checked
      />

    </div>

  `;


  // ===================================================
  // OBTENER CHECKBOXES
  // ===================================================

  const tg_recaudo =
    el.querySelector(
      "#tg_recaudo"
    );


  const tg_letreros =
    el.querySelector(
      "#tg_letreros"
    );


  const tg_contrib =
    el.querySelector(
      "#tg_contrib"
    );


  const tg_predios =
    el.querySelector(
      "#tg_predios"
    );


  // ===================================================
  // ESTADO INICIAL
  // ===================================================

  tg_recaudo.checked =
    isLayerVisible(
      "ica_points_layer"
    );


  tg_letreros.checked =
    isLayerVisible(
      "coinciden_points_layer"
    );


  tg_contrib.checked =

    isLayerVisible(
      "contrib_juridica_layer"
    )

    ||

    isLayerVisible(
      "contrib_natural_layer"
    );


  tg_predios.checked =
    isLayerVisible(
      "predios_base_outline"
    );


  // ===================================================
  // TOGGLE POSIBLE RECAUDO ICA
  // ===================================================

  tg_recaudo.addEventListener(
    "change",
    () => {


      setLayerVisible(

        "ica_points_layer",

        tg_recaudo.checked

      );


      // Si se oculta la capa,
      // eliminar también su selección amarilla
      if (
        !tg_recaudo.checked
      ) {

        const hs =
          map.getSource(
            "highlight_ica"
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


      applyFixedOrder();

    }
  );


  // ===================================================
  // TOGGLE LETREROS
  // ===================================================

  tg_letreros.addEventListener(
    "change",
    () => {


      setLayerVisible(

        "coinciden_points_layer",

        tg_letreros.checked

      );


      if (
        !tg_letreros.checked
      ) {

        const hs =
          map.getSource(
            "highlight_coinciden"
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


      applyFixedOrder();

    }
  );


  // ===================================================
  // TOGGLE CONTRIBUYENTES ACTIVOS
  // ===================================================

  tg_contrib.addEventListener(
    "change",
    () => {


      setLayerVisible(

        "contrib_juridica_layer",

        tg_contrib.checked

      );


      setLayerVisible(

        "contrib_natural_layer",

        tg_contrib.checked

      );


      // Si se ocultan los contribuyentes,
      // eliminar ambas posibles selecciones
      if (
        !tg_contrib.checked
      ) {


        const hsJ =
          map.getSource(
            "highlight_contrib_juridica"
          );


        const hsN =
          map.getSource(
            "highlight_contrib_natural"
          );


        if (
          hsJ
        ) {

          hsJ.setData({

            type:
              "FeatureCollection",

            features:
              []

          });

        }


        if (
          hsN
        ) {

          hsN.setData({

            type:
              "FeatureCollection",

            features:
              []

          });

        }

      }


      applyFixedOrder();

    }
  );


  // ===================================================
  // TOGGLE PREDIOS
  // ===================================================

  tg_predios.addEventListener(
    "change",
    () => {


      setLayerVisible(

        "predios_base_outline",

        tg_predios.checked

      );


      applyFixedOrder();

    }
  );

}
// =====================================================
// PARTE 4B
// BUSCADOR LOCAL
// Posible recaudo ICA
// Letreros encontrados
// Contribuyentes activos
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
      "Buscar ICA / letreros / contribuyentes activos",


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
        // 1. POSIBLE RECAUDO ICA
        // =================================================

        if (

          ICA_DATA &&

          Array.isArray(
            ICA_DATA.features
          )

        ) {


          for (
            const f
            of ICA_DATA.features
          ) {


            const p =
              f.properties || {};


            const nombre =
              norm(
                p.NOMBRE
              );


            const codigo =
              norm(
                p.codigo
              );


            const coincide =

              (
                nombre &&
                nombre.includes(
                  query
                )
              )

              ||

              (
                codigo &&
                codigo.includes(
                  query
                )
              );


            if (
              !coincide
            ) {

              continue;

            }


            const center =
              getPointLngLat(
                f
              );


            results.push({

              type:
                "Feature",

              geometry:
                f.geometry,

              center:
                center,

              properties: {

                ...p,

                __tipo:
                  "ICA"

              },

              place_name:

                `Posible recaudo ICA: ${
                  (
                    p.NOMBRE ??
                    "N/A"
                  ).toString()
                }`,

              text:

                (
                  p.NOMBRE ??
                  p.codigo ??
                  "Posible recaudo ICA"
                ).toString(),

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
        // 2. LETREROS ENCONTRADOS
        // =================================================

        if (

          COINCIDEN_DATA &&

          Array.isArray(
            COINCIDEN_DATA.features
          ) &&

          results.length < 10

        ) {


          for (
            const f
            of COINCIDEN_DATA.features
          ) {


            const p =
              f.properties || {};


            const nombre =
              norm(
                p.NOMBRE
              );


            const codigo =
              norm(
                p.codigo
              );


            const coincide =

              (
                nombre &&
                nombre.includes(
                  query
                )
              )

              ||

              (
                codigo &&
                codigo.includes(
                  query
                )
              );


            if (
              !coincide
            ) {

              continue;

            }


            const center =
              getPointLngLat(
                f
              );


            results.push({

              type:
                "Feature",

              geometry:
                f.geometry,

              center:
                center,

              properties: {

                ...p,

                __tipo:
                  "COINCIDEN"

              },

              place_name:

                `Letreros encontrados: ${
                  (
                    p.NOMBRE ??
                    "N/A"
                  ).toString()
                }`,

              text:

                (
                  p.NOMBRE ??
                  p.codigo ??
                  "Letreros"
                ).toString(),

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
        // FUNCIÓN PARA BUSCAR CONTRIBUYENTES
        // =================================================

        function matchContrib(
          p
        ) {


          // Código predial
          const codigo =
            norm(

              p["Código predial"] ??

              p["CODIGO_PREDIAL"] ??

              p["codigo_predial"] ??

              p["codigo"]

            );


          // Documento
          const documento =
            norm(

              p["Número documento"] ??

              p["NUMERO_DOCUMENTO"] ??

              p["No Documento"] ??

              p["NO_DOCUMENTO"] ??

              p["Documento"] ??

              p["DOCUMENTO"]

            );


          // Razón social
          const razonSocial =
            norm(

              p["Razón social"] ??

              p["RAZON_SOCIAL"] ??

              p["Razon Social"]

            );


          // Contribuyente / nombre
          const contribuyente =
            norm(

              p["Contribuyente"] ??

              p["NOMBRE"] ??

              p["Nombre"] ??

              p["RAZON_SOCIAL"]

            );


          // Naturaleza
          const naturaleza =
            norm(

              p["Naturaleza jurídica"] ??

              p["NATURALEZA_JURIDICA"] ??

              p["Naturaleza Juridica"] ??

              p["Naturaleza"] ??

              p["NATURALEZA"]

            );


          // Estado
          const estado =
            norm(

              p["Estado"] ??

              p["ESTADO"]

            );


          return (

            (
              codigo &&
              codigo.includes(
                query
              )
            )

            ||

            (
              documento &&
              documento.includes(
                query
              )
            )

            ||

            (
              razonSocial &&
              razonSocial.includes(
                query
              )
            )

            ||

            (
              contribuyente &&
              contribuyente.includes(
                query
              )
            )

            ||

            (
              naturaleza &&
              naturaleza.includes(
                query
              )
            )

            ||

            (
              estado &&
              estado.includes(
                query
              )
            )

          );

        }


        // =================================================
        // 3. CONTRIBUYENTES ACTIVOS
        // PERSONA JURÍDICA
        // =================================================

        if (

          CONTRIB_JURIDICA_DATA &&

          Array.isArray(
            CONTRIB_JURIDICA_DATA.features
          ) &&

          results.length < 10

        ) {


          for (
            const f
            of CONTRIB_JURIDICA_DATA.features
          ) {


            const p =
              f.properties || {};


            if (
              !matchContrib(
                p
              )
            ) {

              continue;

            }


            const center =
              getPointLngLat(
                f
              );


            const razon =

              p["Razón social"] ??

              p["RAZON_SOCIAL"] ??

              p["Razon Social"] ??

              p["Contribuyente"] ??

              p["NOMBRE"] ??

              "N/A";


            results.push({

              type:
                "Feature",

              geometry:
                f.geometry,

              center:
                center,

              properties: {

                ...p,

                // IMPORTANTE:
                // diferenciamos jurídica y natural
                // para saber qué highlight utilizar.
                __tipo:
                  "CONTRIB_JURIDICA"

              },

              place_name:

                `Contribuyentes activos: ${
                  razon.toString()
                }`,

              text:
                razon.toString(),

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
        // 4. CONTRIBUYENTES ACTIVOS
        // PERSONA NATURAL
        // =================================================

        if (

          CONTRIB_NATURAL_DATA &&

          Array.isArray(
            CONTRIB_NATURAL_DATA.features
          ) &&

          results.length < 10

        ) {


          for (
            const f
            of CONTRIB_NATURAL_DATA.features
          ) {


            const p =
              f.properties || {};


            if (
              !matchContrib(
                p
              )
            ) {

              continue;

            }


            const center =
              getPointLngLat(
                f
              );


            const razon =

              p["Razón social"] ??

              p["RAZON_SOCIAL"] ??

              p["Razon Social"] ??

              p["Contribuyente"] ??

              p["NOMBRE"] ??

              p["Nombre"] ??

              "N/A";


            results.push({

              type:
                "Feature",

              geometry:
                f.geometry,

              center:
                center,

              properties: {

                ...p,

                __tipo:
                  "CONTRIB_NATURAL"

              },

              place_name:

                `Contribuyentes activos: ${
                  razon.toString()
                }`,

              text:
                razon.toString(),

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
        // DEVOLVER RESULTADOS
        // =================================================

        return results;

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
// PARTE 4C — FINAL
// RESULTADO DEL BUSCADOR + CARGA FINAL
// =====================================================


// =====================================================
// CUANDO EL USUARIO SELECCIONA UN RESULTADO
// =====================================================

geocoder.on(
  "result",
  (e) => {


    const r =
      e.result;


    if (
      !r
    ) {

      return;

    }


    // =================================================
    // IDENTIFICAR TIPO DE RESULTADO
    // =================================================

    const tipo =
      r.properties?.__tipo;


    // =================================================
    // COORDENADA DEL RESULTADO
    // =================================================

    const lngLat =

      r.center ||

      getPointLngLat(
        r
      );


    // =================================================
    // POSIBLE RECAUDO ICA
    // =================================================

    if (
      tipo === "ICA"
    ) {


      // ===============================================
      // LIMPIAR SELECCIONES ANTERIORES
      // Y MARCAR SOLO ESTE ELEMENTO
      // ===============================================

      setSingleHighlight(

        "highlight_ica",

        r

      );


      // ===============================================
      // ACERCAR AL RESULTADO
      // ===============================================

      map.flyTo({

        center:
          lngLat,

        zoom:
          18

      });


      // ===============================================
      // POPUP
      // ===============================================

      popup

        .setLngLat(
          lngLat
        )

        .setHTML(

          popupHTMLICA(

            r.properties || {},

            lngLat

          )

        )

        .addTo(map);


      ensurePopupVisibleSmart();


      return;

    }


    // =================================================
    // LETREROS ENCONTRADOS
    // =================================================

    if (
      tipo === "COINCIDEN"
    ) {


      // ===============================================
      // SELECCIÓN ÚNICA
      // ===============================================

      setSingleHighlight(

        "highlight_coinciden",

        r

      );


      // ===============================================
      // ACERCAR
      // ===============================================

      map.flyTo({

        center:
          lngLat,

        zoom:
          18

      });


      // ===============================================
      // POPUP
      // ===============================================

      popup

        .setLngLat(
          lngLat
        )

        .setHTML(

          popupHTMLCoinciden(

            r.properties || {},

            lngLat

          )

        )

        .addTo(map);


      ensurePopupVisibleSmart();


      return;

    }


    // =================================================
    // CONTRIBUYENTE ACTIVO
    // PERSONA JURÍDICA
    // =================================================

    if (
      tipo ===
      "CONTRIB_JURIDICA"
    ) {


      // ===============================================
      // SELECCIÓN ÚNICA
      // ===============================================

      setSingleHighlight(

        "highlight_contrib_juridica",

        r

      );


      // ===============================================
      // ACERCAR
      // ===============================================

      map.flyTo({

        center:
          lngLat,

        zoom:
          18

      });


      // ===============================================
      // POPUP SIMPLIFICADO
      // ===============================================

      popup

        .setLngLat(
          lngLat
        )

        .setHTML(

          popupHTMLContribActivos(

            r.properties || {},

            lngLat

          )

        )

        .addTo(map);


      ensurePopupVisibleSmart();


      return;

    }


    // =================================================
    // CONTRIBUYENTE ACTIVO
    // PERSONA NATURAL
    // =================================================

    if (
      tipo ===
      "CONTRIB_NATURAL"
    ) {


      // ===============================================
      // SELECCIÓN ÚNICA
      // ===============================================

      setSingleHighlight(

        "highlight_contrib_natural",

        r

      );


      // ===============================================
      // ACERCAR
      // ===============================================

      map.flyTo({

        center:
          lngLat,

        zoom:
          18

      });


      // ===============================================
      // POPUP SIMPLIFICADO
      // ===============================================

      popup

        .setLngLat(
          lngLat
        )

        .setHTML(

          popupHTMLContribActivos(

            r.properties || {},

            lngLat

          )

        )

        .addTo(map);


      ensurePopupVisibleSmart();


      return;

    }

  }

);


// =====================================================
// CARGA FINAL DE TODAS LAS CAPAS
// =====================================================

map.on(
  "style.load",
  () => {


    // =================================================
    // 1. PREDIOS
    // =================================================

    addPrediosBase();


    // =================================================
    // 2. POSIBLE RECAUDO ICA
    //
    // Esta función también ejecuta el zoom inicial
    // automático a la extensión de esta capa.
    // =================================================

    addICALayer();


    // =================================================
    // 3. LETREROS ENCONTRADOS
    // =================================================

    addCoincidenLayer();


    // =================================================
    // 4. CONTRIBUYENTES ACTIVOS
    // PERSONA JURÍDICA
    // =================================================

    addContribJuridicaLayer();


    // =================================================
    // 5. CONTRIBUYENTES ACTIVOS
    // PERSONA NATURAL
    // =================================================

    addContribNaturalLayer();


    // =================================================
    // ESPERAR A QUE LAS CAPAS EXISTAN
    // =================================================

    setTimeout(
      () => {


        try {


          // ===========================================
          // ORDENAR CAPAS
          // ===========================================

          applyFixedOrder();


          // ===========================================
          // CONSTRUIR LEYENDA
          // ===========================================

          buildLegend();


        } catch (error) {


          console.error(

            "Error configurando orden o leyenda:",

            error

          );


        }

      },

      650

    );

  }

);
