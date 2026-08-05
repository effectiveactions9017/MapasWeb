// =====================================================
// 🧠 DETECTAR MÓDULO TERRI+
// =====================================================

function detectarModuloTerri(
  titulo,
  mapaUrl = "",
  dashboardUrl = ""
) {

  const texto =
    `${titulo} ${mapaUrl} ${dashboardUrl}`.toLowerCase();


  if (
    texto.includes("predial") ||
    texto.includes("catastro")
  ) {
    return "predial";
  }


  if (texto.includes("ica")) {
    return "ica";
  }


  if (texto.includes("servicios")) {
    return "servicios_publicos";
  }


  if (texto.includes("activos")) {
    return "activos_publicos";
  }


  if (
    texto.includes("construccion") ||
    texto.includes("construcción") ||
    texto.includes("crecimiento")
  ) {
    return "crecimiento_urbano";
  }


  if (texto.includes("suelo")) {
    return "uso_suelo";
  }


  if (
    texto.includes("bosque") ||
    texto.includes("forest")
  ) {
    return "bosques";
  }


  if (texto.includes("carbono")) {
    return "bonos_carbono";
  }


  if (texto.includes("cartera")) {
    return "cartera";
  }


  if (texto.includes("placa")) {
    return "placa_huellas";
  }


  if (
    texto.includes("socioeconomica") ||
    texto.includes("socioeconómica")
  ) {
    return "caracterizacion_socioeconomica";
  }


  return "general";
}


// =====================================================
// 🧠 ACTUALIZAR CONTEXTO COPILOT
// =====================================================

function notificarCopilot(
  titulo,
  descripcion,
  mapaUrl = null,
  dashboardUrl = null,
  tipoVista = "mapa"
) {

  if (
    typeof actualizarCopilotContexto !== "function"
  ) {

    console.warn(
      "TERRI Copilot todavía no está cargado."
    );

    return;
  }


  const moduloDetectado =
    detectarModuloTerri(
      titulo,
      mapaUrl,
      dashboardUrl
    );


  actualizarCopilotContexto({

    modulo: moduloDetectado,

    titulo,

    descripcion,

    mapaUrl,

    dashboardUrl,

    tipoVista,

    municipio: "Sesquilé"

  });
}


// =====================================================
// 🧭 OBTENER ELEMENTOS PRINCIPALES
// =====================================================

function obtenerElementosPrincipales() {

  return {

    menuPrincipal:
      document.getElementById(
        "menuPrincipal"
      ),

    sidebarMapas:
      document.getElementById(
        "sidebarMapas"
      ),

    inicio:
      document.getElementById(
        "inicio"
      ),

    modulo:
      document.getElementById(
        "modulo"
      ),

    mapaFrame:
      document.getElementById(
        "mapaFrame"
      ),

    dashboardFrame:
      document.getElementById(
        "dashboardFrame"
      ),

    terriCopilot:
      document.getElementById(
        "terriCopilot"
      )

  };
}


// =====================================================
// 🧹 LIMPIAR IFRAMES
// =====================================================

function limpiarIframes() {

  const {
    mapaFrame,
    dashboardFrame
  } = obtenerElementosPrincipales();


  if (mapaFrame) {

    mapaFrame.src = "";

    mapaFrame.style.display =
      "none";

  }


  if (dashboardFrame) {

    dashboardFrame.src = "";

    dashboardFrame.style.display =
      "none";

  }
}


// =====================================================
// 🤖 OCULTAR COPILOT LATERAL
// =====================================================

function ocultarCopilotLateral() {

  const copilot =
    document.getElementById(
      "terriCopilot"
    );


  if (!copilot) {

    console.warn(
      "⚠️ No se encontró el Copilot lateral."
    );

    return;
  }


  copilot.style.display =
    "none";


  setTimeout(() => {

    window.dispatchEvent(
      new Event("resize")
    );

  }, 250);
}


// =====================================================
// 🤖 MOSTRAR COPILOT LATERAL
// =====================================================

function mostrarCopilotLateral() {

  const copilot =
    document.getElementById(
      "terriCopilot"
    );


  if (!copilot) {
    return;
  }


  copilot.style.display = "";


  setTimeout(() => {

    window.dispatchEvent(
      new Event("resize")
    );

  }, 250);
}


