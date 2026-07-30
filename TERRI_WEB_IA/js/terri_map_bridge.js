"use strict";


/* ==========================================================
   TERRI MAP BRIDGE
   Permite que TERRI Copilot controle mapas dentro de iframe
   Compatible con Mapbox GL JS y MapLibre GL JS
========================================================== */


const TERRI_AI_SOURCE_ID = "terri_ai_resultado";

const TERRI_AI_FILL_LAYER_ID = "terri_ai_poligonos";

const TERRI_AI_LINE_LAYER_ID = "terri_ai_lineas";

const TERRI_AI_POINT_LAYER_ID = "terri_ai_puntos";


/* ==========================================================
   ESTADO DEL BRIDGE
========================================================== */


let TERRI_POPUP_ACTIVO = null;


/* ==========================================================
   AVISAR QUE EL BRIDGE ESTÁ DISPONIBLE
========================================================== */


window.parent.postMessage(
    {
        tipo: "TERRI_BRIDGE_CARGADO",
        mensaje: "Bridge cargado correctamente en el mapa."
    },
    "*"
);

console.log(
    "🌉 TERRI Map Bridge cargado correctamente."
);


/* ==========================================================
   ESCUCHAR MENSAJES DESDE TERRI+
========================================================== */


window.addEventListener(
    "message",
    function(event) {

        const mensaje = event.data;

        if (
            !mensaje ||
            typeof mensaje !== "object" ||
            !mensaje.tipo
        ) {
            return;
        }

        if (
            mensaje.tipo ===
            "TERRI_DIBUJAR_GEOJSON"
        ) {

            dibujarGeoJSONDesdeTerri(
                mensaje.geojson
            );

            return;
        }

        if (
            mensaje.tipo ===
            "TERRI_LIMPIAR_RESULTADO"
        ) {

            limpiarResultadoTerri();

            return;
        }

        if (
            mensaje.tipo ===
            "TERRI_ZOOM_RESULTADO"
        ) {

            zoomResultadoTerri();
        }

    }
);


/* ==========================================================
   OBTENER INSTANCIA DEL MAPA
========================================================== */


/**
 * Obtiene la instancia del mapa disponible.
 *
 * @returns {Object|null}
 */
function obtenerMapaTerri() {

    if (
        typeof map !== "undefined" &&
        map
    ) {
        return map;
    }

    if (
        typeof mapa !== "undefined" &&
        mapa
    ) {
        return mapa;
    }

    if (window.map) {
        return window.map;
    }

    if (window.mapa) {
        return window.mapa;
    }

    console.error(
        "❌ No se encontró la instancia del mapa."
    );

    return null;

}


/**
 * Obtiene la librería cartográfica disponible.
 *
 * @returns {Object|null}
 */
function obtenerLibreriaMapaTerri() {

    if (
        typeof mapboxgl !== "undefined"
    ) {
        return mapboxgl;
    }

    if (
        typeof maplibregl !== "undefined"
    ) {
        return maplibregl;
    }

    console.error(
        "❌ No se encontró Mapbox GL ni MapLibre GL."
    );

    return null;

}


/* ==========================================================
   DIBUJAR GEOJSON
========================================================== */


/**
 * Dibuja un resultado GeoJSON enviado por TERRI+.
 *
 * @param {Object} geojson
 */
function dibujarGeoJSONDesdeTerri(geojson) {

    const mapInstance =
        obtenerMapaTerri();

    if (
        !mapInstance ||
        !geojson ||
        !Array.isArray(geojson.features)
    ) {

        console.warn(
            "⚠️ No se recibió un GeoJSON válido."
        );

        return;
    }

    limpiarResultadoTerri();

    mapInstance.addSource(
        TERRI_AI_SOURCE_ID,
        {
            type: "geojson",
            data: geojson
        }
    );

    const tiposGeometria =
        detectarTiposGeometria(
            geojson
        );

    if (
        tiposGeometria.has("Polygon") ||
        tiposGeometria.has("MultiPolygon")
    ) {

        agregarCapaPoligonosTerri(
            mapInstance
        );

    }

    if (
        tiposGeometria.has("LineString") ||
        tiposGeometria.has("MultiLineString")
    ) {

        agregarCapaLineasTerri(
            mapInstance
        );

    }

    if (
        tiposGeometria.has("Point") ||
        tiposGeometria.has("MultiPoint")
    ) {

        agregarCapaPuntosTerri(
            mapInstance
        );

    }

    asegurarEstilosPopupTerri();

    activarPopupTerri(
        mapInstance
    );

    zoomResultadoTerri();

}


