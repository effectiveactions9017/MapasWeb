/* ==========================================================
   TERRI+ APP PRINCIPAL
   Navegación, mapas, dashboards y pantalla completa
========================================================== */


/* ==========================================================
   ESTADO DEL MÓDULO ACTIVO
========================================================== */

/**
 * Guarda las URLs del mapa y dashboard actualmente abiertos.
 * Permite cambiar entre ambas vistas sin perder la información.
 */
let mapaUrlActivo = null;
let dashboardUrlActivo = null;


/* ==========================================================
   OBTENER ELEMENTOS PRINCIPALES
========================================================== */

function obtenerElementosPrincipales() {

    return {

        menuPrincipal:
            document.getElementById("menuPrincipal"),

        sidebarMapas:
            document.getElementById("sidebarMapas"),

        inicio:
            document.getElementById("inicio"),

        modulo:
            document.getElementById("modulo"),

        mapaFrame:
            document.getElementById("mapaFrame"),

        dashboardFrame:
            document.getElementById("dashboardFrame"),

        tituloModulo:
            document.getElementById("tituloModulo"),

        descripcionModulo:
            document.getElementById("descripcionModulo"),

        btnDashboard:
            document.getElementById("btnDashboard"),

        btnMapa:
            document.getElementById("btnMapa")

    };

}


/* ==========================================================
   VERIFICAR ELEMENTOS DEL VISOR
========================================================== */

function visorDisponible() {

    const {
        inicio,
        modulo,
        mapaFrame,
        dashboardFrame,
        tituloModulo,
        descripcionModulo
    } = obtenerElementosPrincipales();


    const elementosCompletos = Boolean(
        inicio &&
        modulo &&
        mapaFrame &&
        dashboardFrame &&
        tituloModulo &&
        descripcionModulo
    );


    if (!elementosCompletos) {

        console.error(
            "❌ Faltan elementos principales del visor."
        );

    }


    return elementosCompletos;

}


/* ==========================================================
   LIMPIAR IFRAMES
========================================================== */

function limpiarIframes() {

    const {
        mapaFrame,
        dashboardFrame,
        btnDashboard,
        btnMapa
    } = obtenerElementosPrincipales();


    if (mapaFrame) {

        mapaFrame.removeAttribute("src");

        mapaFrame.style.display = "none";

    }


    if (dashboardFrame) {

        dashboardFrame.removeAttribute("src");

        dashboardFrame.style.display = "none";

    }


    if (btnDashboard) {

        btnDashboard.style.display = "none";

    }


    if (btnMapa) {

        btnMapa.style.display = "none";

    }


    mapaUrlActivo = null;

    dashboardUrlActivo = null;

}


/* ==========================================================
   REAJUSTAR IFRAME ACTIVO
========================================================== */

function reajustarIframeActivo() {

    const {
        mapaFrame,
        dashboardFrame
    } = obtenerElementosPrincipales();


    let frameActivo = null;


    if (
        dashboardFrame &&
        dashboardFrame.style.display !== "none"
    ) {

        frameActivo = dashboardFrame;

    } else if (
        mapaFrame &&
        mapaFrame.style.display !== "none"
    ) {

        frameActivo = mapaFrame;

    }


    if (
        !frameActivo ||
        !frameActivo.contentWindow
    ) {

        return;

    }


    try {

        frameActivo.contentWindow.dispatchEvent(
            new Event("resize")
        );

    } catch (error) {

        console.warn(
            "⚠️ No se pudo reajustar el iframe activo:",
            error
        );

    }

}


/* ==========================================================
   REAJUSTAR DESPUÉS DE CAMBIAR DE VISTA
========================================================== */

function programarReajusteIframe() {

    requestAnimationFrame(() => {

        reajustarIframeActivo();

    });


    setTimeout(
        reajustarIframeActivo,
        120
    );


    setTimeout(
        reajustarIframeActivo,
        300
    );

}


/* ==========================================================
   MENÚ PRINCIPAL
========================================================== */

function volverMenuPrincipal() {

    const {
        menuPrincipal,
        sidebarMapas,
        inicio,
        modulo
    } = obtenerElementosPrincipales();


    limpiarIframes();


    if (menuPrincipal) {

        menuPrincipal.style.display = "flex";

    }


    if (sidebarMapas) {

        sidebarMapas.style.display = "none";

    }


    if (inicio) {

        inicio.style.display = "none";

    }


    if (modulo) {

        modulo.style.display = "none";

    }


    console.log(
        "🏠 Menú principal TERRI+ visible."
    );

}


/* ==========================================================
   ENTRAR A GEOVISORES
========================================================== */

function entrarGeovisores() {

    const {
        menuPrincipal,
        sidebarMapas,
        inicio,
        modulo
    } = obtenerElementosPrincipales();


    limpiarIframes();


    if (menuPrincipal) {

        menuPrincipal.style.display = "none";

    }


    if (sidebarMapas) {

        sidebarMapas.style.display = "block";

    }


    if (inicio) {

        inicio.style.display = "flex";

    }


    if (modulo) {

        modulo.style.display = "none";

    }


    console.log(
        "🗺️ Geovisores TERRI+ abiertos."
    );

}


