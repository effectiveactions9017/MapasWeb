// =====================================================
// 🧠 DETECTAR MÓDULO TERRI+
// =====================================================

function detectarModuloTerri(titulo, mapaUrl = "", dashboardUrl = "") {

  const texto = `${titulo} ${mapaUrl} ${dashboardUrl}`.toLowerCase();

  if (texto.includes("predial") || texto.includes("catastro")) {
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

  if (texto.includes("bosque") || texto.includes("forest")) {
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

  if (typeof actualizarCopilotContexto !== "function") {
    console.warn("TERRI Copilot todavía no está cargado.");
    return;
  }

  const moduloDetectado = detectarModuloTerri(
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
    menuPrincipal: document.getElementById("menuPrincipal"),
    sidebarMapas: document.getElementById("sidebarMapas"),
    inicio: document.getElementById("inicio"),
    modulo: document.getElementById("modulo"),
    mapaFrame: document.getElementById("mapaFrame"),
    dashboardFrame: document.getElementById("dashboardFrame"),
    terriCopilot: document.getElementById("terriCopilot")
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
    mapaFrame.style.display = "none";
  }

  if (dashboardFrame) {
    dashboardFrame.src = "";
    dashboardFrame.style.display = "none";
  }
}


// =====================================================
// 🤖 MOSTRAR / OCULTAR COPILOT LATERAL
// =====================================================

function ocultarCopilotLateral() {

  const copilot = document.getElementById("terriCopilot");

  if (!copilot) {
    console.warn("⚠️ No se encontró el Copilot lateral.");
    return;
  }

  copilot.style.display = "none";

  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 250);
}


function mostrarCopilotLateral() {

  const copilot = document.getElementById("terriCopilot");

  if (!copilot) {
    return;
  }

  copilot.style.display = "";

  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 250);
}


// =====================================================
// 🏠 MOSTRAR MENÚ PRINCIPAL
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

  ocultarCopilotLateral();

  if (typeof actualizarCopilotContexto === "function") {
    actualizarCopilotContexto({
      modulo: null,
      titulo: null,
      descripcion: null,
      mapaUrl: null,
      dashboardUrl: null,
      tipoVista: "inicio"
    });
  }

  console.log("🏠 Menú principal TERRI+ visible.");
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

  mostrarCopilotLateral();

  if (typeof actualizarCopilotContexto === "function") {
    actualizarCopilotContexto({
      modulo: null,
      titulo: null,
      descripcion: null,
      mapaUrl: null,
      dashboardUrl: null,
      tipoVista: "inicio"
    });
  }

  console.log("🗺️ Geovisores TERRI+ abiertos.");
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
    menuPrincipal.style.display = "none";
  }

  if (sidebarMapas) {
    sidebarMapas.style.display = "none";
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
// 🗺️ ABRIR MÓDULO MAPA + DASHBOARD OPCIONAL
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

  const tituloModulo = document.getElementById("tituloModulo");
  const descripcionModulo = document.getElementById("descripcionModulo");
  const btnDashboard = document.getElementById("btnDashboard");
  const btnMapa = document.getElementById("btnMapa");

  if (
    !inicio ||
    !modulo ||
    !tituloModulo ||
    !descripcionModulo ||
    !mapaFrame ||
    !dashboardFrame ||
    !btnDashboard ||
    !btnMapa
  ) {
    alert("❌ Falta un elemento del visor. Revisa los ID del HTML.");
    return;
  }

  if (menuPrincipal) {
    menuPrincipal.style.display = "none";
  }

  if (sidebarMapas) {
    sidebarMapas.style.display = "block";
  }

  mostrarCopilotLateral();

  inicio.style.display = "none";
  modulo.style.display = "block";

  tituloModulo.innerText = titulo;
  descripcionModulo.innerText = descripcion;

  dashboardFrame.src = "";
  dashboardFrame.style.display = "none";

  mapaFrame.src = mapaUrl;
  mapaFrame.style.display = "block";

  if (dashboardUrl) {
    dashboardFrame.src = dashboardUrl;
    btnDashboard.style.display = "inline-flex";
  } else {
    btnDashboard.style.display = "none";
  }

  btnMapa.style.display = "none";

  notificarCopilot(
    titulo,
    descripcion,
    mapaUrl,
    dashboardUrl,
    "mapa"
  );
}


