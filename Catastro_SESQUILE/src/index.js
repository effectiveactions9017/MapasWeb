// =====================================================
// ✅ Visor Predial Sesquilé - Mapbox GL JS
// ✅ Mapa base SATELITAL
// ✅ Vista inicial automática de TODO el municipio
// ✅ Búsqueda local por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Compatible con TERRI+ Copilot / PostGIS / GeoJSON IA
// ✅ Popup: código, dirección, nombre, documento, avalúo, área
// ✅ Dirección con nomenclatura mejorada
// ✅ Street View
// =====================================================


// =====================================================
// MAPBOX TOKEN
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';


// =====================================================
// CREAR MAPA
// =====================================================

const map = new mapboxgl.Map({

  // 🛰️ MAPA SATELITAL
  style: 'mapbox://styles/mapbox/satellite-streets-v12',

  center: [-73.79724, 5.04463],

  // Zoom temporal mientras carga el GeoJSON
  zoom: 11,

  pitch: 0,

  bearing: 0,

  container: 'map',

  antialias: true

});


// =====================================================
// EXPONER MAPA PARA TERRI+ COPILOT / BRIDGE
// =====================================================

window.map = map;


// =====================================================
// POPUP GLOBAL
// =====================================================

let popup = new mapboxgl.Popup({

  closeButton: true,

  closeOnClick: true,

  className: 'custom-popup'

});


// =====================================================
// DATASET COMPLETO PARA BÚSQUEDAS
// =====================================================

let PREDIOS_DATA = null;


// =====================================================
// HELPERS
// =====================================================


// =====================================================
// FORMATEAR AVALÚO
// =====================================================

function formatAvaluo(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return 'N/A';

  }


  const n =
    Number(value);


  return isNaN(n)

    ? String(value)

    : n.toLocaleString('es-CO');

}


// =====================================================
// FORMATEAR ÁREA
// =====================================================

function formatArea(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {

    return 'N/A';

  }


  const n =
    Number(value);


  return isNaN(n)

    ? String(value)

    : Math
        .round(n)
        .toLocaleString('es-CO');

}


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

    .replace(/\s+/g, '')

    .trim();

}


// =====================================================
// FORMATEAR DIRECCIÓN CATASTRAL
// =====================================================

function formatearDireccion(direccion) {


  // ===================================================
  // SIN INFORMACIÓN
  // ===================================================

  if (
    direccion === null ||
    direccion === undefined ||
    direccion === ''
  ) {

    return 'N/A';

  }


  // ===================================================
  // LIMPIAR ESPACIOS
  // ===================================================

  let dir = direccion

    .toString()

    .trim()

    .replace(/\s+/g, ' ');


  // ===================================================
  // TIPOS DE VÍA
  // ===================================================

  dir = dir

    .replace(/^CLL\s+/i, 'Calle ')

    .replace(/^CL\s+/i, 'Calle ')

    .replace(/^C\s+/i, 'Calle ')

    .replace(/^CRA\s+/i, 'Carrera ')

    .replace(/^CR\s+/i, 'Carrera ')

    .replace(/^KR\s+/i, 'Carrera ')

    .replace(/^K\s+/i, 'Carrera ');


  // ===================================================
  // NOMENCLATURA URBANA
  //
  // C 8 3 35
  // ↓
  // Calle 8 # 3-35
  //
  // C 8 7 39 Lo 4 LA GLORIA
  // ↓
  // Calle 8 # 7-39 Lote 4 LA GLORIA
  // ===================================================

  dir = dir.replace(

    /^(Calle|Carrera)\s+(\d+[A-Za-z]?)\s+(\d+[A-Za-z]?)\s+(\d+[A-Za-z]?)(.*)$/i,

    '$1 $2 # $3-$4$5'

  );


  // ===================================================
  // COMPLEMENTOS
  // ===================================================

  dir = dir

    .replace(/\bLo\b/gi, 'Lote')

    .replace(/\bLt\b/gi, 'Lote')

    .replace(/\bIn\b/gi, 'Interior')

    .replace(/\bInt\b/gi, 'Interior');


  // ===================================================
  // LIMPIEZA FINAL
  // ===================================================

  dir = dir

    .replace(/\s+/g, ' ')

    .trim();


  return dir;

}


// =====================================================
// PUNTO REPRESENTATIVO PARA STREET VIEW
// =====================================================

