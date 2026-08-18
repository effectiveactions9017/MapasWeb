/* ==========================================================
   TERRI+ VISUALIZADOR DE CAPAS
   GeoJSON / JSON + Popup dinámico
========================================================== */


/* ==========================================================
   CONFIGURACIÓN
========================================================== */

const TERRI_CAPAS_CENTER = [
    -73.79724,
    5.04463
];

const TERRI_CAPAS_ZOOM = 12;


/* ==========================================================
   PALETA
========================================================== */

const PALETA_CAPAS = [
    "#1B4F72",
    "#28734C",
    "#C77D24",
    "#7A5195",
    "#2A9D8F",
    "#A23B72",
    "#567568",
    "#457B9D"
];


/* ==========================================================
   ALMACENAMIENTO TEMPORAL
========================================================== */

const capasCargadas = new Map();

let contadorColor = 0;


/* ==========================================================
   MAPA
========================================================== */

const map = new maplibregl.Map({

    container: "map",

    center: TERRI_CAPAS_CENTER,

    zoom: TERRI_CAPAS_ZOOM,

    style: {

        version: 8,

        sources: {

            osm: {

                type: "raster",

                tiles: [
                    "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                ],

                tileSize: 256,

                attribution:
                    "© OpenStreetMap contributors"

            },

            satelite: {

                type: "raster",

                tiles: [
                    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                ],

                tileSize: 256,

                attribution:
                    "Esri World Imagery"

            }

        },

        layers: [

            {

                id: "basemap-osm",

                type: "raster",

                source: "osm",

                layout: {
                    visibility: "visible"
                }

            },

            {

                id: "basemap-satelite",

                type: "raster",

                source: "satelite",

                layout: {
                    visibility: "none"
                }

            }

        ]

    }

});


/* ==========================================================
   CONTROLES MAPLIBRE
========================================================== */

map.addControl(

    new maplibregl.NavigationControl(),

    "top-right"

);


map.addControl(

    new maplibregl.ScaleControl({

        maxWidth: 120,

        unit: "metric"

    }),

    "bottom-right"

);


/* ==========================================================
   ELEMENTOS DOM
========================================================== */

const inputArchivo =
    document.getElementById(
        "archivoCapa"
    );

const selectorMapaBase =
    document.getElementById(
        "selectorMapaBase"
    );

const listaCapas =
    document.getElementById(
        "listaCapas"
    );

const contadorCapas =
    document.getElementById(
        "contadorCapas"
    );

const mensajeEstado =
    document.getElementById(
        "mensajeEstado"
    );

const textoEstadoMapa =
    document.getElementById(
        "textoEstadoMapa"
    );


/* ==========================================================
   MENSAJES
========================================================== */

function mostrarMensaje(
    texto,
    tipo = ""
) {

    mensajeEstado.textContent =
        texto;

    mensajeEstado.className =
        "mensaje-estado";

    if (tipo) {

        mensajeEstado.classList.add(
            tipo
        );

    }

}


/* ==========================================================
   NOMBRE SEGURO
========================================================== */

function crearIdSeguro(nombre) {

    return nombre

        .toLowerCase()

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        );

}


/* ==========================================================
   ID ÚNICO
========================================================== */

function obtenerIdUnico(nombre) {

    let base =
        crearIdSeguro(nombre) ||
        "capa";

    let id = base;

    let numero = 2;

    while (
        capasCargadas.has(id)
    ) {

        id =
            `${base}-${numero}`;

        numero++;

    }

    return id;

}


/* ==========================================================
   NORMALIZAR GEOJSON
========================================================== */

function normalizarGeoJSON(data) {

    if (!data) {

        throw new Error(
            "El archivo está vacío."
        );

    }

    if (
        data.type ===
        "FeatureCollection"
    ) {

        return data;

    }

    if (
        data.type ===
        "Feature"
    ) {

        return {

            type:
                "FeatureCollection",

            features: [
                data
            ]

        };

    }

    const geometriaTipos = [

        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
        "Polygon",
        "MultiPolygon",
        "GeometryCollection"

    ];

    if (
        geometriaTipos.includes(
            data.type
        )
    ) {

        return {

            type:
                "FeatureCollection",

            features: [

                {

                    type:
                        "Feature",

                    properties: {},

                    geometry:
                        data

                }

            ]

        };

    }

    throw new Error(
        "El archivo no contiene un GeoJSON válido."
    );

}


/* ==========================================================
   RECOLECTAR COORDENADAS
========================================================== */

