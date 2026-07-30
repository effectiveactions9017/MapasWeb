/* ==========================================================
   TERRI+ MOTOR DE SIMBOLOGÍA INTELIGENTE
   Archivo: terri_symbology.js

   Responsabilidades:
   - Detectar categorías presentes en un GeoJSON.
   - Asignar colores automáticamente.
   - Construir expresiones Mapbox/MapLibre.
   - Crear y actualizar una leyenda dinámica.
   - Preparar estilos para polígonos, líneas y puntos.
========================================================== */


/* ==========================================================
   CONFIGURACIÓN GENERAL
========================================================== */

const TERRI_SYMBOLOGY_CONFIG = {

    maxCategoriasLeyenda: 20,

    colorPredeterminado: "#3498db",

    colorSinDato: "#95a5a6",

    paleta: [
        "#e74c3c",
        "#2ecc71",
        "#3498db",
        "#f1c40f",
        "#9b59b6",
        "#e67e22",
        "#1abc9c",
        "#34495e",
        "#ff6b6b",
        "#16a085",
        "#2980b9",
        "#8e44ad",
        "#d35400",
        "#27ae60",
        "#c0392b",
        "#7f8c8d",
        "#2c3e50",
        "#f39c12",
        "#00bcd4",
        "#8bc34a"
    ]
};


/* ==========================================================
   NORMALIZAR TEXTO
========================================================== */

function terriNormalizarTexto(valor) {

    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


/* ==========================================================
   FORMATEAR ETIQUETA
========================================================== */

function terriFormatearEtiqueta(valor) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return "Sin información";
    }

    return String(valor)
        .trim()
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, letra => letra.toUpperCase());

}


/* ==========================================================
   COLORES SEMÁNTICOS

   Estas reglas no limitan el sistema.
   Solo permiten usar colores intuitivos cuando el valor
   tiene un significado conocido.

   Para cualquier categoría nueva se utilizará la paleta.
========================================================== */

function terriObtenerColorSemantico(valor) {

    const texto = terriNormalizarTexto(valor);

    if (!texto) {
        return TERRI_SYMBOLOGY_CONFIG.colorSinDato;
    }

    // Riesgo
    if (
        texto.includes("riesgo alto") ||
        texto === "alto"
    ) {
        return "#e74c3c";
    }

    if (
        texto.includes("riesgo medio") ||
        texto === "medio"
    ) {
        return "#f1c40f";
    }

    if (
        texto.includes("riesgo bajo") ||
        texto === "bajo"
    ) {
        return "#2ecc71";
    }

    // Estado tributario
    if (
        texto.includes("con mora") ||
        texto.includes("en mora")
    ) {
        return "#e74c3c";
    }

    if (
        texto.includes("al dia") ||
        texto.includes("pagado")
    ) {
        return "#2ecc71";
    }

    if (texto.includes("exento")) {
        return "#3498db";
    }

    if (texto.includes("publico")) {
        return "#f1c40f";
    }

    if (
        texto.includes("sin pagar") ||
        texto.includes("sin informacion")
    ) {
        return "#95a5a6";
    }

    // Bosques
    if (
        texto.includes("bosque actual") ||
        texto.includes("cobertura actual")
    ) {
        return "#27ae60";
    }

    if (
        texto.includes("perdida") ||
        texto.includes("deforestacion")
    ) {
        return "#e67e22";
    }

    return null;

}


/* ==========================================================
   EXTRAER CATEGORÍAS DEL GEOJSON
========================================================== */


/**
 * Normaliza nombres de campos para compararlos aunque tengan
 * mayúsculas, tildes, espacios, puntos o guiones.
 */
function terriNormalizarCampo(valor) {

    return terriNormalizarTexto(valor)
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

}


/**
 * Comprueba cuántos valores reales contiene un campo.
 */
