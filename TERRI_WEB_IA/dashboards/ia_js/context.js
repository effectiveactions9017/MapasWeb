/* ==========================================================
   TERRI+ CONTEXT MANAGER
========================================================== */

let TERRI_CONTEXT = {
    modulo: "ia_laboratorio",
    nombreModulo: "IA Territorial",
    municipio: "Sesquilé",
    descripcion: "Laboratorio de IA territorial conectado a PostGIS.",

    mapa: {
        activo: true,
        tipo: "maplibre",
        capas: [
            {
                id: "predios",
                nombre: "Predios",
                tipo: "poligono",
                visible: true,
                tabla: "predios_sesquile",
                geometria: "geom"
            }
        ]
    },

    dashboard: {
        activo: false,
        id: null,
        nombre: null
    },

    permisos: {
        puedeConsultarBD: true,
        puedeControlarMapa: true,
        puedeAbrirDashboard: false,
        puedeExportar: false
    }
};


function obtenerContextoTerri() {
    return TERRI_CONTEXT;
}


function actualizarContextoTerri(nuevoContexto) {
    TERRI_CONTEXT = {
        ...TERRI_CONTEXT,
        ...nuevoContexto
    };

    console.log("🧠 Contexto TERRI actualizado:", TERRI_CONTEXT);
}