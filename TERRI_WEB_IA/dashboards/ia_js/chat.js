/* ==========================================================
   TERRI+ CHAT
========================================================== */


/**
 * Agrega un mensaje al chat.
 */
function agregarMensaje(tipo, texto) {

    const chat =
        document.getElementById(
            "chatBox"
        );

    if (!chat) return;


    const div =
        document.createElement(
            "div"
        );


    div.className =
        `mensaje mensaje-${tipo}`;


    div.innerHTML = `
        <strong>
            ${
                tipo === "usuario"
                    ? "🧑 Tú"
                    : "🤖 TERRI+ IA"
            }
        </strong>

        <p>
            ${texto}
        </p>
    `;


    chat.appendChild(
        div
    );


    chat.scrollTop =
        chat.scrollHeight;

}



/* ==========================================================
   ELIMINAR MENSAJE TEMPORAL
========================================================== */


/**
 * Elimina el último mensaje de la IA.
 *
 * Se utiliza principalmente para retirar
 * el mensaje temporal:
 *
 * "Analizando información territorial..."
 */
function eliminarUltimoMensajeIA() {

    const mensajes =
        document.querySelectorAll(
            ".mensaje-ia"
        );


    if (
        mensajes.length > 0
    ) {

        mensajes[
            mensajes.length - 1
        ].remove();

    }

}



/* ==========================================================
   OBTENER GEOJSON
========================================================== */


/**
 * Obtiene el GeoJSON desde distintas estructuras
 * posibles de respuesta.
 *
 * Compatible con:
 *
 * - datos.resultado
 * - datos.geojson
 * - datos.resultado.geojson
 *
 * @param {Object} datos
 * @returns {Object|null}
 */
function obtenerGeoJSONRespuesta(
    datos
) {

    if (
        datos?.resultado?.type ===
        "FeatureCollection"
    ) {

        return datos.resultado;

    }


    if (
        datos?.geojson?.type ===
        "FeatureCollection"
    ) {

        return datos.geojson;

    }


    if (
        datos?.resultado?.geojson?.type ===
        "FeatureCollection"
    ) {

        return datos.resultado.geojson;

    }


    return null;

}



/* ==========================================================
   TOTAL DE ENTIDADES
========================================================== */


/**
 * Obtiene la cantidad real de entidades
 * contenidas en una respuesta GeoJSON.
 */
function obtenerTotalFeaturesTerri(
    datos
) {

    const geojson =
        obtenerGeoJSONRespuesta(
            datos
        );


    if (
        geojson &&
        Array.isArray(
            geojson.features
        )
    ) {

        return geojson.features.length;

    }


    if (
        Number.isFinite(
            Number(
                datos?.total_features
            )
        )
    ) {

        return Number(
            datos.total_features
        );

    }


    return 0;

}



/* ==========================================================
   ACTUALIZAR METADATOS
========================================================== */


/**
 * Actualiza la barra inferior del aplicativo.
 */
function actualizarMetadatos(
    datos
) {

    const metaTipo =
        document.getElementById(
            "metaTipo"
        );


    const metaModo =
        document.getElementById(
            "metaModo"
        );


    const metaFuente =
        document.getElementById(
            "metaFuente"
        );


    const metaSQL =
        document.getElementById(
            "metaSQL"
        );


    const metaTotal =
        document.getElementById(
            "metaTotal"
        );


    /* ======================================================
       TIPO
    ====================================================== */

    if (metaTipo) {

        metaTipo.textContent =
            datos?.tipo ??
            "-";

    }


    /* ======================================================
       MODO
    ====================================================== */

    if (metaModo) {

        metaModo.textContent =
            datos?.modo ??
            "-";

    }


    /* ======================================================
       FUENTE
    ====================================================== */

    if (metaFuente) {

        const fuente =
            datos?.fuente ||
            (
                datos?.ejecuto_sql === true
                    ? "PostGIS"
                    : "-"
            );


        metaFuente.textContent =
            fuente;

    }


    /* ======================================================
       CONSULTA SQL / FUENTE EXTERNA
    ====================================================== */

    if (metaSQL) {

        if (
            String(
                datos?.fuente || ""
            )
                .trim()
                .toUpperCase() ===
            "IGAC"
        ) {

            metaSQL.textContent =
                "Servicio REST oficial IGAC";

        }

        else {

            metaSQL.textContent =
                datos?.sql ||
                datos?.sql_origen ||
                (
                    datos?.ejecuto_sql === false
                        ? "Sin SQL"
                        : "-"
                );

        }

    }


    /* ======================================================
       TOTAL
    ====================================================== */

    if (metaTotal) {

        if (
            datos?.modo === "mapa" ||
            obtenerGeoJSONRespuesta(datos)
        ) {

            metaTotal.textContent =
                obtenerTotalFeaturesTerri(
                    datos
                );

        }

        else {

            metaTotal.textContent =
                datos?.total_registros ??
                (
                    Array.isArray(
                        datos?.resultado
                    )
                        ? datos.resultado.length
                        : 0
                );

        }

    }

}