/* ==========================================================
   ABRIR AGENTE IA TERRITORIAL
========================================================== */

function abrirIATerritorial() {

    const {
        menuPrincipal,
        sidebarMapas
    } = obtenerElementosPrincipales();


    if (menuPrincipal) {

        menuPrincipal.style.display = "none";

    }


    if (sidebarMapas) {

        sidebarMapas.style.display = "none";

    }


    abrirDashboardSolo(

        "🤖 Agente IA Territorial TERRI+",

        "Consulta inteligente para analizar capas, mapas y datos territoriales.",

        "./dashboards/ia_territorial.html"

    );

}

/* ==========================================================
   ABRIR VISUALIZADOR DE CAPAS
========================================================== */

function abrirVisualizadorCapas() {

    const {
        menuPrincipal,
        sidebarMapas
    } = obtenerElementosPrincipales();

    if (menuPrincipal) {
        menuPrincipal.style.display = "none";
    }

    if (sidebarMapas) {
        sidebarMapas.style.display = "none";
    }

    abrirDashboardSolo(
        "🗂️ Visualizador de capas",
        "Carga, visualiza y consulta capas GeoJSON y JSON sobre el territorio.",
        "./capas/capas.html"
    );

}


/* ==========================================================
   ABRIR MAPA CON DASHBOARD OPCIONAL
========================================================== */

function abrirModulo(
    titulo,
    descripcion,
    mapaUrl,
    dashboardUrl = null
) {

    if (!visorDisponible()) {

        alert(
            "❌ Falta un elemento principal del visor."
        );

        return;

    }


    const {
        menuPrincipal,
        sidebarMapas,
        inicio,
        modulo,
        mapaFrame,
        dashboardFrame,
        tituloModulo,
        descripcionModulo,
        btnDashboard,
        btnMapa
    } = obtenerElementosPrincipales();


    mapaUrlActivo = mapaUrl;

    dashboardUrlActivo =
        dashboardUrl || null;


    if (menuPrincipal) {

        menuPrincipal.style.display = "none";

    }


    if (sidebarMapas) {

        sidebarMapas.style.display = "block";

    }


    inicio.style.display = "none";

    modulo.style.display = "flex";


    tituloModulo.textContent = titulo;

    descripcionModulo.textContent =
        descripcion;


    /* ------------------------------------------
       Mostrar mapa
    ------------------------------------------ */

    mapaFrame.src = mapaUrl;

    mapaFrame.style.display = "block";


    /* ------------------------------------------
       Preparar dashboard
    ------------------------------------------ */

    dashboardFrame.style.display = "none";


    if (dashboardUrlActivo) {

        dashboardFrame.src =
            dashboardUrlActivo;


        if (btnDashboard) {

            btnDashboard.style.display =
                "inline-flex";

        }

    } else {

        dashboardFrame.removeAttribute("src");


        if (btnDashboard) {

            btnDashboard.style.display =
                "none";

        }

    }


    if (btnMapa) {

        btnMapa.style.display = "none";

    }


    programarReajusteIframe();


    console.log(
        "🗺️ Módulo abierto:",
        {
            titulo,
            mapaUrlActivo,
            dashboardUrlActivo
        }
    );

}


/* ==========================================================
   IR AL DASHBOARD DEL MAPA ACTIVO
========================================================== */

function verDashboard() {

    const {
        mapaFrame,
        dashboardFrame,
        btnDashboard,
        btnMapa
    } = obtenerElementosPrincipales();


    if (
        !mapaFrame ||
        !dashboardFrame
    ) {

        console.warn(
            "⚠️ No se encontraron los iframes."
        );

        return;

    }


    if (!dashboardUrlActivo) {

        console.warn(
            "⚠️ Este mapa no tiene dashboard asociado."
        );

        return;

    }


    if (
        dashboardFrame.getAttribute("src") !==
        dashboardUrlActivo
    ) {

        dashboardFrame.src =
            dashboardUrlActivo;

    }


    mapaFrame.style.display = "none";

    dashboardFrame.style.display = "block";


    if (btnDashboard) {

        btnDashboard.style.display = "none";

    }


    if (btnMapa) {

        btnMapa.style.display = "inline-flex";

    }


    programarReajusteIframe();


    console.log(
        "📊 Dashboard activo:",
        dashboardUrlActivo
    );

}


/* ==========================================================
   VOLVER AL MAPA ACTIVO
========================================================== */

