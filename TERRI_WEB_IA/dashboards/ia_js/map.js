/* ==========================================================
   TERRI+ MAP ENGINE
   Motor geoespacial
========================================================== */

let terriMap = null;
let terriPopup = null;

const TERRI_LAYERS = {};


/* ==========================================================
   TERRI+ PANEL DE CAPAS
   Mantiene visibles múltiples resultados simultáneamente
========================================================== */

const TERRI_LAYER_COLORS = [
    "#7c3aed",
    "#2563eb",
    "#0891b2",
    "#059669",
    "#d97706",
    "#dc2626",
    "#db2777",
    "#4f46e5",
    "#65a30d",
    "#9333ea"
];


function obtenerColorCapaTerri(clave, fuente = "") {

    const texto = `${fuente}_${clave}`;

    let hash = 0;

    for (let i = 0; i < texto.length; i++) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }

    return TERRI_LAYER_COLORS[
        Math.abs(hash) % TERRI_LAYER_COLORS.length
    ];
}


function asegurarPanelCapasTerri() {

    if (!terriMap) return null;

    let panel = document.getElementById("terri-panel-capas");

    if (panel) return panel;

    const contenedorMapa = document.getElementById("map");

    if (!contenedorMapa) return null;

    const estilos = document.createElement("style");
    estilos.id = "terri-panel-capas-estilos";
    estilos.textContent = `
        #terri-panel-capas {
            position: absolute;
            left: 14px;
            bottom: 34px;
            z-index: 20;
            width: min(310px, calc(100% - 28px));
            max-height: min(360px, 55vh);
            background: rgba(255,255,255,.97);
            border: 1px solid #d8e2ea;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(15,23,42,.18);
            font-family: Arial, Helvetica, sans-serif;
            color: #17324d;
            overflow: hidden;
            display: none;
        }

        #terri-panel-capas .terri-capas-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 12px;
            background: #ffffff;
            border-bottom: 1px solid #e6edf2;
            cursor: pointer;
            user-select: none;
        }

        #terri-panel-capas .terri-capas-titulo {
            font-size: 13px;
            font-weight: 700;
        }

        #terri-panel-capas .terri-capas-contador {
            font-size: 11px;
            color: #64748b;
            margin-left: 5px;
        }

        #terri-panel-capas .terri-capas-toggle {
            border: 0;
            background: transparent;
            cursor: pointer;
            font-size: 14px;
            color: #475569;
        }

        #terri-panel-capas .terri-capas-body {
            max-height: 290px;
            overflow-y: auto;
            padding: 6px;
        }

        #terri-panel-capas.plegado .terri-capas-body {
            display: none;
        }

        #terri-panel-capas .terri-capa-item {
            display: grid;
            grid-template-columns: 24px 16px minmax(0,1fr) 30px;
            align-items: center;
            gap: 7px;
            padding: 7px 6px;
            border-radius: 8px;
        }

        #terri-panel-capas .terri-capa-item:hover {
            background: #f4f8fb;
        }

        #terri-panel-capas .terri-capa-check {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        #terri-panel-capas .terri-capa-color {
            width: 14px;
            height: 14px;
            border-radius: 4px;
            border: 1px solid rgba(15,23,42,.18);
            box-sizing: border-box;
        }

        #terri-panel-capas .terri-capa-nombre {
            min-width: 0;
            font-size: 12px;
            line-height: 1.25;
            overflow-wrap: anywhere;
        }

        #terri-panel-capas .terri-capa-eliminar {
            width: 28px;
            height: 28px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            font-size: 15px;
        }

        #terri-panel-capas .terri-capa-eliminar:hover {
            background: #fee2e2;
            color: #b91c1c;
        }

        @media (max-width: 650px) {

            #terri-panel-capas {
                left: 10px;
                bottom: 28px;
                width: min(280px, calc(100% - 20px));
                max-height: 45vh;
            }

        }
    `;

    if (!document.getElementById(estilos.id)) {
        document.head.appendChild(estilos);
    }

    panel = document.createElement("div");

    panel.id = "terri-panel-capas";
    panel.className = "plegado";

    panel.innerHTML = `
        <div
            class="terri-capas-header"
            title="Mostrar u ocultar lista de capas"
        >
            <div>
                <span class="terri-capas-titulo">
                    🗂️ Capas
                </span>

                <span class="terri-capas-contador">
                    (0)
                </span>
            </div>

            <button
                type="button"
                class="terri-capas-toggle"
                aria-label="Abrir panel de capas"
            >
                ▲
            </button>
        </div>

        <div class="terri-capas-body"></div>
    `;

    contenedorMapa.appendChild(panel);

    const header =
        panel.querySelector(
            ".terri-capas-header"
        );

    header.addEventListener(
        "click",
        () => {

            panel.classList.toggle(
                "plegado"
            );

            const plegado =
                panel.classList.contains(
                    "plegado"
                );

            const boton =
                panel.querySelector(
                    ".terri-capas-toggle"
                );

            boton.textContent =
                plegado ? "▲" : "▼";

            boton.setAttribute(
                "aria-label",
                plegado
                    ? "Abrir panel de capas"
                    : "Cerrar panel de capas"
            );

        }
    );

    return panel;
}


function actualizarPanelCapasTerri() {

    const panel =
        asegurarPanelCapasTerri();

    if (!panel) return;

    const capas =
        Object.values(TERRI_LAYERS);

    panel.style.display =
        capas.length
            ? "block"
            : "none";

    const contador =
        panel.querySelector(
            ".terri-capas-contador"
        );

    const body =
        panel.querySelector(
            ".terri-capas-body"
        );

    contador.textContent =
        `(${capas.length})`;

    body.innerHTML = "";

    capas
        .slice()
        .reverse()
        .forEach(capa => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "terri-capa-item";


            /* ==========================
               CHECKBOX
            ========================== */

            const check =
                document.createElement(
                    "input"
                );

            check.type =
                "checkbox";

            check.className =
                "terri-capa-check";

            check.checked =
                capa.visible !== false;

            check.title =
                "Mostrar u ocultar capa";

            check.addEventListener(
                "change",
                () => {

                    cambiarVisibilidadCapa(
                        capa.id,
                        check.checked
                    );

                }
            );


            /* ==========================
               MUESTRA DE COLOR
            ========================== */

            const muestra =
                document.createElement(
                    "span"
                );

            muestra.className =
                "terri-capa-color";

            muestra.style.background =
                typeof capa.color === "string"
                    ? capa.color
                    : "#64748b";


            /* ==========================
               NOMBRE
            ========================== */

            const nombre =
                document.createElement(
                    "span"
                );

            nombre.className =
                "terri-capa-nombre";

            nombre.textContent =
                capa.nombre ||
                capa.id;

            nombre.title =
                capa.nombre ||
                capa.id;


            /* ==========================
               ELIMINAR
            ========================== */

            const eliminar =
                document.createElement(
                    "button"
                );

            eliminar.type =
                "button";

            eliminar.className =
                "terri-capa-eliminar";

            eliminar.textContent =
                "✕";

            eliminar.title =
                "Eliminar esta capa";

            eliminar.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    eliminarCapaTerri(
                        capa.id
                    );

                }
            );


            item.append(
                check,
                muestra,
                nombre,
                eliminar
            );

            body.appendChild(item);

        });

}


