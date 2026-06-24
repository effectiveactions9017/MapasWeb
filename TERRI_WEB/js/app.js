// =====================================================
// 🗺️ ABRIR MÓDULO MAPA + DASHBOARD OPCIONAL
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


  // pantalla inicio fuera

  inicio.style.display = "none";
  modulo.style.display = "block";


  // textos

  tituloModulo.innerText = titulo;
  descripcionModulo.innerText = descripcion;


  // limpiar dashboard anterior

  dashboardFrame.src = "";
  dashboardFrame.style.display = "none";


  // cargar mapa

  mapaFrame.src = mapaUrl;
  mapaFrame.style.display = "block";


  // activar dashboard si existe

  if (dashboardUrl){

    dashboardFrame.src = dashboardUrl;

    btnDashboard.style.display = "inline-flex";

  }else{

    btnDashboard.style.display = "none";

  }


  btnMapa.style.display = "none";

}



// =====================================================
// 📊 CAMBIAR A DASHBOARD
// =====================================================

function verDashboard(){

  document.getElementById("mapaFrame").style.display="none";

  document.getElementById("dashboardFrame").style.display="block";

  document.getElementById("btnDashboard").style.display="none";

  document.getElementById("btnMapa").style.display="inline-flex";

}



// =====================================================
// 🗺️ VOLVER AL MAPA
// =====================================================

function verMapa(){

  document.getElementById("mapaFrame").style.display="block";

  document.getElementById("dashboardFrame").style.display="none";

  document.getElementById("btnDashboard").style.display="inline-flex";

  document.getElementById("btnMapa").style.display="none";

}



// =====================================================
// 📊 ABRIR SOLO DASHBOARD
// caracterización socioeconómica
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



  inicio.style.display="none";
  modulo.style.display="block";


  tituloModulo.innerText=titulo;
  descripcionModulo.innerText=descripcion;



  // eliminar cualquier mapa anterior

  mapaFrame.src="";
  mapaFrame.style.display="none";



  // abrir dashboard directamente

  dashboardFrame.src=dashboardUrl;
  dashboardFrame.style.display="block";



  // no hay cambio mapa/dashboard

  btnDashboard.style.display="none";
  btnMapa.style.display="none";


}



// =====================================================
// ⬅️ REGRESAR AL INICIO
// =====================================================

function limpiarVisor(){

  document.getElementById("inicio").style.display="flex";

  document.getElementById("modulo").style.display="none";


  document.getElementById("mapaFrame").src="";

  document.getElementById("dashboardFrame").src="";


}



// =====================================================
// ⛶ PANTALLA COMPLETA
// =====================================================

function pantallaCompleta(){

 const visor=document.getElementById("modulo");


 if(!visor)return;


 if(document.fullscreenElement){

    document.exitFullscreen();

 }else{

    visor.requestFullscreen();

 }

}