function getFeatureLngLat(
  feature,
  fallbackLngLat = null
) {


  // ===================================================
  // SI VIENE DEL CLICK
  // ===================================================

  if (

    fallbackLngLat &&

    typeof fallbackLngLat.lng === 'number' &&

    typeof fallbackLngLat.lat === 'number'

  ) {

    return [

      fallbackLngLat.lng,

      fallbackLngLat.lat

    ];

  }


  // ===================================================
  // SI ES UNA GEOMETRÍA POINT
  // ===================================================

  const c =
    feature?.geometry?.coordinates;


  if (

    Array.isArray(c) &&

    c.length >= 2 &&

    c[0] != null &&

    c[1] != null &&

    typeof c[0] === 'number' &&

    typeof c[1] === 'number'

  ) {

    return [

      Number(c[0]),

      Number(c[1])

    ];

  }


  // ===================================================
  // SI ES POLÍGONO
  // ===================================================

  try {


    const pt =

      turf

        .pointOnFeature(feature)

        .geometry

        .coordinates;


    return [

      Number(pt[0]),

      Number(pt[1])

    ];


  } catch (e) {}


  // ===================================================
  // COORDENADA DE RESPALDO
  // ===================================================

  return [

    -73.79724,

    5.04463

  ];

}


// =====================================================
// STREET VIEW URL
// =====================================================

function streetViewUrl([lng, lat]) {

  return (

    `https://www.google.com/maps/@?api=1` +

    `&map_action=pano` +

    `&viewpoint=${lat},${lng}`

  );

}


// =====================================================
// POPUP
// Compatible con GitHub + GeoJSON IA/PostGIS
// =====================================================

function buildPopupHTML(
  props,
  lngLat = null,
  extraHTML = ''
) {


  props =
    props || {};


  // ===================================================
  // CÓDIGO
  // ===================================================

  const codigo =

    props.codigo ??

    props.CODIGO ??

    props.numero_predial ??

    props.NUMERO_PREDIAL ??

    'N/A';


  // ===================================================
  // DIRECCIÓN
  // ===================================================

  const direccionOriginal =

    props.DIRECCION ??

    props.direccion ??

    props.DIRECCIÓN ??

    props.dirección ??

    '';


  const direccion =

    formatearDireccion(
      direccionOriginal
    );


  // ===================================================
  // NOMBRE / PROPIETARIO
  // ===================================================

  const nombre =

    props.NOMBRE ??

    props.nombre ??

    props.propietario ??

    props.PROPIETARIO ??

    'N/A';


  // ===================================================
  // DOCUMENTO
  // ===================================================

  const documento =

    props.NUMERO_DOCUMENTO ??

    props.documento ??

    props.DOCUMENTO ??

    props.identificacion ??

    props.IDENTIFICACION ??

    'N/A';


  // ===================================================
  // AVALÚO
  // ===================================================

  const avaluo =

    props['AVALUO 2026'] ??

    props.avaluo_2026 ??

    props.AVALUO_2026 ??

    props.avaluo ??

    props.AVALUO ??

    null;


  // ===================================================
  // ÁREA
  // ===================================================

  const area =

    props.Shape_Area ??

    props['AREA DE TERRENO'] ??

    props.area_terreno ??

    props.AREA_TERRENO ??

    props.area ??

    props.AREA ??

    null;


  const avaluoTxt =
    formatAvaluo(avaluo);


  const areaTxt =
    formatArea(area);


  // ===================================================
  // STREET VIEW
  // ===================================================

  const svBtn =

    lngLat

      ? `

        <div style="margin-top:10px;">

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

      `

      : '';


  // ===================================================
  // HTML DEL POPUP
  //
  // DESTINO FUE ELIMINADO
  // ===================================================

  return `

    <strong>Código:</strong> ${codigo}<br>

    <strong>Dirección:</strong> ${direccion}<br>

    <strong>Nombre:</strong> ${nombre}<br>

    <strong>Documento:</strong> ${documento}<br>

    <strong>Avalúo 2026:</strong> ${avaluoTxt}<br>

    <strong>Área (㎡):</strong> ${areaTxt}<br>

    ${extraHTML}

    ${svBtn}

    <br>

    <a style="font-size:9px;">
      &#9400; EffectiveActions
    </a>

  `;

}


// =====================================================
// FUNCIÓN PARA AGREGAR CAPA GEOJSON
// =====================================================

