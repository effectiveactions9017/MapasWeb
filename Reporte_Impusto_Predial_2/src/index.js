// =====================================================
// ✅ Predial Sesquilé - Mapbox GL JS (ACTUALIZADO)
// ✅ Mapa base SATELITAL
// ✅ Vista inicial automática de TODO el municipio
// ✅ Búsqueda por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios
// ✅ POPUP SOLO POR CLICK + SELECCIÓN DEL BUSCADOR
// ✅ Destino eliminado del popup
// ✅ Dirección agregada y formateada
// ✅ Street View
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';


// =====================================================
// MAPA
// =====================================================

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [-73.79724, 5.04463],
  zoom: 11,
  pitch: 0,
  bearing: 0,
  container: 'map',
  antialias: true
});


// =====================================================
// POPUP
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
// FORMATEAR DIRECCIÓN
// =====================================================

function formatearDireccion(direccion) {

  // Si no hay dirección
  if (
    direccion === null ||
    direccion === undefined ||
    direccion === ''
  ) {
    return 'N/A';
  }


  // Limpiar espacios
  let dir = direccion
    .toString()
    .trim()
    .replace(/\s+/g, ' ');


  // ===================================================
  // IDENTIFICAR TIPO DE VÍA
  // ===================================================

  dir = dir
    .replace(/^C\s+/i, 'Calle ')
    .replace(/^CL\s+/i, 'Calle ')
    .replace(/^CLL\s+/i, 'Calle ')
    .replace(/^CR\s+/i, 'Carrera ')
    .replace(/^CRA\s+/i, 'Carrera ')
    .replace(/^KR\s+/i, 'Carrera ')
    .replace(/^K\s+/i, 'Carrera ');


  // ===================================================
  // FORMATEAR NOMENCLATURA
  //
  // Ejemplo:
  // Calle 8 3 35
  //
  // Resultado:
  // Calle 8 # 3-35
  //
  // También conserva lo que exista después:
  // Calle 8 7 39 Lo 4 LA GLORIA
  // →
  // Calle 8 # 7-39 Lo 4 LA GLORIA
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


  // Limpiar espacios nuevamente
  dir = dir
    .replace(/\s+/g, ' ')
    .trim();


  return dir;
}


// =====================================================
// STREET VIEW
// Obtener coordenada representativa
// =====================================================

function getFeatureLngLat(
  feature,
  fallbackLngLat = null
) {

  // ===================================================
  // 1. SI VIENE DEL CLICK
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
  // 2. SI LA GEOMETRÍA ES UN PUNTO
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
  // 3. SI ES POLÍGONO
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

  }

  catch (e) {}


  // ===================================================
  // RESPALDO
  // ===================================================

  return [
    -73.79724,
    5.04463
  ];

}


// =====================================================
// URL STREET VIEW
// =====================================================

function streetViewUrl([lng, lat]) {

  return (
    `https://www.google.com/maps/@?api=1` +
    `&map_action=pano` +
    `&viewpoint=${lat},${lng}`
  );

}


// =====================================================
// CONSTRUIR POPUP
// =====================================================

function buildPopupFromFields(
  feature,
  lngLatForPopup,
  popupFields,
  lngLatForSV
) {

  const props =
    feature.properties || {};


  const popupContent =
    popupFields

      .map((field) => {


        let value =
          props?.[field.key];


        // =============================================
        // DIRECCIÓN
        // =============================================

        if (
          field.key === 'DIRECCION' &&
          value !== null &&
          value !== undefined
        ) {

          value =
            formatearDireccion(value);

        }


        // =============================================
        // ÁREA
        // =============================================

        if (
          field.key === 'Shape_Area' &&
          value !== null &&
          value !== undefined
        ) {

          const numero =
            Number(value);


          value =
            isNaN(numero)

              ? value

              : Math
                  .round(numero)
                  .toLocaleString('es-CO');

        }


        // =============================================
        // AVALÚO 2026
        // =============================================

        if (
          field.key === 'AVALUO 2026' &&
          value !== null &&
          value !== undefined &&
          value !== ''
        ) {

          const n =
            Number(value);


          value =
            isNaN(n)

              ? value

              : n.toLocaleString(
                  'es-CO'
                );

        }


        // =============================================
        // CONSTRUIR FILA
        // =============================================

        return (
          `<strong>${field.label}:</strong> ` +
          `${value ?? 'N/A'}`
        );

      })

      .join('<br>');


  // ===================================================
  // BOTÓN STREET VIEW
  // ===================================================

  const svBtn = `

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

  `;


  // ===================================================
  // MOSTRAR POPUP
  // ===================================================

  popup

    .setLngLat(
      lngLatForPopup
    )

    .setHTML(

      `${popupContent}
       ${svBtn}
       <br>
       <a style="font-size:9px;">
         &#9400 EffectiveActions
       </a>`

    )

    .addTo(map);

}


