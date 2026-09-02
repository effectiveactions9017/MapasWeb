/* ==========================================================
   TERRI+ MAP ENGINE
   Motor geoespacial
========================================================== */

let terriMap = null;
let terriPopup = null;

const TERRI_LAYERS = {};


/* ==========================================================
   Inicializar mapa
========================================================== */

function inicializarMapa() {

    if (terriMap) return;

    terriMap = new maplibregl.Map({
        container: "map",
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: [-73.7972, 5.0446],
        zoom: 15,
        attributionControl: true
    });

    terriMap.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
    );

    terriPopup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: "480px",
        offset: 12
    });

    terriMap.on("load", () => {
        console.log("🗺️ Map Engine iniciado correctamente.");
    });

}


/* ==========================================================
   Validaciones internas
========================================================== */

function mapaListo() {
    return terriMap && terriMap.isStyleLoaded();
}

function existeCapa(id) {
    return terriMap.getLayer(id) !== undefined;
}

function existeFuente(id) {
    return terriMap.getSource(id) !== undefined;
}


/* ==========================================================
   Eliminar capa / fuente
========================================================== */

function eliminarCapa(id) {

    if (existeCapa(id)) {
        terriMap.removeLayer(id);
    }

}

function eliminarFuente(id) {

    if (existeFuente(id)) {
        terriMap.removeSource(id);
    }

}


/* ==========================================================
   Limpiar resultado anterior
========================================================== */

function limpiarMapa() {

    Object.keys(TERRI_LAYERS).forEach(layerId => {

        eliminarCapa(layerId);

        eliminarFuente(
            TERRI_LAYERS[layerId].sourceId
        );

        delete TERRI_LAYERS[layerId];

    });

    if (window.TERRI_SYMBOLOGY) {

        window.TERRI_SYMBOLOGY
            .ocultarLeyenda();

    }

    if (terriPopup) {
        terriPopup.remove();
    }

}


/* ==========================================================
   DIBUJAR GEOJSON PRINCIPAL
   Simbología categórica genérica para todas las capas
========================================================== */


/**
 * Normaliza el nombre de un atributo para comparar campos
 * aunque tengan mayúsculas, espacios, tildes o guiones.
 *
 * Ejemplos:
 *
 * "DESTINO"          → "destino"
 * "Destino Económico" → "destino_economico"
 * "tipo-bosque"      → "tipo_bosque"
 *
 * @param {unknown} valor
 * @returns {string}
 */
function normalizarCampoMapaTerri(valor) {

    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

}


/**
 * Busca el nombre real de un campo dentro de las
 * propiedades del GeoJSON.
 *
 * Esto permite que el Planner solicite, por ejemplo:
 *
 * destino
 * DESTINO
 * Destino económico
 *
 * y el mapa encuentre el atributo equivalente.
 *
 * @param {Object} geojson
 * @param {string} campoSolicitado
 * @returns {string|null}
 */
function resolverCampoCategoriaMapaTerri(
    geojson,
    campoSolicitado
) {

    if (
        !geojson ||
        !Array.isArray(geojson.features) ||
        !campoSolicitado
    ) {
        return null;
    }

    const campoNormalizado =
        normalizarCampoMapaTerri(campoSolicitado);

    if (!campoNormalizado) {
        return null;
    }

    /*
     * Se revisan varias entidades porque una primera
     * entidad podría no contener todos los atributos.
     */
    const entidadesConPropiedades =
        geojson.features
            .filter(feature => {
                return (
                    feature &&
                    feature.properties &&
                    typeof feature.properties === "object"
                );
            })
            .slice(0, 100);

    /*
     * Primero se intenta encontrar una coincidencia exacta.
     */
    for (const feature of entidadesConPropiedades) {

        const campos =
            Object.keys(feature.properties);

        if (campos.includes(campoSolicitado)) {
            return campoSolicitado;
        }

    }

    /*
     * Después se busca mediante nombres normalizados.
     */
    for (const feature of entidadesConPropiedades) {

        const campos =
            Object.keys(feature.properties);

        const campoEncontrado =
            campos.find(campo => {
                return (
                    normalizarCampoMapaTerri(campo) ===
                    campoNormalizado
                );
            });

        if (campoEncontrado) {
            return campoEncontrado;
        }

    }

    /*
     * Compatibilidad con nombres semánticamente similares.
     *
     * Ejemplo:
     * Planner: destino_economico
     * GeoJSON: destino
     */
    const equivalencias = {

        destino_economico: [
            "destino",
            "destino_economico",
            "destino_económico",
            "uso_economico",
            "uso_económico"
        ],

        destino: [
            "destino",
            "destino_economico",
            "destino_económico"
        ],

        vereda: [
            "vereda",
            "nombre_vereda",
            "sector_veredal"
        ],

        barrio: [
            "barrio",
            "nombre_barrio",
            "sector"
        ],

        estado: [
            "estado",
            "estado_actual",
            "estado_registro"
        ],

        tipo_contribuyente: [
            "tipo_contribuyente",
            "naturaleza",
            "naturaleza_juridica",
            "naturaleza_jurídica"
        ],

        naturaleza_juridica: [
            "naturaleza_juridica",
            "naturaleza_jurídica",
            "tipo_contribuyente",
            "naturaleza"
        ],

        tipo_bosque: [
            "tipo_bosque",
            "tipo_bosque_predominante",
            "cobertura_boscosa"
        ],

        nivel_riesgo: [
            "nivel_riesgo",
            "riesgo",
            "categoria_riesgo",
            "categoría_riesgo"
        ]

    };

    const candidatos =
        equivalencias[campoNormalizado] || [];

    const candidatosNormalizados =
        candidatos.map(normalizarCampoMapaTerri);

    for (const feature of entidadesConPropiedades) {

        const campos =
            Object.keys(feature.properties);

        const campoEncontrado =
            campos.find(campo => {
                return candidatosNormalizados.includes(
                    normalizarCampoMapaTerri(campo)
                );
            });

        if (campoEncontrado) {
            return campoEncontrado;
        }

    }

    return null;

}