/* ==========================================================
   MENSAJE DE RESPALDO
========================================================== */


/**
 * Construye una respuesta legible cuando
 * el backend no entrega inteligencia.mensaje.
 */
function construirMensajeRespaldo(
    datos
) {

    const fuente =
        String(
            datos?.fuente || ""
        )
            .trim()
            .toUpperCase();


    /* ======================================================
       IGAC
    ====================================================== */

    if (
        fuente === "IGAC"
    ) {

        if (
            datos?.municipio
        ) {

            return `
                Se consultó el límite oficial de
                <b>${datos.municipio}</b>
                ${
                    datos?.departamento
                        ? `, ${datos.departamento}`
                        : ""
                }
                en el servicio del IGAC
                y ya fue enviado al mapa.
            `;

        }


        if (
            datos?.departamento
        ) {

            return `
                Se consultó el límite oficial del
                departamento de
                <b>${datos.departamento}</b>
                en el servicio del IGAC
                y ya fue enviado al mapa.
            `;

        }


        return `
            La información geográfica oficial
            fue consultada en el IGAC
            y ya fue enviada al mapa.
        `;

    }


    /* ======================================================
       MAPA
    ====================================================== */

    if (
        datos?.modo === "mapa" ||
        obtenerGeoJSONRespuesta(datos)
    ) {

        const total =
            obtenerTotalFeaturesTerri(
                datos
            );


        return `
            Se encontraron
            <b>${total}</b>
            ${
                total === 1
                    ? "entidad espacial"
                    : "entidades espaciales"
            }
            y ya fueron dibujadas
            en el mapa.
        `;

    }


    /* ======================================================
       RESULTADO TABULAR DE UNA SOLA FILA
    ====================================================== */

    const resultado =
        datos?.resultado;


    if (
        Array.isArray(resultado) &&
        resultado.length === 1
    ) {

        const fila =
            resultado[0];


        if (
            fila &&
            typeof fila === "object" &&
            !Array.isArray(fila)
        ) {

            const claves =
                Object.keys(
                    fila
                );


            if (
                claves.length === 1
            ) {

                const campo =
                    claves[0];


                const valor =
                    fila[campo];


                const nombreCampo =
                    campo
                        .replace(
                            /_/g,
                            " "
                        )
                        .replace(
                            /\b\w/g,
                            letra =>
                                letra.toUpperCase()
                        );


                return `
                    <b>${nombreCampo}:</b>
                    ${
                        formatearValorChat(
                            valor,
                            campo
                        )
                    }
                `;

            }

        }

    }


    /* ======================================================
       RESULTADO TABULAR GENERAL
    ====================================================== */

    const total =
        datos?.total_registros ??
        (
            Array.isArray(resultado)
                ? resultado.length
                : 0
        );


    return `
        La consulta devolvió
        <b>${total}</b>
        ${
            total === 1
                ? "registro"
                : "registros"
        }.
    `;

}



/* ==========================================================
   FORMATEAR VALORES
========================================================== */


/**
 * Formatea valores numéricos para mostrarlos
 * correctamente en el chat.
 */