// =====================================================
// 🏠 VOLVER AL MENÚ PRINCIPAL
// =====================================================

function volverMenuPrincipal() {

  const {

    menuPrincipal,

    sidebarMapas,

    inicio,

    modulo

  } = obtenerElementosPrincipales();


  limpiarIframes();


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


  ocultarCopilotLateral();


  if (
    typeof actualizarCopilotContexto ===
    "function"
  ) {

    actualizarCopilotContexto({

      modulo: null,

      titulo: null,

      descripcion: null,

      mapaUrl: null,

      dashboardUrl: null,

      tipoVista: "inicio"

    });
  }


  console.log(
    "🏠 Menú principal TERRI+ visible."
  );
}


// =====================================================
// 🗺️ ENTRAR A GEOVISORES
// =====================================================

function entrarGeovisores() {

  const {

    menuPrincipal,

    sidebarMapas,

    inicio,

    modulo

  } = obtenerElementosPrincipales();


  limpiarIframes();


  if (menuPrincipal) {

    menuPrincipal.style.display =
      "none";

  }


  if (sidebarMapas) {

    sidebarMapas.style.display =
      "block";

  }


  if (inicio) {

    inicio.style.display =
      "flex";

  }


  if (modulo) {

    modulo.style.display =
      "none";

  }


  mostrarCopilotLateral();


  if (
    typeof actualizarCopilotContexto ===
    "function"
  ) {

    actualizarCopilotContexto({

      modulo: null,

      titulo: null,

      descripcion: null,

      mapaUrl: null,

      dashboardUrl: null,

      tipoVista: "inicio"

    });
  }


  console.log(
    "🗺️ Geovisores TERRI+ abiertos."
  );
}


// =====================================================
// 🤖 ABRIR IA TERRITORIAL
// =====================================================

function abrirIATerritorial() {

  const {

    menuPrincipal,

    sidebarMapas

  } = obtenerElementosPrincipales();


  if (menuPrincipal) {

    menuPrincipal.style.display =
      "none";

  }


  if (sidebarMapas) {

    sidebarMapas.style.display =
      "none";

  }


  ocultarCopilotLateral();


  abrirDashboardSolo(

    "🤖 Agente IA Territorial TERRI+",

    "Consulta inteligente para analizar capas, mapas y datos territoriales.",

    "./dashboards/ia_territorial.html",

    false

  );
}


// =====================================================
// 🗺️ ABRIR MÓDULO DE MAPA
// =====================================================

function abrirModulo(
  titulo,
  descripcion,
  mapaUrl,
  dashboardUrl = null
) {

  const {

    menuPrincipal,

    sidebarMapas,

    inicio,

    modulo,

    mapaFrame,

    dashboardFrame

  } = obtenerElementosPrincipales();


  const tituloModulo =
    document.getElementById(
      "tituloModulo"
    );


  const descripcionModulo =
    document.getElementById(
      "descripcionModulo"
    );


  if (
    !inicio ||
    !modulo ||
    !tituloModulo ||
    !descripcionModulo ||
    !mapaFrame ||
    !dashboardFrame
  ) {

    alert(
      "❌ Falta un elemento del visor. Revisa los ID del HTML."
    );

    return;
  }


  if (menuPrincipal) {

    menuPrincipal.style.display =
      "none";

  }


  if (sidebarMapas) {

    sidebarMapas.style.display =
      "block";

  }


  mostrarCopilotLateral();


  inicio.style.display =
    "none";


  /*
   * Se usa flex para conservar el diseño
   * y la altura correcta del mapa.
   */
  modulo.style.display =
    "flex";


  tituloModulo.innerText =
    titulo;


  descripcionModulo.innerText =
    descripcion;


  dashboardFrame.src = "";

  dashboardFrame.style.display =
    "none";


  mapaFrame.src =
    mapaUrl;

  mapaFrame.style.display =
    "block";


  notificarCopilot(

    titulo,

    descripcion,

    mapaUrl,

    dashboardUrl,

    "mapa"

  );
}


// =====================================================
// 📊 ABRIR SOLO UN DASHBOARD
// =====================================================

