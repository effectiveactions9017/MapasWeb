// Use own access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';
const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-76.63290500, 7.88156614], 
    zoom: 14,
    pitch: 0,
    bearing: 0,
    container: 'map',
    antialias: true
});

let geojsonData = null;
let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'custom-popup'
});

map.on('style.load', () => {
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
    ).id;

    fetch('../src/data/const_year.geojson')
        .then(response => response.json())
        .then(data => {
            geojsonData = data;

            map.addSource('buildings', {
                type: 'geojson',
                data: geojsonData
            });

            map.addLayer({
                id: 'buildings',
                source: 'buildings',
                type: 'fill',
                minzoom: 12,
                paint: {
                    'fill-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'const_year'], // Propiedad del año en el GeoJSON
                        1985, '#D53E4F',   // Magenta oscuro
                        1990, '#F46D43',   // Morado claro
                        1995, '#FDAE61',   // Naranja suave
                        2000, '#FEE08B',   // Durazno claro
                        2005, '#FFFFBF',   // Verde claro
                        2010, '#E6F598',   // Verde medio
                        2015, '#ABDDA4',   // Verde fuerte
                        2020, '#66C2A5',   // Verde oscuro
                        2024, '#3288BD'    // Azul-verde oscuro
                    ],
                    'fill-opacity': 1
                    },
                filter: ['==', ['get', 'const_year'], 1985] // Filtra por el año 1985
            }, labelLayerId);

            // Evento mousemove en los edificios para mostrar popup
            map.on('mousemove', 'buildings', (e) => {
                const feature = e.features[0];
                const year = feature.properties.const_year;
                const area = feature.properties.area_in_meters;
                const areaRedondeada = Math.round(area, 0);

                const popupContent = 
                    `<strong>Año:</strong> ${year}<br>
                    <strong>Área:</strong> ${areaRedondeada} &#x33A1<br>
                    <a style="font-size:9px;">&#9400 EffectiveActions</a>`;

                popup
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map);
            });

            // Cambiar cursor al pasar sobre los edificios
            map.on('mouseenter', 'buildings', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Cerrar popup y restaurar cursor cuando el mouse sale de un edificio
            map.on('mouseleave', 'buildings', () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        });

        const yearSlider = document.getElementById('year-slider');
        const yearLabel = document.getElementById('year-label');

        // Establecer el valor inicial del slider al mínimo (1985)
        yearSlider.value = yearSlider.min;  // Esto pone el slider en el valor mínimo al cargar la página
        
        yearSlider.addEventListener('input', (event) => {
            const selectedYear = event.target.value;
        
            // Actualiza el texto del label
            yearLabel.textContent = `${selectedYear}`;
        
            // Filtra los edificios según el año seleccionado
            map.setFilter('buildings', ['<=', ['get', 'const_year'], parseInt(selectedYear)]);
        });
});