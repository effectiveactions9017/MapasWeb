// Usar token propio de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-73.79724, 5.04463], // Sesquilé
    zoom: 15,
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

// Función para agregar capas
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

            // Evento mousemove para mostrar popups
            map.on('mousemove', layerId, (e) => {
                const feature = e.features[0];
                const popupContent = popupFields
                    .map((field) => {
                        let value = feature.properties[field.key];

                        // Redondear el valor de 'shap_Ar' sin decimales
                        if (field.key === 'shap_Ar' && value !== null && value !== undefined) {
                            value = Math.round(value);
                        }

                        return `<strong>${field.label}:</strong> ${value ?? 'N/A'}`;
                    })
                    .join('<br>');

                popup
                    .setLngLat(e.lngLat)
                    .setHTML(`${popupContent}<br><a style="font-size:9px;">&#9400 EffectiveActions</a>`)
                    .addTo(map);
            });

            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        })
        .catch((err) => console.error("Error cargando GeoJSON:", err));
}

// Cargar capa predial (solo esta)
map.on('style.load', () => {

    addLayer(
        'PREDIOS_MUNICIPIO_SESQUILE_JOIN_4326.geojson',
        'predios_ssk',
        'predios_ssk_layer',
        '#2ec4b6',
        [
            { label: 'Código', key: 'codigo' },
            { label: 'Destino', key: 'DESTINO' },
            { label: 'Nombre', key: 'NOMBRE' },
            { label: 'Avalúo 2026', key: 'AVALUO2026' }, 
            { label: 'Área (㎡)', key: 'shap_Ar' }
        ]
    );
});

// Configurar el Geocoder para buscar en el source 'predios_ssk' usando el campo 'codigo'
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    localGeocoder: function (query) {
        const matchingFeatures = [];
        const q = (query || '').toLowerCase().trim();
        if (!q) return matchingFeatures;

        const features = map.querySourceFeatures('predios_ssk');

        features.forEach((feature) => {
            const props = feature.properties || {};
            const cod = (props.codigo ?? '').toString().toLowerCase();

            if (cod && cod.includes(q)) {
                matchingFeatures.push({
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: props,
                    place_name: `Código: ${props.codigo}`,
                    text: props.codigo,
                    center: turf.centroid(feature).geometry.coordinates,
                    place_type: ['place']
                });
            }
        });

        return matchingFeatures;
    },
    placeholder: 'Buscar código',
    localGeocoderOnly: true
});

// Agregar el Geocoder al mapa
map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());

// Hacer zoom al polígono seleccionado y mostrar popup predial
geocoder.on('result', (e) => {
    const result = e.result;

    if (result && result.geometry) {
        const bounds = turf.bbox(result);
        map.fitBounds(bounds, { padding: 20 });

        const coordinates = result.center;
        const properties = result.properties || {};

        const popupContent = `
            <strong>Código:</strong> ${properties.codigo || 'N/A'}<br>
            <strong>Destino:</strong> ${properties.DESTINO || 'N/A'}<br>
            <strong>Nombre:</strong> ${properties.NOMBRE || 'N/A'}<br>
            <strong>Avalúo 2026:</strong> ${properties['AVALUO2026'] || 'N/A'}<br>
            <strong>Área (㎡):</strong> ${Math.round(properties.shap_Ar || 0)}<br>
            <a style="font-size:9px;">&#9400 EffectiveActions</a>
        `;

        popup
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
    }
});
