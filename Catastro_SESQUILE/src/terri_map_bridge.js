/* ==========================================================
   TERRI MAP BRIDGE
   Permite que TERRI Copilot controle mapas dentro de iframe
   Compatible con Mapbox GL JS y MapLibre GL JS
========================================================== */

let TERRI_AI_SOURCE_ID = "terri_ai_resultado";
let TERRI_AI_FILL_LAYER_ID = "terri_ai_poligonos";
let TERRI_AI_LINE_LAYER_ID = "terri_ai_lineas";
let TERRI_AI_POINT_LAYER_ID = "terri_ai_puntos";


// ==========================================================
// Escuchar mensajes desde TERRI Copilot
// ==========================================================

window.addEventListener("message", function(event) {

    const mensaje = event.data;

    if (!mensaje || !mensaje.tipo) return;

    if (mensaje.tipo === "TERRI_DIBUJAR_GEOJSON") {
        dibujarGeoJSONDesdeTerri(mensaje.geojson);
    }

    if (mensaje.tipo === "TERRI_LIMPIAR_RESULTADO") {
        limpiarResultadoTerri();
    }

    if (mensaje.tipo === "TERRI_ZOOM_RESULTADO") {
        zoomResultadoTerri();
    }

});


// ==========================================================
// Obtener instancia del mapa
// ==========================================================

function obtenerMapaTerri() {

    if (typeof window.map !== "undefined") return window.map;

    if (typeof map !== "undefined") return map;

    if (typeof window.mapa !== "undefined") return window.mapa;

    if (typeof mapa !== "undefined") return mapa;

    console.error("❌ No se encontró instancia de mapa Mapbox/MapLibre.");
    return null;

}


// ==========================================================
// Obtener clases Mapbox o MapLibre
// ==========================================================

function obtenerBoundsClass() {

    if (window.mapboxgl && window.mapboxgl.LngLatBounds) {
        return window.mapboxgl.LngLatBounds;
    }

    if (window.maplibregl && window.maplibregl.LngLatBounds) {
        return window.maplibregl.LngLatBounds;
    }

    console.error("❌ No se encontró LngLatBounds.");
    return null;

}


function obtenerPopupClass() {

    if (window.mapboxgl && window.mapboxgl.Popup) {
        return window.mapboxgl.Popup;
    }

    if (window.maplibregl && window.maplibregl.Popup) {
        return window.maplibregl.Popup;
    }

    console.error("❌ No se encontró Popup.");
    return null;

}


// ==========================================================
// Dibujar GeoJSON enviado por TERRI Copilot
// ==========================================================

function dibujarGeoJSONDesdeTerri(geojson) {

    const mapInstance = obtenerMapaTerri();

    if (!mapInstance || !geojson) return;

    limpiarResultadoTerri();

    if (!geojson.features || geojson.features.length === 0) {
        console.warn("GeoJSON vacío recibido desde TERRI.");
        return;
    }

    mapInstance.addSource(TERRI_AI_SOURCE_ID, {
        type: "geojson",
        data: geojson
    });

    const tipoGeom = detectarTipoGeometria(geojson);

    if (tipoGeom === "Polygon" || tipoGeom === "MultiPolygon") {

        mapInstance.addLayer({
            id: TERRI_AI_FILL_LAYER_ID,
            type: "fill",
            source: TERRI_AI_SOURCE_ID,
            paint: {
                "fill-color": "#00AEEF",
                "fill-opacity": 0.55,
                "fill-outline-color": "#003B5C"
            }
        });

    }

    if (tipoGeom === "LineString" || tipoGeom === "MultiLineString") {

        mapInstance.addLayer({
            id: TERRI_AI_LINE_LAYER_ID,
            type: "line",
            source: TERRI_AI_SOURCE_ID,
            paint: {
                "line-color": "#FF7A00",
                "line-width": 4
            }
        });

    }

    if (tipoGeom === "Point" || tipoGeom === "MultiPoint") {

        mapInstance.addLayer({
            id: TERRI_AI_POINT_LAYER_ID,
            type: "circle",
            source: TERRI_AI_SOURCE_ID,
            paint: {
                "circle-radius": 7,
                "circle-color": "#FF2D55",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2
            }
        });

    }

    activarPopupTerri(mapInstance);
    zoomResultadoTerri();

    console.log("✅ TERRI Copilot dibujó GeoJSON en el mapa:", geojson);

}


