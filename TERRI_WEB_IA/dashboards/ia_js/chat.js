/* ==========================================================
   TERRI+ CHAT
========================================================== */


/**
 * Agrega un mensaje al chat.
 */
function agregarMensaje(tipo, texto) {

    const chat = document.getElementById("chatBox");

    if (!chat) return;

    const div = document.createElement("div");

    div.className = `mensaje mensaje-${tipo}`;

    div.innerHTML = `
        <strong>
            ${tipo === "usuario" ? "🧑 Tú" : "🤖 TERRI+ IA"}
        </strong>

        <p>${texto}</p>
    `;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


/**
 * Elimina el último mensaje de la IA.
 * Se usa para retirar el mensaje temporal "Analizando...".
 */
function eliminarUltimoMensajeIA() {

    const mensajes =
        document.querySelectorAll(".mensaje-ia");

    if (mensajes.length > 0) {

        mensajes[
            mensajes.length - 1
        ].remove();

    }

}


/**
 * Actualiza la barra inferior.
 */
function actualizarMetadatos(datos) {

    const metaTipo =
        document.getElementById("metaTipo");

    const metaModo =
        document.getElementById("metaModo");

    const metaSQL =
        document.getElementById("metaSQL");

    const metaTotal =
        document.getElementById("metaTotal");


    if (metaTipo) {

        metaTipo.textContent =
            datos.tipo ?? "-";

    }


    if (metaModo) {

        metaModo.textContent =
            datos.modo ?? "-";

    }


    if (metaSQL) {

        metaSQL.textContent =
            datos.sql ?? "-";

    }


    if (metaTotal) {

        if (datos.modo === "mapa") {

            metaTotal.textContent =
                datos.total_features ?? 0;

        } else {

            metaTotal.textContent =
                datos.total_registros ?? 0;

        }

    }

}


/**
 * Construye una respuesta de respaldo cuando el backend
 * no envía datos.inteligencia.mensaje.
 */
function construirMensajeRespaldo(datos) {

    if (datos.modo === "mapa") {

        const total =
            datos.total_features ?? 0;

        return `
            Se encontraron <b>${total}</b>
            ${
                total === 1
                    ? "entidad espacial"
                    : "entidades espaciales"
            }
            y ya fueron dibujadas en el mapa.
        `;

    }


    const resultado =
        datos.resultado;


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
                Object.keys(fila);


            if (claves.length === 1) {

                const campo =
                    claves[0];

                const valor =
                    fila[campo];

                const nombreCampo =
                    campo
                        .replace(/_/g, " ")
                        .replace(
                            /\b\w/g,
                            letra =>
                                letra.toUpperCase()
                        );

                return `
                    <b>${nombreCampo}:</b>
                    ${formatearValorChat(
                        valor,
                        campo
                    )}
                `;

            }

        }

    }


    const total =
        datos.total_registros ?? 0;

    return `
        La consulta devolvió <b>${total}</b>
        ${
            total === 1
                ? "registro"
                : "registros"
        }.
    `;

}


/**
 * Formatea valores numéricos para mostrarlos en el chat.
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
        String(campo).toLowerCase();

    const numero =
        Number(valor);


    if (!Number.isNaN(numero)) {

        if (
            campoNormalizado.includes("avaluo") ||
            campoNormalizado.includes("valor") ||
            campoNormalizado.includes("recaudo") ||
            campoNormalizado.includes("cartera")
        ) {

            return new Intl.NumberFormat(
                "es-CO",
                {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0
                }
            ).format(numero);

        }


        return new Intl.NumberFormat(
            "es-CO"
        ).format(numero);

    }


    return String(valor);

}


/**
 * Obtiene la configuración de visualización enviada
 * por el backend.
 *
 * Permite compatibilidad con distintas estructuras
 * de respuesta.
 */
function obtenerVisualizacionRespuesta(datos) {

    return (
        datos?.visualizacion ||
        datos?.inteligencia?.visualizacion ||
        datos?.metadata?.visualizacion ||
        {}
    );

}


/**
 * Obtiene el GeoJSON desde la respuesta.
 *
 * Permite compatibilidad con:
 * - datos.resultado
 * - datos.geojson
 * - datos.resultado.geojson
 */
function obtenerGeoJSONRespuesta(datos) {

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


/**
 * Obtiene un nombre legible para la capa.
 */
function obtenerNombreResultado(datos) {

    return (
        datos?.inteligencia?.titulo ||
        datos?.titulo ||
        datos?.visualizacion?.titulo_leyenda ||
        datos?.visualizacion?.tituloLeyenda ||
        "Resultado TERRI+"
    );

}


/**
 * Dibuja en el mapa una respuesta espacial.
 */
function dibujarResultadoMapa(datos) {

    const geojson =
        obtenerGeoJSONRespuesta(datos);

    if (!geojson) {

        console.warn(
            "⚠️ La respuesta indica modo mapa, pero no contiene un GeoJSON válido:",
            datos
        );

        return;

    }


    const visualizacion =
        obtenerVisualizacionRespuesta(datos);

    const nombre =
        obtenerNombreResultado(datos);


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
            visualizacion,
            nombre
        }
    );

}


/**
 * Envía la pregunta al backend.
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


    agregarMensaje(
        "usuario",
        pregunta
    );


    input.value = "";


    agregarMensaje(
        "ia",
        "Analizando información territorial..."
    );


    try {

        const datos =
            await consultarIA(pregunta);


        eliminarUltimoMensajeIA();


        actualizarMetadatos(datos);


        const mensajeInteligente =
            datos.inteligencia?.mensaje ||
            construirMensajeRespaldo(datos);


        agregarMensaje(
            "ia",
            mensajeInteligente
        );


        if (datos.modo === "mapa") {

            dibujarResultadoMapa(datos);

        }


        console.log(
            "🤖 Respuesta TERRI+:",
            datos
        );

    } catch (error) {

        eliminarUltimoMensajeIA();


        agregarMensaje(
            "ia",
            "❌ No fue posible conectar con TERRI+."
        );


        console.error(
            "❌ Error enviando consulta:",
            error
        );

    }


    const chat =
        document.getElementById("chatBox");


    if (chat) {

        chat.scrollTop =
            chat.scrollHeight;

    }

}