function addLayer(
  geojsonFile,
  sourceId,
  layerId,
  baseColor
) {


  fetch(
    `../src/data/${geojsonFile}`
  )


    .then((response) => {


      if (!response.ok) {

        throw new Error(
          `Error HTTP ${response.status} cargando ${geojsonFile}`
        );

      }


      return response.json();

    })


    .then((data) => {


      // =================================================
      // DATASET PREDIAL
      // =================================================

      if (
        sourceId === 'predios_ssk'
      ) {


        PREDIOS_DATA =
          data;


        // ===============================================
        // MOSTRAR TODO SESQUILÉ AL ABRIR
        // ===============================================

        try {


          if (

            data &&

            Array.isArray(
              data.features
            ) &&

            data.features.length > 0

          ) {


            const municipioBounds =
              turf.bbox(data);


            if (

              Array.isArray(
                municipioBounds
              ) &&

              municipioBounds.length === 4 &&

              municipioBounds.every(
                Number.isFinite
              )

            ) {


              map.fitBounds(

                municipioBounds,

                {

                  padding:
                    40,

                  duration:
                    1200

                }

              );

            }

          }


        } catch (error) {


          console.error(

            'Error ajustando la vista del municipio:',

            error

          );


        }

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
              'geojson',

            data:
              data

          }

        );

      }


      // =================================================
      // CAPA PREDIAL
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
            'fill',


          // No usamos minzoom.
          // Los predios deben verse también
          // cuando se visualiza todo el municipio.


          paint: {


            // ===========================================
            // SIMBOLOGÍA ORIGINAL
            //
            // SIN NOMBRE / SIN REGISTRO R1 = NARANJA
            // CON REGISTRO = COLOR BASE
            // ===========================================

            'fill-color': [

              'case',

              [
                '==',

                [
                  'coalesce',

                  ['get', 'NOMBRE'],

                  ''
                ],

                ''
              ],

              '#ffb703',

              baseColor

            ],


            'fill-opacity':
              0.75,


            'fill-outline-color':
              '#ffffff'

          }

        });

      }


      // =================================================
      // LIMPIAR EVENTOS ANTERIORES
      // =================================================

      try {

        map.off(
          'click',
          layerId
        );

      } catch (e) {}


      try {

        map.off(
          'mouseenter',
          layerId
        );

      } catch (e) {}


      try {

        map.off(
          'mouseleave',
          layerId
        );

      } catch (e) {}


      // =================================================
      // CLICK SOBRE PREDIO
      // =================================================

      map.on(

        'click',

        layerId,

        (e) => {


          const feature =

            e.features &&

            e.features[0];


          if (!feature) {

            return;

          }


          const props =

            feature.properties ||

            {};


          const lngLatClick =
            e.lngLat;


          // Resaltar grupo
          highlightGroupFromFeature(
            feature
          );


          // Street View
          const svLngLat =

            getFeatureLngLat(

              feature,

              lngLatClick

            );


          // Popup
          popup

            .setLngLat(
              lngLatClick
            )

            .setHTML(

              buildPopupHTML(

                props,

                svLngLat

              )

            )

            .addTo(map);

        }

      );


      // =================================================
      // CURSOR
      // =================================================

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

    })


    // ===================================================
    // ERROR DE CARGA
    // ===================================================

    .catch((err) => {


      console.error(

        'Error cargando GeoJSON:',

        err

      );


    });

}
// =====================================================
// FUENTE + CAPAS DE RESALTADO
// =====================================================

function ensureHighlightLayers() {


  // ===================================================
  // SOURCE DE RESALTADO
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
  // BORDE AMARILLO
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

        'line-width':
          4

      }

    });

  }

}


// =====================================================
// ACTUALIZAR RESALTADO
// =====================================================

function setHighlight(
  featuresArr
) {


  const fc = {

    type:
      'FeatureCollection',

    features:
      featuresArr || []

  };


  const hlSource =

    map.getSource(
      'predios_highlight'
    );


  if (
    hlSource
  ) {

    hlSource.setData(
      fc
    );

  }

}


// =====================================================
// RESALTAR GRUPO DE PREDIOS
// =====================================================