function verMapa() {

    const {
        mapaFrame,
        dashboardFrame,
        btnDashboard,
        btnMapa
    } = obtenerElementosPrincipales();


    if (
        !mapaFrame ||
        !dashboardFrame
    ) {

        console.warn(
            "⚠️ No se encontraron los iframes."
        );

        return;

    }


    if (!mapaUrlActivo) {

        console.warn(
            "⚠️ No hay un mapa activo."
        );

        return;

    }


    if (
        mapaFrame.getAttribute("src") !==
        mapaUrlActivo
    ) {

        mapaFrame.src =
            mapaUrlActivo;

    }


    mapaFrame.style.display = "block";

    dashboardFrame.style.display = "none";


    if (
        btnDashboard &&
        dashboardUrlActivo
    ) {

        btnDashboard.style.display =
            "inline-flex";

    }


    if (btnMapa) {

        btnMapa.style.display = "none";

    }


    programarReajusteIframe();


    console.log(
        "🗺️ Visor de mapa activo."
    );

}


/* ==========================================================
   ABRIR DASHBOARD INDEPENDIENTE
   IA TERRITORIAL O CARACTERIZACIÓN
========================================================== */

function abrirDashboardSolo(
    titulo,
    descripcion,
    dashboardUrl
) {

    if (!visorDisponible()) {

        alert(
            "❌ Falta un elemento principal del visor."
        );

        return;

    }


    const {
        menuPrincipal,
        sidebarMapas,
        inicio,
        modulo,
        mapaFrame,
        dashboardFrame,
        tituloModulo,
        descripcionModulo,
        btnDashboard,
        btnMapa
    } = obtenerElementosPrincipales();


    mapaUrlActivo = null;

    dashboardUrlActivo = dashboardUrl;


    if (menuPrincipal) {

        menuPrincipal.style.display = "none";

    }


    /*
     * El Agente IA se abre sin menú lateral.
     * Caracterización puede abrirse desde el menú lateral.
     * No cambiamos aquí el estado del sidebar.
     */


    inicio.style.display = "none";

    modulo.style.display = "flex";


    tituloModulo.textContent = titulo;

    descripcionModulo.textContent =
        descripcion;


    mapaFrame.removeAttribute("src");

    mapaFrame.style.display = "none";


    dashboardFrame.src =
        dashboardUrlActivo;

    dashboardFrame.style.display = "block";


    /*
     * Un dashboard independiente no necesita
     * alternar entre mapa y dashboard.
     */

    if (btnDashboard) {

        btnDashboard.style.display = "none";

    }


    if (btnMapa) {

        btnMapa.style.display = "none";

    }


    programarReajusteIframe();


    console.log(
        "📊 Dashboard independiente abierto:",
        dashboardUrlActivo
    );

}


/* ==========================================================
   REGRESAR AL INICIO DE GEOVISORES
========================================================== */

function limpiarVisor() {

    const {
        menuPrincipal,
        sidebarMapas,
        inicio,
        modulo
    } = obtenerElementosPrincipales();


    limpiarIframes();


    if (menuPrincipal) {

        menuPrincipal.style.display = "none";

    }


    if (sidebarMapas) {

        sidebarMapas.style.display = "block";

    }


    if (inicio) {

        inicio.style.display = "flex";

    }


    if (modulo) {

        modulo.style.display = "none";

    }


    console.log(
        "⬅️ Inicio de geovisores visible."
    );

}


/* ==========================================================
   PANTALLA COMPLETA
========================================================== */

async function pantallaCompleta() {

    const modulo =
        document.getElementById("modulo");


    if (!modulo) {

        console.warn(
            "⚠️ No se encontró el módulo."
        );

        return;

    }


    try {

        if (document.fullscreenElement) {

            await document.exitFullscreen();

        } else {

            await modulo.requestFullscreen();

        }

    } catch (error) {

        console.error(
            "❌ Error cambiando pantalla completa:",
            error
        );

    }

}


/* ==========================================================
   CAMBIO DE TAMAÑO DE VENTANA
========================================================== */

window.addEventListener(
    "resize",
    programarReajusteIframe
);


/* ==========================================================
   CAMBIO DE PANTALLA COMPLETA
========================================================== */

document.addEventListener(
    "fullscreenchange",
    programarReajusteIframe
);


document.addEventListener(
    "webkitfullscreenchange",
    programarReajusteIframe
);


/* ==========================================================
   ESTADO INICIAL
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const {
            menuPrincipal,
            sidebarMapas,
            inicio,
            modulo,
            btnDashboard,
            btnMapa
        } = obtenerElementosPrincipales();


        if (menuPrincipal) {

            menuPrincipal.style.display =
                "flex";

        }


        if (sidebarMapas) {

            sidebarMapas.style.display =
                "none";

        }


        if (inicio) {

            inicio.style.display =
                "none";

        }


        if (modulo) {

            modulo.style.display =
                "none";

        }


        if (btnDashboard) {

            btnDashboard.style.display =
                "none";

        }


        if (btnMapa) {

            btnMapa.style.display =
                "none";

        }


        console.log(
            "✅ TERRI+ iniciado en el menú principal."
        );

    }
);