// ==========================================================
// Detectar tipo de geometría
// ==========================================================

function detectarTipoGeometria(geojson) {

    if (!geojson.features || geojson.features.length === 0) return null;

    return geojson.features[0].geometry.type;

}


// ==========================================================
// Limpiar resultado TERRI
// ==========================================================

function limpiarResultadoTerri() {

    const mapInstance = obtenerMapaTerri();

    if (!mapInstance) return;

    const layers = [
        TERRI_AI_FILL_LAYER_ID,
        TERRI_AI_LINE_LAYER_ID,
        TERRI_AI_POINT_LAYER_ID
    ];

    layers.forEach(layerId => {

        if (mapInstance.getLayer(layerId)) {
            mapInstance.removeLayer(layerId);
        }

    });

    if (mapInstance.getSource(TERRI_AI_SOURCE_ID)) {
        mapInstance.removeSource(TERRI_AI_SOURCE_ID);
    }

}


// ==========================================================
// Zoom al resultado
// ==========================================================

function zoomResultadoTerri() {

    const mapInstance = obtenerMapaTerri();

    if (!mapInstance) return;

    const source = mapInstance.getSource(TERRI_AI_SOURCE_ID);

    if (!source || !source._data || !source._data.features.length) return;

    const BoundsClass = obtenerBoundsClass();

    if (!BoundsClass) return;

    const bounds = new BoundsClass();

    source._data.features.forEach(feature => {
        expandirBoundsTerri(bounds, feature.geometry);
    });

    mapInstance.fitBounds(bounds, {
        padding: 50,
        duration: 1000
    });

}


// ==========================================================
// Expandir bounds según geometría
// ==========================================================

function expandirBoundsTerri(bounds, geometry) {

    if (!geometry) return;

    if (geometry.type === "Point") {
        bounds.extend(geometry.coordinates);
    }

    if (geometry.type === "MultiPoint" || geometry.type === "LineString") {
        geometry.coordinates.forEach(coord => bounds.extend(coord));
    }

    if (geometry.type === "MultiLineString" || geometry.type === "Polygon") {
        geometry.coordinates.forEach(linea => {
            linea.forEach(coord => bounds.extend(coord));
        });
    }

    if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach(poligono => {
            poligono.forEach(anillo => {
                anillo.forEach(coord => bounds.extend(coord));
            });
        });
    }

}


// ==========================================================
// Popups del resultado TERRI
// ==========================================================

function activarPopupTerri(mapInstance) {

    const PopupClass = obtenerPopupClass();

    if (!PopupClass) return;

    const capas = [
        TERRI_AI_FILL_LAYER_ID,
        TERRI_AI_LINE_LAYER_ID,
        TERRI_AI_POINT_LAYER_ID
    ];

    capas.forEach(layerId => {

        if (!mapInstance.getLayer(layerId)) return;

        mapInstance.on("click", layerId, function(e) {

            const props = e.features[0].properties || {};

            let html = `
                <div style="font-size:12px;max-height:220px;overflow:auto;">
                <strong>Resultado TERRI+</strong>
                <hr>
                <table>
            `;

            Object.keys(props).forEach(campo => {

                html += `
                    <tr>
                        <td><b>${campo}</b></td>
                        <td>${props[campo]}</td>
                    </tr>
                `;

            });

            html += `
                </table>
                </div>
            `;

            new PopupClass()
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(mapInstance);

        });

    });

}


// ==========================================================
// Exponer funciones globales
// ==========================================================

window.dibujarGeoJSONDesdeTerri = dibujarGeoJSONDesdeTerri;
window.limpiarResultadoTerri = limpiarResultadoTerri;
window.zoomResultadoTerri = zoomResultadoTerri;
