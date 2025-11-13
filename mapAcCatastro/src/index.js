// ==========================================================
// 🌍 VISOR COMPLETO + CAPA DE PLUSVALIA
// ==========================================================

// Usar token propio de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-76.62000, 7.88400],
    zoom: 14,
    pitch: 0,
    bearing: 0,
    container: 'map',
    antialias: true
});

let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'custom-popup'
});

// ----------------------------------------------------------
// FUNCION ORIGINAL PARA CARGAR CAPAS NORMALES
// ----------------------------------------------------------
function addLayer(geojsonFile, sourceId, layerId, color, popupFields) {
    fetch(`../src/data/${geojsonFile}`)
        .then((response) => response.json())
        .then((data) => {
            map.addSource(sourceId, {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                id: layerId,
                source: sourceId,
                type: 'fill',
                minzoom: 12,
                paint: {
                    'fill-color': color,
                    'fill-opacity': 0.75,
                    "fill-outline-color": '#ffffff'
                }
            });

            map.on('mousemove', layerId, (e) => {
                const feature = e.features[0];
                const popupContent = popupFields
                    .map((field) => {
                        let value = feature.properties[field.key];
                        if (field.key === 'area') value = Math.round(value);
                        return `<strong>${field.label}:</strong> ${value}`;
                    })
                    .join('<br>');

                popup.setLngLat(e.lngLat)
                    .setHTML(`${popupContent}<br><a style="font-size:9px;">© EffectiveActions</a>`)
                    .addTo(map);
            });

            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        });
}

// ----------------------------------------------------------
// CARGAR TODAS TUS CAPAS NORMALES
// ----------------------------------------------------------

map.on('style.load', () => {

    addLayer('dem_parcial.geojson', 'dem_p', 'dem_parcial', '#F5B041', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Área parcial (㎡)', key: 'area' }
    ]);

    addLayer('dem_total.geojson', 'dem_t', 'dem_total', '#E74C3C', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Área demolida (㎡)', key: 'area' }
    ]);

    addLayer('cons_aumento.geojson', 'cons_a', 'c_aumento', '#F7DC6F', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Incremento de área (㎡)', key: 'area' }
    ]);

    addLayer('cons_nuevas.geojson', 'cons_n', 'c_nuevas', '#A569BD', [
        { label: 'Código', key: 'PK_PREDIOS' },
        { label: 'Área (㎡)', key: 'area' }
    ]);

    addLayer('cons_viejas.geojson', 'cons_v', 'c_viejas', '#AAB7B8', [
        { label: 'Código', key: 'CODIGO_CON' },
        { label: 'Número de pisos', key: 'NUMERO_PIS' },
        { label: 'Área (㎡)', key: 'area' }
    ]);

    // Orden de capas
    map.on('sourcedata', () => {
        if (map.getLayer('c_viejas')) {
            map.moveLayer('c_viejas', 'dem_parcial');
        }
    });

    // ------------------------------------------------------
    // 🚀 AGREGAR CAPA DE PLUSVALÍA
    // ------------------------------------------------------
    fetch('../src/data/Clasificacion_Plusvalia.geojson')
        .then(res => res.json())
        .then(data => {

            map.addSource('plus_src', {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                id: 'plus_layer',
                type: 'fill',
                source: 'plus_src',
                minzoom: 12,
                paint: {
                    'fill-opacity': 0.75,
                    'fill-outline-color': '#000',
                    'fill-color': [
                        'match',
                        ['get', 'CLASIFICACION_PLUSVALIA'],
                        'Muy alta', '#d73027',
                        'Alta',     '#f46d43',
                        'Media',    '#fdae61',
                        'Baja',     '#66c2a5',
                        'Muy baja', '#3288bd',
                        '#cccccc'
                    ]
                }
            });

            // POPUP
            map.on('mousemove', 'plus_layer', (e) => {
                const p = e.features[0].properties;

                const html = `
                    <strong>Manzana:</strong> ${p.ID_MANZANA}<br>
                    <strong>Clasificación:</strong> ${p.CLASIFICACION_PLUSVALIA}<br>
                    <strong>Predios:</strong> ${p.n_predios}<br>
                    <a style="font-size:9px;">© EffectiveActions</a>
                `;

                popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
            });

            map.on('mouseleave', 'plus_layer', () => popup.remove());
        });
});

// ----------------------------------------------------------
// CONFIGURACIÓN GEOCODER (NO SE TOCA)
// ----------------------------------------------------------

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    localGeocoder: function (query) {
        const features = map.querySourceFeatures('cons_v');
        const matching = [];

        features.forEach((feature) => {
            const props = feature.properties;
            if (props.CODIGO_CON && props.CODIGO_CON.toLowerCase().includes(query.toLowerCase())) {
                matching.push({
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: props,
                    place_name: `Código: ${props.CODIGO_CON}`,
                    text: props.CODIGO_CON,
                    center: turf.centroid(feature).geometry.coordinates,
                    place_type: ['place']
                });
            }
        });
        return matching;
    },
    placeholder: 'Buscar código catastral',
    localGeocoderOnly: true
});

map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());