function terriContarValoresCampo(
    geojson,
    campo
) {

    if (
        !geojson ||
        !Array.isArray(geojson.features) ||
        !campo
    ) {
        return 0;
    }

    return geojson.features.reduce(
        (total, feature) => {

            const valor =
                feature?.properties?.[campo];

            const tieneValor =
                valor !== null &&
                valor !== undefined &&
                String(valor).trim() !== "";

            return total + (tieneValor ? 1 : 0);

        },
        0
    );

}


/**
 * Busca el nombre real y útil del campo categórico.
 *
 * No basta con que el atributo exista: debe contener datos.
 */
function terriResolverCampoCategoria(
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

    const camposDisponibles = new Set();

    geojson.features
        .slice(0, 200)
        .forEach(feature => {

            Object.keys(
                feature?.properties || {}
            ).forEach(campo => {

                camposDisponibles.add(campo);

            });

        });

    const campos =
        Array.from(camposDisponibles);

    const solicitadoNormalizado =
        terriNormalizarCampo(campoSolicitado);


    /* ======================================================
       1. COINCIDENCIA EXACTA CON DATOS
    ====================================================== */

    if (
        campos.includes(campoSolicitado) &&
        terriContarValoresCampo(
            geojson,
            campoSolicitado
        ) > 0
    ) {

        return campoSolicitado;

    }


    /* ======================================================
       2. COINCIDENCIA NORMALIZADA CON DATOS
    ====================================================== */

    const coincidenciaNormalizada =
        campos.find(campo => {

            return (
                terriNormalizarCampo(campo) ===
                    solicitadoNormalizado &&
                terriContarValoresCampo(
                    geojson,
                    campo
                ) > 0
            );

        });

    if (coincidenciaNormalizada) {

        return coincidenciaNormalizada;

    }


    /* ======================================================
       3. EQUIVALENCIAS SEMÁNTICAS
    ====================================================== */

    const equivalencias = {

        naturaleza_juridica: [
            "naturaleza_juridica",
            "tipo_contribuyente",
            "naturaleza",
            "tipo_persona"
        ],

        tipo_contribuyente: [
            "tipo_contribuyente",
            "naturaleza_juridica",
            "naturaleza",
            "tipo_persona"
        ],

        destino_economico: [
            "destino_economico",
            "destino",
            "uso_economico"
        ],

        destino: [
            "destino",
            "destino_economico",
            "uso_economico"
        ],

        tipo_poste: [
            "tipo_poste",
            "clase_poste",
            "material_poste"
        ],

        nivel_riesgo: [
            "nivel_riesgo",
            "riesgo",
            "categoria_riesgo"
        ],

        tipo_bosque: [
            "tipo_bosque",
            "tipo_bosque_predominante",
            "cobertura_boscosa"
        ],

        vereda: [
            "vereda",
            "nombre_vereda",
            "elija_la_vereda"
        ],

        estado: [
            "estado",
            "estado_actual",
            "estado_registro"
        ]

    };

    const candidatos =
        equivalencias[solicitadoNormalizado] || [];

    for (const candidato of candidatos) {

        const candidatoNormalizado =
            terriNormalizarCampo(candidato);

        const campoEncontrado =
            campos.find(campo => {

                return (
                    terriNormalizarCampo(campo) ===
                        candidatoNormalizado &&
                    terriContarValoresCampo(
                        geojson,
                        campo
                    ) > 0
                );

            });

        if (campoEncontrado) {

            return campoEncontrado;

        }

    }


    /* ======================================================
       4. ÚLTIMO RECURSO
    ====================================================== */

    return campos.find(campo => {

        return (
            terriNormalizarCampo(campo) ===
            solicitadoNormalizado
        );

    }) || null;

}


/**
 * Extrae las categorías del campo real resuelto.
 */