function recolectarCoordenadas(
    valor,
    resultado
) {

    if (
        !Array.isArray(valor)
    ) {

        return;

    }

    if (
        valor.length >= 2 &&
        typeof valor[0] === "number" &&
        typeof valor[1] === "number"
    ) {

        resultado.push([
            valor[0],
            valor[1]
        ]);

        return;

    }

    valor.forEach(
        item => {

            recolectarCoordenadas(
                item,
                resultado
            );

        }
    );

}


/* ==========================================================
   CALCULAR BBOX
========================================================== */

function calcularBBox(
    geojson
) {

    const coords = [];

    geojson.features.forEach(
        feature => {

            if (
                !feature.geometry
            ) {

                return;

            }

            if (
                feature.geometry.type ===
                "GeometryCollection"
            ) {

                feature.geometry
                    .geometries
                    .forEach(
                        geom => {

                            if (
                                geom.coordinates
                            ) {

                                recolectarCoordenadas(
                                    geom.coordinates,
                                    coords
                                );

                            }

                        }
                    );

                return;

            }

            recolectarCoordenadas(

                feature.geometry.coordinates,

                coords

            );

        }
    );

    if (
        !coords.length
    ) {

        return null;

    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    coords.forEach(
        ([x, y]) => {

            minX =
                Math.min(
                    minX,
                    x
                );

            minY =
                Math.min(
                    minY,
                    y
                );

            maxX =
                Math.max(
                    maxX,
                    x
                );

            maxY =
                Math.max(
                    maxY,
                    y
                );

        }
    );

    if (
        !Number.isFinite(minX) ||
        !Number.isFinite(minY) ||
        !Number.isFinite(maxX) ||
        !Number.isFinite(maxY)
    ) {

        return null;

    }

    return [
        minX,
        minY,
        maxX,
        maxY
    ];

}


/* ==========================================================
   VALIDAR COORDENADAS WEB
========================================================== */

function validarBBox(
    bbox
) {

    if (
        !bbox
    ) {

        return false;

    }

    const [
        minX,
        minY,
        maxX,
        maxY
    ] = bbox;

    return (

        minX >= -180 &&
        maxX <= 180 &&
        minY >= -90 &&
        maxY <= 90

    );

}


/* ==========================================================
   ESCAPAR HTML
========================================================== */

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }

    return String(valor)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ==========================================================
   FORMATEAR VALOR DEL POPUP
========================================================== */

function formatearValorPopup(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return "Sin información";

    }

    if (
        typeof valor === "number"
    ) {

        return valor.toLocaleString(

            "es-CO",

            {

                maximumFractionDigits:
                    2

            }

        );

    }

    if (
        typeof valor === "object"
    ) {

        try {

            return escaparHTML(
                JSON.stringify(valor)
            );

        } catch {

            return "Sin información";

        }

    }

    return escaparHTML(
        valor
    );

}


/* ==========================================================
   CREAR CONTENIDO DEL POPUP
========================================================== */

function crearContenidoPopup(
    nombreCapa,
    propiedades,
    lngLat
) {

    const propiedadesValidas =
        Object.entries(
            propiedades || {}
        )
        .filter(
            ([clave]) => {

                const campo =
                    clave.toLowerCase();

                return ![
                    "popup_html",
                    "lon_street",
                    "lat_street"
                ].includes(
                    campo
                );

            }
        );


    let filas = "";


    propiedadesValidas
        .slice(
            0,
            20
        )
        .forEach(
            ([clave, valor]) => {

                filas += `

                    <div style="
                        display:grid;
                        grid-template-columns:minmax(90px,0.8fr) minmax(120px,1.2fr);
                        gap:8px;
                        padding:6px 0;
                        border-bottom:1px solid #edf1f3;
                    ">

                        <strong style="
                            color:#25465d;
                            font-size:12px;
                            overflow-wrap:anywhere;
                        ">
                            ${escaparHTML(clave)}
                        </strong>

                        <span style="
                            color:#566d7b;
                            font-size:12px;
                            overflow-wrap:anywhere;
                        ">
                            ${formatearValorPopup(valor)}
                        </span>

                    </div>

                `;

            }
        );


    if (
        !filas
    ) {

        filas = `

            <div style="
                padding:10px 0;
                color:#71838d;
                font-size:12px;
            ">

                Este elemento no contiene atributos.

            </div>

        `;

    }


    const longitud =
        Number(
            lngLat.lng
        );

    const latitud =
        Number(
            lngLat.lat
        );


    const streetViewUrl =
        `https://www.google.com/maps?q=&layer=c&cbll=${latitud},${longitud}`;


    return `

        <div style="
            width:310px;
            max-width:82vw;
            font-family:'Segoe UI',Arial,sans-serif;
        ">

            <div style="
                margin:-2px -2px 8px;
                padding:10px 12px;
                border-radius:8px 8px 0 0;
                background:#0C2D48;
                color:white;
            ">

                <div style="
                    font-size:11px;
                    opacity:.75;
                    margin-bottom:2px;
                ">
                    TERRI+ · Información de capa
                </div>

                <strong style="
                    font-size:14px;
                    line-height:1.25;
                ">
                    ${escaparHTML(nombreCapa)}
                </strong>

            </div>


            <div style="
                max-height:310px;
                overflow-y:auto;
                padding:0 4px;
            ">

                ${filas}

            </div>


            <div style="
                margin-top:10px;
                padding-top:9px;
                border-top:1px solid #e7ecef;
            ">

                <a
                    href="${streetViewUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        display:block;
                        padding:8px 10px;
                        border-radius:8px;
                        background:#edf5f7;
                        color:#0C5265;
                        text-align:center;
                        text-decoration:none;
                        font-size:12px;
                        font-weight:600;
                    "
                >
                    📍 Abrir ubicación / Street View
                </a>

            </div>

        </div>

    `;

}


