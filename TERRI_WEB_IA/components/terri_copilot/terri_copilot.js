/* ==========================================================
   TERRI COPILOT
   Componente transversal del visor TERRI+
========================================================== */

let TERRI_COPILOT_CONTEXT = {
    modulo: null,
    titulo: null,
    descripcion: null,
    mapaUrl: null,
    dashboardUrl: null,
    tipoVista: "inicio",
    municipio: "Sesquilé"
};


/* ==========================================================
   Cambiar contexto del Copilot
========================================================== */

function actualizarCopilotContexto(contexto) {

    TERRI_COPILOT_CONTEXT = {
        ...TERRI_COPILOT_CONTEXT,
        ...contexto
    };

    document.getElementById("copilotModulo").textContent =
        TERRI_COPILOT_CONTEXT.titulo || "Sin módulo activo";

    document.getElementById("copilotDescripcion").textContent =
        TERRI_COPILOT_CONTEXT.descripcion ||
        "Abre un mapa para que TERRI Copilot pueda analizarlo contigo.";

    document.getElementById("copilotVista").textContent =
        `Vista: ${TERRI_COPILOT_CONTEXT.tipoVista || "inicio"}`;

    document.getElementById("copilotMunicipio").textContent =
        `Municipio: ${TERRI_COPILOT_CONTEXT.municipio || "Sesquilé"}`;

    actualizarSugerenciasCopilot();

    console.log("🧠 Contexto Copilot actualizado:", TERRI_COPILOT_CONTEXT);
}


/* ==========================================================
   Sugerencias por módulo
========================================================== */

function actualizarSugerenciasCopilot() {

    const contenedor = document.querySelector(".copilot-suggestions");

    if (!contenedor) return;

    const modulo = TERRI_COPILOT_CONTEXT.modulo;

    let preguntas = [
        "Resume este mapa",
        "Muéstrame los elementos más importantes",
        "¿Qué oportunidades territoriales se observan?"
    ];

    if (modulo === "predial") {
        preguntas = [
            "Resume las oportunidades prediales",
            "Muéstrame los predios con mayor avalúo",
            "¿Qué predios tienen potencial de actualización?"
        ];
    }

    if (modulo === "ica") {
        preguntas = [
            "Resume las oportunidades de recaudo ICA",
            "¿Dónde están los mayores contribuyentes?",
            "Muéstrame posibles zonas con subregistro"
        ];
    }

    if (modulo === "servicios_publicos") {
        preguntas = [
            "Resume la situación de servicios públicos",
            "¿Dónde hay déficit de cobertura?",
            "Muéstrame zonas sin servicios completos"
        ];
    }

    if (modulo === "cartera") {
        preguntas = [
            "Resume la cartera municipal",
            "¿Dónde se concentra la mayor cartera?",
            "Muéstrame predios con alto riesgo de mora"
        ];
    }

    if (modulo === "placa_huellas") {
        preguntas = [
            "Resume el estado de placa huellas",
            "¿Qué zonas requieren intervención vial?",
            "Muéstrame sectores prioritarios"
        ];
    }

    if (modulo === "bosques") {
        preguntas = [
            "Resume la pérdida de bosque",
            "¿Dónde están las zonas críticas?",
            "Muéstrame oportunidades ambientales"
        ];
    }

    contenedor.innerHTML = `
        <span class="suggestions-title">💡 Puedes preguntar</span>
        ${preguntas.map(p => `
            <button onclick="usarPreguntaCopilot('${p.replace(/'/g, "\\'")}')">
                ${p}
            </button>
        `).join("")}
    `;
}


/* ==========================================================
   Usar pregunta sugerida
========================================================== */

function usarPreguntaCopilot(texto) {

    const input = document.getElementById("copilotPregunta");

    if (!input) return;

    input.value = texto;
    input.focus();
}


/* ==========================================================
   Agregar mensaje al Copilot
========================================================== */

function agregarMensajeCopilot(tipo, texto) {

    const chat = document.getElementById("copilotChat");

    if (!chat) return;

    const mensaje = document.createElement("div");

    mensaje.className = `copilot-msg ${tipo}`;
    mensaje.innerHTML = texto;

    chat.appendChild(mensaje);
    chat.scrollTop = chat.scrollHeight;
}


function eliminarUltimoMensajeIA() {

    const mensajesIA = document.querySelectorAll(".copilot-msg.ia");

    if (mensajesIA.length > 0) {
        mensajesIA[mensajesIA.length - 1].remove();
    }
}


/* ==========================================================
   Enviar GeoJSON al mapa activo
========================================================== */

function enviarGeoJSONAlMapaActivo(geojson) {

    const iframe = document.getElementById("mapaFrame");

    if (!iframe || !iframe.contentWindow) {

        console.warn("⚠️ No se encontró iframe de mapa activo.");

        agregarMensajeCopilot(
            "ia",
            "No encontré un mapa activo para dibujar el resultado."
        );

        return false;
    }

    console.log("📨 Enviando GeoJSON al mapa activo:", geojson);

    iframe.contentWindow.postMessage({
        tipo: "TERRI_DIBUJAR_GEOJSON",
        geojson: geojson
    }, "*");

    return true;
}


/* ==========================================================
   Comandos directos al mapa activo
========================================================== */