/* ==========================================================
   DETECTAR GEOMETRÍAS
========================================================== */


/**
 * Detecta todos los tipos geométricos del GeoJSON.
 *
 * @param {Object} geojson
 * @returns {Set<string>}
 */
function detectarTiposGeometria(geojson) {

    const tipos = new Set();

    geojson.features.forEach(
        function(feature) {

            const tipo =
                feature?.geometry?.type;

            if (tipo) {
                tipos.add(tipo);
            }

        }
    );

    return tipos;

}


/* ==========================================================
   CAPA DE POLÍGONOS
========================================================== */


/**
 * Agrega la capa de polígonos TERRI+.
 *
 * @param {Object} mapInstance
 */
function agregarCapaPoligonosTerri(
    mapInstance
) {

    mapInstance.addLayer({
        id: TERRI_AI_FILL_LAYER_ID,
        type: "fill",
        source: TERRI_AI_SOURCE_ID,

        filter: [
            "in",
            ["geometry-type"],
            ["literal", [
                "Polygon",
                "MultiPolygon"
            ]]
        ],

        paint: {
            "fill-color": "#00AEEF",
            "fill-opacity": 0.55,
            "fill-outline-color": "#003B5C"
        }
    });

}


/* ==========================================================
   CAPA DE LÍNEAS
========================================================== */


/**
 * Agrega la capa de líneas TERRI+.
 *
 * @param {Object} mapInstance
 */
function agregarCapaLineasTerri(
    mapInstance
) {

    mapInstance.addLayer({
        id: TERRI_AI_LINE_LAYER_ID,
        type: "line",
        source: TERRI_AI_SOURCE_ID,

        filter: [
            "in",
            ["geometry-type"],
            ["literal", [
                "LineString",
                "MultiLineString"
            ]]
        ],

        paint: {
            "line-color": "#FF7A00",

            "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                2,
                14,
                4,
                18,
                6
            ]
        }
    });

}


/* ==========================================================
   CAPA DE PUNTOS
========================================================== */


/**
 * Agrega la capa de puntos TERRI+.
 *
 * @param {Object} mapInstance
 */
function agregarCapaPuntosTerri(
    mapInstance
) {

    mapInstance.addLayer({
        id: TERRI_AI_POINT_LAYER_ID,
        type: "circle",
        source: TERRI_AI_SOURCE_ID,

        filter: [
            "in",
            ["geometry-type"],
            ["literal", [
                "Point",
                "MultiPoint"
            ]]
        ],

        paint: {
            "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                4,
                14,
                7,
                18,
                10
            ],

            "circle-color": "#FF2D55",

            "circle-stroke-color": "#ffffff",

            "circle-stroke-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                1,
                14,
                2
            ]
        }
    });

}


/* ==========================================================
   LIMPIAR RESULTADO
========================================================== */


/**
 * Elimina las capas, la fuente y el popup actual.
 */
function limpiarResultadoTerri() {

    const mapInstance =
        obtenerMapaTerri();

    if (!mapInstance) {
        return;
    }

    cerrarPopupTerri();

    const capas = [
        TERRI_AI_FILL_LAYER_ID,
        TERRI_AI_LINE_LAYER_ID,
        TERRI_AI_POINT_LAYER_ID
    ];

    capas.forEach(
        function(layerId) {

            eliminarEventosPopupTerri(
                mapInstance,
                layerId
            );

            if (
                mapInstance.getLayer(
                    layerId
                )
            ) {

                mapInstance.removeLayer(
                    layerId
                );

            }

        }
    );

    if (
        mapInstance.getSource(
            TERRI_AI_SOURCE_ID
        )
    ) {

        mapInstance.removeSource(
            TERRI_AI_SOURCE_ID
        );

    }

}


/* ==========================================================
   ZOOM AL RESULTADO
========================================================== */


/**
 * Ajusta el mapa al resultado actual.
 */
function zoomResultadoTerri() {

    const mapInstance =
        obtenerMapaTerri();

    const libreriaMapa =
        obtenerLibreriaMapaTerri();

    if (
        !mapInstance ||
        !libreriaMapa
    ) {
        return;
    }

    const source =
        mapInstance.getSource(
            TERRI_AI_SOURCE_ID
        );

    const geojson =
        source?._data;

    if (
        !geojson ||
        !Array.isArray(geojson.features) ||
        geojson.features.length === 0
    ) {
        return;
    }

    const bounds =
        new libreriaMapa.LngLatBounds();

    geojson.features.forEach(
        function(feature) {

            expandirBoundsTerri(
                bounds,
                feature.geometry
            );

        }
    );

    if (bounds.isEmpty()) {
        return;
    }

    const primeraGeometria =
        geojson.features[0]?.geometry;

    if (
        geojson.features.length === 1 &&
        primeraGeometria?.type === "Point"
    ) {

        mapInstance.flyTo({
            center:
                primeraGeometria.coordinates,

            zoom: 16,

            duration: 900
        });

        return;
    }

    mapInstance.fitBounds(
        bounds,
        {
            padding: {
                top: 55,
                right: 55,
                bottom: 55,
                left: 55
            },

            duration: 1000,

            maxZoom: 17
        }
    );

}