function formatearValorChat(
    valor,
    campo = ""
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "Sin información";

    }


    const campoNormalizado =
        String(campo)
            .toLowerCase();


    const numero =
        Number(valor);


    if (
        !Number.isNaN(numero)
    ) {

        /* ==================================================
           VALORES MONETARIOS
        ================================================== */

        if (
            campoNormalizado.includes(
                "avaluo"
            ) ||
            campoNormalizado.includes(
                "valor"
            ) ||
            campoNormalizado.includes(
                "recaudo"
            ) ||
            campoNormalizado.includes(
                "cartera"
            )
        ) {

            return new Intl.NumberFormat(
                "es-CO",
                {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0
                }
            ).format(
                numero
            );

        }


        /* ==================================================
           NÚMEROS GENERALES
        ================================================== */

        return new Intl.NumberFormat(
            "es-CO"
        ).format(
            numero
        );

    }


    return String(
        valor
    );

}



/* ==========================================================
   VISUALIZACIÓN
========================================================== */


/**
 * Obtiene la configuración de visualización enviada
 * por el backend.
 *
 * Compatible con distintas estructuras.
 */
function obtenerVisualizacionRespuesta(
    datos
) {

    return (
        datos?.visualizacion ||
        datos?.inteligencia?.visualizacion ||
        datos?.metadata?.visualizacion ||
        {}
    );

}



/* ==========================================================
   NOMBRE DEL RESULTADO
========================================================== */


/**
 * Obtiene un nombre legible para la capa.
 */
function obtenerNombreResultado(
    datos
) {

    /* ======================================================
       IGAC - MUNICIPIO
    ====================================================== */

    if (
        String(
            datos?.fuente || ""
        )
            .trim()
            .toUpperCase() ===
        "IGAC" &&
        datos?.municipio
    ) {

        return (
            `Límite oficial de ${datos.municipio}`
        );

    }


    /* ======================================================
       IGAC - DEPARTAMENTO
    ====================================================== */

    if (
        String(
            datos?.fuente || ""
        )
            .trim()
            .toUpperCase() ===
        "IGAC" &&
        datos?.departamento
    ) {

        return (
            `Límite oficial de ${datos.departamento}`
        );

    }


    /* ======================================================
       TERRI+ GENERAL
    ====================================================== */

    return (
        datos?.inteligencia?.titulo ||
        datos?.titulo ||
        datos?.visualizacion?.titulo_leyenda ||
        datos?.visualizacion?.tituloLeyenda ||
        "Resultado TERRI+"
    );

}



/* ==========================================================
   DIBUJAR RESULTADO
========================================================== */


/**
 * Dibuja en el mapa una respuesta espacial.
 *
 * Primero intenta utilizar el nuevo punto de entrada
 * universal del Map Engine.
 *
 * Si no está disponible, conserva compatibilidad
 * con dibujarGeoJSON().
 */
function dibujarResultadoMapa(
    datos
) {

    /* ======================================================
       MOTOR UNIVERSAL
    ====================================================== */

    if (
        typeof window.dibujarResultadoTerritorial ===
        "function"
    ) {

        const dibujado =
            window.dibujarResultadoTerritorial(
                datos
            );


        if (dibujado) {

            console.log(
                "🌎 Resultado territorial dibujado mediante el motor universal.",
                {
                    fuente:
                        datos?.fuente ||
                        "PostGIS",
                    layerId:
                        datos?.layer_id,
                    municipio:
                        datos?.municipio,
                    departamento:
                        datos?.departamento
                }
            );


            return;

        }

    }


    /* ======================================================
       COMPATIBILIDAD CON MOTOR ANTERIOR
    ====================================================== */

    const geojson =
        obtenerGeoJSONRespuesta(
            datos
        );


    if (!geojson) {

        console.warn(
            "⚠️ La respuesta indica un resultado cartográfico, pero no contiene un GeoJSON válido:",
            datos
        );


        return;

    }


    const visualizacion =
        obtenerVisualizacionRespuesta(
            datos
        );


    const nombre =
        obtenerNombreResultado(
            datos
        );


    console.log(
        "🗺️ GeoJSON enviado al mapa:",
        geojson
    );


    console.log(
        "🎨 Visualización enviada al mapa:",
        visualizacion
    );


    console.log(
        "🏷️ Nombre de la capa:",
        nombre
    );


    dibujarGeoJSON(
        geojson,
        {
            layerId:
                datos?.layer_id ||
                TERRI_CONFIG.MAP_LAYER,

            sourceId:
                datos?.source_id ||
                TERRI_CONFIG.MAP_SOURCE,

            visualizacion,

            nombre
        }
    );

}