function eliminarCapaTerri(layerId) {

    const capa =
        TERRI_LAYERS[layerId];

    if (!capa) return;

    if (terriPopup) {
        terriPopup.remove();
    }

    eliminarCapa(layerId);

    eliminarFuente(
        capa.sourceId
    );

    delete TERRI_LAYERS[layerId];

    actualizarPanelCapasTerri();

}


/* ==========================================================
   Inicializar mapa
========================================================== */

function inicializarMapa() {

    if (terriMap) return;

    terriMap =
        new maplibregl.Map({

            container: "map",

            style:
                "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",

            center: [
                -73.7972,
                5.0446
            ],

            zoom: 15,

            attributionControl: true

        });


    terriMap.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
    );


    terriPopup =
        new maplibregl.Popup({

            closeButton: true,

            closeOnClick: true,

            maxWidth: "480px",

            offset: 12

        });


    terriMap.on(
        "load",
        () => {

            asegurarPanelCapasTerri();

            actualizarPanelCapasTerri();

            console.log(
                "🗺️ Map Engine iniciado correctamente."
            );

        }
    );

}


/* ==========================================================
   Validaciones internas
========================================================== */

function mapaListo() {

    return (
        terriMap &&
        terriMap.isStyleLoaded()
    );

}


function existeCapa(id) {

    return (
        terriMap.getLayer(id) !==
        undefined
    );

}


function existeFuente(id) {

    return (
        terriMap.getSource(id) !==
        undefined
    );

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
   Limpiar mapa completo
========================================================== */

function limpiarMapa() {

    Object.keys(
        TERRI_LAYERS
    ).forEach(layerId => {

        eliminarCapa(
            layerId
        );

        eliminarFuente(
            TERRI_LAYERS[layerId]
                .sourceId
        );

        delete TERRI_LAYERS[
            layerId
        ];

    });


    if (
        window.TERRI_SYMBOLOGY
    ) {

        window
            .TERRI_SYMBOLOGY
            .ocultarLeyenda();

    }


    if (terriPopup) {

        terriPopup.remove();

    }


    actualizarPanelCapasTerri();

}


/* ==========================================================
   NORMALIZACIÓN DE CAMPOS
========================================================== */

function normalizarCampoMapaTerri(
    valor
) {

    return String(
        valor ?? ""
    )
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            "_"
        )
        .replace(
            /^_+|_+$/g,
            ""
        );

}


/* ==========================================================
   RESOLVER CAMPO CATEGÓRICO
========================================================== */

function resolverCampoCategoriaMapaTerri(
    geojson,
    campoSolicitado
) {

    if (
        !geojson ||
        !Array.isArray(
            geojson.features
        ) ||
        !campoSolicitado
    ) {

        return null;

    }


    const campoNormalizado =
        normalizarCampoMapaTerri(
            campoSolicitado
        );


    if (!campoNormalizado) {

        return null;

    }


    const entidadesConPropiedades =
        geojson.features
            .filter(feature => {

                return (
                    feature &&
                    feature.properties &&
                    typeof feature.properties ===
                        "object"
                );

            })
            .slice(
                0,
                100
            );


    /* Coincidencia exacta */

    for (
        const feature
        of entidadesConPropiedades
    ) {

        const campos =
            Object.keys(
                feature.properties
            );

        if (
            campos.includes(
                campoSolicitado
            )
        ) {

            return campoSolicitado;

        }

    }


    /* Coincidencia normalizada */

    for (
        const feature
        of entidadesConPropiedades
    ) {

        const campos =
            Object.keys(
                feature.properties
            );

        const campoEncontrado =
            campos.find(
                campo => {

                    return (
                        normalizarCampoMapaTerri(
                            campo
                        ) ===
                        campoNormalizado
                    );

                }
            );


        if (campoEncontrado) {

            return campoEncontrado;

        }

    }


    /* Equivalencias semánticas */

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
        equivalencias[
            campoNormalizado
        ] || [];


    const candidatosNormalizados =
        candidatos.map(
            normalizarCampoMapaTerri
        );


    for (
        const feature
        of entidadesConPropiedades
    ) {

        const campos =
            Object.keys(
                feature.properties
            );


        const campoEncontrado =
            campos.find(
                campo => {

                    return (
                        candidatosNormalizados
                            .includes(
                                normalizarCampoMapaTerri(
                                    campo
                                )
                            )
                    );

                }
            );


        if (campoEncontrado) {

            return campoEncontrado;

        }

    }


    return null;

}


/* ==========================================================
   TÍTULO DE CATEGORÍA
========================================================== */

function construirTituloCategoriaMapaTerri(
    campo
) {

    const campoNormalizado =
        normalizarCampoMapaTerri(
            campo
        );


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


    if (
        titulos[
            campoNormalizado
        ]
    ) {

        return titulos[
            campoNormalizado
        ];

    }


    return campoNormalizado
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letra =>
                letra.toUpperCase()
        );

}