/**
 * Amplía los límites con las coordenadas
 * de cualquier geometría GeoJSON.
 *
 * @param {Object} bounds
 * @param {Object} geometry
 */
function expandirBoundsTerri(
    bounds,
    geometry
) {

    if (
        !geometry ||
        !geometry.coordinates
    ) {
        return;
    }

    recorrerCoordenadasTerri(
        geometry.coordinates,
        function(coordenada) {

            bounds.extend(
                coordenada
            );

        }
    );

}


/**
 * Recorre recursivamente coordenadas GeoJSON.
 *
 * @param {Array} coordenadas
 * @param {Function} callback
 */
function recorrerCoordenadasTerri(
    coordenadas,
    callback
) {

    if (
        !Array.isArray(coordenadas)
    ) {
        return;
    }

    const esCoordenada =
        coordenadas.length >= 2 &&
        typeof coordenadas[0] === "number" &&
        typeof coordenadas[1] === "number";

    if (esCoordenada) {

        callback(coordenadas);

        return;
    }

    coordenadas.forEach(
        function(elemento) {

            recorrerCoordenadasTerri(
                elemento,
                callback
            );

        }
    );

}


/* ==========================================================
   POPUP TERRI
========================================================== */


/**
 * Campos que no deben mostrarse.
 */
const TERRI_POPUP_CAMPOS_OCULTOS =
    new Set([
        "geom",
        "geometry",
        "longitude",
        "latitude",
        "longitud",
        "latitud"
    ]);


/**
 * Orden preferido de los campos.
 */
const TERRI_POPUP_ORDEN_CAMPOS = [
    "id",
    "codigo",
    "numero_predial",
    "nombre",
    "nombre_contribuyente",
    "razon_social",
    "destino",
    "direccion",
    "direccion_formateada",
    "documento",
    "tipo_documento",
    "numero_documento",
    "estado",
    "naturaleza_juridica",
    "tipo_contribuyente",
    "avaluo_2026",
    "avaluo_2025",
    "area_terreno",
    "area_m2",
    "anio_construccion",
    "altura_metros",
    "confianza"
];


/**
 * Traducción de nombres técnicos.
 */
const TERRI_POPUP_ETIQUETAS = {
    id: "ID",
    codigo: "Código",
    numero_predial: "Número predial",
    nombre: "Nombre",
    nombre_contribuyente:
        "Nombre del contribuyente",
    razon_social: "Razón social",
    destino: "Destino",
    direccion: "Dirección",
    direccion_formateada:
        "Dirección formateada",
    documento: "Documento",
    tipo_documento:
        "Tipo de documento",
    numero_documento:
        "Número de documento",
    estado: "Estado",
    naturaleza_juridica:
        "Naturaleza jurídica",
    tipo_contribuyente:
        "Tipo de contribuyente",
    avaluo_2026: "Avalúo 2026",
    avaluo_2025: "Avalúo 2025",
    area_terreno: "Área de terreno",
    area_m2: "Área",
    anio_construccion:
        "Año de construcción",
    altura_metros: "Altura",
    confianza: "Confianza"
};


/**
 * Escapa contenido HTML.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function escaparHtmlTerri(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/**
 * Convierte el nombre del campo
 * en una etiqueta legible.
 *
 * @param {string} campo
 * @returns {string}
 */
function obtenerEtiquetaPopupTerri(
    campo
) {

    if (
        TERRI_POPUP_ETIQUETAS[campo]
    ) {

        return (
            TERRI_POPUP_ETIQUETAS[campo]
        );

    }

    return String(campo)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            function(letra) {

                return letra.toUpperCase();

            }
        );

}


/**
 * Verifica si un valor debe mostrarse.
 *
 * @param {string} campo
 * @param {unknown} valor
 * @returns {boolean}
 */
function debeMostrarCampoPopupTerri(
    campo,
    valor
) {

    if (
        TERRI_POPUP_CAMPOS_OCULTOS.has(
            campo
        )
    ) {
        return false;
    }

    if (
        valor === null ||
        valor === undefined
    ) {
        return false;
    }

    return (
        String(valor).trim() !== ""
    );

}


