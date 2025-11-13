// =============================
// MAPBOX TOKEN
// =============================
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

// =============================
// CREAR MAPA
// =============================
const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-76.62000, 7.88400],
    zoom: 14,
    container: 'map',
    antialias: true
});

// =============================
// POPUP
// =============================
let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'custom-popup'
});

// =============================
// CARGAR CAPA DE PLUSVALÍA
// =============================
map.on('style.load', () => {

    map.addSource('plusvalia', {
        type: 'geojson',
        data: '../src/data/Clasificacion_Plusvalia.geojson'
    });

    map.addLayer({
        id: 'layer_plusvalia',
        type: 'fill',
        source: 'plusvalia',
        paint: {
            'fill-color': [
                'match',
                ['get', 'CLASIFICACION_PLUSVALIA'],
                'Muy Alta', '#e74c3c',
                'Alta', '#e67e22',
                'Media', '#f1c40f',
                'Baja', '#2ecc71',
                'Muy Baja', '#3498db',
                '#bdc3c7'
            ],
            'fill-opacity': 0.75,
            'fill-outline-color': '#ffffff'
        }
    });

    // POPUP DINÁMICO
    map.on('mousemove', 'layer_plusvalia', (e) => {
        const f = e.features[0];
        popup
            .setLngLat(e.lngLat)
            .setHTML(`
                <strong>Clasificación:</strong> ${f.properties.CLASIFICACION_PLUSVALIA}<br>
                <a style="font-size:9px;">© EffectiveActions</a>
            `)
            .addTo(map);
    });

    map.on('mouseleave', 'layer_plusvalia', () => popup.remove());

});