/* ==========================================================
   ACTIVAR POPUP EN CAPA
========================================================== */

function activarPopupCapa(
    nombreCapa,
    layerIds
) {

    layerIds.forEach(
        layerId => {

            map.on(
                "click",
                layerId,
                evento => {

                    if (
                        !evento.features ||
                        !evento.features.length
                    ) {

                        return;

                    }


                    const feature =
                        evento.features[0];


                    const contenido =
                        crearContenidoPopup(

                            nombreCapa,

                            feature.properties || {},

                            evento.lngLat

                        );


                    new maplibregl.Popup({

                        closeButton: true,

                        closeOnClick: true,

                        maxWidth: "350px"

                    })
                    .setLngLat(
                        evento.lngLat
                    )
                    .setHTML(
                        contenido
                    )
                    .addTo(
                        map
                    );

                }
            );


            map.on(
                "mouseenter",
                layerId,
                () => {

                    map.getCanvas()
                        .style.cursor =
                        "pointer";

                }
            );


            map.on(
                "mouseleave",
                layerId,
                () => {

                    map.getCanvas()
                        .style.cursor =
                        "";

                }
            );

        }
    );

}


/* ==========================================================
   AGREGAR CAPA AL MAPA
========================================================== */

function agregarCapaMapa(
    id,
    nombreCapa,
    geojson,
    color
) {

    const sourceId =
        `source-${id}`;


    map.addSource(
        sourceId,
        {

            type:
                "geojson",

            data:
                geojson

        }
    );


    const layerIds = [];


/* ----------------------------------------------------------
   POLÍGONOS
---------------------------------------------------------- */

    const fillId =
        `${id}-fill`;


    map.addLayer({

        id:
            fillId,

        type:
            "fill",

        source:
            sourceId,

        filter: [

            "in",

            ["geometry-type"],

            [
                "literal",
                [
                    "Polygon",
                    "MultiPolygon"
                ]
            ]

        ],

        paint: {

            "fill-color":
                color,

            "fill-opacity":
                0.34

        }

    });


    layerIds.push(
        fillId
    );


/* ----------------------------------------------------------
   CONTORNO DE POLÍGONOS
---------------------------------------------------------- */

    const outlineId =
        `${id}-outline`;


    map.addLayer({

        id:
            outlineId,

        type:
            "line",

        source:
            sourceId,

        filter: [

            "in",

            ["geometry-type"],

            [
                "literal",
                [
                    "Polygon",
                    "MultiPolygon"
                ]
            ]

        ],

        paint: {

            "line-color":
                color,

            "line-width":
                1.5

        }

    });


    layerIds.push(
        outlineId
    );


/* ----------------------------------------------------------
   LÍNEAS
---------------------------------------------------------- */

    const lineId =
        `${id}-line`;


    map.addLayer({

        id:
            lineId,

        type:
            "line",

        source:
            sourceId,

        filter: [

            "in",

            ["geometry-type"],

            [
                "literal",
                [
                    "LineString",
                    "MultiLineString"
                ]
            ]

        ],

        paint: {

            "line-color":
                color,

            "line-width":
                3

        }

    });


    layerIds.push(
        lineId
    );


/* ----------------------------------------------------------
   PUNTOS
---------------------------------------------------------- */

    const pointId =
        `${id}-point`;


    map.addLayer({

        id:
            pointId,

        type:
            "circle",

        source:
            sourceId,

        filter: [

            "in",

            ["geometry-type"],

            [
                "literal",
                [
                    "Point",
                    "MultiPoint"
                ]
            ]

        ],

        paint: {

            "circle-color":
                color,

            "circle-radius":
                6,

            "circle-stroke-color":
                "#ffffff",

            "circle-stroke-width":
                1.5

        }

    });


    layerIds.push(
        pointId
    );


/* ----------------------------------------------------------
   POPUPS
---------------------------------------------------------- */

    activarPopupCapa(
        nombreCapa,
        layerIds
    );


    return {

        sourceId,

        layerIds

    };

}