/**
 * Obtiene el nombre legible de un campo para usarlo
 * como título automático de la leyenda.
 *
 * @param {string} campo
 * @returns {string}
 */
function construirTituloCategoriaMapaTerri(campo) {

    const campoNormalizado =
        normalizarCampoMapaTerri(campo);

    const titulos = {

        destino:
            "Destino económico",

        destino_economico:
            "Destino económico",

        nivel_riesgo:
            "Nivel de riesgo",

        vereda:
            "Vereda",

        barrio:
            "Barrio",

        estado:
            "Estado",

        tipo_contribuyente:
            "Tipo de contribuyente",

        naturaleza_juridica:
            "Naturaleza jurídica",

        tipo_bosque:
            "Tipo de bosque",

        tipo_bosque_predominante:
            "Tipo de bosque predominante",

        uso_suelo:
            "Uso del suelo",

        categoria:
            "Categoría"

    };

    if (titulos[campoNormalizado]) {
        return titulos[campoNormalizado];
    }

    return campoNormalizado
        .replace(/_/g, " ")
        .replace(/\b\w/g, letra =>
            letra.toUpperCase()
        );

}


/**
 * Dibuja el resultado GeoJSON y aplica automáticamente
 * una simbología categórica cuando el Planner proporciona
 * un campo de clasificación.
 *
 * Compatible con:
 *
 * - polígonos;
 * - líneas;
 * - puntos;
 * - cualquier capa;
 * - cualquier atributo categórico.
 *
 * @param {Object} geojson
 * @param {Object} opciones
 */