// =====================================================
// 📊 CAMBIAR A DASHBOARD
// =====================================================

function verDashboard() {

  const mapaFrame = document.getElementById("mapaFrame");
  const dashboardFrame = document.getElementById("dashboardFrame");
  const btnDashboard = document.getElementById("btnDashboard");
  const btnMapa = document.getElementById("btnMapa");

  if (
    !mapaFrame ||
    !dashboardFrame ||
    !btnDashboard ||
    !btnMapa
  ) {
    console.warn("⚠️ No se encontraron elementos para cambiar a dashboard.");
    return;
  }

  mapaFrame.style.display = "none";
  dashboardFrame.style.display = "block";

  btnDashboard.style.display = "none";
  btnMapa.style.display = "inline-flex";

  if (typeof actualizarCopilotContexto === "function") {
    actualizarCopilotContexto({
      tipoVista: "dashboard"
    });
  }
}


// =====================================================
// 🗺️ VOLVER AL MAPA
// =====================================================

function verMapa() {

  const mapaFrame = document.getElementById("mapaFrame");
  const dashboardFrame = document.getElementById("dashboardFrame");
  const btnDashboard = document.getElementById("btnDashboard");
  const btnMapa = document.getElementById("btnMapa");

  if (
    !mapaFrame ||
    !dashboardFrame ||
    !btnDashboard ||
    !btnMapa
  ) {
    console.warn("⚠️ No se encontraron elementos para volver al mapa.");
    return;
  }

  mapaFrame.style.display = "block";
  dashboardFrame.style.display = "none";

  btnDashboard.style.display = "inline-flex";
  btnMapa.style.display = "none";

  if (typeof actualizarCopilotContexto === "function") {
    actualizarCopilotContexto({
      tipoVista: "mapa"
    });
  }
}


// =====================================================
// 📊 ABRIR SOLO DASHBOARD
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

  const tituloModulo = document.getElementById("tituloModulo");
  const descripcionModulo = document.getElementById("descripcionModulo");
  const btnDashboard = document.getElementById("btnDashboard");
  const btnMapa = document.getElementById("btnMapa");

  if (
    !inicio ||
    !modulo ||
    !tituloModulo ||
    !descripcionModulo ||
    !mapaFrame ||
    !dashboardFrame ||
    !btnDashboard ||
    !btnMapa
  ) {
    alert("❌ Falta un elemento del visor. Revisa los ID del HTML.");
    return;
  }

  if (menuPrincipal) {
    menuPrincipal.style.display = "none";
  }

  if (mostrarCopilot) {
    mostrarCopilotLateral();
  } else {
    ocultarCopilotLateral();
  }

  inicio.style.display = "none";
  modulo.style.display = "block";

  tituloModulo.innerText = titulo;
  descripcionModulo.innerText = descripcion;

  mapaFrame.src = "";
  mapaFrame.style.display = "none";

  dashboardFrame.src = dashboardUrl;
  dashboardFrame.style.display = "block";

  btnDashboard.style.display = "none";
  btnMapa.style.display = "none";

  notificarCopilot(
    titulo,
    descripcion,
    null,
    dashboardUrl,
    "dashboard"
  );
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

  mostrarCopilotLateral();

  if (typeof actualizarCopilotContexto === "function") {
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

  const visor = document.getElementById("modulo");

  if (!visor) {
    return;
  }

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    visor.requestFullscreen();
  }
}


// =====================================================
// 🚀 ESTADO INICIAL
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  const {
    menuPrincipal,
    sidebarMapas,
    inicio,
    modulo
  } = obtenerElementosPrincipales();

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

  ocultarCopilotLateral();

  console.log("✅ TERRI+ iniciado en el menú principal.");
  
  /* ==========================================================
   VOLVER AL MENÚ PRINCIPAL
========================================================== */

function volverMenuPrincipalDesdeIA(){

    // Ocultar visor
    document.getElementById("modulo").style.display = "none";

    // Ocultar menú lateral
    document.getElementById("sidebarMapas").style.display = "none";

    // Mostrar menú principal
    document.getElementById("menuPrincipal").style.display = "flex";

    // Limpiar iframes
    document.getElementById("mapaFrame").src = "";
    document.getElementById("dashboardFrame").src = "";

}
});
