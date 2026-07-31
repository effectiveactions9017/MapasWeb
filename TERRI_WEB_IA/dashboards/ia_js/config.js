/* ==========================================================
   TERRI+ CONFIG
   Configuración automática y manual del backend
========================================================== */


/* ==========================================================
   DETECTAR ENTORNO LOCAL
========================================================== */

/**
 * Identifica si TERRI+ está ejecutándose en:
 *
 * - localhost
 * - 127.0.0.1
 * - archivo local file://
 */
function terriEstaEnLocal() {

    const hostname = window.location.hostname;

    return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        window.location.protocol === "file:"
    );

}


/* ==========================================================
   MODO DE CONEXIÓN
========================================================== */

/**
 * Modos disponibles:
 *
 * "auto"
 *   - localhost utiliza FastAPI local.
 *   - GitHub Pages utiliza Render.
 *
 * "local"
 *   - Fuerza el backend local.
 *
 * "render"
 *   - Fuerza el backend publicado en Render.
 *
 * Para la prueba actual se utiliza "render".
 */
const TERRI_API_MODE = "render";


/* ==========================================================
   URLS DEL BACKEND
========================================================== */

const TERRI_LOCAL_API = "http://127.0.0.1:8000";

const TERRI_RENDER_API = "https://terri-api.onrender.com";


/* ==========================================================
   SELECCIONAR URL DEL BACKEND
========================================================== */

function obtenerTerriApiBaseUrl() {

    if (TERRI_API_MODE === "local") {

        return TERRI_LOCAL_API;

    }

    if (TERRI_API_MODE === "render") {

        return TERRI_RENDER_API;

    }

    return terriEstaEnLocal()
        ? TERRI_LOCAL_API
        : TERRI_RENDER_API;

}


/* ==========================================================
   URL ACTIVA
========================================================== */

const TERRI_API_BASE_URL = obtenerTerriApiBaseUrl();


/* ==========================================================
   CONFIGURACIÓN GENERAL
========================================================== */

const TERRI_CONFIG = {

    // URL principal del backend FastAPI
    API_BASE_URL: TERRI_API_BASE_URL,

    // Endpoint principal de consultas
    IA_ENDPOINT: "/ia/consultar",

    // Tiempo máximo de espera de la petición.
    // Render puede tardar en despertar después de estar inactivo.
    REQUEST_TIMEOUT: 120000,

    // Identificador de la fuente GeoJSON en MapLibre
    MAP_SOURCE: "terri_resultado",

    // Identificador de la capa principal
    MAP_LAYER: "terri_poligonos"

};


/* ==========================================================
   EXPONER CONFIGURACIÓN GLOBALMENTE
========================================================== */

/**
 * Permite consultar la configuración desde:
 *
 * window.TERRI_CONFIG
 *
 * También facilita la comunicación con el iframe y la depuración.
 */
window.TERRI_CONFIG = TERRI_CONFIG;

window.TERRI_API_MODE = TERRI_API_MODE;


/* ==========================================================
   LOGS DE DIAGNÓSTICO
========================================================== */

console.log("======================================");

console.log("⚙️ TERRI+ IA CONFIG");

console.log("======================================");

console.log(
    "🌐 Entorno del frontend:",
    terriEstaEnLocal() ? "LOCAL" : "PRODUCCIÓN"
);

console.log(
    "🔧 Modo de conexión:",
    TERRI_API_MODE
);

console.log(
    "🔗 API activa:",
    TERRI_CONFIG.API_BASE_URL
);

console.log(
    "🎯 Endpoint IA:",
    `${TERRI_CONFIG.API_BASE_URL}${TERRI_CONFIG.IA_ENDPOINT}`
);

console.log("======================================");