function dibujarGeoJSON(
    geojson,
    opciones = {}
) {

    const layerId =
        opciones.layerId ||
        TERRI_CONFIG.MAP_LAYER;

    const sourceId =
        opciones.sourceId ||
        TERRI_CONFIG.MAP_SOURCE;

    const nombre =
        opciones.nombre ||
        "Resultado IA";

    limpiarMapa();


    /* ======================================================
       COLOR PREDETERMINADO
    ====================================================== */

    let colorMapa =
        opciones.color ||
        "#2b8cbe";

    let simbologia = null;


    /* ======================================================
       INFORMACIÓN DEL PLANNER
    ====================================================== */

    const visualizacion =
        opciones.visualizacion || {};

    const campoCategoriaSolicitado =
        visualizacion.campo_categoria ||
        visualizacion.campoCategoria ||
        visualizacion.campo ||
        null;

    const modoVisualizacion =
        String(
            visualizacion.modo ||
            visualizacion.tipo ||
            ""
        )
            .trim()
            .toLowerCase();


    /* ======================================================
       RESOLVER EL CAMPO REAL DEL GEOJSON
    ====================================================== */

    const campoCategoriaReal =
        resolverCampoCategoriaMapaTerri(
            geojson,
            campoCategoriaSolicitado
        );


    /*
     * Se interpreta como categórica cuando:
     *
     * 1. El Planner solicita modo categórico o por colores.
     * 2. Existe campo_categoria aunque el Planner no haya
     *    especificado explícitamente el modo.
     *
     * No se aplica si el modo indica una visualización
     * continua o graduada.
     */
    const esModoContinuo =
        modoVisualizacion.includes("continu") ||
        modoVisualizacion.includes("graduad") ||
        modoVisualizacion.includes("rango") ||
        modoVisualizacion.includes("cuant");

    const solicitaCategorias =
        Boolean(campoCategoriaReal) &&
        !esModoContinuo;


    /* ======================================================
       SIMBOLOGÍA CATEGÓRICA
    ====================================================== */

    if (
        solicitaCategorias &&
        window.TERRI_SYMBOLOGY
    ) {

        const tituloLeyenda =
            visualizacion.titulo_leyenda ||
            visualizacion.tituloLeyenda ||
            construirTituloCategoriaMapaTerri(
                campoCategoriaReal
            );

        simbologia =
            window.TERRI_SYMBOLOGY.prepararCategorica({
                geojson,
                campoCategoria:
                    campoCategoriaReal,
                tituloLeyenda
            });

        if (
            simbologia &&
            simbologia.valido
        ) {

            colorMapa =
                simbologia.expresionColor;

            window.TERRI_SYMBOLOGY
                .mostrarLeyendaCategorica({
                    titulo:
                        simbologia.tituloLeyenda,
                    categorias:
                        simbologia.categorias
                });

            console.log(
                "🎨 Simbología categórica aplicada:",
                {
                    capa: nombre,
                    campoSolicitado:
                        campoCategoriaSolicitado,
                    campoReal:
                        campoCategoriaReal,
                    tituloLeyenda,
                    simbologia
                }
            );

        } else {

            console.warn(
                "⚠️ No fue posible aplicar la simbología categórica:",
                {
                    capa: nombre,
                    campoSolicitado:
                        campoCategoriaSolicitado,
                    campoReal:
                        campoCategoriaReal,
                    motivo:
                        simbologia?.motivo ||
                        "Respuesta inválida del motor de simbología."
                }
            );

            window.TERRI_SYMBOLOGY
                .ocultarLeyenda();

        }

    } else {

        if (window.TERRI_SYMBOLOGY) {

            window.TERRI_SYMBOLOGY
                .ocultarLeyenda();

        }

        if (
            campoCategoriaSolicitado &&
            !campoCategoriaReal
        ) {

            console.warn(
                "⚠️ El campo categórico solicitado no existe en el GeoJSON:",
                {
                    capa: nombre,
                    campoSolicitado:
                        campoCategoriaSolicitado,
                    camposDisponibles:
                        geojson?.features?.[0]?.properties
                            ? Object.keys(
                                geojson.features[0].properties
                            )
                            : []
                }
            );

        }

    }


    /* ======================================================
       DIBUJAR CAPA
    ====================================================== */

    agregarCapaGeoJSON({
        geojson,
        layerId,
        sourceId,
        nombre,
        color: colorMapa,
        opacity:
            opciones.opacity ??
            0.55,
        simbologia
    });


    /* ======================================================
       NAVEGACIÓN E INTERACCIÓN
    ====================================================== */

    zoomResultado(layerId);

    activarPopups(layerId);

}


/* ==========================================================
   Agregar capa GeoJSON
========================================================== */

function agregarCapaGeoJSON(config) {

    const {
        geojson,
        layerId,
        sourceId,
        nombre,
        color,
        opacity
    } = config;

    if (
        !geojson ||
        !Array.isArray(geojson.features) ||
        geojson.features.length === 0
    ) {
        console.warn("⚠️ GeoJSON inválido o sin entidades:", geojson);
        return;
    }

    const primeraEntidadValida = geojson.features.find(feature => {
        return (
            feature &&
            feature.geometry &&
            feature.geometry.type
        );
    });

    if (!primeraEntidadValida) {
        console.warn("⚠️ El GeoJSON no contiene geometrías válidas.");
        return;
    }

    const tipoGeometria = primeraEntidadValida.geometry.type;

    eliminarCapa(layerId);
    eliminarFuente(sourceId);

    terriMap.addSource(sourceId, {
        type: "geojson",
        data: geojson
    });

    let configuracionCapa = null;

    if (
        tipoGeometria === "Polygon" ||
        tipoGeometria === "MultiPolygon"
    ) {

        configuracionCapa = {
            id: layerId,
            type: "fill",
            source: sourceId,
            paint: {
                "fill-color": color,
                "fill-opacity": opacity,
                "fill-outline-color": "#12344d"
            }
        };

    } else if (
        tipoGeometria === "LineString" ||
        tipoGeometria === "MultiLineString"
    ) {

        configuracionCapa = {
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
                "line-cap": "round",
                "line-join": "round"
            },
            paint: {
                "line-color": color,
                "line-width": 4,
                "line-opacity": Math.max(opacity, 0.8)
            }
        };

    } else if (
        tipoGeometria === "Point" ||
        tipoGeometria === "MultiPoint"
    ) {

        configuracionCapa = {
            id: layerId,
            type: "circle",
            source: sourceId,
            paint: {
                "circle-radius": 7,
                "circle-color": color,
                "circle-opacity": Math.max(opacity, 0.85),
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2
            }
        };

    } else {

        console.warn(
            `⚠️ Tipo de geometría no soportado: ${tipoGeometria}`
        );

        eliminarFuente(sourceId);
        return;

    }

    terriMap.addLayer(configuracionCapa);

    TERRI_LAYERS[layerId] = {
        id: layerId,
        sourceId,
        nombre,
        tipo: tipoGeometria,
        visible: true,
        geojson
    };

    console.log(
        `✅ Capa ${nombre} dibujada como ${tipoGeometria}.`
    );

}