/* ==========================================================
   DETERMINAR SI DEBE MOSTRARSE EN EL MAPA
========================================================== */


/**
 * Determina si la respuesta contiene
 * información geográfica representable.
 */
function respuestaDebeDibujarse(
    datos
) {

    if (
        !datos ||
        typeof datos !== "object"
    ) {

        return false;

    }


    if (
        datos.modo === "mapa"
    ) {

        return true;

    }


    return Boolean(
        obtenerGeoJSONRespuesta(
            datos
        )
    );

}



/* ==========================================================
   ENVIAR PREGUNTA
========================================================== */


/**
 * Envía la pregunta al backend TERRI+.
 */
async function enviarPregunta() {

    const input =
        document.getElementById(
            "preguntaInput"
        );


    if (!input) return;


    const pregunta =
        input.value.trim();


    if (!pregunta) return;


    /* ======================================================
       MOSTRAR PREGUNTA
    ====================================================== */

    agregarMensaje(
        "usuario",
        pregunta
    );


    input.value = "";


    /* ======================================================
       MENSAJE TEMPORAL
    ====================================================== */

    agregarMensaje(
        "ia",
        "Analizando información territorial..."
    );


    try {

        /* ==================================================
           CONSULTAR API
        ================================================== */

        const datos =
            await consultarIA(
                pregunta
            );


        /* ==================================================
           RETIRAR MENSAJE TEMPORAL
        ================================================== */

        eliminarUltimoMensajeIA();


        /* ==================================================
           VALIDAR RESPUESTA
        ================================================== */

        if (
            !datos ||
            typeof datos !== "object"
        ) {

            throw new Error(
                "TERRI+ devolvió una respuesta inválida."
            );

        }


        /* ==================================================
           METADATOS
        ================================================== */

        actualizarMetadatos(
            datos
        );


        /* ==================================================
           MENSAJE INTELIGENTE
        ================================================== */

        const mensajeInteligente =
            datos?.inteligencia?.mensaje ||
            datos?.mensaje ||
            construirMensajeRespaldo(
                datos
            );


        agregarMensaje(
            "ia",
            mensajeInteligente
        );


        /* ==================================================
           DIBUJAR MAPA
        ================================================== */

        if (
            respuestaDebeDibujarse(
                datos
            )
        ) {

            dibujarResultadoMapa(
                datos
            );

        }


        /* ==================================================
           CONSOLA
        ================================================== */

        console.log(
            "🤖 Respuesta TERRI+:",
            datos
        );


        console.log(
            "🌐 Fuente:",
            datos?.fuente ||
            (
                datos?.ejecuto_sql
                    ? "PostGIS"
                    : "No identificada"
            )
        );


        console.log(
            "🗺️ Resultado espacial:",
            respuestaDebeDibujarse(
                datos
            )
        );


    }

    catch (error) {

        /* ==================================================
           RETIRAR MENSAJE TEMPORAL
        ================================================== */

        eliminarUltimoMensajeIA();


        /* ==================================================
           MOSTRAR ERROR
        ================================================== */

        agregarMensaje(
            "ia",
            "❌ No fue posible conectar con TERRI+."
        );


        console.error(
            "❌ Error enviando consulta:",
            error
        );

    }


    /* ======================================================
       LLEVAR CHAT AL FINAL
    ====================================================== */

    const chat =
        document.getElementById(
            "chatBox"
        );


    if (chat) {

        chat.scrollTop =
            chat.scrollHeight;

    }

}