// =====================================================
// FUNCIÓN PARA AGREGAR LA CAPA
// =====================================================

function addLayer(
  geojsonFile,
  sourceId,
  layerId,
  color,
  popupFields
) {


  fetch(
    `../src/data/${geojsonFile}`
  )


    .then(
      (response) =>
        response.json()
    )


    .then((data) => {


      // =================================================
      // GUARDAR DATASET PREDIAL
      // =================================================

      if (
        sourceId === 'predios_ssk'
      ) {


        PREDIOS_DATA =
          data;


        // ===============================================
        // VISTA INICIAL:
        // MOSTRAR TODO EL MUNICIPIO
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

        }

        catch (error) {

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

      }

      else {


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
          // Así los predios aparecen también
          // cuando vemos todo Sesquilé.


          paint: {

            'fill-color':
              color,

            'fill-opacity':
              0.75,

            'fill-outline-color':
              '#ffffff'

          }

        });

      }


      // =================================================
      // QUITAR EVENTOS ANTERIORES
      // =================================================

      try {

        map.off(
          'mousemove',
          layerId
        );

      }

      catch (e) {}


      try {

        map.off(
          'mouseenter',
          layerId
        );

      }

      catch (e) {}


      try {

        map.off(
          'mouseleave',
          layerId
        );

      }

      catch (e) {}


      try {

        map.off(
          'click',
          layerId
        );

      }

      catch (e) {}


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


      // =================================================
      // POPUP SOLO POR CLICK
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


          const svLngLat =

            getFeatureLngLat(

              feature,

              e.lngLat

            );


          buildPopupFromFields(

            feature,

            e.lngLat,

            popupFields,

            svLngLat

          );

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
// CARGAR CAPA PREDIAL + RESALTADO
// =====================================================

map.on('style.load', () => {


  // ===================================================
  // CAPA DE PREDIOS
  // ===================================================

  addLayer(

    'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',

    'predios_ssk',

    'predios_ssk_layer',

    '#2ec4b6',

    [

      {
        label: 'Código',
        key: 'codigo'
      },

      // ===============================================
      // NUEVO: DIRECCIÓN
      // Se formatea automáticamente con
      // formatearDireccion() de la Parte 1
      // ===============================================

      {
        label: 'Dirección',
        key: 'DIRECCION'
      },

      {
        label: 'Nombre',
        key: 'NOMBRE'
      },

      {
        label: 'Documento',
        key: 'NUMERO_DOCUMENTO'
      },

      {
        label: 'Avalúo 2026',
        key: 'AVALUO 2026'
      },

      {
        label: 'Área (㎡)',
        key: 'Shape_Area'
      }

    ]

  );


  // ===================================================
  // SOURCE PARA RESALTAR PREDIOS
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
  // RELLENO AMARILLO DEL PREDIO SELECCIONADO
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
  // BORDE AMARILLO DEL PREDIO SELECCIONADO
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

});


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


        // =============================================
        // NORMALIZAR TEXTO BUSCADO
        // =============================================

        const q =

          (query || '')

            .toString()
            .toLowerCase()
            .trim();


        if (!q) {

          return matchingFeatures;

        }


        // =============================================
        // OBTENER TODOS LOS PREDIOS
        // =============================================

        const features =

          (
            PREDIOS_DATA &&
            Array.isArray(
              PREDIOS_DATA.features
            )
          )

            ? PREDIOS_DATA.features

            : [];


        // Si todavía no cargó el GeoJSON
        if (!features.length) {

          return matchingFeatures;

        }


        // =============================================
        // RECORRER TODOS LOS PREDIOS
        // =============================================

        features.forEach(
          (feature) => {


            const props =
              feature.properties ||
              {};


            // =========================================
            // CAMPOS PARA BÚSQUEDA
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


            // =========================================
            // SI HAY COINCIDENCIA
            // =========================================

            if (match) {


              // =======================================
              // CENTRO DEL PREDIO
              // =======================================

              const centro =

                turf
                  .centroid(feature)
                  .geometry
                  .coordinates;


              // =======================================
              // VALORES ORIGINALES
              // =======================================

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


              // =======================================
              // IDENTIFICAR POR QUÉ CAMPO COINCIDIÓ
              // =======================================

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


              // =======================================
              // COPIAR PROPIEDADES
              // =======================================

              const props2 = {

                ...props,

                __matchField:
                  matchField,

                __matchValue:
                  matchValue

              };


              // =======================================
              // AGREGAR RESULTADO
              // =======================================

              matchingFeatures.push({

                type:
                  'Feature',

                geometry:
                  feature.geometry,

                properties:
                  props2,


                // Texto que aparece en los resultados
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

            }

          }

        );


        // =============================================
        // MÁXIMO 10 RESULTADOS
        // =============================================

        return (
          matchingFeatures
            .slice(0, 10)
        );

      }

  });