/* ==========================================================
   ZOOM AUTOMÁTICO SEGURO
========================================================== */

function zoomResultado(layerId = TERRI_CONFIG.MAP_LAYER) {

    const capa = TERRI_LAYERS[layerId];

    if (
        !capa ||
        !capa.geojson ||
        !Array.isArray(capa.geojson.features) ||
        capa.geojson.features.length === 0
    ) {
        return;
    }

    const bounds = new maplibregl.LngLatBounds();

    capa.geojson.features.forEach(feature => {

        if (
            !feature ||
            !feature.geometry
        ) {
            return;
        }

        expandirBounds(
            bounds,
            feature.geometry
        );

    });

    if (bounds.isEmpty()) {

        console.warn(
            "⚠️ No se encontraron coordenadas válidas para ajustar el zoom.",
            {
                layerId,
                geojson: capa.geojson
            }
        );

        return;
    }

    const suroeste = bounds.getSouthWest();
    const noreste = bounds.getNorthEast();

    if (
        !suroeste ||
        !noreste ||
        !Number.isFinite(suroeste.lng) ||
        !Number.isFinite(suroeste.lat) ||
        !Number.isFinite(noreste.lng) ||
        !Number.isFinite(noreste.lat)
    ) {

        console.warn(
            "⚠️ Los límites calculados no son válidos.",
            {
                suroeste,
                noreste
            }
        );

        return;
    }

    const esUnSoloPunto =
        suroeste.lng === noreste.lng &&
        suroeste.lat === noreste.lat;

    if (esUnSoloPunto) {

        terriMap.flyTo({
            center: [
                suroeste.lng,
                suroeste.lat
            ],
            zoom: 17,
            duration: 900
        });

        return;
    }

    terriMap.fitBounds(bounds, {
        padding: 50,
        maxZoom: 17,
        duration: 1200
    });

}


/* ==========================================================
   Expandir bounds
========================================================== */

function expandirBounds(bounds, geometry) {

    if (!geometry) return;

    if (geometry.type === "Point") {
        bounds.extend(geometry.coordinates);
    }

    if (geometry.type === "LineString") {
        geometry.coordinates.forEach(coord => bounds.extend(coord));
    }

    if (geometry.type === "Polygon") {
        geometry.coordinates[0].forEach(coord => bounds.extend(coord));
    }

    if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach(pol => {
            pol[0].forEach(coord => bounds.extend(coord));
        });
    }

}


/* ==========================================================
   POPUPS
========================================================== */


/**
 * Escapa caracteres especiales para evitar
 * errores al insertar valores en el HTML.
 *
 * @param {unknown} valor
 * @returns {string}
 */