/**
 * Ordena las propiedades del popup.
 *
 * @param {Object} propiedades
 * @returns {Array}
 */
function ordenarCamposPopupTerri(
    propiedades
) {

    return Object.entries(
        propiedades || {}
    ).sort(
        function(
            [campoA],
            [campoB]
        ) {

            const indiceA =
                TERRI_POPUP_ORDEN_CAMPOS
                    .indexOf(campoA);

            const indiceB =
                TERRI_POPUP_ORDEN_CAMPOS
                    .indexOf(campoB);

            if (
                indiceA !== -1 &&
                indiceB !== -1
            ) {

                return indiceA - indiceB;

            }

            if (indiceA !== -1) {
                return -1;
            }

            if (indiceB !== -1) {
                return 1;
            }

            return campoA.localeCompare(
                campoB,
                "es"
            );

        }
    );

}


/**
 * Construye un popup simple y legible.
 *
 * Los valores se muestran exactamente
 * como llegan desde el backend.
 *
 * @param {Object} propiedades
 * @returns {string}
 */
function construirPopupHtmlTerri(
    propiedades
) {

    const filas =
        ordenarCamposPopupTerri(
            propiedades
        )
            .filter(
                function([campo, valor]) {

                    return debeMostrarCampoPopupTerri(
                        campo,
                        valor
                    );

                }
            )
            .map(
                function([campo, valor]) {

                    const etiqueta =
                        obtenerEtiquetaPopupTerri(
                            campo
                        );

                    return `
                        <div class="terri-popup-fila">

                            <div class="terri-popup-etiqueta">
                                ${escaparHtmlTerri(etiqueta)}
                            </div>

                            <div class="terri-popup-valor">
                                ${escaparHtmlTerri(valor)}
                            </div>

                        </div>
                    `;

                }
            )
            .join("");

    if (!filas) {

        return `
            <div class="terri-popup-contenido">

                <div class="terri-popup-sin-datos">
                    Sin información disponible
                </div>

            </div>
        `;

    }

    return `
        <div class="terri-popup-contenido">
            ${filas}
        </div>
    `;

}


/* ==========================================================
   ESTILOS POPUP TERRI
========================================================== */


/**
 * Inserta los estilos una sola vez.
 */
function asegurarEstilosPopupTerri() {

    if (
        document.getElementById(
            "terri-popup-estilos"
        )
    ) {
        return;
    }

    const estilos =
        document.createElement("style");

    estilos.id =
        "terri-popup-estilos";

    estilos.textContent = `

        .mapboxgl-popup,
        .maplibregl-popup {
            max-width:
                min(
                    460px,
                    calc(100vw - 24px)
                ) !important;
        }

        .mapboxgl-popup-content,
        .maplibregl-popup-content {
            padding: 0 !important;
            border-radius: 8px !important;
            overflow: hidden;
            box-shadow:
                0 6px 20px
                rgba(15, 23, 42, 0.20)
                !important;
        }

        .mapboxgl-popup-close-button,
        .maplibregl-popup-close-button {
            width: 30px;
            height: 30px;
            padding: 0;
            font-size: 20px;
            line-height: 28px;
            color: #334155;
            background: transparent;
            z-index: 5;
        }

        .mapboxgl-popup-close-button:hover,
        .maplibregl-popup-close-button:hover {
            color: #0f172a;
            background: #f1f5f9;
        }

        .terri-popup-contenido {
            width: 100%;
            min-width: 340px;
            max-width: 460px;
            max-height: min(420px, 58vh);
            padding: 16px;
            overflow-x: hidden;
            overflow-y: auto;
            box-sizing: border-box;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            font-size: 13px;
            line-height: 1.45;
            color: #17324d;
            background: #ffffff;
        }

        .terri-popup-fila {
            display: grid;
            grid-template-columns:
                minmax(110px, 130px)
                minmax(0, 1fr);
            column-gap: 14px;
            align-items: start;
            padding: 7px 0;
            border-bottom:
                1px solid #edf2f7;
        }

        .terri-popup-fila:last-child {
            border-bottom: none;
        }

        .terri-popup-etiqueta {
            min-width: 0;
            font-weight: 700;
            color: #17324d;
            line-height: 1.4;
            overflow-wrap: break-word;
        }

        .terri-popup-valor {
            min-width: 0;
            color: #294b68;
            line-height: 1.45;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: anywhere;
        }

        .terri-popup-sin-datos {
            padding: 16px;
            text-align: center;
            color: #64748b;
        }

        .terri-popup-contenido::-webkit-scrollbar {
            width: 7px;
        }

        .terri-popup-contenido::-webkit-scrollbar-track {
            background: #f1f5f9;
        }

        .terri-popup-contenido::-webkit-scrollbar-thumb {
            background: #b7c4d0;
            border-radius: 10px;
        }

        .terri-popup-contenido::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        @media (max-width: 650px) {

            .mapboxgl-popup,
            .maplibregl-popup {
                max-width:
                    calc(100vw - 20px)
                    !important;
            }

            .terri-popup-contenido {
                width:
                    calc(100vw - 44px);
                min-width: 0;
                max-width: 390px;
                max-height: 52vh;
                padding: 14px;
                font-size: 12px;
            }

            .terri-popup-fila {
                grid-template-columns:
                    minmax(95px, 110px)
                    minmax(0, 1fr);
                column-gap: 10px;
                padding: 6px 0;
            }

        }

        @media (max-width: 400px) {

            .terri-popup-contenido {
                width:
                    calc(100vw - 36px);
                padding: 12px;
            }

            .terri-popup-fila {
                display: block;
            }

            .terri-popup-etiqueta {
                margin-bottom: 2px;
            }

        }

    `;

    document.head.appendChild(
        estilos
    );

}


