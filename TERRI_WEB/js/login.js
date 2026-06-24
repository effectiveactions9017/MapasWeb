// ==========================
// LOGIN TERRI+
// ==========================

const USUARIO_VALIDO = "admin";
const PASSWORD_VALIDO = "terri123";


// Siempre iniciar mostrando login

window.onload = function () {

  localStorage.removeItem("terri_login");

  mostrarLogin();

};


// Validar usuario

function iniciarSesion() {

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("loginError");


  if (usuario === USUARIO_VALIDO && password === PASSWORD_VALIDO) {

    error.innerHTML = "";

    mostrarAplicacion();

  } else {

    error.innerHTML = "Usuario o contraseña incorrectos";

  }

}



// Mostrar plataforma

function mostrarAplicacion() {

  document.getElementById("login").style.display = "none";

  document.querySelector(".header").style.display = "flex";

  document.querySelector(".app").style.display = "flex";

}



// Mostrar login

function mostrarLogin() {

  document.getElementById("login").style.display = "flex";

  document.querySelector(".header").style.display = "none";

  document.querySelector(".app").style.display = "none";

}



// Cerrar sesión

function cerrarSesion() {

  document.getElementById("usuario").value = "";

  document.getElementById("password").value = "";

  mostrarLogin();

}