// =====================================================
// ✅ Predial Sesquilé - Mapbox GL JS (ACTUALIZADO)
// ✅ Mapa base SATELITAL
// ✅ Vista inicial automática de TODO el municipio
// ✅ Búsqueda por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios (mismo codigo o documento)
// ✅ POPUP SOLO POR CLICK + SOLO POR SELECCIÓN DEL BUSCADOR
// ✅ Destino NO se muestra en popup
// ✅ Street View en el POPUP
// =====================================================

mapboxgl.accessToken =
  'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [-73.79724, 5.04463],

  // Este zoom es solamente temporal mientras carga el GeoJSON.
  // Después fitBounds mostrará automáticamente todo el municipio.
  zoom: 12,

  pitch: 0,
  bearing: 0,
  container: 'map',
  antialias: true
});


// =====================================================
// POPUP GLOBAL
// =====================================================

let popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: 'custom-popup'
});


// =====================================================
// Guardar dataset completo para búsquedas
// =====================================================

let PREDIOS_DATA = null;


// =====================================================
// HELPERS STREET VIEW
// =====================================================

function getFeatureLngLat(feature, fallbackLngLat = null) {

  // 1. Si viene del evento click, usar ese punto
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


  // 2. Si la geometría es un punto
  const c = feature?.geometry?.coordinates;

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


  // 3. Si es un polígono:
  // obtener un punto representativo dentro del predio
  try {

    const pt =
      turf.pointOnFeature(feature)
        .geometry
        .coordinates;

    return [
      Number(pt[0]),
      Number(pt[1])
    ];

  } catch (e) {}


  // Punto de respaldo
  return [-73.79724, 5.04463];
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
        // ÁREA
        // =============================================

        if (
          field.key === 'Shape_Area' &&
          value !== null &&
          value !== undefined
        ) {

          value =
            Math.round(
              Number(value)
            );
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
              : n.toLocaleString('es-CO');
        }


        return (
          `<strong>${field.label}:</strong> ` +
          `${value ?? 'N/A'}`
        );

      })
      .join('<br>');


  // ===================================================
  // BOTÓN STREET VIEW
  // Por ahora se mantiene exactamente como estaba
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
// FUNCIÓN PARA AGREGAR CAPA
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
      (response) => response.json()
    )

    .then((data) => {


      // =================================================
      // DATASET PREDIAL
      // =================================================

      if (
        sourceId === 'predios_ssk'
      ) {

        PREDIOS_DATA = data;


        // ===============================================
        // ✅ NUEVO:
        // MOSTRAR TODO EL MUNICIPIO AL ABRIR EL VISOR
        // ===============================================

        try {

          // Calcular los límites de TODOS los predios
          const municipioBounds =
            turf.bbox(data);


          // Validar que Turf haya generado
          // coordenadas correctas
          if (
            municipioBounds &&
            municipioBounds.length === 4 &&
            municipioBounds.every(
              Number.isFinite
            )
          ) {

            // Ajustar automáticamente la cámara
            // para mostrar todos los predios
            map.fitBounds(
              municipioBounds,
              {
                padding: 35,
                duration: 1200,

                // Evita acercamientos excesivos
                // en caso de cambiar el GeoJSON
                maxZoom: 16
              }
            );
          }

        } catch (error) {

          console.error(
            'Error ajustando la vista inicial al municipio:',
            error
          );
        }
      }


      // =================================================
      // SOURCE
      // =================================================

      if (
        map.getSource(sourceId)
      ) {

        map
          .getSource(sourceId)
          .setData(data);

      } else {

        map.addSource(
          sourceId,
          {
            type: 'geojson',
            data: data
          }
        );
      }


      // =================================================
      // CAPA PREDIAL
      // =================================================

      if (
        !map.getLayer(layerId)
      ) {

        map.addLayer({

          id: layerId,

          source: sourceId,

          type: 'fill',

          minzoom: 12,

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


      try {

        map.off(
          'click',
          layerId
        );

      } catch (e) {}


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
            .cursor = 'pointer';
        }
      );


      map.on(
        'mouseleave',
        layerId,
        () => {

          map
            .getCanvas()
            .style
            .cursor = '';
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
    // ERROR CARGANDO GEOJSON
    // ===================================================

    .catch((err) => {

      console.error(
        'Error cargando GeoJSON:',
        err
      );

    });
}


// =====================================================
// CARGAR CAPA PREDIAL
// =====================================================

map.on(
  'style.load',
  () => {


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

          type: 'geojson',

          data: {

            type:
              'FeatureCollection',

            features: []

          }

        }
      );
    }


    // ===================================================
    // RELLENO DE RESALTADO
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
    // BORDE DEL RESALTADO
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
);


// =====================================================
// GEOCODER LOCAL
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
      function (query) {


        const matchingFeatures =
          [];


        const q =
          (query || '')
            .toString()
            .toLowerCase()
            .trim();


        if (!q) {

          return matchingFeatures;

        }


        const features =

          (
            PREDIOS_DATA &&
            Array.isArray(
              PREDIOS_DATA.features
            )
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

        features.forEach(
          (feature) => {


            const props =
              feature.properties ||
              {};


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
            // COINCIDENCIA
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
              // TEXTOS
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


              let matchField =
                null;

              let matchValue =
                null;


              // =======================================
              // SABER POR QUÉ CAMPO COINCIDIÓ
              // =======================================

              if (
                codigo &&
                codigo.includes(q)
              ) {

                matchField =
                  'codigo';

                matchValue =
                  codTxt;

              }


              else if (
                documento &&
                documento.includes(q)
              ) {

                matchField =
                  'NUMERO_DOCUMENTO';

                matchValue =
                  docTxt;

              }


              else if (
                nombre &&
                nombre.includes(q)
              ) {

                matchField =
                  'NOMBRE';

                matchValue =
                  nomTxt;

              }


              const props2 = {

                ...props,

                __matchField:
                  matchField,

                __matchValue:
                  matchValue

              };


              // =======================================
              // RESULTADO DEL GEOCODER
              // =======================================

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

            }

          }
        );


        // Máximo 10 resultados
        return (
          matchingFeatures
            .slice(0, 10)
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
// CONTROLES DE NAVEGACIÓN
// =====================================================

map.addControl(
  new mapboxgl.NavigationControl()
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
    // NORMALIZADOR
    // =================================================

    const normLocal =
      (v) =>

        (
          v ??
          ''
        )

          .toString()
          .toLowerCase()
          .replace(
            /\s+/g,
            ''
          )
          .trim();


    const features =

      (
        PREDIOS_DATA &&
        Array.isArray(
          PREDIOS_DATA.features
        )
      )

        ? PREDIOS_DATA.features

        : [];


    let toHighlight =
      [];


    // =================================================
    // BUSCAR TODOS LOS PREDIOS
    // DEL MISMO CÓDIGO O DOCUMENTO
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


    // Si no encuentra grupo,
    // usar solamente el resultado
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