/* ==========================================================
   EVENTOS DEL POPUP
========================================================== */


/**
 * Abre el popup correspondiente al elemento
 * seleccionado.
 *
 * @param {Object} evento
 */
function manejarClickPopupTerri(
    evento
) {

    const libreriaMapa =
        obtenerLibreriaMapaTerri();

    const mapInstance =
        obtenerMapaTerri();

    if (
        !libreriaMapa ||
        !mapInstance
    ) {
        return;
    }

    const feature =
        evento.features?.[0];

    if (!feature) {
        return;
    }

    cerrarPopupTerri();

    const html =
        construirPopupHtmlTerri(
            feature.properties || {}
        );

    TERRI_POPUP_ACTIVO =
        new libreriaMapa.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "460px",
            offset: 12
        })
            .setLngLat(
                evento.lngLat
            )
            .setHTML(html)
            .addTo(mapInstance);

}


/**
 * Cambia el cursor cuando entra a una capa.
 */
function manejarEntradaPopupTerri() {

    const mapInstance =
        obtenerMapaTerri();

    if (!mapInstance) {
        return;
    }

    mapInstance.getCanvas()
        .style.cursor = "pointer";

}


/**
 * Restaura el cursor al salir de una capa.
 */
function manejarSalidaPopupTerri() {

    const mapInstance =
        obtenerMapaTerri();

    if (!mapInstance) {
        return;
    }

    mapInstance.getCanvas()
        .style.cursor = "";

}


/**
 * Activa los eventos de popup.
 *
 * @param {Object} mapInstance
 */
function activarPopupTerri(
    mapInstance
) {

    const capas = [
        TERRI_AI_FILL_LAYER_ID,
        TERRI_AI_LINE_LAYER_ID,
        TERRI_AI_POINT_LAYER_ID
    ];

    capas.forEach(
        function(layerId) {

            if (
                !mapInstance.getLayer(
                    layerId
                )
            ) {
                return;
            }

            eliminarEventosPopupTerri(
                mapInstance,
                layerId
            );

            mapInstance.on(
                "click",
                layerId,
                manejarClickPopupTerri
            );

            mapInstance.on(
                "mouseenter",
                layerId,
                manejarEntradaPopupTerri
            );

            mapInstance.on(
                "mouseleave",
                layerId,
                manejarSalidaPopupTerri
            );

        }
    );

}


/**
 * Elimina eventos anteriores de una capa.
 *
 * @param {Object} mapInstance
 * @param {string} layerId
 */
function eliminarEventosPopupTerri(
    mapInstance,
    layerId
) {

    try {

        mapInstance.off(
            "click",
            layerId,
            manejarClickPopupTerri
        );

        mapInstance.off(
            "mouseenter",
            layerId,
            manejarEntradaPopupTerri
        );

        mapInstance.off(
            "mouseleave",
            layerId,
            manejarSalidaPopupTerri
        );

    } catch (error) {

        // La capa puede no tener eventos registrados.
    }

}


/**
 * Cierra el popup actual.
 */
function cerrarPopupTerri() {

    if (!TERRI_POPUP_ACTIVO) {
        return;
    }

    TERRI_POPUP_ACTIVO.remove();

    TERRI_POPUP_ACTIVO = null;

}