function terriExtraerCategorias(
    geojson,
    campoCategoria
) {

    if (
        !geojson ||
        !Array.isArray(geojson.features) ||
        !campoCategoria
    ) {
        return [];
    }

    const categorias = new Map();

    geojson.features.forEach(feature => {

        const propiedades =
            feature?.properties || {};

        let valor =
            propiedades[campoCategoria];

        if (
            valor === null ||
            valor === undefined ||
            String(valor).trim() === ""
        ) {

            valor = "Sin información";

        }

        const clave =
            String(valor).trim();

        categorias.set(
            clave,
            (categorias.get(clave) || 0) + 1
        );

    });

    return Array
        .from(categorias.entries())
        .map(([valor, total]) => ({
            valor,
            etiqueta:
                terriFormatearEtiqueta(valor),
            total
        }))
        .sort((a, b) => {

            if (b.total !== a.total) {
                return b.total - a.total;
            }

            return a.etiqueta.localeCompare(
                b.etiqueta,
                "es"
            );

        });

}

/* ==========================================================
   ASIGNAR COLORES A LAS CATEGORÍAS
========================================================== */

function terriAsignarColoresCategorias(categorias) {

    return categorias.map((categoria, indice) => {

        const colorSemantico =
            terriObtenerColorSemantico(categoria.valor);

        const color =
            colorSemantico ||
            TERRI_SYMBOLOGY_CONFIG.paleta[
                indice %
                TERRI_SYMBOLOGY_CONFIG.paleta.length
            ];

        return {
            ...categoria,
            color
        };

    });

}


/* ==========================================================
   CONSTRUIR EXPRESIÓN CATEGÓRICA MAPBOX / MAPLIBRE
========================================================== */

function terriConstruirExpresionCategorica(
    campoCategoria,
    categorias
) {

    const expresion = [
        "match",
        [
            "to-string",
            [
                "coalesce",
                ["get", campoCategoria],
                "Sin información"
            ]
        ]
    ];

    categorias.forEach(categoria => {

        expresion.push(
            String(categoria.valor),
            categoria.color
        );

    });

    expresion.push(
        TERRI_SYMBOLOGY_CONFIG.colorSinDato
    );

    return expresion;

}


/* ==========================================================
   DETECTAR TIPO DE GEOMETRÍA
========================================================== */

function terriDetectarTipoGeometria(geojson) {

    if (
        !geojson ||
        !Array.isArray(geojson.features) ||
        geojson.features.length === 0
    ) {
        return null;
    }

    const featureConGeometria = geojson.features.find(
        feature =>
            feature &&
            feature.geometry &&
            feature.geometry.type
    );

    if (!featureConGeometria) {
        return null;
    }

    const tipo = featureConGeometria.geometry.type;

    if (
        tipo === "Polygon" ||
        tipo === "MultiPolygon"
    ) {
        return "polygon";
    }

    if (
        tipo === "LineString" ||
        tipo === "MultiLineString"
    ) {
        return "line";
    }

    if (
        tipo === "Point" ||
        tipo === "MultiPoint"
    ) {
        return "point";
    }

    return null;

}


/* ==========================================================
   CREAR CONTENEDOR DE LEYENDA
========================================================== */

function terriObtenerContenedorLeyenda() {

    let leyenda = document.getElementById(
        "terriLeyendaDinamica"
    );

    if (leyenda) {
        return leyenda;
    }

    leyenda = document.createElement("div");

    leyenda.id = "terriLeyendaDinamica";
    leyenda.className = "terri-leyenda-dinamica";

    const contenedorMapa = document.getElementById("map");

    if (contenedorMapa) {

        const posicion =
            window.getComputedStyle(contenedorMapa).position;

        if (posicion === "static") {
            contenedorMapa.style.position = "relative";
        }

        contenedorMapa.appendChild(leyenda);

    } else {

        document.body.appendChild(leyenda);

    }

    terriAsegurarEstilosLeyenda();

    return leyenda;

}

/* ==========================================================
   MOSTRAR LEYENDA CATEGÓRICA
========================================================== */

