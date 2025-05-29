// use own access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';
const map = new mapboxgl.Map({
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-76.63290738, 7.88156614], 
    zoom: 16.5,
    pitch: 60,
    bearing: -17.6,
    container: 'map',
    antialias: true
});

let geojsonData = null; // Variable para almacenar los datos del GeoJSON
let codigoConValues = [];

map.on('style.load', () => {
    // Cargar datos de los edificios
    // Insert the layer beneath any symbol layer.
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
    ).id;

    fetch('../src/data/test_dataset.geojson') // cambiar por ruta relativa
        .then(response => response.json())
        .then(data => {
            geojsonData = data;

            map.addSource('buildings', {
                type: 'geojson',
                data: geojsonData
            });

            // Añadir capa de edificios 3D
            map.addLayer({
                id: '3d-buildings',
                source: 'buildings',
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': '#FFBD33',
                    'fill-extrusion-height': ['get', 'max'],
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': 0.7
                }
            },
            labelLayerId
            );

            // Obtener valores únicos de CODIGO_CON para autocompletar
            const uniqueCodigoCon = new Set();

            geojsonData.features.forEach((feature) => {
                uniqueCodigoCon.add(feature.properties.CODIGO_CON);
            });

            codigoConValues = Array.from(uniqueCodigoCon);

            // Llenar el datalist con los valores únicos
            const dataList = document.getElementById('codigo-con-list');
            codigoConValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                dataList.appendChild(option);
            });

            // Evento click en los edificios para pop-up
            map.on('click', '3d-buildings', (e) => {
                const feature = e.features[0];
                const codigoCon = feature.properties.CODIGO_CON;
                const altura = feature.properties.max;
                const pisos = feature.properties.no_pisos;

                const alturaRedondeada = Math.round(altura * 10) / 10;

                const popupContent = 
                    `<strong>Código:</strong> ${codigoCon}<br>
                    <strong>Altura:</strong> ${alturaRedondeada} m, ${pisos} pisos`;

                new mapboxgl.Popup({
                    closeButton: false, // Desactivar el botón de cerrar
                    className: 'custom-popup'
                })
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map);
            });

            // Cambiar cursor al pasar sobre los edificios
            map.on('mouseenter', '3d-buildings', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', '3d-buildings', () => {
                map.getCanvas().style.cursor = '';
            });
        });

    // Búsqueda por CODIGO_CON
    document.getElementById('search-button').addEventListener('click', () => {
        const searchValue = document.getElementById('search-input').value.trim();

        if (geojsonData) {
            const foundFeature = geojsonData.features.find(
                (feature) => feature.properties.CODIGO_CON === searchValue
            );

            if (foundFeature) {
                // Coordenadas centrales del edificio
                const coordinates = foundFeature.geometry.coordinates[0][0];

                // Sacar el primer punto de las coordenadas del polígono
                const lngLat = coordinates[0]; // Obtener el primer punto del polígono

                // Hacer zoom a un nivel fijo (por ejemplo, 19) centrando el edificio
                map.flyTo({
                    center: lngLat,
                    zoom: 19, // Ajusta este nivel de zoom según lo que prefieras
                    speed: 0.8, // Controla la velocidad del vuelo
                    curve: 1 // Ajusta la curva del vuelo
                });

                // Mostrar pop-up con la información del edificio
                new mapboxgl.Popup({
                    closeButton: false, // Desactivar el botón de cerrar
                    className: 'custom-popup'
                })
                    .setLngLat(lngLat)
                    .setHTML(
                        `<strong>Código:</strong> ${foundFeature.properties.CODIGO_CON}<br>
                            <strong>Altura:</strong> ${Math.round(foundFeature.properties.max * 10) / 10} m, 
                            ${foundFeature.properties.no_pisos} pisos`
                    )
                    .addTo(map);
            } else {
                alert('No se encontró ningún edificio con ese CODIGO');
            }
        }
    });
});