function abrirDashboardSolo(
  titulo,
  descripcion,
  dashboardUrl,
  mostrarCopilot = true
) {

  const {

    menuPrincipal,

    inicio,

    modulo,

    mapaFrame,

    dashboardFrame

  } = obtenerElementosPrincipales();


  const tituloModulo =
    document.getElementById(
      "tituloModulo"
    );


  const descripcionModulo =
    document.getElementById(
      "descripcionModulo"
    );


  if (
    !inicio ||
    !modulo ||
    !tituloModulo ||
    !descripcionModulo ||
    !mapaFrame ||
    !dashboardFrame
  ) {

    alert(
      "❌ Falta un elemento del visor. Revisa los ID del HTML."
    );

    return;
  }


  if (menuPrincipal) {

    menuPrincipal.style.display =
      "none";

  }


  if (mostrarCopilot) {

    mostrarCopilotLateral();

  } else {

    ocultarCopilotLateral();

  }


  inicio.style.display =
    "none";


  /*
   * Flex conserva el mapa/chat ajustados
   * al espacio disponible.
   */
  modulo.style.display =
    "flex";


  tituloModulo.innerText =
    titulo;


  descripcionModulo.innerText =
    descripcion;


  mapaFrame.src = "";

  mapaFrame.style.display =
    "none";


  dashboardFrame.src =
    dashboardUrl;

  dashboardFrame.style.display =
    "block";


  notificarCopilot(

    titulo,

    descripcion,

    null,

    dashboardUrl,

    "dashboard"

  );


  /*
   * Recalcular el tamaño del iframe
   * después de mostrarlo.
   */
  setTimeout(() => {

    window.dispatchEvent(
      new Event("resize")
    );

  }, 200);
}


// =====================================================
// ⬅️ REGRESAR AL INICIO DE GEOVISORES
// =====================================================

function limpiarVisor() {

  const {

    menuPrincipal,

    sidebarMapas,

    inicio,

    modulo

  } = obtenerElementosPrincipales();


  limpiarIframes();


  if (menuPrincipal) {

    menuPrincipal.style.display =
      "none";

  }


  if (sidebarMapas) {

    sidebarMapas.style.display =
      "block";

  }


  if (inicio) {

    inicio.style.display =
      "flex";

  }


  if (modulo) {

    modulo.style.display =
      "none";

  }


  mostrarCopilotLateral();


  if (
    typeof actualizarCopilotContexto ===
    "function"
  ) {

    actualizarCopilotContexto({

      modulo: null,

      titulo: null,

      descripcion: null,

      mapaUrl: null,

      dashboardUrl: null,

      tipoVista: "inicio"

    });
  }
}


// =====================================================
// ⛶ PANTALLA COMPLETA
// =====================================================

function pantallaCompleta() {

  const visor =
    document.getElementById(
      "modulo"
    );


  if (!visor) {
    return;
  }


  if (document.fullscreenElement) {

    document
      .exitFullscreen()
      .catch(error => {

        console.error(
          "No fue posible salir de pantalla completa:",
          error
        );

      });

  } else {

    visor
      .requestFullscreen()
      .catch(error => {

        console.error(
          "No fue posible activar pantalla completa:",
          error
        );

      });

  }
}


// =====================================================
// 📐 REAJUSTAR EL CONTENIDO DEL IFRAME
// =====================================================

function reajustarIframeActivo() {

  const {

    mapaFrame,

    dashboardFrame

  } = obtenerElementosPrincipales();


  const frameActivo =

    dashboardFrame &&
    dashboardFrame.style.display !== "none"

      ? dashboardFrame

      : mapaFrame;


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
      "No se pudo reajustar el iframe:",
      error
    );

  }
}


// =====================================================
// 📐 CAMBIOS DE TAMAÑO
// =====================================================

window.addEventListener(
  "resize",
  reajustarIframeActivo
);


document.addEventListener(
  "fullscreenchange",
  () => {

    setTimeout(
      reajustarIframeActivo,
      150
    );

  }
);


// =====================================================
// 🚀 ESTADO INICIAL
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const {

      menuPrincipal,

      sidebarMapas,

      inicio,

      modulo

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


    ocultarCopilotLateral();


    console.log(
      "✅ TERRI+ iniciado en el menú principal."
    );

  }
);