function terriMostrarLeyendaCategorica({
    titulo = "Leyenda",
    categorias = []
} = {}) {

    const leyenda = terriObtenerContenedorLeyenda();

    const categoriasVisibles = categorias.slice(
        0,
        TERRI_SYMBOLOGY_CONFIG.maxCategoriasLeyenda
    );

    const filas = categoriasVisibles
        .map(categoria => `
            <div class="terri-leyenda-fila">

                <span
                    class="terri-leyenda-simbolo"
                    style="background:${categoria.color};"
                ></span>

                <span class="terri-leyenda-etiqueta">
                    ${categoria.etiqueta}
                </span>

                <span class="terri-leyenda-total">
                    ${Number(categoria.total).toLocaleString("es-CO")}
                </span>

            </div>
        `)
        .join("");

    const mensajeAdicional =
        categorias.length >
        TERRI_SYMBOLOGY_CONFIG.maxCategoriasLeyenda
            ? `
                <div class="terri-leyenda-adicional">
                    Se muestran las primeras
                    ${TERRI_SYMBOLOGY_CONFIG.maxCategoriasLeyenda}
                    categorías de ${categorias.length}.
                </div>
            `
            : "";

    leyenda.innerHTML = `
        <div class="terri-leyenda-encabezado">

            <strong>${titulo}</strong>

            <button
                type="button"
                id="terriCerrarLeyenda"
                class="terri-leyenda-cerrar"
                aria-label="Cerrar leyenda"
            >
                ×
            </button>

        </div>

        <div class="terri-leyenda-contenido">
            ${filas}
            ${mensajeAdicional}
        </div>
    `;

    leyenda.style.display = "block";

    const botonCerrar = document.getElementById(
        "terriCerrarLeyenda"
    );

    if (botonCerrar) {

        botonCerrar.addEventListener(
            "click",
            terriOcultarLeyenda
        );

    }

}


/* ==========================================================
   OCULTAR LEYENDA
========================================================== */

function terriOcultarLeyenda() {

    const leyenda = document.getElementById(
        "terriLeyendaDinamica"
    );

    if (leyenda) {
        leyenda.style.display = "none";
    }

}


/* ==========================================================
   ELIMINAR LEYENDA
========================================================== */

function terriEliminarLeyenda() {

    const leyenda = document.getElementById(
        "terriLeyendaDinamica"
    );

    if (leyenda) {
        leyenda.remove();
    }

}


/* ==========================================================
   ESTILOS DE LA LEYENDA
========================================================== */

function terriAsegurarEstilosLeyenda() {

    const estilosAnteriores =
        document.getElementById(
            "terriEstilosLeyendaDinamica"
        );

    if (estilosAnteriores) {
        estilosAnteriores.remove();
    }

    const estilos =
        document.createElement("style");

    estilos.id =
        "terriEstilosLeyendaDinamica";

    estilos.textContent = `

        .terri-leyenda-dinamica {

            position: absolute;

            right: 16px;
            bottom: 34px;
            left: auto;
            top: auto;

            z-index: 9999;

            width: 240px;
            max-height: 360px;

            background: rgba(255, 255, 255, 0.96);

            border: 1px solid #d7e1e8;
            border-radius: 10px;

            box-shadow:
                0 4px 14px
                rgba(15, 45, 65, 0.18);

            overflow: hidden;

            color: #17354a;

            font-family:
                Arial,
                Helvetica,
                sans-serif;
        }


        .terri-leyenda-encabezado {

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 10px;

            padding: 10px 12px;

            background: #0b5cab;
            color: #ffffff;

            font-size: 13px;
        }


        .terri-leyenda-cerrar {

            border: none;
            background: transparent;
            color: #ffffff;

            font-size: 20px;
            line-height: 1;

            cursor: pointer;

            padding: 0 2px;
        }


        .terri-leyenda-contenido {

            max-height: 300px;
            overflow-y: auto;

            padding: 8px 10px;
        }


        .terri-leyenda-fila {

            display: grid;

            grid-template-columns:
                16px
                minmax(0, 1fr)
                auto;

            align-items: center;

            gap: 8px;

            padding: 5px 0;

            border-bottom:
                1px solid
                rgba(215, 225, 232, 0.65);

            font-size: 12px;
        }


        .terri-leyenda-fila:last-child {

            border-bottom: none;
        }


        .terri-leyenda-simbolo {

            display: inline-block;

            width: 14px;
            height: 14px;

            border:
                1px solid
                rgba(0, 0, 0, 0.28);

            border-radius: 3px;
        }


        .terri-leyenda-etiqueta {

            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }


        .terri-leyenda-total {

            color: #5c7180;
            font-weight: 700;
        }


        .terri-leyenda-adicional {

            padding-top: 8px;

            color: #5c7180;
            font-size: 11px;
            line-height: 1.35;
        }


        @media (max-width: 700px) {

            .terri-leyenda-dinamica {

                right: 10px;
                bottom: 22px;
                left: auto;
                top: auto;

                width: 210px;
                max-height: 300px;
            }

        }

    `;

    document.head.appendChild(estilos);
}


