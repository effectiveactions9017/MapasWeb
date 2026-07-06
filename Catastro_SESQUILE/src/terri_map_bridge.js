/* ==========================================================
   TERRI MAP BRIDGE
   Permite que TERRI Copilot controle mapas dentro de iframe
   Compatible con Mapbox GL JS y MapLibre GL JS
========================================================== */

let TERRI_AI_SOURCE_ID = "terri_ai_resultado";
let TERRI_AI_FILL_LAYER_ID = "terri_ai_poligonos";
let TERRI_AI_LINE_LAYER_ID = "terri_ai_lineas";
let TERRI_AI_POINT_LAYER_ID = "terri_ai_puntos";

let TERRI_AI_LAST_GEOJSON = null;

let TERRI_BASE_LAYERS_ATENUADAS = [
    "predios_ssk_layer"
];


// ==========================================================
// Avisar al visor principal que el bridge cargó
// ==========================================================

window.parent.postMessage({
    tipo: "TERRI_BRIDGE_CARGADO",
    mensaje: "Bridge cargado correctamente en el mapa."
}, "*");

console.log("🌉 TERRI Map Bridge cargado correctamente.");


// ==========================================================
// Escuchar mensajes desde TERRI Copilot
// ==========================================================

window.addEventListener("message", function(event) {

    console.log("📩 TERRI Bridge recibió mensaje:", event.data);

    const mensaje = event.data;

    if (!mensaje || !mensaje.tipo) return;

    window.parent.postMessage({
        tipo: "TERRI_BRIDGE_RECIBIO",
        mensaje: mensaje.tipo
    }, "*");

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

    window.parent.postMessage({
        tipo: "TERRI_BRIDGE_ERROR",
        mensaje: "No se encontró instancia de mapa Mapbox/MapLibre."
    }, "*");

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

        window.parent.postMessage({
            tipo: "TERRI_BRIDGE_ERROR",
            mensaje: "GeoJSON vacío recibido desde TERRI."
        }, "*");

        return;

    }

    TERRI_AI_LAST_GEOJSON = geojson;

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
                "fill-opacity": 0.60,
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

    atenuarCapasBaseTerri(mapInstance);
    activarPopupTerri(mapInstance);
    zoomResultadoTerri();

    console.log("✅ TERRI Copilot dibujó GeoJSON en el mapa:", geojson);

    window.parent.postMessage({
        tipo: "TERRI_BRIDGE_DIBUJO",
        total: geojson.features.length
    }, "*");

}


// ==========================================================
// Detectar tipo de geometría
// ==========================================================

function detectarTipoGeometria(geojson) {

    if (!geojson.features || geojson.features.length === 0) return null;

    const featureConGeom = geojson.features.find(
        f => f.geometry && f.geometry.type
    );

    return featureConGeom ? featureConGeom.geometry.type : null;

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

    restaurarCapasBaseTerri(mapInstance);

    TERRI_AI_LAST_GEOJSON = null;

}


// ==========================================================
// Atenuar / restaurar capas base
// ==========================================================

function atenuarCapasBaseTerri(mapInstance) {

    TERRI_BASE_LAYERS_ATENUADAS.forEach(layerId => {

        if (mapInstance.getLayer(layerId)) {

            try {
                mapInstance.setPaintProperty(layerId, "fill-opacity", 0.10);
            } catch (e) {
                console.warn("⚠️ No se pudo atenuar la capa:", layerId);
            }

        }

    });

}


function restaurarCapasBaseTerri(mapInstance) {

    TERRI_BASE_LAYERS_ATENUADAS.forEach(layerId => {

        if (mapInstance.getLayer(layerId)) {

            try {
                mapInstance.setPaintProperty(layerId, "fill-opacity", 0.75);
            } catch (e) {
                console.warn("⚠️ No se pudo restaurar la capa:", layerId);
            }

        }

    });

}


// ==========================================================
// Zoom al resultado
// ==========================================================

function zoomResultadoTerri() {

    const mapInstance = obtenerMapaTerri();

    if (!mapInstance) return;

    if (
        !TERRI_AI_LAST_GEOJSON ||
        !TERRI_AI_LAST_GEOJSON.features ||
        !TERRI_AI_LAST_GEOJSON.features.length
    ) return;

    const BoundsClass = obtenerBoundsClass();

    if (!BoundsClass) return;

    const bounds = new BoundsClass();

    TERRI_AI_LAST_GEOJSON.features.forEach(feature => {
        expandirBoundsTerri(bounds, feature.geometry);
    });

    if (bounds.isEmpty && bounds.isEmpty()) return;

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

        try {
            mapInstance.off("click", layerId, popupTerriHandler);
            mapInstance.off("mouseenter", layerId, mouseEnterTerriHandler);
            mapInstance.off("mouseleave", layerId, mouseLeaveTerriHandler);
        } catch (e) {}

        mapInstance.on("click", layerId, popupTerriHandler);
        mapInstance.on("mouseenter", layerId, mouseEnterTerriHandler);
        mapInstance.on("mouseleave", layerId, mouseLeaveTerriHandler);

    });

}


function popupTerriHandler(e) {

    const mapInstance = obtenerMapaTerri();
    const PopupClass = obtenerPopupClass();

    if (!mapInstance || !PopupClass) return;

    const feature = e.features && e.features[0];

    if (!feature) return;

    const props = feature.properties || {};
    const lngLat = [e.lngLat.lng, e.lngLat.lat];

    if (typeof buildPopupHTML === "function") {

        new PopupClass({
            closeButton: true,
            closeOnClick: true,
            className: "custom-popup"
        })
            .setLngLat(e.lngLat)
            .setHTML(buildPopupHTML(props, lngLat))
            .addTo(mapInstance);

        return;

    }

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

}


function mouseEnterTerriHandler() {

    const mapInstance = obtenerMapaTerri();

    if (mapInstance) {
        mapInstance.getCanvas().style.cursor = "pointer";
    }

}


function mouseLeaveTerriHandler() {

    const mapInstance = obtenerMapaTerri();

    if (mapInstance) {
        mapInstance.getCanvas().style.cursor = "";
    }

}


// ==========================================================
// Exponer funciones globales
// ==========================================================

window.dibujarGeoJSONDesdeTerri = dibujarGeoJSONDesdeTerri;
window.limpiarResultadoTerri = limpiarResultadoTerri;
window.zoomResultadoTerri = zoomResultadoTerri;
