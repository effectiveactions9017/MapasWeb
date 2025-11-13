// Token de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

// Crear mapa
const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-76.62000, 7.88400],
    zoom: 14,
    container: 'map',
    antialias: true
});

// Popup
let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'custom-popup'
});

// =========================================
//      CARGAR Y CLASIFICAR PLUSVALÍA
// =========================================

map.on('style.load', () => {

    // Fuente (archivo sin tilde)
    map.addSource('c_plusvalia', {
        type: 'geojson',
        data: '../src/data/Clasificacion_Plusvalia.geojson'
    });

    // Capa categorizada por CLASIFICACION_PLUSVALIA
    map.addLayer({
        id: 'layer_plusvalia',
        source: 'c_plusvalia',
        type: 'fill',
        paint: {
            'fill-color': [
                'match',
                ['get', 'CLASIFICACION_PLUSVALIA'],

                'Muy Alta', '#e74c3c',     // rojo
                'Alta',     '#e67e22',     // naranja
                'Media',    '#f1c40f',     // amarillo
                'Baja',
