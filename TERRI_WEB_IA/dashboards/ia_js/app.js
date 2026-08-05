/* ==========================================================
   TERRI+ APP
========================================================== */


/* ==========================================================
   REAJUSTAR MAPA AL TAMAÑO DE LA VENTANA
========================================================== */

/**
 * Obliga a MapLibre a recalcular el tamaño del mapa.
 *
 * Se utiliza cuando:
 * - cambia el tamaño del navegador;
 * - cambia el tamaño del iframe;
 * - se entra o sale de pantalla completa;
 * - termina de cargar la interfaz.
 */
function reajustarMapaTerri() {

    if (
        typeof terriMap === "undefined" ||
        !terriMap
    ) {
        return;
    }

    requestAnimationFrame(() => {

        terriMap.resize();

    });

    setTimeout(() => {

        if (terriMap) {
            terriMap.resize();
        }

    }, 150);

}


/* ==========================================================
   INICIALIZAR APLICACIÓN
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("=======================================");
    console.log("🚀 TERRI+ IA Territorial iniciando...");
    console.log("=======================================");


    /* ======================================================
       INICIALIZAR MAPA
    ====================================================== */

    inicializarMapa();

    reajustarMapaTerri();


    /* ======================================================
       VERIFICAR API
    ====================================================== */

    const apiDisponible =
        await verificarAPI();

    const estado =
        document.getElementById("apiStatus");

    const texto =
        document.getElementById("apiStatusText");


    if (estado && texto) {

        if (apiDisponible) {

            estado.style.background =
                "#34c759";

            texto.textContent =
                "API conectada";

        } else {

            estado.style.background =
                "#ff3b30";

            texto.textContent =
                "API no disponible";

        }

    }


    /* ======================================================
       BOTÓN ANALIZAR
    ====================================================== */

    const botonEnviar =
        document.getElementById("btnEnviar");

    if (botonEnviar) {

        botonEnviar.addEventListener(
            "click",
            enviarPregunta
        );

    }


    /* ======================================================
       ENTER PARA ENVIAR
    ====================================================== */

    const preguntaInput =
        document.getElementById("preguntaInput");

    if (preguntaInput) {

        preguntaInput.addEventListener(
            "keydown",
            function(evento) {

                if (evento.key === "Enter") {

                    evento.preventDefault();

                    enviarPregunta();

                }

            }
        );

    }


    /* ======================================================
       PREGUNTAS SUGERIDAS
    ====================================================== */

    document
        .querySelectorAll(".pregunta-btn")
        .forEach(boton => {

            boton.addEventListener(
                "click",
                () => {

                    const input =
                        document.getElementById(
                            "preguntaInput"
                        );

                    if (!input) {
                        return;
                    }

                    input.value =
                        boton.dataset.pregunta || "";

                    input.focus();

                }
            );

        });


    /* ======================================================
       LIMPIAR CHAT
    ====================================================== */

    const botonLimpiarChat =
        document.getElementById(
            "btnLimpiarChat"
        );

    if (botonLimpiarChat) {

        botonLimpiarChat.addEventListener(
            "click",
            () => {

                const chat =
                    document.getElementById(
                        "chatBox"
                    );

                if (chat) {
                    chat.innerHTML = "";
                }

            }
        );

    }


    /* ======================================================
       LIMPIAR MAPA
    ====================================================== */

    const botonLimpiarMapa =
        document.getElementById(
            "btnLimpiarMapa"
        );

    if (botonLimpiarMapa) {

        botonLimpiarMapa.addEventListener(
            "click",
            () => {

                limpiarMapa();

                reajustarMapaTerri();

            }
        );

    }


    /* ======================================================
       ZOOM AL RESULTADO
    ====================================================== */

    const botonZoomResultado =
        document.getElementById(
            "btnZoomResultado"
        );

    if (botonZoomResultado) {

        botonZoomResultado.addEventListener(
            "click",
            () => {

                zoomResultado();

            }
        );

    }


    /* ======================================================
       AJUSTE FINAL DE LA INTERFAZ
    ====================================================== */

    setTimeout(
        reajustarMapaTerri,
        300
    );

});


/* ==========================================================
   CAMBIO DE TAMAÑO DE VENTANA
========================================================== */

window.addEventListener(
    "resize",
    reajustarMapaTerri
);


/* ==========================================================
   ENTRAR O SALIR DE PANTALLA COMPLETA
========================================================== */

document.addEventListener(
    "fullscreenchange",
    reajustarMapaTerri
);

document.addEventListener(
    "webkitfullscreenchange",
    reajustarMapaTerri
);


/* ==========================================================
   CUANDO EL IFRAME VUELVE A SER VISIBLE
========================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (!document.hidden) {

            reajustarMapaTerri();

        }

    }
);


/* ==========================================================
   REAJUSTAR MAPA AL CAMBIAR EL TAMAÑO DEL CONTENEDOR
========================================================== */

function actualizarTamanoMapa() {

    setTimeout(() => {

        if (
            typeof terriMap !== "undefined" &&
            terriMap
        ) {

            terriMap.resize();

        }

    }, 100);

}


/* ==========================================================
   CAMBIO DE TAMAÑO DE LA VENTANA
========================================================== */

window.addEventListener(
    "resize",
    actualizarTamanoMapa
);


/* ==========================================================
   ENTRAR O SALIR DE PANTALLA COMPLETA
========================================================== */

document.addEventListener(
    "fullscreenchange",
    actualizarTamanoMapa
);

document.addEventListener(
    "webkitfullscreenchange",
    actualizarTamanoMapa
);


/* ==========================================================
   OBSERVAR CAMBIOS DE TAMAÑO DEL CONTENEDOR DEL MAPA
========================================================== */

const contenedorMapa =
    document.getElementById("map");

if (
    contenedorMapa &&
    typeof ResizeObserver !== "undefined"
) {

    const observadorMapa =
        new ResizeObserver(() => {

            actualizarTamanoMapa();

        });

    observadorMapa.observe(
        contenedorMapa
    );

}