function escaparHtmlPopupTerri(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/**
 * Convierte el nombre técnico de un campo
 * en una etiqueta más legible.
 *
 * @param {string} campo
 * @returns {string}
 */
function obtenerEtiquetaPopupTerri(campo) {

    const campoNormalizado = String(campo)
        .trim()
        .toLowerCase();

    const etiquetas = {

        /* Identificación */

        id: "ID",
        codigo: "Código",
        numero_predial: "Número predial",
        nombre: "Nombre",
        destino: "Destino",
        direccion: "Dirección",
        documento: "Documento",
        numero_documento: "Número de documento",

        /* Predial */

        avaluo_2025: "Avalúo 2025",
        avaluo_2026: "Avalúo 2026",
        area_terreno: "Área de terreno",
        area_construida: "Área construida",
        area_m2: "Área",

        /* Contribuyentes */

        estado: "Estado",
        razon_social: "Razón social",
        naturaleza_juridica: "Naturaleza jurídica",
        tipo_contribuyente: "Tipo de contribuyente",

        /* Ambiental: bosque actual */

        area_ha: "Área",
        stock_carbono_total_tc: "Stock total de carbono",
        carbono_tc: "Carbono",
        densidad_carbono_media_tc_ha:
            "Densidad media de carbono",
        densidad_c_media_tc_ha:
            "Densidad media de carbono",
        ndvi_medio: "NDVI medio",
        ndvi_medio_poligono: "NDVI medio",
        porcentaje_cobertura_forestal:
            "Cobertura forestal",
        tipo_bosque_predominante:
            "Tipo de bosque predominante",

        /* Ambiental: pérdida de bosque */

        area_perdida_ha: "Área perdida",
        carbono_perdido_tc: "Carbono perdido",

        /* Campo auxiliar */

        capa: "Capa"

    };

    if (etiquetas[campoNormalizado]) {
        return etiquetas[campoNormalizado];
    }

    return campoNormalizado
        .replace(/_/g, " ")
        .replace(/\b\w/g, letra =>
            letra.toUpperCase()
        );

}


/**
 * Convierte un valor compatible en número.
 *
 * @param {unknown} valor
 * @returns {number|null}
 */
function convertirNumeroPopupTerri(valor) {

    if (typeof valor === "number") {

        return Number.isFinite(valor)
            ? valor
            : null;

    }

    const texto = String(valor ?? "")
        .trim()
        .replace(/\s/g, "");

    if (!texto) {
        return null;
    }

    let normalizado = texto;

    const tienePunto = texto.includes(".");
    const tieneComa = texto.includes(",");

    if (tienePunto && tieneComa) {

        const ultimoPunto = texto.lastIndexOf(".");
        const ultimaComa = texto.lastIndexOf(",");

        if (ultimaComa > ultimoPunto) {

            normalizado = texto
                .replace(/\./g, "")
                .replace(",", ".");

        } else {

            normalizado = texto
                .replace(/,/g, "");

        }

    } else if (tieneComa) {

        normalizado = texto.replace(",", ".");

    }

    const numero = Number(normalizado);

    return Number.isFinite(numero)
        ? numero
        : null;

}


/**
 * Da formato y asigna unidades según el campo.
 *
 * @param {string} campo
 * @param {unknown} valor
 * @returns {string}
 */
function formatearValorPopupTerri(campo, valor) {

    const campoNormalizado = String(campo)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");

    const numero =
        convertirNumeroPopupTerri(valor);


    /* ======================================================
       FORMATEADORES
    ====================================================== */

    const formatearNumero = (
        valorNumerico,
        decimales = 2
    ) => {

        return new Intl.NumberFormat(
            "es-CO",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimales
            }
        ).format(valorNumerico);

    };


    /* ======================================================
       IDENTIFICADORES
    ====================================================== */

    if (
        campoNormalizado === "id" ||
        campoNormalizado.includes("codigo") ||
        campoNormalizado.includes("documento") ||
        campoNormalizado.includes("numero_predial")
    ) {

        return String(valor ?? "");

    }


    /* ======================================================
       VALORES MONETARIOS
    ====================================================== */

    const esValorMonetario =
    campoNormalizado.includes("avaluo") ||
    campoNormalizado.includes("liquidacion") ||
    campoNormalizado.includes("total_valor_mora") ||
    campoNormalizado.includes("valor_ultimo_pago") ||
    campoNormalizado.includes("pago_marzo") ||
    campoNormalizado.includes("impuesto") ||
    campoNormalizado.includes("valor_predial") ||
    campoNormalizado.includes("valor_catastral");

if (esValorMonetario && numero !== null) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ).format(numero);

}


    /* ======================================================
       ÁREAS EN HECTÁREAS
       Debe evaluarse antes que el área genérica.
    ====================================================== */

    const esAreaHectareas =
        campoNormalizado === "area_ha" ||
        campoNormalizado.includes("area_perdida_ha") ||
        campoNormalizado.includes("area_hectareas") ||
        (
        campoNormalizado.includes("area") &&
        campoNormalizado.endsWith("_ha")
    );

    if (esAreaHectareas && numero !== null) {

        return `${formatearNumero(numero, 2)} ha`;

    }


    /* ======================================================
       ÁREAS EN METROS CUADRADOS
    ====================================================== */

    const esAreaMetrosCuadrados =
        campoNormalizado === "area_m2" ||
        campoNormalizado.includes("shape_area") ||
        campoNormalizado.includes("area_terreno") ||
        campoNormalizado.includes("area_construida") ||
        campoNormalizado.endsWith("_m2");

    if (
        esAreaMetrosCuadrados &&
        numero !== null
    ) {

        return `${formatearNumero(numero, 2)} m²`;

    }


    /* ======================================================
       DENSIDAD DE CARBONO
    ====================================================== */

    const esDensidadCarbono =
        campoNormalizado.includes("densidad") &&
        campoNormalizado.includes("carbono");

    const esDensidadC =
        campoNormalizado.includes("densidad_c_") ||
        campoNormalizado.includes("densidad_c_media");

    if (
        (esDensidadCarbono || esDensidadC) &&
        numero !== null
    ) {

        return `${formatearNumero(numero, 2)} tC/ha`;

    }


    /* ======================================================
       STOCK O CARBONO TOTAL/PERDIDO
    ====================================================== */

    const esCarbono =
        campoNormalizado.includes("carbono") &&
        (
            campoNormalizado.includes("stock") ||
            campoNormalizado.includes("total") ||
            campoNormalizado.includes("perdido") ||
            campoNormalizado.endsWith("_tc") ||
            campoNormalizado === "carbono_tc"
        );

    if (esCarbono && numero !== null) {

        return `${formatearNumero(numero, 2)} tC`;

    }


    /* ======================================================
       PORCENTAJES
    ====================================================== */

    const esPorcentaje =
        campoNormalizado.includes("porcentaje") ||
        campoNormalizado.includes("percent");

    if (esPorcentaje && numero !== null) {

        return `${formatearNumero(numero, 2)} %`;

    }


    /* ======================================================
       NDVI
    ====================================================== */

    const esNdvi =
        campoNormalizado.includes("ndvi");

    if (esNdvi && numero !== null) {

        return formatearNumero(numero, 2);

    }


    /* ======================================================
       ÁREA GENÉRICA SIN UNIDAD EXPLÍCITA
       No se agrega m² automáticamente.
    ====================================================== */

    if (
        campoNormalizado.includes("area") &&
        numero !== null
    ) {

        return formatearNumero(numero, 2);

    }


    /* ======================================================
       RESTO DE VALORES
    ====================================================== */

    return String(valor ?? "");

}