/* ==========================================================
   DIBUJAR GEOJSON PRINCIPAL
   IMPORTANTE:
   YA NO BORRA LAS CAPAS ANTERIORES
========================================================== */

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


    /*
     * IMPORTANTE:
     *
     * Antes aquí estaba:
     *
     * limpiarMapa();
     *
     * Se eliminó intencionalmente.
     *
     * Cada consulta nueva ahora
     * se agrega al mapa.
     */


    /* ======================================================
       COLOR PREDETERMINADO
    ====================================================== */

    let colorMapa =
        opciones.color ||
        "#2b8cbe";


    let simbologia =
        null;


    /* ======================================================
       INFORMACIÓN DEL PLANNER
    ====================================================== */

    const visualizacion =
        opciones.visualizacion ||
        {};


    const campoCategoriaSolicitado =
        visualizacion
            .campo_categoria ||

        visualizacion
            .campoCategoria ||

        visualizacion
            .campo ||

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
       RESOLVER CAMPO REAL
    ====================================================== */

    const campoCategoriaReal =
        resolverCampoCategoriaMapaTerri(
            geojson,
            campoCategoriaSolicitado
        );


    const esModoContinuo =

        modoVisualizacion
            .includes(
                "continu"
            ) ||

        modoVisualizacion
            .includes(
                "graduad"
            ) ||

        modoVisualizacion
            .includes(
                "rango"
            ) ||

        modoVisualizacion
            .includes(
                "cuant"
            );


    const solicitaCategorias =
        Boolean(
            campoCategoriaReal
        ) &&
        !esModoContinuo;


    /* ======================================================
       SIMBOLOGÍA CATEGÓRICA
    ====================================================== */

    if (
        solicitaCategorias &&
        window.TERRI_SYMBOLOGY
    ) {

        const tituloLeyenda =

            visualizacion
                .titulo_leyenda ||

            visualizacion
                .tituloLeyenda ||

            construirTituloCategoriaMapaTerri(
                campoCategoriaReal
            );


        simbologia =
            window
                .TERRI_SYMBOLOGY
                .prepararCategorica({

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
                simbologia
                    .expresionColor;


            window
                .TERRI_SYMBOLOGY
                .mostrarLeyendaCategorica({

                    titulo:
                        simbologia
                            .tituloLeyenda,

                    categorias:
                        simbologia
                            .categorias

                });


            console.log(
                "🎨 Simbología categórica aplicada:",
                {

                    capa:
                        nombre,

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

                    capa:
                        nombre,

                    campoSolicitado:
                        campoCategoriaSolicitado,

                    campoReal:
                        campoCategoriaReal,

                    motivo:
                        simbologia?.motivo ||
                        "Respuesta inválida del motor de simbología."

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

        color:
            colorMapa,

        opacity:
            opciones.opacity ??
            0.55,

        simbologia

    });


    /* ======================================================
       NAVEGACIÓN
    ====================================================== */

    zoomResultado(
        layerId
    );


    activarPopups(
        layerId
    );

}
/* ==========================================================
   AGREGAR CAPA GEOJSON
========================================================== */

function agregarCapaGeoJSON(config) {

    const {
        geojson,
        layerId,
        sourceId,
        nombre,
        color,
        opacity,
        simbologia = null
    } = config;


    if (
        !geojson ||
        !Array.isArray(geojson.features) ||
        geojson.features.length === 0
    ) {

        console.warn(
            "⚠️ GeoJSON inválido o sin entidades:",
            geojson
        );

        return;

    }


    const primeraEntidadValida =
        geojson.features.find(
            feature => {

                return (
                    feature &&
                    feature.geometry &&
                    feature.geometry.type
                );

            }
        );


    if (!primeraEntidadValida) {

        console.warn(
            "⚠️ El GeoJSON no contiene geometrías válidas."
        );

        return;

    }


    const tipoGeometria =
        primeraEntidadValida
            .geometry
            .type;


    /*
     * IMPORTANTE:
     *
     * Aquí solamente eliminamos una capa
     * si tiene exactamente el mismo ID.
     *
     * NO eliminamos las demás capas.
     *
     * Esto permite:
     *
     * Vías + Ríos + Lagunas + Embalses...
     */

    eliminarCapa(
        layerId
    );

    eliminarFuente(
        sourceId
    );


    terriMap.addSource(
        sourceId,
        {

            type:
                "geojson",

            data:
                geojson

        }
    );


    let configuracionCapa =
        null;


    /* ======================================================
       POLÍGONOS
    ====================================================== */

    if (
        tipoGeometria ===
            "Polygon" ||

        tipoGeometria ===
            "MultiPolygon"
    ) {

        configuracionCapa = {

            id:
                layerId,

            type:
                "fill",

            source:
                sourceId,

            paint: {

                "fill-color":
                    color,

                "fill-opacity":
                    opacity,

                "fill-outline-color":
                    "#12344d"

            }

        };

    }


    /* ======================================================
       LÍNEAS
    ====================================================== */

    else if (
        tipoGeometria ===
            "LineString" ||

        tipoGeometria ===
            "MultiLineString"
    ) {

        configuracionCapa = {

            id:
                layerId,

            type:
                "line",

            source:
                sourceId,

            layout: {

                "line-cap":
                    "round",

                "line-join":
                    "round"

            },

            paint: {

                "line-color":
                    color,

                "line-width":
                    4,

                "line-opacity":
                    Math.max(
                        opacity,
                        0.8
                    )

            }

        };

    }


    /* ======================================================
       PUNTOS
    ====================================================== */

    else if (
        tipoGeometria ===
            "Point" ||

        tipoGeometria ===
            "MultiPoint"
    ) {

        configuracionCapa = {

            id:
                layerId,

            type:
                "circle",

            source:
                sourceId,

            paint: {

                "circle-radius":
                    7,

                "circle-color":
                    color,

                "circle-opacity":
                    Math.max(
                        opacity,
                        0.85
                    ),

                "circle-stroke-color":
                    "#ffffff",

                "circle-stroke-width":
                    2

            }

        };

    }


    /* ======================================================
       GEOMETRÍA NO SOPORTADA
    ====================================================== */

    else {

        console.warn(
            `⚠️ Tipo de geometría no soportado: ${tipoGeometria}`
        );


        eliminarFuente(
            sourceId
        );


        return;

    }


    /* ======================================================
       AGREGAR CAPA A MAPLIBRE
    ====================================================== */

    terriMap.addLayer(
        configuracionCapa
    );


    /* ======================================================
       REGISTRAR CAPA EN TERRI+
    ====================================================== */

    TERRI_LAYERS[
        layerId
    ] = {

        id:
            layerId,

        sourceId,

        nombre,

        tipo:
            tipoGeometria,

        visible:
            true,

        geojson,

        color,

        opacity,

        simbologia

    };


    /*
     * Actualizar automáticamente
     * el administrador de capas.
     */

    actualizarPanelCapasTerri();


    console.log(
        `✅ Capa ${nombre} dibujada como ${tipoGeometria}.`
    );

}


/* ==========================================================
   ZOOM AUTOMÁTICO SEGURO
========================================================== */

function zoomResultado(
    layerId =
        TERRI_CONFIG.MAP_LAYER
) {

    const capa =
        TERRI_LAYERS[
            layerId
        ];


    if (
        !capa ||
        !capa.geojson ||
        !Array.isArray(
            capa.geojson.features
        ) ||
        capa.geojson.features
            .length === 0
    ) {

        return;

    }


    const bounds =
        new maplibregl
            .LngLatBounds();


    capa.geojson
        .features
        .forEach(
            feature => {

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

            }
        );


    if (
        bounds.isEmpty()
    ) {

        console.warn(
            "⚠️ No se encontraron coordenadas válidas para ajustar el zoom.",
            {

                layerId,

                geojson:
                    capa.geojson

            }
        );


        return;

    }


    const suroeste =
        bounds
            .getSouthWest();


    const noreste =
        bounds
            .getNorthEast();


    if (
        !suroeste ||
        !noreste ||
        !Number.isFinite(
            suroeste.lng
        ) ||
        !Number.isFinite(
            suroeste.lat
        ) ||
        !Number.isFinite(
            noreste.lng
        ) ||
        !Number.isFinite(
            noreste.lat
        )
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

        suroeste.lng ===
            noreste.lng &&

        suroeste.lat ===
            noreste.lat;


    if (
        esUnSoloPunto
    ) {

        terriMap.flyTo({

            center: [

                suroeste.lng,

                suroeste.lat

            ],

            zoom:
                17,

            duration:
                900

        });


        return;

    }


    terriMap.fitBounds(
        bounds,
        {

            padding:
                50,

            maxZoom:
                17,

            duration:
                1200

        }
    );

}


/* ==========================================================
   EXPANDIR BOUNDS
========================================================== */

function expandirBounds(
    bounds,
    geometry
) {

    if (!geometry) {

        return;

    }


    /* PUNTO */

    if (
        geometry.type ===
        "Point"
    ) {

        bounds.extend(
            geometry.coordinates
        );

    }


    /* MULTIPUNTO */

    if (
        geometry.type ===
        "MultiPoint"
    ) {

        geometry.coordinates
            .forEach(
                coord =>
                    bounds.extend(
                        coord
                    )
            );

    }


    /* LÍNEA */

    if (
        geometry.type ===
        "LineString"
    ) {

        geometry.coordinates
            .forEach(
                coord =>
                    bounds.extend(
                        coord
                    )
            );

    }


    /* MULTILÍNEA */

    if (
        geometry.type ===
        "MultiLineString"
    ) {

        geometry.coordinates
            .forEach(
                linea => {

                    linea.forEach(
                        coord =>
                            bounds.extend(
                                coord
                            )
                    );

                }
            );

    }


    /* POLÍGONO */

    if (
        geometry.type ===
        "Polygon"
    ) {

        geometry.coordinates
            .forEach(
                anillo => {

                    anillo.forEach(
                        coord =>
                            bounds.extend(
                                coord
                            )
                    );

                }
            );

    }


    /* MULTIPOLÍGONO */

    if (
        geometry.type ===
        "MultiPolygon"
    ) {

        geometry.coordinates
            .forEach(
                poligono => {

                    poligono.forEach(
                        anillo => {

                            anillo.forEach(
                                coord =>
                                    bounds.extend(
                                        coord
                                    )
                            );

                        }
                    );

                }
            );

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

function escaparHtmlPopupTerri(
    valor
) {

    return String(
        valor ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==========================================================
   ETIQUETAS DEL POPUP
========================================================== */

function obtenerEtiquetaPopupTerri(
    campo
) {

    const campoNormalizado =
        String(campo)
            .trim()
            .toLowerCase();


    const etiquetas = {

        /* Identificación */

        id:
            "ID",

        codigo:
            "Código",

        numero_predial:
            "Número predial",

        nombre:
            "Nombre",

        destino:
            "Destino",

        direccion:
            "Dirección",

        documento:
            "Documento",

        numero_documento:
            "Número de documento",


        /* Predial */

        avaluo_2025:
            "Avalúo 2025",

        avaluo_2026:
            "Avalúo 2026",

        area_terreno:
            "Área de terreno",

        area_construida:
            "Área construida",

        area_m2:
            "Área",


        /* Contribuyentes */

        estado:
            "Estado",

        razon_social:
            "Razón social",

        naturaleza_juridica:
            "Naturaleza jurídica",

        tipo_contribuyente:
            "Tipo de contribuyente",


        /* Ambiental */

        area_ha:
            "Área",

        stock_carbono_total_tc:
            "Stock total de carbono",

        carbono_tc:
            "Carbono",

        densidad_carbono_media_tc_ha:
            "Densidad media de carbono",

        densidad_c_media_tc_ha:
            "Densidad media de carbono",

        ndvi_medio:
            "NDVI medio",

        ndvi_medio_poligono:
            "NDVI medio",

        porcentaje_cobertura_forestal:
            "Cobertura forestal",

        tipo_bosque_predominante:
            "Tipo de bosque predominante",

        area_perdida_ha:
            "Área perdida",

        carbono_perdido_tc:
            "Carbono perdido",


        /* IGAC */

        nombre_geografico:
            "Nombre geográfico",

        _terri_tema:
            "Tema",

        _terri_capa_igac:
            "Capa IGAC",

        objectid:
            "ObjectID",

        pk_cue:
            "PK CUE",


        /* Campo auxiliar */

        capa:
            "Capa"

    };


    if (
        etiquetas[
            campoNormalizado
        ]
    ) {

        return etiquetas[
            campoNormalizado
        ];

    }


    return campoNormalizado

        .replace(
            /^_+/,
            ""
        )

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            letra =>
                letra.toUpperCase()
        );

}


/* ==========================================================
   CONVERTIR VALORES NUMÉRICOS
========================================================== */

function convertirNumeroPopupTerri(
    valor
) {

    if (
        typeof valor ===
        "number"
    ) {

        return Number.isFinite(
            valor
        )
            ? valor
            : null;

    }


    const texto =
        String(
            valor ?? ""
        )
            .trim()
            .replace(
                /\s/g,
                ""
            );


    if (!texto) {

        return null;

    }


    let normalizado =
        texto;


    const tienePunto =
        texto.includes(
            "."
        );


    const tieneComa =
        texto.includes(
            ","
        );


    if (
        tienePunto &&
        tieneComa
    ) {

        const ultimoPunto =
            texto.lastIndexOf(
                "."
            );


        const ultimaComa =
            texto.lastIndexOf(
                ","
            );


        if (
            ultimaComa >
            ultimoPunto
        ) {

            normalizado =
                texto
                    .replace(
                        /\./g,
                        ""
                    )
                    .replace(
                        ",",
                        "."
                    );

        } else {

            normalizado =
                texto.replace(
                    /,/g,
                    ""
                );

        }

    }

    else if (
        tieneComa
    ) {

        normalizado =
            texto.replace(
                ",",
                "."
            );

    }


    const numero =
        Number(
            normalizado
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : null;

}


/* ==========================================================
   FORMATEAR VALORES DEL POPUP
========================================================== */

function formatearValorPopupTerri(
    campo,
    valor
) {

    const campoNormalizado =
        String(campo)
            .trim()
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /\s+/g,
                "_"
            );


    const numero =
        convertirNumeroPopupTerri(
            valor
        );


    const formatearNumero = (
        valorNumerico,
        decimales = 2
    ) => {

        return new Intl
            .NumberFormat(
                "es-CO",
                {

                    minimumFractionDigits:
                        0,

                    maximumFractionDigits:
                        decimales

                }
            )
            .format(
                valorNumerico
            );

    };


    /* ======================================================
       IDENTIFICADORES
    ====================================================== */

    if (
        campoNormalizado ===
            "id" ||

        campoNormalizado
            .includes(
                "codigo"
            ) ||

        campoNormalizado
            .includes(
                "documento"
            ) ||

        campoNormalizado
            .includes(
                "numero_predial"
            )
    ) {

        return String(
            valor ?? ""
        );

    }


    /* ======================================================
       VALORES MONETARIOS
    ====================================================== */

    const esValorMonetario =

        campoNormalizado
            .includes(
                "avaluo"
            ) ||

        campoNormalizado
            .includes(
                "liquidacion"
            ) ||

        campoNormalizado
            .includes(
                "total_valor_mora"
            ) ||

        campoNormalizado
            .includes(
                "valor_ultimo_pago"
            ) ||

        campoNormalizado
            .includes(
                "pago_marzo"
            ) ||

        campoNormalizado
            .includes(
                "impuesto"
            ) ||

        campoNormalizado
            .includes(
                "valor_predial"
            ) ||

        campoNormalizado
            .includes(
                "valor_catastral"
            );


    if (
        esValorMonetario &&
        numero !== null
    ) {

        return new Intl
            .NumberFormat(
                "es-CO",
                {

                    style:
                        "currency",

                    currency:
                        "COP",

                    minimumFractionDigits:
                        0,

                    maximumFractionDigits:
                        0

                }
            )
            .format(
                numero
            );

    }


    /* ======================================================
       ÁREAS EN HECTÁREAS
    ====================================================== */

    const esAreaHectareas =

        campoNormalizado ===
            "area_ha" ||

        campoNormalizado
            .includes(
                "area_perdida_ha"
            ) ||

        campoNormalizado
            .includes(
                "area_hectareas"
            ) ||

        (
            campoNormalizado
                .includes(
                    "area"
                ) &&

            campoNormalizado
                .endsWith(
                    "_ha"
                )
        );


    if (
        esAreaHectareas &&
        numero !== null
    ) {

        return (
            `${formatearNumero(
                numero,
                2
            )} ha`
        );

    }


    /* ======================================================
       ÁREAS EN METROS CUADRADOS
    ====================================================== */

    const esAreaMetrosCuadrados =

        campoNormalizado ===
            "area_m2" ||

        campoNormalizado
            .includes(
                "shape_area"
            ) ||

        campoNormalizado
            .includes(
                "area_terreno"
            ) ||

        campoNormalizado
            .includes(
                "area_construida"
            ) ||

        campoNormalizado
            .endsWith(
                "_m2"
            );


    if (
        esAreaMetrosCuadrados &&
        numero !== null
    ) {

        return (
            `${formatearNumero(
                numero,
                2
            )} m²`
        );

    }


    /* ======================================================
       DENSIDAD DE CARBONO
    ====================================================== */

    const esDensidadCarbono =

        campoNormalizado
            .includes(
                "densidad"
            ) &&

        campoNormalizado
            .includes(
                "carbono"
            );


    const esDensidadC =

        campoNormalizado
            .includes(
                "densidad_c_"
            ) ||

        campoNormalizado
            .includes(
                "densidad_c_media"
            );


    if (
        (
            esDensidadCarbono ||
            esDensidadC
        ) &&
        numero !== null
    ) {

        return (
            `${formatearNumero(
                numero,
                2
            )} tC/ha`
        );

    }


    /* ======================================================
       CARBONO
    ====================================================== */

    const esCarbono =

        campoNormalizado
            .includes(
                "carbono"
            ) &&

        (
            campoNormalizado
                .includes(
                    "stock"
                ) ||

            campoNormalizado
                .includes(
                    "total"
                ) ||

            campoNormalizado
                .includes(
                    "perdido"
                ) ||

            campoNormalizado
                .endsWith(
                    "_tc"
                ) ||

            campoNormalizado ===
                "carbono_tc"
        );


    if (
        esCarbono &&
        numero !== null
    ) {

        return (
            `${formatearNumero(
                numero,
                2
            )} tC`
        );

    }


    /* ======================================================
       PORCENTAJES
    ====================================================== */

    const esPorcentaje =

        campoNormalizado
            .includes(
                "porcentaje"
            ) ||

        campoNormalizado
            .includes(
                "percent"
            );


    if (
        esPorcentaje &&
        numero !== null
    ) {

        return (
            `${formatearNumero(
                numero,
                2
            )} %`
        );

    }


    /* ======================================================
       NDVI
    ====================================================== */

    const esNdvi =
        campoNormalizado
            .includes(
                "ndvi"
            );


    if (
        esNdvi &&
        numero !== null
    ) {

        return formatearNumero(
            numero,
            2
        );

    }


    /* ======================================================
       ÁREA GENÉRICA
    ====================================================== */

    if (
        campoNormalizado
            .includes(
                "area"
            ) &&
        numero !== null
    ) {

        return formatearNumero(
            numero,
            2
        );

    }


    /* ======================================================
       RESTO
    ====================================================== */

    return String(
        valor ?? ""
    );

}


/* ==========================================================
   ORDEN DE CAMPOS DEL POPUP
========================================================== */

function ordenarCamposPopupTerri(
    propiedades
) {

    const orden = [

        /* Identificación */

        "id",
        "codigo",
        "numero_predial",
        "nombre",
        "nombre_geografico",
        "razon_social",


        /* IGAC */

        "_terri_tema",
        "_terri_capa_igac",
        "objectid",
        "pk_cue",


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


    return Object
        .entries(
            propiedades || {}
        )
        .sort(
            (
                [campoA],
                [campoB]
            ) => {

                const indiceA =
                    orden.indexOf(
                        campoA
                    );


                const indiceB =
                    orden.indexOf(
                        campoB
                    );


                if (
                    indiceA !== -1 &&
                    indiceB !== -1
                ) {

                    return (
                        indiceA -
                        indiceB
                    );

                }


                if (
                    indiceA !== -1
                ) {

                    return -1;

                }


                if (
                    indiceB !== -1
                ) {

                    return 1;

                }


                return campoA
                    .localeCompare(
                        campoB,
                        "es"
                    );

            }
        );

}


/* ==========================================================
   CONSTRUIR POPUP
========================================================== */

function construirHtmlPopupTerri(
    propiedades
) {

    const camposOcultos =
        new Set([
            "geom",
            "geometry",
            "latitud",
            "longitud",
            "latitude",
            "longitude"
        ]);


    const esIGAC =
        propiedades &&
        (
            propiedades._terri_tema ||
            propiedades._terri_capa_igac
        );


    const filas =
        ordenarCamposPopupTerri(
            propiedades
        )

            .filter(
                (
                    [
                        campo,
                        valor
                    ]
                ) => {

                    if (
                        camposOcultos
                            .has(
                                campo
                            )
                    ) {

                        return false;

                    }


                    if (
                        valor === null ||
                        valor === undefined ||
                        String(valor)
                            .trim() ===
                            ""
                    ) {

                        return false;

                    }


                    return true;

                }
            )

            .map(
                (
                    [
                        campo,
                        valor
                    ]
                ) => {

                    const etiqueta =
                        obtenerEtiquetaPopupTerri(
                            campo
                        );


                    const valorFormateado =
                        formatearValorPopupTerri(
                            campo,
                            valor
                        );


                    return `
                        <div class="popup-terri-fila">

                            <div class="popup-terri-etiqueta">
                                ${escaparHtmlPopupTerri(
                                    etiqueta
                                )}
                            </div>

                            <div class="popup-terri-valor">
                                ${escaparHtmlPopupTerri(
                                    valorFormateado
                                )}
                            </div>

                        </div>
                    `;

                }
            )
            .join("");


    const tituloPopup =
        esIGAC
            ? "🌎 Información IGAC"
            : "📍 Información del predio";


    return `
        <div class="popup-terri-contenido">

            <div class="popup-terri-titulo">
                ${tituloPopup}
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
/* ==========================================================
   ESTILOS DEL POPUP
========================================================== */

function asegurarEstilosPopupTerri() {

    if (
        document.getElementById(
            "popup-terri-estilos"
        )
    ) {

        return;

    }


    const estilos =
        document.createElement(
            "style"
        );


    estilos.id =
        "popup-terri-estilos";


    estilos.textContent = `

        .maplibregl-popup {

            max-width:
                min(
                    480px,
                    calc(100vw - 24px)
                ) !important;

        }


        .maplibregl-popup-content {

            padding:
                0 !important;

            border-radius:
                10px !important;

            overflow:
                hidden;

            box-shadow:
                0 8px 24px
                rgba(
                    15,
                    23,
                    42,
                    0.22
                );

        }


        .maplibregl-popup-close-button {

            width:
                30px;

            height:
                30px;

            padding:
                0;

            font-size:
                20px;

            line-height:
                28px;

            color:
                #334155;

            background:
                transparent;

            z-index:
                10;

        }


        .maplibregl-popup-close-button:hover {

            color:
                #0f172a;

            background:
                #f1f5f9;

        }


        .popup-terri-contenido {

            width:
                100%;

            min-width:
                350px;

            max-width:
                480px;

            max-height:
                min(
                    430px,
                    60vh
                );

            padding:
                16px;

            overflow-y:
                auto;

            overflow-x:
                hidden;

            box-sizing:
                border-box;

            background:
                #ffffff;

            color:
                #17324d;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            font-size:
                13px;

            line-height:
                1.45;

        }


        .popup-terri-titulo {

            margin:
                -16px
                -16px
                16px
                -16px;

            padding:
                12px
                16px;

            background:
                #0b5cab;

            color:
                white;

            font-size:
                15px;

            font-weight:
                bold;

            border-bottom:
                1px solid
                #dbe7ee;

        }


        .popup-terri-fila {

            display:
                grid;

            grid-template-columns:
                minmax(
                    120px,
                    140px
                )
                minmax(
                    0,
                    1fr
                );

            column-gap:
                16px;

            align-items:
                start;

            padding:
                8px
                0;

            border-bottom:
                1px solid
                #e7edf3;

        }


        .popup-terri-fila:last-child {

            border-bottom:
                none;

        }


        .popup-terri-etiqueta {

            min-width:
                0;

            font-weight:
                700;

            color:
                #17324d;

            overflow-wrap:
                break-word;

        }


        .popup-terri-valor {

            min-width:
                0;

            color:
                #31536f;

            white-space:
                normal;

            word-break:
                break-word;

            overflow-wrap:
                anywhere;

        }


        .popup-terri-sin-datos {

            padding:
                16px;

            text-align:
                center;

            color:
                #64748b;

        }


        .popup-terri-contenido::-webkit-scrollbar {

            width:
                7px;

        }


        .popup-terri-contenido::-webkit-scrollbar-track {

            background:
                #f1f5f9;

        }


        .popup-terri-contenido::-webkit-scrollbar-thumb {

            background:
                #b7c4d0;

            border-radius:
                10px;

        }


        @media (
            max-width:
                650px
        ) {

            .popup-terri-contenido {

                width:
                    calc(
                        100vw - 44px
                    );

                min-width:
                    0;

                max-width:
                    390px;

                max-height:
                    52vh;

                padding:
                    14px;

                font-size:
                    12px;

            }


            .popup-terri-fila {

                grid-template-columns:
                    minmax(
                        100px,
                        115px
                    )
                    minmax(
                        0,
                        1fr
                    );

                column-gap:
                    10px;

            }

        }


        @media (
            max-width:
                400px
        ) {

            .popup-terri-contenido {

                width:
                    calc(
                        100vw - 36px
                    );

                padding:
                    12px;

            }


            .popup-terri-fila {

                display:
                    block;

            }


            .popup-terri-etiqueta {

                margin-bottom:
                    3px;

            }

        }

    `;


    document.head.appendChild(
        estilos
    );

}


/* ==========================================================
   ACTIVAR POPUPS
========================================================== */

function activarPopups(
    layerId =
        TERRI_CONFIG.MAP_LAYER
) {

    asegurarEstilosPopupTerri();


    /*
     * Al actualizar una capa con el mismo ID,
     * retiramos sus manejadores anteriores.
     */

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
                feature.properties ||
                {};


            console.log(
                "PROPIEDADES DEL POPUP"
            );


            console.table(
                propiedades
            );


            const html =
                construirHtmlPopupTerri(
                    propiedades
                );


            terriPopup

                .setLngLat(
                    e.lngLat
                )

                .setHTML(
                    html
                )

                .addTo(
                    terriMap
                );

        }
    );


    terriMap.on(
        "mouseenter",
        layerId,
        function() {

            terriMap
                .getCanvas()
                .style
                .cursor =
                    "pointer";

        }
    );


    terriMap.on(
        "mouseleave",
        layerId,
        function() {

            terriMap
                .getCanvas()
                .style
                .cursor =
                    "";

        }
    );

}


/* ==========================================================
   VISIBILIDAD DE CAPAS
========================================================== */

function cambiarVisibilidadCapa(
    layerId,
    visible
) {

    if (
        !existeCapa(
            layerId
        )
    ) {

        return;

    }


    terriMap
        .setLayoutProperty(

            layerId,

            "visibility",

            visible
                ? "visible"
                : "none"

        );


    if (
        TERRI_LAYERS[
            layerId
        ]
    ) {

        TERRI_LAYERS[
            layerId
        ].visible =
            visible;

    }


    actualizarPanelCapasTerri();

}


/* ==========================================================
   OBTENER CAPAS ACTIVAS
========================================================== */

function obtenerCapasActivas() {

    return TERRI_LAYERS;

}


/* ==========================================================
   UTILIDADES PARA FUENTES EXTERNAS
========================================================== */


/**
 * Construye un identificador estable.
 *
 * Es fundamental para el sistema multicapa:
 *
 * - vías de Sesquilé siempre tendrán el mismo ID;
 * - ríos de Sesquilé tendrán otro;
 * - embalses tendrán otro;
 * - lagunas tendrán otro.
 *
 * Así repetir una consulta reemplaza únicamente
 * esa misma capa y no genera duplicados.
 */

function construirIdCapaExternaTerri(
    respuesta,
    fuente
) {

    const fuenteNormalizada =
        normalizarCampoMapaTerri(
            fuente
        ) ||
        "externa";


    const servicio =
        normalizarCampoMapaTerri(
            respuesta.servicio ||
            respuesta.catalogo ||
            ""
        );


    const tema =
        normalizarCampoMapaTerri(
            respuesta.tema ||
            respuesta.tipo_tema ||
            ""
        );


    const municipio =
        normalizarCampoMapaTerri(
            respuesta.municipio ||
            ""
        );


    const departamento =
        normalizarCampoMapaTerri(
            respuesta.departamento ||
            ""
        );


    /*
     * Para resultados temáticos usamos primero
     * servicio + tema + territorio.
     *
     * No usamos únicamente el layer_id numérico
     * de ArcGIS porque ese número puede repetirse
     * entre diferentes servicios.
     */

    if (
        tema ||
        municipio ||
        departamento
    ) {

        const partes = [

            "terri",

            fuenteNormalizada,

            servicio,

            tema,

            municipio,

            departamento

        ].filter(Boolean);


        return partes.join(
            "_"
        );

    }


    /*
     * Compatibilidad con otras fuentes externas.
     */

    const codigo =
        respuesta.codigo ||
        respuesta.id ||
        respuesta.layer_id ||
        "resultado";


    return [
        "terri",
        fuenteNormalizada,
        normalizarCampoMapaTerri(
            codigo
        )
    ]
        .filter(Boolean)
        .join("_");

}


/**
 * Obtiene un nombre legible para la capa externa.
 */

function construirNombreCapaExternaTerri(
    respuesta,
    fuente
) {

    if (
        respuesta.nombre
    ) {

        return String(
            respuesta.nombre
        );

    }


    const tema =
        normalizarCampoMapaTerri(
            respuesta.tema ||
            ""
        );


    const municipio =
        respuesta.municipio ||
        "";


    const departamento =
        respuesta.departamento ||
        "";


    const territorio =
        municipio ||
        departamento ||
        "";


    const nombresTema = {

        vias:
            "Vías",

        via:
            "Vías",

        vias_terrestres:
            "Vías",

        via_ferrea:
            "Vía férrea",

        vias_ferreas:
            "Vías férreas",

        rios:
            "Ríos y drenajes",

        drenajes:
            "Ríos y drenajes",

        rios_drenajes:
            "Ríos y drenajes",

        canales:
            "Canales",

        cuerpos_agua:
            "Cuerpos de agua",

        cuerpos_de_agua:
            "Cuerpos de agua",

        lagunas:
            "Lagunas",

        humedales:
            "Humedales",

        embalses:
            "Embalses",

        bosques:
            "Bosques",

        tuneles:
            "Túneles",

        puentes:
            "Puentes",

        construcciones:
            "Construcciones",

        minas:
            "Minas",

        aeropuertos:
            "Aeropuertos",

        puertos:
            "Puertos",

        islas:
            "Islas",

        limite:
            "Límite oficial",

        limites:
            "Límite oficial",

        limite_municipal:
            "Límite municipal",

        limite_departamental:
            "Límite departamental"

    };


    let nombreTema =
        nombresTema[
            tema
        ];


    if (
        !nombreTema &&
        tema
    ) {

        nombreTema =
            construirTituloCategoriaMapaTerri(
                tema
            );

    }


    /*
     * Si hay un tema, ese tema debe prevalecer.
     *
     * Esto corrige el comportamiento anterior,
     * donde cualquier resultado IGAC con municipio
     * se llamaba "Límite oficial de ...".
     */

    if (
        nombreTema &&
        territorio
    ) {

        return (
            `${nombreTema} — ${territorio}`
        );

    }


    if (
        nombreTema
    ) {

        return nombreTema;

    }


    /*
     * Solo usamos "Límite oficial" cuando
     * realmente no hay tema cartográfico
     * y la respuesta corresponde a un límite.
     */

    if (
        fuente
            .toUpperCase() ===
            "IGAC" &&
        municipio
    ) {

        return (
            `Límite oficial de ${municipio}`
        );

    }


    if (
        fuente
            .toUpperCase() ===
            "IGAC" &&
        departamento
    ) {

        return (
            `Límite oficial de ${departamento}`
        );

    }


    return (
        respuesta.municipio ||
        respuesta.departamento ||
        "Resultado externo"
    );

}


/**
 * Devuelve un color diferente según el tema.
 */

function obtenerColorFuenteExternaTerri(
    respuesta,
    fuente
) {

    const tema =
        normalizarCampoMapaTerri(
            respuesta.tema ||
            ""
        );


    /*
     * Colores fijos para temas frecuentes.
     * Esto hace que la leyenda sea más intuitiva.
     */

    const coloresTema = {

        vias:
            "#d97706",

        via:
            "#d97706",

        vias_terrestres:
            "#d97706",

        via_ferrea:
            "#475569",

        vias_ferreas:
            "#475569",

        rios:
            "#2563eb",

        drenajes:
            "#2563eb",

        rios_drenajes:
            "#2563eb",

        canales:
            "#0891b2",

        cuerpos_agua:
            "#0284c7",

        cuerpos_de_agua:
            "#0284c7",

        lagunas:
            "#0ea5e9",

        humedales:
            "#059669",

        embalses:
            "#0369a1",

        bosques:
            "#16a34a",

        tuneles:
            "#57534e",

        puentes:
            "#9333ea",

        construcciones:
            "#dc2626",

        minas:
            "#78716c",

        aeropuertos:
            "#7c3aed",

        puertos:
            "#0f766e",

        islas:
            "#65a30d",

        limite:
            "#7c3aed",

        limites:
            "#7c3aed",

        limite_municipal:
            "#7c3aed",

        limite_departamental:
            "#9333ea"

    };


    if (
        coloresTema[
            tema
        ]
    ) {

        return coloresTema[
            tema
        ];

    }


    return obtenerColorCapaTerri(
        tema ||
        respuesta.layer_id ||
        respuesta.codigo ||
        "resultado",
        fuente
    );

}


/* ==========================================================
   TERRI+ FUENTES EXTERNAS
   IGAC + otros servicios GeoJSON
========================================================== */

function dibujarFuenteExternaTerri(
    respuesta
) {

    if (
        !respuesta ||
        typeof respuesta !==
            "object"
    ) {

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
        geojson.type !==
            "FeatureCollection" ||
        !Array.isArray(
            geojson.features
        )
    ) {

        console.warn(
            "⚠️ La fuente externa no contiene un FeatureCollection válido.",
            respuesta
        );


        return false;

    }


    if (
        geojson.features
            .length === 0
    ) {

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
        )
            .trim();


    /* ======================================================
       ID ESTABLE DE LA CAPA
    ====================================================== */

    const layerId =
        construirIdCapaExternaTerri(
            respuesta,
            fuente
        );


    const sourceId =
        `${layerId}_source`;


    /* ======================================================
       NOMBRE LEGIBLE
    ====================================================== */

    const nombre =
        construirNombreCapaExternaTerri(
            respuesta,
            fuente
        );


    /* ======================================================
       VISUALIZACIÓN
    ====================================================== */

    const visualizacion =
        respuesta.visualizacion ||
        {

            modo:
                "simple",

            mostrar_leyenda:
                false,

            titulo_leyenda:
                fuente

        };


    /* ======================================================
       COLOR
    ====================================================== */

    const color =
        obtenerColorFuenteExternaTerri(
            respuesta,
            fuente
        );


    /* ======================================================
       OPACIDAD
    ====================================================== */

    let opacity =
        0.35;


    const primeraGeometria =
        geojson.features
            .find(
                feature =>
                    feature?.geometry?.type
            )
            ?.geometry
            ?.type ||
        "";


    /*
     * Las líneas necesitan mayor opacidad
     * que los polígonos.
     */

    if (
        primeraGeometria ===
            "LineString" ||
        primeraGeometria ===
            "MultiLineString"
    ) {

        opacity =
            0.9;

    }


    if (
        primeraGeometria ===
            "Point" ||
        primeraGeometria ===
            "MultiPoint"
    ) {

        opacity =
            0.9;

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

            opacity,

            visualizacion

        }
    );


    console.log(
        "🌎 Fuente externa dibujada correctamente:",
        {

            fuente,

            nombre,

            tema:
                respuesta.tema,

            municipio:
                respuesta.municipio,

            departamento:
                respuesta.departamento,

            layerId,

            sourceId,

            color,

            total:
                geojson.features
                    .length

        }
    );


    return true;

}


/* ==========================================================
   DIBUJAR RESULTADO IGAC
========================================================== */

function dibujarResultadoIGAC(
    respuesta
) {

    if (!respuesta) {

        return false;

    }


    const fuente =
        String(
            respuesta.fuente ||
            ""
        )
            .trim()
            .toUpperCase();


    if (
        fuente !==
        "IGAC"
    ) {

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
 * Permite trabajar con:
 *
 * - PostGIS;
 * - TERRI+;
 * - IGAC;
 * - futuras fuentes externas.
 */

function dibujarResultadoTerritorial(
    respuesta
) {

    if (
        !respuesta ||
        typeof respuesta !==
            "object"
    ) {

        return false;

    }


    /* ======================================================
       IGAC
    ====================================================== */

    if (
        respuesta.fuente &&
        String(
            respuesta.fuente
        )
            .trim()
            .toUpperCase() ===
            "IGAC"
    ) {

        return dibujarResultadoIGAC(
            respuesta
        );

    }


    /* ======================================================
       OTRAS FUENTES EXTERNAS
    ====================================================== */

    if (
        respuesta.fuente &&
        String(
            respuesta.fuente
        )
            .trim()
            .toUpperCase() !==
            "POSTGIS" &&
        String(
            respuesta.fuente
        )
            .trim()
            .toUpperCase() !==
            "TERRI"
    ) {

        const posibleGeoJSON =

            respuesta.resultado ||

            respuesta.geojson ||

            respuesta.data;


        if (
            posibleGeoJSON &&
            posibleGeoJSON.type ===
                "FeatureCollection"
        ) {

            return dibujarFuenteExternaTerri(
                respuesta
            );

        }

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
        geojson.type ===
            "FeatureCollection" &&
        Array.isArray(
            geojson.features
        )
    ) {

        /*
         * Si el backend proporciona un ID,
         * lo utilizamos.
         *
         * Si no, conservamos el ID estándar
         * de TERRI+ para mantener compatibilidad
         * con las consultas existentes.
         */

        const layerId =

            respuesta.layer_id ||

            TERRI_CONFIG.MAP_LAYER;


        const sourceId =

            respuesta.source_id ||

            (
                layerId ===
                    TERRI_CONFIG.MAP_LAYER

                    ? TERRI_CONFIG.MAP_SOURCE

                    : `${layerId}_source`
            );


        dibujarGeoJSON(
            geojson,
            {

                layerId,

                sourceId,

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


/* ==========================================================
   FIN TERRI+ MAP ENGINE
========================================================== */