function enviarComandoMapaActivo(tipo, payload = {}) {

    const iframe = document.getElementById("mapaFrame");

    if (!iframe || !iframe.contentWindow) {

        agregarMensajeCopilot(
            "ia",
            "No encontré un mapa activo para ejecutar ese comando."
        );

        return false;
    }

    iframe.contentWindow.postMessage({
        tipo: tipo,
        ...payload
    }, "*");

    return true;
}


function limpiarResultadoMapaActivo() {
    return enviarComandoMapaActivo("TERRI_LIMPIAR_RESULTADO");
}


function zoomResultadoMapaActivo() {
    return enviarComandoMapaActivo("TERRI_ZOOM_RESULTADO");
}


/* ==========================================================
   Detectar comandos locales del visor
========================================================== */

function normalizarTextoCopilot(texto) {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


function procesarComandoLocalCopilot(pregunta) {

    const texto = normalizarTextoCopilot(pregunta);

    const esLimpiar =
        texto.includes("limpiar mapa") ||
        texto.includes("limpia el mapa") ||
        texto.includes("borrar resultado") ||
        texto.includes("borra el resultado") ||
        texto.includes("quitar resultado") ||
        texto.includes("quita el resultado") ||
        texto.includes("ocultar resultado") ||
        texto.includes("oculta el resultado") ||
        texto.includes("volver al mapa original");

    if (esLimpiar) {
        const ok = limpiarResultadoMapaActivo();

        agregarMensajeCopilot(
            "ia",
            ok
                ? "Listo. Limpié los resultados de la IA y dejé visible el mapa base."
                : "No encontré un mapa activo para limpiar."
        );

        return true;
    }

    const esZoomResultado =
        texto.includes("zoom al resultado") ||
        texto.includes("acercate al resultado") ||
        texto.includes("acercar al resultado") ||
        texto.includes("volver al resultado") ||
        texto.includes("centrar resultado") ||
        texto.includes("centra el resultado") ||
        texto.includes("muestrame el resultado") ||
        texto.includes("mostrar resultado");

    if (esZoomResultado) {
        const ok = zoomResultadoMapaActivo();

        agregarMensajeCopilot(
            "ia",
            ok
                ? "Listo. Centré el mapa en el resultado actual."
                : "No encontré un mapa activo para hacer zoom."
        );

        return true;
    }

    return false;
}


/* ==========================================================
   Enviar pregunta al Copilot
========================================================== */

async function enviarCopilot() {

    const input = document.getElementById("copilotPregunta");

    if (!input) return;

    const pregunta = input.value.trim();

    if (!pregunta) return;

    agregarMensajeCopilot("usuario", pregunta);

    input.value = "";

    if (procesarComandoLocalCopilot(pregunta)) {
        return;
    }

    agregarMensajeCopilot("ia", "Analizando el mapa activo...");

    try {

        const respuesta = await fetch("https://terri-api.onrender.com/ia/consultar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pregunta: pregunta,
                contexto: TERRI_COPILOT_CONTEXT
            })
        });

        const datos = await respuesta.json();

        eliminarUltimoMensajeIA();

        if (datos.modo === "mapa") {

            const enviado = enviarGeoJSONAlMapaActivo(datos.resultado);

            if (enviado) {

                agregarMensajeCopilot(
                    "ia",
                     datos.inteligencia?.mensaje ||
                    `Encontré <b>${datos.total_features}</b> entidades espaciales y las envié al mapa activo.`
                );

            } else {

                agregarMensajeCopilot(
                    "ia",
                    `Encontré <b>${datos.total_features}</b> entidades espaciales, pero no pude enviarlas al mapa activo.`
                );

            }

        } else {

            agregarMensajeCopilot(
                "ia",
                 datos.inteligencia?.mensaje ||
                `La consulta devolvió <b>${datos.total_registros}</b> registros.`
            );

        }

        console.log("🤖 Respuesta Copilot:", datos);

    } catch (error) {

        eliminarUltimoMensajeIA();

        agregarMensajeCopilot(
            "ia",
            "❌ No pude conectar con TERRI+ IA. Verifica que FastAPI esté encendido."
        );

        console.error(error);
    }
}


/* ==========================================================
   Abrir / cerrar Copilot
========================================================== */

function toggleCopilot() {

    const panel = document.getElementById("terriCopilot");

    if (!panel) return;

    panel.classList.toggle("copilot-cerrado");
}


/* ==========================================================
   Recibir confirmaciones desde el mapa iframe
========================================================== */

window.addEventListener("message", function(event) {

    if (!event.data || !event.data.tipo) return;

    if (event.data.tipo === "TERRI_BRIDGE_CARGADO") {
        console.log("🌉 Bridge del mapa cargado:", event.data);
    }

    if (event.data.tipo === "TERRI_BRIDGE_RECIBIO") {
        console.log("✅ El mapa confirmó recepción:", event.data);
    }

    if (event.data.tipo === "TERRI_BRIDGE_DIBUJO") {
        console.log("🗺️ El mapa dibujó el resultado:", event.data);

        agregarMensajeCopilot(
            "ia",
            `✅ El mapa dibujó correctamente <b>${event.data.total}</b> entidades.`
        );
    }

    if (event.data.tipo === "TERRI_BRIDGE_ERROR") {
        console.error("❌ Error del bridge:", event.data);

        agregarMensajeCopilot(
            "ia",
            `❌ El mapa reportó un problema: ${event.data.mensaje}`
        );
    }
});


/* ==========================================================
   Enter para enviar
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("copilotPregunta");

    if (input) {

        input.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {
                enviarCopilot();
            }

        });
    }
});