/* ==========================================================
   MOSTRAR / OCULTAR CAPA
========================================================== */

function cambiarVisibilidad(
    id,
    visible
) {

    const capa =
        capasCargadas.get(
            id
        );


    if (
        !capa
    ) {

        return;

    }


    capa.layerIds.forEach(
        layerId => {

            if (
                !map.getLayer(
                    layerId
                )
            ) {

                return;

            }


            map.setLayoutProperty(

                layerId,

                "visibility",

                visible
                    ? "visible"
                    : "none"

            );

        }
    );


    capa.visible =
        visible;

}


/* ==========================================================
   ZOOM A CAPA
========================================================== */

function zoomACapa(
    id
) {

    const capa =
        capasCargadas.get(
            id
        );


    if (
        !capa ||
        !capa.bbox
    ) {

        mostrarMensaje(
            "No fue posible calcular la extensión de la capa.",
            "error"
        );

        return;

    }


    const [
        minX,
        minY,
        maxX,
        maxY
    ] = capa.bbox;


    if (
        minX === maxX &&
        minY === maxY
    ) {

        map.flyTo({

            center: [
                minX,
                minY
            ],

            zoom: 17

        });

        return;

    }


    map.fitBounds(

        [
            [
                minX,
                minY
            ],
            [
                maxX,
                maxY
            ]
        ],

        {

            padding:
                60,

            duration:
                800,

            maxZoom:
                18

        }

    );

}


/* ==========================================================
   ELIMINAR CAPA
========================================================== */

function eliminarCapa(
    id
) {

    const capa =
        capasCargadas.get(
            id
        );


    if (
        !capa
    ) {

        return;

    }


    capa.layerIds.forEach(
        layerId => {

            if (
                map.getLayer(
                    layerId
                )
            ) {

                map.removeLayer(
                    layerId
                );

            }

        }
    );


    if (
        map.getSource(
            capa.sourceId
        )
    ) {

        map.removeSource(
            capa.sourceId
        );

    }


    capasCargadas.delete(
        id
    );


    renderizarListaCapas();


    mostrarMensaje(
        `Capa eliminada: ${capa.nombre}`,
        "ok"
    );

}


/* ==========================================================
   RENDERIZAR LISTADO
========================================================== */

function renderizarListaCapas() {

    listaCapas.innerHTML =
        "";


    contadorCapas.textContent =
        capasCargadas.size;


    if (
        capasCargadas.size === 0
    ) {

        listaCapas.innerHTML = `

            <div class="estado-vacio">

                <div class="estado-vacio-icon">
                    ◫
                </div>

                <strong>
                    No hay capas cargadas
                </strong>

                <span>
                    Usa “Subir capa” para comenzar.
                </span>

            </div>

        `;


        textoEstadoMapa.textContent =
            "Visualizador listo";


        return;

    }


    capasCargadas.forEach(
        (capa, id) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "capa-item";


            item.innerHTML = `

                <div class="capa-superior">

                    <input
                        class="capa-check"
                        type="checkbox"
                        ${capa.visible ? "checked" : ""}
                        title="Mostrar u ocultar capa"
                    >

                    <span
                        class="capa-color"
                        style="background:${capa.color};"
                    ></span>

                    <span
                        class="capa-nombre"
                        title="${escaparHTML(capa.nombre)}"
                    >
                        ${escaparHTML(capa.nombre)}
                    </span>

                </div>


                <div class="capa-acciones">

                    <button
                        type="button"
                        class="capa-btn zoom"
                    >
                        🔍 Zoom
                    </button>

                    <button
                        type="button"
                        class="capa-btn eliminar"
                    >
                        🗑️ Eliminar
                    </button>

                </div>

            `;


            const check =
                item.querySelector(
                    ".capa-check"
                );


            const btnZoom =
                item.querySelector(
                    ".zoom"
                );


            const btnEliminar =
                item.querySelector(
                    ".eliminar"
                );


            check.addEventListener(
                "change",
                () => {

                    cambiarVisibilidad(
                        id,
                        check.checked
                    );

                }
            );


            btnZoom.addEventListener(
                "click",
                () => {

                    zoomACapa(
                        id
                    );

                }
            );


            btnEliminar.addEventListener(
                "click",
                () => {

                    eliminarCapa(
                        id
                    );

                }
            );


            listaCapas.appendChild(
                item
            );

        }
    );


    textoEstadoMapa.textContent =
        `${capasCargadas.size} capa${capasCargadas.size === 1 ? "" : "s"} cargada${capasCargadas.size === 1 ? "" : "s"}`;

}


