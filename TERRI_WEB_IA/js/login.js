// =====================================================
// 🔐 LOGIN TERRI+
// =====================================================

const CLAVE_TERRI = "Sesquile_2026*";


// =====================================================
// 🔓 INICIAR SESIÓN
// =====================================================

function iniciarSesion() {

    const passwordInput =
        document.getElementById("password");

    const login =
        document.getElementById("login");

    const loginError =
        document.getElementById("loginError");


    // Verificar elementos
    if (!passwordInput || !login) {

        console.error(
            "❌ No se encontraron los elementos del login."
        );

        return;
    }


    // Obtener contraseña
    const password =
        passwordInput.value;


    // Limpiar mensaje anterior
    if (loginError) {
        loginError.textContent = "";
    }


    // =================================================
    // VALIDAR CONTRASEÑA
    // =================================================

    if (password === CLAVE_TERRI) {

        // Ocultar login
        login.style.display = "none";


        // Guardar sesión durante esta pestaña
        sessionStorage.setItem(
            "terriSesion",
            "activa"
        );


        // Limpiar contraseña
        passwordInput.value = "";


        console.log(
            "✅ Sesión TERRI+ iniciada."
        );

    } else {

        // Contraseña incorrecta
        if (loginError) {

            loginError.textContent =
                "Contraseña incorrecta.";

        }


        // Limpiar campo
        passwordInput.value = "";


        // Volver a enfocar
        passwordInput.focus();

    }

}


// =====================================================
// 🔒 CERRAR SESIÓN
// =====================================================

function cerrarSesion() {

    sessionStorage.removeItem(
        "terriSesion"
    );


    const login =
        document.getElementById("login");

    const passwordInput =
        document.getElementById("password");


    if (login) {
        login.style.display = "flex";
    }


    if (passwordInput) {

        passwordInput.value = "";

        setTimeout(() => {
            passwordInput.focus();
        }, 100);

    }

}


// =====================================================
// 🚀 COMPROBAR SESIÓN AL CARGAR
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const login =
            document.getElementById("login");

        const passwordInput =
            document.getElementById("password");


        // Si ya inició sesión en esta pestaña
        if (
            sessionStorage.getItem("terriSesion") === "activa"
        ) {

            if (login) {
                login.style.display = "none";
            }

        } else {

            if (login) {
                login.style.display = "flex";
            }


            if (passwordInput) {

                setTimeout(() => {
                    passwordInput.focus();
                }, 100);

            }

        }

    }
);
