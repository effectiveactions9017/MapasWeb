// Usar token propio de Mapbox (NO TOCAR)
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w';

// Mapa base (NO TOCAR token/style)
const map = new mapboxgl.Map({
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-76.62000, 7.88400], // queda igual (luego auto-centra al predial)
    zoom: 14,
    pitch: 0,
    bearing: 0,
    container: 'map',
    antialias: true
});

let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

// ✅ ÚNICO archivo predial (ruta mínima)
const PREDIAL_FILE = 'PREDIOS_SESQUILE_URB.geojson';
const PREDIAL_URL = `./src/data/${PREDIAL_FILE}`;

// Función para agregar la capa predial (mínimo cambio)
function addPredialLayer() {
    fetch(PREDIAL_URL)
        .then((response) => response.json())
        .then((data) => {

            // Source único
            map.addSource('predios', {
                type: 'geojson',
                data: data
            });

            // Capa fill
            map.addLayer({
                id: 'predios_fill',
                source: 'predios',
                type: 'fill',
                minzoom: 12,
                paint: {
                    'fill-color': '#2ec4b6',
                    'fill-opacity': 0.45,
                    'fill-outline-color': '#ffffff'
                }
            });

            // Capa line
            map.addLayer({
                id: 'predios_line',
                source: 'predios',
                type: 'line',
                minzoom: 12,
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 0.6
                }
            });

            // ✅ Auto-centrar al dataset completo (Turf ya lo tienes en el HTML)
            const bounds = turf.bbox(data); // [minX, minY, maxX, maxY]
            map.fitBounds(bounds, { padding: 40 });

        })
        .catch((error) => console.error('Error cargando predial:', error));
}

// Cargar capa cuando el mapa esté listo
map.on('load', () => {
    addPredialLayer();
});


// ✅ Geocoder: buscar por CUALQUIER atributo del predio
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    placeholder: 'Buscar predio (cédula, nombre, NPN, etc.)',
    localGeocoderOnly: true,

    localGeocoder: function (query) {
        const matchingFeatures = [];
        const q = (query || '').toLowerCase().trim();
        if (!q) return matchingFeatures;

        // Buscar dentro del source 'predios'
        const features = map.querySourceFeatures('predios');

        features.forEach((feature) => {
            const props = feature.properties || {};

            // Buscar en TODOS los campos del predio
            const hit = Object.values(props).some(v =>
                v !== null && v !== undefined && v.toString().toLowerCase().includes(q)
            );

            if (hit) {
                // Un nombre bonito para mostrar en resultados (si existe alguno)
                const label =
                    props.CEDULA_CATASTRAL ||
                    props.CEDULA ||
                    props.NPN ||
                    props.MATRICULA ||
                    props.PROPIETARIO ||
                    'Predio';

                matchingFeatures.push({
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: feature.properties,
                    place_name: String(label),
                    place_type: ['predio'],
                    center: turf.centroid(feature).geometry.coordinates
                });
            }
        });

        return matchingFeatures;
    }
});

// Agregar el Geocoder al mapa
map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl());

// Al seleccionar resultado: zoom + popup + ficha
geocoder.on('result', (e) => {
    const result = e.result;
    if (!result || !result.geometry) return;

    // Zoom al polígono
    const bounds = turf.bbox(result);
    map.fitBounds(bounds, { padding: 40 });

    const properties = result.properties || {};
    const coordinates = (result.center && result.center.length === 2)
        ? result.center
        : turf.centroid(result).geometry.coordinates;

    // Mostrar propiedades en la caja derecha (todas)
    const infoBox = document.querySelector('.info-content');
    if (infoBox) {
        const rows = Object.keys(properties)
            .sort()
            .map(k => `<div><strong>${k}:</strong> ${properties[k] ?? 'N/A'}</div>`)
            .join('');

        infoBox.innerHTML = rows || 'Sin atributos';
    }

    // Popup simple
    const popupContent = `
        <strong>Predio seleccionado</strong><br>
        <a style="font-size:9px;">&#9400 EffectiveActions</a>
    `;

    popup
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
});