function highlightGroupFromFeature(
  feature
) {


  const props =

    feature.properties ||

    {};


  const features =

    PREDIOS_DATA &&

    Array.isArray(
      PREDIOS_DATA.features
    )

      ? PREDIOS_DATA.features

      : [];


  // ===================================================
  // SI NO HAY DATASET
  // ===================================================

  if (
    !features.length
  ) {


    setHighlight(
      [feature]
    );


    return;

  }


  // ===================================================
  // IDENTIFICADORES
  // ===================================================

  const codigo =

    norm(
      props.codigo
    );


  const doc =

    norm(

      props.NUMERO_DOCUMENTO ??

      props.documento

    );


  let group =
    [];


  // ===================================================
  // AGRUPAR POR DOCUMENTO
  // ===================================================

  if (
    doc
  ) {


    group =

      features.filter(
        (f) => {


          const p =

            f.properties ||

            {};


          return (

            norm(

              p.NUMERO_DOCUMENTO ??

              p.documento

            )

            ===

            doc

          );

        }

      );

  }


  // ===================================================
  // SI NO HAY DOCUMENTO:
  // AGRUPAR POR CÓDIGO
  // ===================================================

  else if (
    codigo
  ) {


    group =

      features.filter(
        (f) =>

          norm(
            f.properties?.codigo
          )

          ===

          codigo

      );

  }


  // ===================================================
  // SI NO HAY GRUPO:
  // USAR SOLO EL PREDIO SELECCIONADO
  // ===================================================

  if (
    !group.length
  ) {


    group =
      [feature];

  }


  // ===================================================
  // RESALTAR
  // ===================================================

  setHighlight(
    group
  );


  // ===================================================
  // ZOOM AL GRUPO
  // ===================================================

  try {


    const bounds =

      turf.bbox({

        type:
          'FeatureCollection',

        features:
          group

      });


    map.fitBounds(

      bounds,

      {

        padding:
          40

      }

    );


  } catch (error) {


    console.error(

      'Error haciendo zoom al grupo de predios:',

      error

    );


  }

}


// =====================================================
// CARGAR CAPA PREDIAL + RESALTADO
// =====================================================

map.on(
  'style.load',
  () => {


    // =================================================
    // CAPA PREDIAL
    // =================================================

    addLayer(

      'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',

      'predios_ssk',

      'predios_ssk_layer',

      '#2ec4b6'

    );


    // =================================================
    // CAPAS DE RESALTADO
    // =================================================

    ensureHighlightLayers();


    // =================================================
    // CONTROLES DE NAVEGACIÓN
    // =================================================

    map.addControl(

      new mapboxgl.NavigationControl()

    );

  }

);


