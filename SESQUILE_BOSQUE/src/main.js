// Agrega tu token de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

// Crear el mapa base para "before" (2017)
const beforeMap = new mapboxgl.Map({
    container: 'before',
    style: 'mapbox://styles/mapbox/light-v11', // Mapa base
    center: [-74.11, 0.75], // Coordenadas iniciales (Colombia)
    zoom: 7,
    maxZoom: 15,
    minZoom: 6,
    customAttribution: '&#9400 EffectiveActions, datos: ESRI Land Cover',
    bounds: [
        [-75.0818601319999743, 0.0255106350000460],
        [-73.1380698179999627,1.5677558370000499]
    ],
    fitBoundingOptions: {
        padding: 15
    }
});

// Crear el mapa base para "after" (2023)
const afterMap = new mapboxgl.Map({
    container: 'after',
    style: 'mapbox://styles/mapbox/light-v11', // Mapa base
    center: [-74.11, 0.75], // Coordenadas iniciales (Colombia)
    zoom: 7,
    maxZoom: 15,
    minZoom: 6,
    customAttribution: '&#9400 EffectiveActions, datos: ESRI Land Cover',
    bounds: [
        [-75.0818601319999743, 0.0255106350000460],
        [-73.1380698179999627,1.5677558370000499]
    ],
    fitBoundingOptions: {
        padding: 15
    }
});

// Agregar tilesets a los mapas
beforeMap.on('load', () => {
    // Agregar capa raster para los bosques en 2017
    beforeMap.addSource('bosques2017', {
        type: 'raster',
        url: 'mapbox://jorgepatino.7bsorayj', // ID del tileset para 2017
        tileSize: 256
    });

    beforeMap.addLayer({
        id: 'bosques2017-layer',
        type: 'raster',
        source: 'bosques2017',
        paint: {
            'raster-opacity': 1 // Ajusta la opacidad si es necesario
        }
    });
});

afterMap.on('load', () => {
    // Agregar capa raster para los bosques en 2023
    afterMap.addSource('bosques2023', {
        type: 'raster',
        url: 'mapbox://jorgepatino.axptxglb', // ID del tileset para 2023
        tileSize: 256
    });

    afterMap.addLayer({
        id: 'bosques2023-layer',
        type: 'raster',
        source: 'bosques2023',
        paint: {
            'raster-opacity': 1 // Ajusta la opacidad si es necesario
        }
    });
});

// Crear la funcionalidad de comparación (swipe)
const container = '#comparison-container';
new mapboxgl.Compare(beforeMap, afterMap, container, {
    // Activa el swipe con el movimiento del mouse si es necesario
    // mousemove: true
});

// NOTAS:
// Agregar source de los datos (attribution)