/* ==========================================================
   PROCESAR ARCHIVO
========================================================== */

async function procesarArchivo(
    archivo
) {

    const extension =
        archivo.name

            .split(".")

            .pop()

            .toLowerCase();


    if (
        ![
            "json",
            "geojson"
        ].includes(
            extension
        )
    ) {

        throw new Error(
            `Formato no soportado: ${archivo.name}`
        );

    }


    const texto =
        await archivo.text();


    let data;


    try {

        data =
            JSON.parse(
                texto
            );

    } catch {

        throw new Error(
            `El archivo ${archivo.name} no contiene JSON válido.`
        );

    }


    const geojson =
        normalizarGeoJSON(
            data
        );


    if (
        !geojson.features.length
    ) {

        throw new Error(
            `La capa ${archivo.name} no contiene elementos.`
        );

    }


    const bbox =
        calcularBBox(
            geojson
        );


    if (
        !validarBBox(
            bbox
        )
    ) {

        throw new Error(
            `La capa ${archivo.name} no parece estar en EPSG:4326.`
        );

    }


    const nombre =
        archivo.name.replace(
            /\.[^.]+$/,
            ""
        );


    const id =
        obtenerIdUnico(
            nombre
        );


    const color =
        PALETA_CAPAS[
            contadorColor %
            PALETA_CAPAS.length
        ];


    contadorColor++;


    const resultado =
        agregarCapaMapa(
            id,
            nombre,
            geojson,
            color
        );


    capasCargadas.set(
        id,
        {

            id,

            nombre,

            geojson,

            bbox,

            color,

            visible:
                true,

            sourceId:
                resultado.sourceId,

            layerIds:
                resultado.layerIds

        }
    );


    renderizarListaCapas();


    zoomACapa(
        id
    );


    return nombre;

}


/* ==========================================================
   SUBIR CAPAS
========================================================== */

inputArchivo.addEventListener(
    "change",
    async event => {

        const archivos =
            Array.from(
                event.target.files ||
                []
            );


        if (
            !archivos.length
        ) {

            return;

        }


        mostrarMensaje(
            "Procesando capas..."
        );


        const cargadas = [];

        const errores = [];


        for (
            const archivo
            of archivos
        ) {

            try {

                const nombre =
                    await procesarArchivo(
                        archivo
                    );


                cargadas.push(
                    nombre
                );

            } catch (error) {

                console.error(
                    error
                );


                errores.push(
                    error.message
                );

            }

        }


        if (
            cargadas.length &&
            !errores.length
        ) {

            mostrarMensaje(

                `${cargadas.length} capa${cargadas.length === 1 ? "" : "s"} cargada${cargadas.length === 1 ? "" : "s"} correctamente.`,

                "ok"

            );

        } else if (
            errores.length
        ) {

            mostrarMensaje(

                errores.join(
                    " | "
                ),

                "error"

            );

        }


        inputArchivo.value =
            "";

    }
);


/* ==========================================================
   CAMBIAR MAPA BASE
========================================================== */

selectorMapaBase.addEventListener(
    "change",
    () => {

        const base =
            selectorMapaBase.value;


        map.setLayoutProperty(

            "basemap-osm",

            "visibility",

            base === "osm"
                ? "visible"
                : "none"

        );


        map.setLayoutProperty(

            "basemap-satelite",

            "visibility",

            base === "satelite"
                ? "visible"
                : "none"

        );

    }
);


/* ==========================================================
   MAPA LISTO
========================================================== */

map.on(
    "load",
    () => {

        textoEstadoMapa.textContent =
            "Visualizador listo";


        mostrarMensaje(
            "Puedes comenzar cargando una capa GeoJSON o JSON."
        );

    }
);


/* ==========================================================
   REDIMENSIONAR
========================================================== */

window.addEventListener(
    "resize",
    () => {

        map.resize();

    }
);