// =====================================================
// GEOCODER / BUSCADOR LOCAL
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
    // FUNCIÓN DE BÚSQUEDA
    // =================================================

    localGeocoder:
      function (query) {


        const matchingFeatures =
          [];


        const q =

          (query || '')

            .toString()

            .toLowerCase()

            .trim();


        // =============================================
        // SIN TEXTO
        // =============================================

        if (
          !q
        ) {

          return matchingFeatures;

        }


        // =============================================
        // OBTENER PREDIOS
        // =============================================

        const features =

          PREDIOS_DATA &&

          Array.isArray(
            PREDIOS_DATA.features
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

        for (
          const feature
          of features
        ) {


          const props =

            feature.properties ||

            {};


          // ===========================================
          // CAMPOS DE BÚSQUEDA
          // ===========================================

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

              props.nombre ??

              ''
            )

              .toString()

              .toLowerCase();


          const documento =

            (
              props.NUMERO_DOCUMENTO ??

              props.documento ??

              ''
            )

              .toString()

              .toLowerCase();


          // ===========================================
          // COINCIDENCIA
          // ===========================================

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

            continue;

          }


          // ===========================================
          // CENTRO DEL PREDIO
          // ===========================================

          const centro =

            turf

              .centroid(feature)

              .geometry

              .coordinates;


          // ===========================================
          // TEXTOS ORIGINALES
          // ===========================================

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

              props.nombre ??

              ''
            )

              .toString()

              .trim();


          const docTxt =

            (
              props.NUMERO_DOCUMENTO ??

              props.documento ??

              ''
            )

              .toString()

              .trim();


          // ===========================================
          // IDENTIFICAR CAMPO DE COINCIDENCIA
          // ===========================================

          let matchField =
            null;


          let matchValue =
            null;


          // Código
          if (

            codigo &&

            codigo.includes(q)

          ) {


            matchField =
              'codigo';


            matchValue =
              codTxt;

          }


          // Documento
          else if (

            documento &&

            documento.includes(q)

          ) {


            matchField =
              'NUMERO_DOCUMENTO';


            matchValue =
              docTxt;

          }


          // Nombre
          else if (

            nombre &&

            nombre.includes(q)

          ) {


            matchField =
              'NOMBRE';


            matchValue =
              nomTxt;

          }


          // ===========================================
          // PROPIEDADES DEL RESULTADO
          // ===========================================

          const props2 = {

            ...props,

            __matchField:
              matchField,

            __matchValue:
              matchValue

          };


          // ===========================================
          // AGREGAR RESULTADO
          // ===========================================

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

              `Nombre: ${
                nomTxt || 'N/A'
              } | ` +

              `Doc: ${
                docTxt || 'N/A'
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


          // ===========================================
          // MÁXIMO 10 RESULTADOS
          // ===========================================

          if (
            matchingFeatures.length >= 10
          ) {

            break;

          }

        }


        return matchingFeatures;

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
// SELECCIÓN DESDE EL BUSCADOR
// =====================================================

geocoder.on('result', (e) => {

  // ===================================================
  // RESULTADO
  // ===================================================

  const result =
    e.result;


  if (
    !result ||
    !result.geometry
  ) {

    return;

  }


  // ===================================================
  // PROPIEDADES
  // ===================================================

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


  // ===================================================
  // OBTENER TODOS LOS PREDIOS
  // ===================================================

  const features =

    PREDIOS_DATA &&

    Array.isArray(
      PREDIOS_DATA.features
    )

      ? PREDIOS_DATA.features

      : [];


  // ===================================================
  // PREDIOS A RESALTAR
  // ===================================================

  let toHighlight =
    [];


  // ===================================================
  // SI LA BÚSQUEDA FUE POR DOCUMENTO O CÓDIGO
  // BUSCAR TODOS LOS PREDIOS RELACIONADOS
  // ===================================================

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
            f.properties ||
            {};


          const v =

            matchField ===
              'NUMERO_DOCUMENTO'

              ? (
                  p.NUMERO_DOCUMENTO ??
                  p.documento
                )

              : p.codigo;


          return (
            norm(v) ===
            mv
          );

        }

      );

  }


  // ===================================================
  // SI NO ENCUENTRA GRUPO
  // UTILIZAR SOLO EL RESULTADO
  // ===================================================

  if (
    !toHighlight.length
  ) {


    toHighlight = [

      {

        type:
          'Feature',

        geometry:
          result.geometry,

        properties:
          properties

      }

    ];

  }


  // ===================================================
  // RESALTAR
  // ===================================================

  setHighlight(
    toHighlight
  );


  // ===================================================
  // CREAR FEATURE COLLECTION
  // ===================================================

  const fc = {

    type:
      'FeatureCollection',

    features:
      toHighlight

  };


  // ===================================================
  // ZOOM AL PREDIO O GRUPO
  // ===================================================

  try {


    const bounds =
      turf.bbox(
        fc
      );


    map.fitBounds(

      bounds,

      {

        padding:
          40

      }

    );


  } catch (error) {


    console.error(

      'Error haciendo zoom al resultado:',

      error

    );


  }


  // ===================================================
  // OBTENER CÓDIGOS DE PREDIOS VINCULADOS
  // ===================================================

  const codigos =

    toHighlight

      .map(
        (f) =>

          (
            f.properties?.codigo ??
            ''
          )

            .toString()

            .trim()
      )

      .filter(
        Boolean
      );


  // ===================================================
  // LISTA DE PREDIOS VINCULADOS
  // ===================================================

  const listaCodigos =

    codigos.length

      ? `

        <div style="
          margin-top:8px;
          padding-top:7px;
          border-top:1px solid rgba(255,255,255,0.25);
        ">

          <strong>
            Predios vinculados (${codigos.length}):
          </strong>

          <br>

          ${

            codigos

              .slice(0, 10)

              .join('<br>')

          }

          ${

            codigos.length > 10

              ? '<br>…'

              : ''

          }

        </div>

      `

      : '';


  // ===================================================
  // CENTRO DEL GRUPO PARA STREET VIEW
  // ===================================================

  const b =
    turf.bbox(
      fc
    );


  const center = [

    (
      b[0] +
      b[2]
    ) / 2,

    (
      b[1] +
      b[3]
    ) / 2

  ];


  // ===================================================
  // POSICIÓN DEL POPUP
  // ===================================================

  let popupCenter;


  if (
    result.center &&
    Array.isArray(result.center)
  ) {

    popupCenter =
      result.center;

  } else {

    try {

      popupCenter =

        turf

          .centroid(result)

          .geometry

          .coordinates;

    } catch (error) {

      popupCenter =
        center;

    }

  }


  // ===================================================
  // MOSTRAR POPUP
  //
  // buildPopupHTML() de la Parte 1 se encarga de:
  //
  // - Código
  // - Dirección formateada
  // - Nombre
  // - Documento
  // - Avalúo 2026
  // - Área
  // - Predios vinculados
  // - Street View
  //
  // DESTINO NO APARECE
  // ===================================================

  popup

    .setLngLat(
      popupCenter
    )

    .setHTML(

      buildPopupHTML(

        properties,

        center,

        listaCodigos

      )

    )

    .addTo(map);


}); // FIN geocoder.on('result')