/**
 * Define el orden preferido de los campos.
 *
 * @param {Object} propiedades
 * @returns {Array}
 */
function ordenarCamposPopupTerri(propiedades) {

    const orden = [

    /* Identificación */

    "id",
    "codigo",
    "numero_predial",
    "nombre",
    "razon_social",

    /* Ubicación y clasificación */

    "capa",
    "destino",
    "direccion",
    "documento",
    "numero_documento",
    "estado",
    "naturaleza_juridica",
    "tipo_contribuyente",

    /* Datos ambientales */

    "area_ha",
    "area_perdida_ha",
    "stock_carbono_total_tc",
    "carbono_tc",
    "carbono_perdido_tc",
    "densidad_carbono_media_tc_ha",
    "densidad_c_media_tc_ha",
    "ndvi_medio",
    "ndvi_medio_poligono",
    "porcentaje_cobertura_forestal",
    "tipo_bosque_predominante",

    /* Datos prediales */

    "avaluo_2026",
    "avaluo_2025",
    "area_terreno",
    "area_construida",
    "area_m2"

];

    return Object.entries(propiedades || {})
        .sort(([campoA], [campoB]) => {

            const indiceA = orden.indexOf(campoA);
            const indiceB = orden.indexOf(campoB);

            if (indiceA !== -1 && indiceB !== -1) {
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

        });

}


/**
 * Construye el contenido HTML del popup.
 *
 * @param {Object} propiedades
 * @returns {string}
 */
function construirHtmlPopupTerri(propiedades) {

    const camposOcultos = new Set([
        "geom",
        "geometry",
        "latitud",
        "longitud",
        "latitude",
        "longitude"
    ]);

    const filas = ordenarCamposPopupTerri(propiedades)
        .filter(([campo, valor]) => {

            if (camposOcultos.has(campo)) {
                return false;
            }

            if (
                valor === null ||
                valor === undefined ||
                String(valor).trim() === ""
            ) {
                return false;
            }

            return true;

        })
        .map(([campo, valor]) => {

            const etiqueta =
                obtenerEtiquetaPopupTerri(campo);

            const valorFormateado =
                formatearValorPopupTerri(
                    campo,
                    valor
                );

            return `
                <div class="popup-terri-fila">

                    <div class="popup-terri-etiqueta">
                        ${escaparHtmlPopupTerri(etiqueta)}
                    </div>

                    <div class="popup-terri-valor">
                        ${escaparHtmlPopupTerri(valorFormateado)}
                    </div>

                </div>
            `;

        })
        .join("");

    return `
    <div class="popup-terri-contenido">

        <div class="popup-terri-titulo">
            📍 Información del predio
        </div>

        ${
            filas ||
            `
                <div class="popup-terri-sin-datos">
                    Sin información disponible
                </div>
            `
        }

    </div>
`;

}


/**
 * Inserta los estilos del popup una sola vez.
 */
function asegurarEstilosPopupTerri() {

    if (
        document.getElementById(
            "popup-terri-estilos"
        )
    ) {
        return;
    }

    const estilos =
        document.createElement("style");

    estilos.id =
        "popup-terri-estilos";

    estilos.textContent = `

        .maplibregl-popup {
            max-width: min(
                480px,
                calc(100vw - 24px)
            ) !important;
        }

        .maplibregl-popup-content {
            padding: 0 !important;
            border-radius: 10px !important;
            overflow: hidden;
            box-shadow:
                0 8px 24px
                rgba(15, 23, 42, 0.22);
        }

        .maplibregl-popup-close-button {
            width: 30px;
            height: 30px;
            padding: 0;
            font-size: 20px;
            line-height: 28px;
            color: #334155;
            background: transparent;
            z-index: 10;
        }

        .maplibregl-popup-close-button:hover {
            color: #0f172a;
            background: #f1f5f9;
        }

        .popup-terri-contenido {
            width: 100%;
            min-width: 350px;
            max-width: 480px;
            max-height: min(430px, 60vh);
            padding: 16px;
            overflow-y: auto;
            overflow-x: hidden;
            box-sizing: border-box;
            background: #ffffff;
            color: #17324d;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            font-size: 13px;
            line-height: 1.45;
        }

        .popup-terri-titulo {

    margin: -16px -16px 16px -16px;
    padding: 12px 16px;

    background: #0b5cab;
    color: white;

    font-size: 15px;
    font-weight: bold;

    border-bottom: 1px solid #dbe7ee;

    }

        .popup-terri-fila {
            display: grid;
            grid-template-columns:
                minmax(120px, 140px)
                minmax(0, 1fr);
            column-gap: 16px;
            align-items: start;
            padding: 8px 0;
            border-bottom:
                1px solid #e7edf3;
        }

        .popup-terri-fila:last-child {
            border-bottom: none;
        }

        .popup-terri-etiqueta {
            min-width: 0;
            font-weight: 700;
            color: #17324d;
            overflow-wrap: break-word;
        }

        .popup-terri-valor {
            min-width: 0;
            color: #31536f;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: anywhere;
        }

        .popup-terri-sin-datos {
            padding: 16px;
            text-align: center;
            color: #64748b;
        }

        .popup-terri-contenido::-webkit-scrollbar {
            width: 7px;
        }

        .popup-terri-contenido::-webkit-scrollbar-track {
            background: #f1f5f9;
        }

        .popup-terri-contenido::-webkit-scrollbar-thumb {
            background: #b7c4d0;
            border-radius: 10px;
        }

        @media (max-width: 650px) {

            .popup-terri-contenido {
                width: calc(100vw - 44px);
                min-width: 0;
                max-width: 390px;
                max-height: 52vh;
                padding: 14px;
                font-size: 12px;
            }

            .popup-terri-fila {
                grid-template-columns:
                    minmax(100px, 115px)
                    minmax(0, 1fr);
                column-gap: 10px;
            }

        }

        @media (max-width: 400px) {

            .popup-terri-contenido {
                width: calc(100vw - 36px);
                padding: 12px;
            }

            .popup-terri-fila {
                display: block;
            }

            .popup-terri-etiqueta {
                margin-bottom: 3px;
            }

        }

    `;

    document.head.appendChild(estilos);

}


/**
 * Activa el popup mediante clic sobre una entidad.
 *
 * @param {string} layerId
 */
function activarPopups(
    layerId = TERRI_CONFIG.MAP_LAYER
) {

    asegurarEstilosPopupTerri();

    terriMap.off(
        "click",
        layerId
    );

    terriMap.off(
        "mouseenter",
        layerId
    );

    terriMap.off(
        "mouseleave",
        layerId
    );

    terriMap.on(
        "click",
        layerId,
        function(e) {

            const feature =
                e.features?.[0];

            if (!feature) {
                return;
            }

            const propiedades =
                feature.properties || {};


            console.log("PROPIEDADES DEL POPUP");
            console.table(propiedades);

            const html =
                construirHtmlPopupTerri(
                    propiedades
                );

            terriPopup
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(terriMap);

        }
    );

    terriMap.on(
        "mouseenter",
        layerId,
        function() {

            terriMap.getCanvas()
                .style.cursor = "pointer";

        }
    );

    terriMap.on(
        "mouseleave",
        layerId,
        function() {

            terriMap.getCanvas()
                .style.cursor = "";

        }
    );

}

/* ==========================================================
   Visibilidad de capas
========================================================== */

function cambiarVisibilidadCapa(layerId, visible) {

    if (!existeCapa(layerId)) return;

    terriMap.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none"
    );

    if (TERRI_LAYERS[layerId]) {
        TERRI_LAYERS[layerId].visible = visible;
    }

}


