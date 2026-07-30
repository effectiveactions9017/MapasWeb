/* ==========================================================
   TERRI+ API SERVICE
   Único archivo autorizado para comunicarse con FastAPI
========================================================== */


/**
 * Construye la URL completa del endpoint IA.
 */
function obtenerUrlIA() {
    return `${TERRI_CONFIG.API_BASE_URL}${TERRI_CONFIG.IA_ENDPOINT}`;
}


/**
 * Consulta el estado básico de la API.
 * Por ahora usa /docs como verificación simple.
 */
async function verificarAPI() {

    try {

        const respuesta = await fetch(`${TERRI_CONFIG.API_BASE_URL}/docs`, {
            method: "GET"
        });

        return respuesta.ok;

    } catch (error) {

        console.error("Error verificando API:", error);
        return false;

    }

}


/**
 * Envía una pregunta al backend TERRI+.
 */
async function consultarIA(pregunta) {

    const controlador = new AbortController();

    const timeout = setTimeout(() => {
        controlador.abort();
    }, TERRI_CONFIG.REQUEST_TIMEOUT);

    try {

        const respuesta = await fetch(obtenerUrlIA(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pregunta: pregunta
            }),
            signal: controlador.signal
        });

        clearTimeout(timeout);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        return datos;

    } catch (error) {

        clearTimeout(timeout);

        console.error("Error consultando TERRI+ IA:", error);

        throw error;

    }

}