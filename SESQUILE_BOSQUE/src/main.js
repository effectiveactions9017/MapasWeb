// Agrega tu token de Mapbox (usa el MISMO token del archivo que sí funciona)
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

// Crear el mapa base para "before" (2017)
const beforeMap = new mapboxgl.Map({
    container: 'before',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-73.80, 5.05], // Sesquilé
    zoom: 11,
    maxZoom: 15,
    minZoom: 6,
    customAttribution: '&#9400 EffectiveActions, datos: ESRI Land Cover',
    bounds: [
        [-74.10, 4.80],
        [-73.50, 5.30]
    ],
    fitBoundsOptions: { padding: 15 }
});

// Crear el mapa base para "after" (2024)
const afterMap = new mapboxgl.Map({
    container: 'after',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-73.80, 5.05], // Sesquilé
    zoom: 11,
    maxZoom: 15,
    minZoom: 6,
    customAttribution: '&#9400 EffectiveActions, datos: ESRI Land Cover',
    bounds: [
        [-74.10, 4.80],
        [-73.50, 5.30]
    ],
    fitBoundsOptions: { padding: 15 }
});

// Agregar tilesets a los mapas (SOLO cambiamos los IDs)
beforeMap.on('load', () => {
    beforeMap.addSource('bosques2017', {
        type: 'raster',
        url: 'mapbox://effectiveactions9017.bosques_2017_esriLC_color-7e6vbh',
        tileSize: 256
    });

    beforeMap.addLayer({
        id: 'bosques2017-layer',
        type: 'raster',
        source: 'bosques2017',
        paint: { 'raster-opacity': 1 }
    });
});

afterMap.on('load', () => {
    afterMap.addSource('bosques2024', {
        type: 'raster',
        url: 'mapbox://effectiveactions9017.bosques_2024_esriLC_color-7dr8hx',
        tileSize: 256
    });

    afterMap.addLayer({
        id: 'bosques2024-layer',
        type: 'raster',
        source: 'bosques2024',
        paint: { 'raster-opacity': 1 }
    });
});

// Crear la funcionalidad de comparación (swipe)
new mapboxgl.Compare(beforeMap, afterMap, '#comparison-container');