/* ==========================================================
   Obtener capas activas
========================================================== */

function obtenerCapasActivas() {
    return TERRI_LAYERS;
}
/* ==========================================================
   TERRI+ FUENTES EXTERNAS
   Integración de GeoJSON proveniente de IGAC y otras fuentes
========================================================== */


/**
 * Dibuja en TERRI+ un resultado proveniente de una
 * fuente geográfica externa.
 *
 * Actualmente compatible con:
 *
 * - IGAC
 * - ArcGIS REST convertido a GeoJSON
 * - cualquier servicio que entregue FeatureCollection
 *
 * @param {Object} respuesta
 * @returns {boolean}
 */
function dibujarFuenteExternaTerri(respuesta) {

    if (!respuesta || typeof respuesta !== "object") {

        console.warn(
            "⚠️ Respuesta externa inválida:",
            respuesta
        );

        return false;
    }


    /* ======================================================
       IDENTIFICAR GEOJSON
    ====================================================== */

    const geojson =
        respuesta.resultado ||
        respuesta.geojson ||
        respuesta.data ||
        null;


    if (
        !geojson ||
        geojson.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features)
    ) {

        console.warn(
            "⚠️ La fuente externa no contiene un FeatureCollection válido.",
            respuesta
        );

        return false;
    }


    if (geojson.features.length === 0) {

        console.warn(
            "⚠️ La fuente externa devolvió cero entidades."
        );

        return false;
    }


    /* ======================================================
       FUENTE
    ====================================================== */

    const fuente =
        String(
            respuesta.fuente ||
            "Fuente externa"
        ).trim();


    /* ======================================================
       IDENTIFICADOR ÚNICO
    ====================================================== */

    const codigo =
        respuesta.codigo ||
        respuesta.id ||
        Date.now();


    const fuenteNormalizada =
        normalizarCampoMapaTerri(fuente) ||
        "externa";


    const layerId =
        respuesta.layer_id ||
        `terri_${fuenteNormalizada}_${codigo}`;


    const sourceId =
        `${layerId}_source`;


    /* ======================================================
       NOMBRE DE LA CAPA
    ====================================================== */

    let nombre =
        respuesta.nombre ||
        respuesta.municipio ||
        respuesta.departamento ||
        "Resultado externo";


    if (
        respuesta.municipio &&
        fuente.toUpperCase() === "IGAC"
    ) {

        nombre =
            `Límite oficial de ${respuesta.municipio}`;

    }


    /* ======================================================
       VISUALIZACIÓN
    ====================================================== */

    const visualizacion =
        respuesta.visualizacion || {
            modo: "simple",
            mostrar_leyenda: false,
            titulo_leyenda: fuente
        };


    /* ======================================================
       COLOR SEGÚN FUENTE
    ====================================================== */

    let color = "#2b8cbe";


    if (fuente.toUpperCase() === "IGAC") {

        color = "#7c3aed";

    }


    /* ======================================================
       DIBUJAR
    ====================================================== */

    dibujarGeoJSON(
        geojson,
        {
            layerId,
            sourceId,
            nombre,
            color,
            opacity: 0.22,
            visualizacion
        }
    );


    console.log(
        "🌎 Fuente externa dibujada correctamente:",
        {
            fuente,
            nombre,
            codigo,
            layerId,
            sourceId,
            total: geojson.features.length
        }
    );


    return true;
}