/* ==========================================================
   PREPARAR SIMBOLOGÍA CATEGÓRICA

   Esta función será utilizada por terri_map_bridge.js.
========================================================== */

function terriPrepararSimbologiaCategorica({
    geojson,
    campoCategoria,
    tituloLeyenda = null
} = {}) {

    if (!geojson || !campoCategoria) {

        return {
            valido: false,
            motivo:
                "No se recibió GeoJSON o campo de categoría."
        };

    }


    /* ======================================================
       RESOLVER EL CAMPO REAL DEL GEOJSON
    ====================================================== */

    const campoCategoriaReal =
        terriResolverCampoCategoria(
            geojson,
            campoCategoria
        );

    if (!campoCategoriaReal) {

        return {
            valido: false,
            motivo:
                `No se encontró un campo válido para la categoría: ${campoCategoria}.`
        };

    }


    /* ======================================================
       EXTRAER CATEGORÍAS
    ====================================================== */

    const categoriasDetectadas =
        terriExtraerCategorias(
            geojson,
            campoCategoriaReal
        );

    if (categoriasDetectadas.length === 0) {

        return {
            valido: false,
            motivo:
                "No se encontraron categorías en el resultado."
        };

    }


    /* ======================================================
       ASIGNAR COLORES
    ====================================================== */

    const categorias =
        terriAsignarColoresCategorias(
            categoriasDetectadas
        );


    /* ======================================================
       CONSTRUIR EXPRESIÓN DE COLOR
    ====================================================== */

    const expresionColor =
        terriConstruirExpresionCategorica(
            campoCategoriaReal,
            categorias
        );


    /* ======================================================
       TIPO DE GEOMETRÍA
    ====================================================== */

    const tipoGeometria =
        terriDetectarTipoGeometria(
            geojson
        );


    /* ======================================================
       RESULTADO FINAL
    ====================================================== */

    return {
        valido: true,

        modo: "categorico",

        campoCategoriaSolicitado:
            campoCategoria,

        campoCategoria:
            campoCategoriaReal,

        tituloLeyenda:
            tituloLeyenda ||
            terriFormatearEtiqueta(
                campoCategoriaReal
            ),

        tipoGeometria,

        categorias,

        expresionColor
    };

}

/* ==========================================================
   API GLOBAL

   Permite que terri_map_bridge.js utilice este módulo.
========================================================== */

window.TERRI_SYMBOLOGY = {

    normalizarTexto:
        terriNormalizarTexto,

    formatearEtiqueta:
        terriFormatearEtiqueta,

    extraerCategorias:
        terriExtraerCategorias,

    asignarColoresCategorias:
        terriAsignarColoresCategorias,

    construirExpresionCategorica:
        terriConstruirExpresionCategorica,

    detectarTipoGeometria:
        terriDetectarTipoGeometria,

    prepararCategorica:
        terriPrepararSimbologiaCategorica,

    mostrarLeyendaCategorica:
        terriMostrarLeyendaCategorica,

    ocultarLeyenda:
        terriOcultarLeyenda,

    eliminarLeyenda:
        terriEliminarLeyenda
};


console.log(
    "🎨 TERRI+ Motor de Simbología cargado correctamente."
);