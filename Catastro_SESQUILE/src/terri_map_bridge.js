/* ==========================================================
   TERRI MAP BRIDGE
   Permite que TERRI Copilot controle mapas dentro de iframe
========================================================== */

let TERRI_AI_SOURCE_ID = "terri_ai_resultado";
let TERRI_AI_FILL_LAYER_ID = "terri_ai_poligonos";
let TERRI_AI_LINE_LAYER_ID = "terri_ai_lineas";
let TERRI_AI_POINT_LAYER_ID = "terri_ai_puntos";


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


function obtenerMapaTerri() {

    if (typeof map !== "undefined") return map;

    if (typeof mapa !== "undefined") return mapa;

    if (typeof window.map !== "undefined") return window.map;

    if (typeof window.mapa !== "undefined") return window.mapa;

    console.error("❌ No se encontró instancia de mapa MapLibre/Mapbox.");
    return null;

}


function dibujarGeoJSONDesdeTerri(geojson) {

    const mapInstance = obtenerMapaTerri();

    if (!mapInstance || !geojson) return;

    limpiarResultadoTerri();

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

}


function detectarTipoGeometria(geojson) {

    if (!geojson.features || geojson.features.length === 0) return null;

    return geojson.features[0].geometry.type;

}


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


function zoomResultadoTerri() {

    const mapInstance = obtenerMapaTerri();

    if (!mapInstance) return;

    const source = mapInstance.getSource(TERRI_AI_SOURCE_ID);

    if (!source || !source._data || !source._data.features.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    source._data.features.forEach(feature => {
        expandirBoundsTerri(bounds, feature.geometry);
    });

    mapInstance.fitBounds(bounds, {
        padding: 50,
        duration: 1000
    });

}


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


function activarPopupTerri(mapInstance) {

    const capas = [
        TERRI_AI_FILL_LAYER_ID,
        TERRI_AI_LINE_LAYER_ID,
        TERRI_AI_POINT_LAYER_ID
    ];

    capas.forEach(layerId => {

        if (!mapInstance.getLayer(layerId)) return;

        mapInstance.on("click", layerId, function(e) {

            const props = e.features[0].properties;

            let html = "<div style='font-size:12px;max-height:220px;overflow:auto;'><table>";

            Object.keys(props).forEach(campo => {
                html += `
                    <tr>
                        <td><b>${campo}</b></td>
                        <td>${props[campo]}</td>
                    </tr>
                `;
            });

            html += "</table></div>";

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(mapInstance);

        });

    });

}