/* ==========================================================
   DIBUJAR RESULTADO IGAC
========================================================== */


/**
 * Función especializada para resultados provenientes
 * del Instituto Geográfico Agustín Codazzi.
 *
 * @param {Object} respuesta
 * @returns {boolean}
 */
function dibujarResultadoIGAC(respuesta) {

    if (!respuesta) {
        return false;
    }


    const fuente =
        String(
            respuesta.fuente || ""
        )
            .trim()
            .toUpperCase();


    if (fuente !== "IGAC") {

        console.warn(
            "⚠️ El resultado recibido no corresponde al IGAC."
        );

        return false;
    }


    return dibujarFuenteExternaTerri(
        respuesta
    );
}



/* ==========================================================
   DETECTAR Y DIBUJAR RESULTADO TERRITORIAL
========================================================== */


/**
 * Punto de entrada universal para resultados cartográficos.
 *
 * Permite que el frontend no necesite conocer si el
 * GeoJSON proviene de PostGIS, IGAC u otra fuente.
 *
 * @param {Object} respuesta
 * @returns {boolean}
 */
function dibujarResultadoTerritorial(respuesta) {

    if (!respuesta || typeof respuesta !== "object") {
        return false;
    }


    /* ======================================================
       FUENTE EXTERNA
    ====================================================== */

    if (
        respuesta.fuente &&
        String(respuesta.fuente)
            .trim()
            .toUpperCase() === "IGAC"
    ) {

        return dibujarResultadoIGAC(
            respuesta
        );
    }


    /* ======================================================
       GEOJSON TERRI+ / POSTGIS
    ====================================================== */

    const geojson =
        respuesta.resultado ||
        respuesta.geojson ||
        null;


    if (
        geojson &&
        geojson.type === "FeatureCollection" &&
        Array.isArray(geojson.features)
    ) {

        dibujarGeoJSON(
            geojson,
            {
                layerId:
                    respuesta.layer_id ||
                    TERRI_CONFIG.MAP_LAYER,

                sourceId:
                    respuesta.source_id ||
                    TERRI_CONFIG.MAP_SOURCE,

                nombre:
                    respuesta.nombre ||
                    "Resultado TERRI+",

                visualizacion:
                    respuesta.visualizacion ||
                    {}
            }
        );


        return true;
    }


    return false;
}
