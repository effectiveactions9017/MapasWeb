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

// Popup general
let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'custom-popup'
});

// ------------------------
//    CLASIFICACIÓN
// ------------------------

map.on('style.load', () => {

    // Fuente: Clasificación Plusvalía
    map.addSource('c_plusvalia', {
        type: 'geojson',
        data: '../src/data/Clasificación_Plusvalia.geojson'
    });

    // Layer categorizado según CLASIFICACION_PLUSVALIA
    map.addLayer({
        id: 'layer_plusvalia',
        source: 'c_plusvalia',
        type: 'fill',
        paint: {
            'fill-color': [
                'match',
                ['get', 'CLASIFICACION_PLUSVALIA'],

                'Muy Alta', '#e74c3c',      // rojo
                'Alta',     '#e67e22',      // naranja
                'Media',    '#f1c40f',      // amarillo
                'Baja',     '#2ecc71',      // verde
                'Muy Baja', '#3498db',      // azul

                '#bdc3c7'   // color default si no coincide
            ],
            'fill-opacity': 0.75,
            'fill-outline-color': '#ffffff'
        }
    });

    // POPUP
    map.on('mousemove', 'layer_plusvalia', (e) => {
        const feature = e.features[0];

        popup
            .setLngLat(e.lngLat)
            .setHTML(`
                <strong>Clasificación:</strong> ${feature.properties.CLASIFICACION_PLUSVALIA}<br>
                <a style="font-size:9px;">&#9400 EffectiveActions</a>
            `)
            .addTo(map);
    });

    map.on('mouseleave', 'layer_plusvalia', () => {
        popup.remove();
    });

});