// =====================================================
// AGREGAR BUSCADOR AL MAPA
// =====================================================

map.addControl(
  geocoder,
  'top-left'
);


// =====================================================
// CONTROLES DE NAVEGACIÓN
// =====================================================

map.addControl(
  new mapboxgl.NavigationControl()
);
// =====================================================
// AL SELECCIONAR UN RESULTADO DEL BUSCADOR
// =====================================================

geocoder.on('result', (e) => {


  // ===================================================
  // OBTENER RESULTADO
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
  // PROPIEDADES DEL RESULTADO
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
  // NORMALIZAR VALORES
  // ===================================================

  const normLocal =
    (v) =>

      (
        v ??
        ''
      )

        .toString()
        .toLowerCase()
        .replace(/\s+/g, '')
        .trim();


  // ===================================================
  // OBTENER TODOS LOS PREDIOS
  // ===================================================

  const features =

    (
      PREDIOS_DATA &&
      Array.isArray(
        PREDIOS_DATA.features
      )
    )

      ? PREDIOS_DATA.features

      : [];


  // ===================================================
  // PREDIOS QUE SE VAN A RESALTAR
  // ===================================================

  let toHighlight =
    [];


  // ===================================================
  // SI LA BÚSQUEDA FUE POR DOCUMENTO O CÓDIGO
  // BUSCAR TODOS LOS PREDIOS COINCIDENTES
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
      normLocal(
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

              ? p.NUMERO_DOCUMENTO

              : p.codigo;


          return (
            normLocal(v) ===
            mv
          );

        }
      );

  }


  // ===================================================
  // SI NO HAY GRUPO DE PREDIOS
  // USAR SOLO EL RESULTADO SELECCIONADO
  // ===================================================

  if (
    !toHighlight.length
  ) {

    toHighlight =
      [result];

  }


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
  // RESALTAR PREDIO(S) EN AMARILLO
  // ===================================================

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


  // ===================================================
  // ZOOM AUTOMÁTICO AL RESULTADO
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


  }

  catch (error) {


    console.error(
      'Error haciendo zoom al predio:',
      error
    );


  }


  // ===================================================
  // CAMPOS DEL POPUP
  // ===================================================
  //
  // IMPORTANTE:
  // DESTINO ya NO aparece.
  //
  // DIRECCION sí aparece y será procesada
  // automáticamente por formatearDireccion()
  // de la Parte 1.
  // ===================================================

  const popupFields = [

    {
      label:
        'Código',

      key:
        'codigo'
    },


    {
      label:
        'Dirección',

      key:
        'DIRECCION'
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


  // ===================================================
  // STREET VIEW
  // ===================================================
  //
  // Calcular el centro del conjunto de predios
  // seleccionados.
  // ===================================================

  const b =
    turf.bbox(
      fc
    );


  const svCenter = [

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

  const center =

    result.center

    ||

    turf
      .centroid(
        result
      )
      .geometry
      .coordinates;


  // ===================================================
  // CREAR FEATURE-LIKE PARA REUTILIZAR
  // buildPopupFromFields()
  // ===================================================

  const featureLike = {

    properties:
      properties

  };


  // ===================================================
  // MOSTRAR POPUP
  // ===================================================

  buildPopupFromFields(

    featureLike,

    center,

    popupFields,

    svCenter

  );


}); // FIN DEL EVENTO geocoder.on('result')
