// ==========================================================
// LOGIN TERRI+
// ==========================================================

const PASSWORD_VALIDO = "Sesquile_2026*";


// ==========================================================
// INICIAR PÁGINA
// ==========================================================

window.addEventListener("DOMContentLoaded", function () {

    mostrarLogin();

    // Permitir ingresar con Enter
    document.getElementById("password").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            iniciarSesion();
        }
    });

});


// ==========================================================
// VALIDAR CONTRASEÑA
// ==========================================================

function iniciarSesion() {

    const password = document.getElementById("password").value.trim();
    const error = document.getElementById("loginError");

    if (password === PASSWORD_VALIDO) {

        error.textContent = "";
        mostrarAplicacion();

    } else {

        error.textContent = "Contraseña incorrecta.";
        document.getElementById("password").value = "";
        document.getElementById("password").focus();

    }

}


// ==========================================================
// MOSTRAR PLATAFORMA
// ==========================================================

function mostrarAplicacion() {

    document.getElementById("login").style.display = "none";
    document.querySelector(".header").style.display = "flex";
    document.querySelector(".app").style.display = "flex";

}


// ==========================================================
// MOSTRAR LOGIN
// ==========================================================

function mostrarLogin() {

    document.getElementById("login").style.display = "flex";
    document.querySelector(".header").style.display = "none";
    document.querySelector(".app").style.display = "none";

    document.getElementById("password").focus();

}


// ==========================================================
// CERRAR SESIÓN
// ==========================================================

function cerrarSesion() {

    document.getElementById("password").value = "";
    document.getElementById("loginError").textContent = "";

    mostrarLogin();

}
