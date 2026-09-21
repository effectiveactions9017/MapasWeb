// =====================================================
// ✅ Predial Sesquilé - Mapbox GL JS (ACTUALIZADO)
// ✅ Mapa base SATELITAL
// ✅ Vista inicial automática de TODO el municipio
// ✅ Búsqueda por: codigo, NOMBRE, NUMERO_DOCUMENTO
// ✅ Resalta 1 o varios predios
// ✅ POPUP SOLO POR CLICK + SELECCIÓN DEL BUSCADOR
// ✅ Destino eliminado del popup
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
// STREET VIEW
// =====================================================

function getFeatureLngLat(feature, fallbackLngLat = null) {

  // 1. Si viene del click
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
    c[1] != null
  ) {

    return [
      Number(c[0]),
      Number(c[1])
    ];
  }


  // 3. Si es polígono
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


  // Coordenada de respaldo
  return [-73.79724, 5.04463];
}


// =====================================================
// URL STREET VIEW
// =====================================================

function streetViewUrl([lng, lat]) {

  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

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
          `<strong>${field.label}:</strong> ${value ?? 'N/A'}`
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


  popup
    .setLngLat(lngLatForPopup)

    .setHTML(
      `${popupContent}${svBtn}<br>
       <a style="font-size:9px;">&#9400 EffectiveActions</a>`
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

  fetch(`../src/data/${geojsonFile}`)

    .then((response) => response.json())

    .then((data) => {


      // =================================================
      // GUARDAR DATASET PREDIAL
      // + MOSTRAR TODO SESQUILÉ AL INICIAR
      // =================================================

      if (sourceId === 'predios_ssk') {

        PREDIOS_DATA = data;


        // ===============================================
        // VISTA INICIAL DE TODO EL MUNICIPIO
        // ===============================================

        try {

          if (
            data &&
            Array.isArray(data.features) &&
            data.features.length > 0
          ) {

            const municipioBounds =
              turf.bbox(data);


            if (
              Array.isArray(municipioBounds) &&
              municipioBounds.length === 4 &&
              municipioBounds.every(Number.isFinite)
            ) {

              map.fitBounds(
                municipioBounds,
                {
                  padding: 40,
                  duration: 1200
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

      if (map.getSource(sourceId)) {

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

      if (!map.getLayer(layerId)) {

        map.addLayer({

          id: layerId,

          source: sourceId,

          type: 'fill',

          // NO usamos minzoom.
          // Así los predios siguen visibles cuando
          // se muestra todo el municipio.

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
      // QUITAR EVENTOS DE HOVER
      // =================================================

      try {
        map.off('mousemove', layerId);
      } catch (e) {}

      try {
        map.off('mouseenter', layerId);
      } catch (e) {}

      try {
        map.off('mouseleave', layerId);
      } catch (e) {}

      try {
        map.off('click', layerId);
      } catch (e) {}


      // =================================================
      // CURSOR
      // =================================================

      map.on(
        'mouseenter',
        layerId,
        () => {

          map.getCanvas()
            .style.cursor =
            'pointer';

        }
      );


      map.on(
        'mouseleave',
        layerId,
        () => {

          map.getCanvas()
            .style.cursor =
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
      { label: 'Código', key: 'codigo' },
      { label: 'Nombre', key: 'NOMBRE' },
      { label: 'Documento', key: 'NUMERO_DOCUMENTO' },
      { label: 'Avalúo 2026', key: 'AVALUO 2026' },
      { label: 'Área (㎡)', key: 'Shape_Area' }
    ]
  );


  // ===================================================
  // SOURCE PARA RESALTAR PREDIOS
  // ===================================================

  if (!map.getSource('predios_highlight')) {

    map.addSource(
      'predios_highlight',
      {
        type: 'geojson',

        data: {
          type: 'FeatureCollection',
          features: []
        }
      }
    );

  }


  // ===================================================
  // RELLENO AMARILLO DEL PREDIO SELECCIONADO
  // ===================================================

  if (!map.getLayer('predios_highlight_fill')) {

    map.addLayer({
      id: 'predios_highlight_fill',
      type: 'fill',
      source: 'predios_highlight',

      paint: {
        'fill-color': '#ffff00',
        'fill-opacity': 0.30
      }
    });

  }


  // ===================================================
  // BORDE AMARILLO DEL PREDIO SELECCIONADO
  // ===================================================

  if (!map.getLayer('predios_highlight_line')) {

    map.addLayer({
      id: 'predios_highlight_line',
      type: 'line',
      source: 'predios_highlight',

      paint: {
        'line-color': '#ffff00',
        'line-width': 4
      }
    });

  }

});


// =====================================================
// GEOCODER / BUSCADOR LOCAL
// =====================================================

const geocoder = new MapboxGeocoder({

  accessToken: mapboxgl.accessToken,

  mapboxgl: mapboxgl,

  marker: false,

  localGeocoderOnly: true,

  placeholder:
    'Buscar por código, nombre o documento',


  // ===================================================
  // FUNCIÓN DE BÚSQUEDA
  // ===================================================

  localGeocoder: function (query) {


    const matchingFeatures = [];


    // Convertir búsqueda a minúsculas
    const q =
      (query || '')
        .toString()
        .toLowerCase()
        .trim();


    // Si no escribió nada
    if (!q) {

      return matchingFeatures;

    }


    // =================================================
    // OBTENER TODOS LOS PREDIOS
    // =================================================

    const features =

      (
        PREDIOS_DATA &&
        Array.isArray(PREDIOS_DATA.features)
      )

        ? PREDIOS_DATA.features

        : [];


    // Si todavía no cargaron los predios
    if (!features.length) {

      return matchingFeatures;

    }


    // =================================================
    // RECORRER TODOS LOS PREDIOS
    // =================================================

    features.forEach((feature) => {


      const props =
        feature.properties || {};


      // =================================================
      // CAMPOS DE BÚSQUEDA
      // =================================================

      const codigo =

        (props.codigo ?? '')
          .toString()
          .toLowerCase();


      const nombre =

        (props.NOMBRE ?? '')
          .toString()
          .toLowerCase();


      const documento =

        (props.NUMERO_DOCUMENTO ?? '')
          .toString()
          .toLowerCase();


      // =================================================
      // COMPROBAR COINCIDENCIA
      // =================================================

      const match =

        (codigo && codigo.includes(q))

        ||

        (nombre && nombre.includes(q))

        ||

        (documento && documento.includes(q));


      // =================================================
      // SI EXISTE COINCIDENCIA
      // =================================================

      if (match) {


        // ===============================================
        // CENTRO DEL PREDIO
        // ===============================================

        const centro =

          turf
            .centroid(feature)
            .geometry
            .coordinates;


        // ===============================================
        // TEXTOS ORIGINALES
        // ===============================================

        const codTxt =

          (props.codigo ?? '')
            .toString()
            .trim();


        const nomTxt =

          (props.NOMBRE ?? '')
            .toString()
            .trim();


        const docTxt =

          (props.NUMERO_DOCUMENTO ?? '')
            .toString()
            .trim();


        // ===============================================
        // IDENTIFICAR POR QUÉ CAMPO COINCIDIÓ
        // ===============================================

        let matchField = null;

        let matchValue = null;


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


        // ===============================================
        // COPIA DE PROPIEDADES
        // ===============================================

        const props2 = {

          ...props,

          __matchField:
            matchField,

          __matchValue:
            matchValue

        };


        // ===============================================
        // AGREGAR RESULTADO AL BUSCADOR
        // ===============================================

        matchingFeatures.push({

          type: 'Feature',

          geometry:
            feature.geometry,

          properties:
            props2,


          // Texto mostrado en resultados
          place_name:

            `Código: ${codTxt || 'N/A'} | ` +

            `Nombre: ${nomTxt || 'N/A'} | ` +

            `Doc: ${docTxt || 'N/A'}`,


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

    });


    // =================================================
    // MÁXIMO 10 RESULTADOS
    // =================================================

    return matchingFeatures.slice(0, 10);

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

  const result = e.result;


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
  // FUNCIÓN PARA NORMALIZAR VALORES
  // ===================================================

  const normLocal = (v) =>

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
      Array.isArray(PREDIOS_DATA.features)
    )

      ? PREDIOS_DATA.features

      : [];


  // ===================================================
  // PREDIOS A RESALTAR
  // ===================================================

  let toHighlight = [];


  // ===================================================
  // SI LA BÚSQUEDA FUE POR:
  // - DOCUMENTO
  // - CÓDIGO
  //
  // BUSCAR TODOS LOS PREDIOS COINCIDENTES
  // ===================================================

  if (

    (
      matchField === 'NUMERO_DOCUMENTO' ||
      matchField === 'codigo'
    )

    &&

    matchValue

  ) {


    const mv =
      normLocal(matchValue);


    toHighlight =

      features.filter((f) => {


        const p =
          f.properties || {};


        const v =

          matchField === 'NUMERO_DOCUMENTO'

            ? p.NUMERO_DOCUMENTO

            : p.codigo;


        return (
          normLocal(v) === mv
        );

      });

  }


  // ===================================================
  // SI NO ENCUENTRA GRUPO
  // UTILIZAR SOLO EL RESULTADO SELECCIONADO
  // ===================================================

  if (!toHighlight.length) {

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
  // RESALTAR PREDIO(S)
  // ===================================================

  const hlSource =
    map.getSource(
      'predios_highlight'
    );


  if (hlSource) {

    hlSource.setData(fc);

  }


  // ===================================================
  // ZOOM AUTOMÁTICO AL PREDIO BUSCADO
  // ===================================================

  try {

    const bounds =
      turf.bbox(fc);


    map.fitBounds(
      bounds,
      {
        padding: 40
      }
    );

  } catch (error) {

    console.error(
      'Error haciendo zoom al predio:',
      error
    );

  }


  // ===================================================
  // CAMPOS DEL POPUP
  //
  // DESTINO YA NO SE MUESTRA
  // ===================================================

  const popupFields = [

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

  ];


  // ===================================================
  // STREET VIEW
  //
  // Obtener centro del conjunto de predios resaltados
  // ===================================================

  const b =
    turf.bbox(fc);


  const svCenter = [

    (b[0] + b[2]) / 2,

    (b[1] + b[3]) / 2

  ];


  // ===================================================
  // CENTRO PARA MOSTRAR EL POPUP
  // ===================================================

  const center =

    result.center ||

    turf
      .centroid(result)
      .geometry
      .coordinates;


  // ===================================================
  // CREAR OBJETO PARA REUTILIZAR EL POPUP
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


}); // ✅ FIN geocoder.on('result')
