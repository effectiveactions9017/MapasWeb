/* ==========================================================
   TERRI+ APP
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("=======================================");
    console.log("🚀 TERRI+ IA Territorial iniciando...");
    console.log("=======================================");

    inicializarMapa();

    // ----------------------------------------
    // Verificar API
    // ----------------------------------------

    const apiDisponible = await verificarAPI();

    const estado = document.getElementById("apiStatus");
    const texto = document.getElementById("apiStatusText");

    if(apiDisponible){

        estado.style.background = "#34c759";
        texto.textContent = "API conectada";

    }else{

        estado.style.background = "#ff3b30";
        texto.textContent = "API no disponible";

    }

    // ----------------------------------------
    // Botón Analizar
    // ----------------------------------------

    document
        .getElementById("btnEnviar")
        .addEventListener("click", enviarPregunta);

    // ----------------------------------------
    // Enter para enviar
    // ----------------------------------------

    document
        .getElementById("preguntaInput")
        .addEventListener("keydown", function(e){

            if(e.key==="Enter"){

                enviarPregunta();

            }

        });

    // ----------------------------------------
    // Preguntas sugeridas
    // ----------------------------------------

    document
        .querySelectorAll(".pregunta-btn")
        .forEach(boton=>{

            boton.addEventListener("click",()=>{

                document.getElementById("preguntaInput").value =
                    boton.dataset.pregunta;

            });

        });

    // ----------------------------------------
    // Limpiar chat
    // ----------------------------------------

    document
        .getElementById("btnLimpiarChat")
        .addEventListener("click",()=>{

            document.getElementById("chatBox").innerHTML = "";

        });

    // ----------------------------------------
    // Limpiar mapa
    // ----------------------------------------

    document
        .getElementById("btnLimpiarMapa")
        .addEventListener("click", () => {

            limpiarMapa();

        });

    // ----------------------------------------
    // Zoom resultado
    // ----------------------------------------

    document
        .getElementById("btnZoomResultado")
        .addEventListener("click", () => {

            zoomResultado();

        });

});