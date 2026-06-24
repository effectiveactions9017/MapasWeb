// =====================================================
// VARIABLES GLOBALES
// =====================================================

let dashboardActual = null;


// =====================================================
// NORMALIZAR RUTAS EN GITHUB PAGES
// =====================================================

function normalizarRutaDashboard(ruta) {

  if (!ruta) return null;

  if (ruta.startsWith("http")) {
    return ruta;
  }

  if (ruta.startsWith("./")) {
    return ruta;
  }

  return "./" + ruta;

}


// =====================================================
// ABRIR MÓDULO MAPA + DASHBOARD OPCIONAL
// =====================================================

function abrirModulo(titulo, descripcion, mapaUrl, dashboardUrl = null) {

  const inicio = document.getElementById("inicio");
  const modulo = document.getElementById("modulo");

  const tituloModulo = document.getElementById("tituloModulo");
  const descripcionModulo = document.getElementById("descripcionModulo");

  const mapaFrame = document.getElementById("mapaFrame");
  const dashboardFrame = document.getElementById("dashboardFrame");

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
  ){
    alert("❌ Falta un elemento del visor. Revisa los ID del HTML.");
    return;
  }

  inicio.style.display = "none";
  modulo.style.display = "block";

  tituloModulo.innerText = titulo;
  descripcionModulo.innerText = descripcion;

  dashboardActual = normalizarRutaDashboard(dashboardUrl);

  dashboardFrame.src = "";
  dashboardFrame.style.display = "none";

  mapaFrame.src = mapaUrl;
  mapaFrame.style.display = "block";

  if (dashboardActual) {
    btnDashboard.style.display = "inline-flex";
  } else {
    btnDashboard.style.display = "none";
  }

  btnMapa.style.display = "none";
}


// =====================================================
// CAMBIAR A DASHBOARD
// =====================================================

function verDashboard(){

  const mapaFrame = document.getElementById("mapaFrame");
  const dashboardFrame = document.getElementById("dashboardFrame");
  const btnDashboard = document.getElementById("btnDashboard");
  const btnMapa = document.getElementById("btnMapa");

  if (!dashboardActual) {
    alert("Este módulo no tiene dashboard asociado.");
    return;
  }

  dashboardFrame.src = dashboardActual;

  mapaFrame.style.display = "none";
  dashboardFrame.style.display = "block";

  btnDashboard.style.display = "none";
  btnMapa.style.display = "inline-flex";
}


// =====================================================
// VOLVER AL MAPA
// =====================================================

function verMapa(){

  const mapaFrame = document.getElementById("mapaFrame");
  const dashboardFrame = document.getElementById("dashboardFrame");
  const btnDashboard = document.getElementById("btnDashboard");
  const btnMapa = document.getElementById("btnMapa");

  mapaFrame.style.display = "block";
  dashboardFrame.style.display = "none";

  btnDashboard.style.display = "inline-flex";
  btnMapa.style.display = "none";
}


// =====================================================
// ABRIR SOLO DASHBOARD
// =====================================================

function abrirDashboardSolo(titulo, descripcion, dashboardUrl){

  const inicio = document.getElementById("inicio");
  const modulo = document.getElementById("modulo");

  const tituloModulo = document.getElementById("tituloModulo");
  const descripcionModulo = document.getElementById("descripcionModulo");

  const mapaFrame = document.getElementById("mapaFrame");
  const dashboardFrame = document.getElementById("dashboardFrame");

  const btnDashboard = document.getElementById("btnDashboard");
  const btnMapa = document.getElementById("btnMapa");

  inicio.style.display = "none";
  modulo.style.display = "block";

  tituloModulo.innerText = titulo;
  descripcionModulo.innerText = descripcion;

  mapaFrame.src = "";
  mapaFrame.style.display = "none";

  dashboardActual = normalizarRutaDashboard(dashboardUrl);

  dashboardFrame.src = dashboardActual;
  dashboardFrame.style.display = "block";

  btnDashboard.style.display = "none";
  btnMapa.style.display = "none";
}


// =====================================================
// REGRESAR AL INICIO
// =====================================================

function limpiarVisor(){

  document.getElementById("inicio").style.display = "flex";
  document.getElementById("modulo").style.display = "none";

  document.getElementById("mapaFrame").src = "";
  document.getElementById("dashboardFrame").src = "";

  dashboardActual = null;
}


// =====================================================
// PANTALLA COMPLETA
// =====================================================

function pantallaCompleta(){

 const visor = document.getElementById("modulo");

 if (!visor) return;

 if (document.fullscreenElement){
    document.exitFullscreen();
 } else {
    visor.requestFullscreen();
 }

}
