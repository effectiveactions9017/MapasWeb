/* ==========================================================
   TERRI+ MAPAS BASE
   Claro + Satelital híbrido + OpenStreetMap
========================================================== */


/* ==========================================================
   IDENTIFICADORES DE FUENTES Y CAPAS
========================================================== */

const TERRI_BASEMAPS = {

    satelite: {
        sourceId: "terri-basemap-satelite-source",
        layerId: "terri-basemap-satelite-layer"
    },

    etiquetas: {
        sourceId: "terri-basemap-etiquetas-source",
        layerId: "terri-basemap-etiquetas-layer"
    },

    osm: {
        sourceId: "terri-basemap-osm-source",
        layerId: "terri-basemap-osm-layer"
    }

};


/* ==========================================================
   MAPA BASE ACTIVO
========================================================== */

let terriMapaBaseActivo = "claro";
let terriMapasBaseCargados = false;


/* ==========================================================
   AGREGAR FUENTE SI NO EXISTE
========================================================== */

function agregarFuenteMapaBaseTerri(
    sourceId,
    configuracion
) {

    if (terriMap.getSource(sourceId)) {
        return;
    }

    terriMap.addSource(
        sourceId,
        configuracion
    );

}


/* ==========================================================
   AGREGAR CAPA SI NO EXISTE
========================================================== */

function agregarCapaMapaBaseTerri(
    configuracion
) {

    if (terriMap.getLayer(configuracion.id)) {
        return;
    }

    terriMap.addLayer(configuracion);

}


/* ==========================================================
   CARGAR MAPAS BASE
========================================================== */

function cargarMapasBaseTerri() {

    if (!terriMap || terriMapasBaseCargados) {
        return;
    }


    /* ======================================================
       SATELITAL ESRI
    ====================================================== */

    agregarFuenteMapaBaseTerri(
        TERRI_BASEMAPS.satelite.sourceId,
        {
            type: "raster",

            tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            ],

            tileSize: 256,

            maxzoom: 19,

            attribution:
                "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics and the GIS User Community"
        }
    );


    agregarCapaMapaBaseTerri({
        id: TERRI_BASEMAPS.satelite.layerId,

        type: "raster",

        source: TERRI_BASEMAPS.satelite.sourceId,

        layout: {
            visibility: "none"
        },

        paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 0
        }
    });


    /* ======================================================
       ETIQUETAS PARA SATELITAL HÍBRIDO
    ====================================================== */

    agregarFuenteMapaBaseTerri(
        TERRI_BASEMAPS.etiquetas.sourceId,
        {
            type: "raster",

            tiles: [
                "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            ],

            tileSize: 256,

            maxzoom: 19,

            attribution:
                "Boundaries and places &copy; Esri"
        }
    );


    agregarCapaMapaBaseTerri({
        id: TERRI_BASEMAPS.etiquetas.layerId,

        type: "raster",

        source: TERRI_BASEMAPS.etiquetas.sourceId,

        layout: {
            visibility: "none"
        },

        paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 0
        }
    });


    /* ======================================================
       OPENSTREETMAP
    ====================================================== */

    agregarFuenteMapaBaseTerri(
        TERRI_BASEMAPS.osm.sourceId,
        {
            type: "raster",

            tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],

            tileSize: 256,

            minzoom: 0,

            maxzoom: 19,

            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
        }
    );


    agregarCapaMapaBaseTerri({
        id: TERRI_BASEMAPS.osm.layerId,

        type: "raster",

        source: TERRI_BASEMAPS.osm.sourceId,

        layout: {
            visibility: "none"
        },

        paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 0
        }
    });


    terriMapasBaseCargados = true;

    cambiarMapaBaseTerri(
        terriMapaBaseActivo
    );

    console.log(
        "🗺️ Mapas base TERRI+ cargados correctamente."
    );

}


/* ==========================================================
   CAMBIAR VISIBILIDAD
========================================================== */

function cambiarVisibilidadMapaBaseTerri(
    layerId,
    visible
) {

    if (!terriMap || !terriMap.getLayer(layerId)) {
        return;
    }

    terriMap.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none"
    );

}


/* ==========================================================
   CAMBIAR MAPA BASE
========================================================== */

function cambiarMapaBaseTerri(tipoMapa) {

    const mapasPermitidos = [
        "claro",
        "satelite",
        "osm"
    ];

    terriMapaBaseActivo =
        mapasPermitidos.includes(tipoMapa)
            ? tipoMapa
            : "claro";


    if (!terriMap || !terriMapasBaseCargados) {

        actualizarMenuMapaBaseTerri();

        return;

    }


    /* Ocultar todos los mapas raster */

    cambiarVisibilidadMapaBaseTerri(
        TERRI_BASEMAPS.satelite.layerId,
        false
    );

    cambiarVisibilidadMapaBaseTerri(
        TERRI_BASEMAPS.etiquetas.layerId,
        false
    );

    cambiarVisibilidadMapaBaseTerri(
        TERRI_BASEMAPS.osm.layerId,
        false
    );


    /* Mapa claro */

    if (terriMapaBaseActivo === "claro") {

        console.log(
            "🗺️ Mapa base activo: mapa claro."
        );

    }


    /* Satelital híbrido */

    if (terriMapaBaseActivo === "satelite") {

        cambiarVisibilidadMapaBaseTerri(
            TERRI_BASEMAPS.satelite.layerId,
            true
        );

        cambiarVisibilidadMapaBaseTerri(
            TERRI_BASEMAPS.etiquetas.layerId,
            true
        );

        console.log(
            "🛰️ Mapa base activo: satelital híbrido."
        );

    }


    /* OpenStreetMap */

    if (terriMapaBaseActivo === "osm") {

        cambiarVisibilidadMapaBaseTerri(
            TERRI_BASEMAPS.osm.layerId,
            true
        );

        console.log(
            "🌍 Mapa base activo: OpenStreetMap."
        );

    }


    actualizarMenuMapaBaseTerri();

}


/* ==========================================================
   ACTUALIZAR ESTADO VISUAL DEL MENÚ
========================================================== */

function actualizarMenuMapaBaseTerri() {

    const botones =
        document.querySelectorAll(
            "#menuMapaBase [data-map]"
        );


    botones.forEach(function(boton) {

        const tipoMapa =
            boton.dataset.map;

        const estaActivo =
            tipoMapa === terriMapaBaseActivo;


        boton.classList.toggle(
            "activo",
            estaActivo
        );


        const iconoActivo =
            boton.querySelector(
                ".mapa-base-check"
            );


        if (iconoActivo) {

            iconoActivo.textContent =
                estaActivo ? "✓" : "";

        }

    });

}


/* ==========================================================
   CERRAR MENÚ
========================================================== */

function cerrarMenuMapaBaseTerri() {

    const menu =
        document.getElementById(
            "menuMapaBase"
        );

    const boton =
        document.getElementById(
            "btnMapaBase"
        );


    if (menu) {

        menu.classList.remove(
            "abierto"
        );

    }


    if (boton) {

        boton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


/* ==========================================================
   CONFIGURAR MENÚ DESPLEGABLE
========================================================== */

function configurarMenuMapaBaseTerri() {

    const botonMapaBase =
        document.getElementById(
            "btnMapaBase"
        );

    const menuMapaBase =
        document.getElementById(
            "menuMapaBase"
        );


    if (!botonMapaBase || !menuMapaBase) {

        console.warn(
            "⚠️ No se encontró el menú de mapas base."
        );

        return;

    }


    botonMapaBase.setAttribute(
        "aria-haspopup",
        "true"
    );

    botonMapaBase.setAttribute(
        "aria-expanded",
        "false"
    );


    /* Abrir o cerrar el menú */

    botonMapaBase.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            const seAbrira =
                !menuMapaBase.classList.contains(
                    "abierto"
                );


            menuMapaBase.classList.toggle(
                "abierto",
                seAbrira
            );


            botonMapaBase.setAttribute(
                "aria-expanded",
                String(seAbrira)
            );

        }
    );


    /* Seleccionar mapa base */

    menuMapaBase
        .querySelectorAll("[data-map]")
        .forEach(function(botonOpcion) {

            botonOpcion.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    const tipoMapa =
                        botonOpcion.dataset.map;


                    cambiarMapaBaseTerri(
                        tipoMapa
                    );


                    cerrarMenuMapaBaseTerri();

                }
            );

        });


    /* Cerrar al hacer clic fuera */

    document.addEventListener(
        "click",
        function(event) {

            const clicDentro =
                botonMapaBase.contains(
                    event.target
                ) ||
                menuMapaBase.contains(
                    event.target
                );


            if (!clicDentro) {

                cerrarMenuMapaBaseTerri();

            }

        }
    );


    /* Cerrar con la tecla Escape */

    document.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Escape") {

                cerrarMenuMapaBaseTerri();

                botonMapaBase.focus();

            }

        }
    );


    actualizarMenuMapaBaseTerri();

}


/* ==========================================================
   INTEGRAR CON LA INICIALIZACIÓN ACTUAL DEL MAPA
========================================================== */

const inicializarMapaOriginalTerri =
    inicializarMapa;


inicializarMapa = function() {

    inicializarMapaOriginalTerri();


    if (!terriMap) {
        return;
    }


    if (terriMap.loaded()) {

        cargarMapasBaseTerri();

    } else {

        terriMap.once(
            "load",
            function() {

                cargarMapasBaseTerri();

            }
        );

    }

};


/* ==========================================================
   INICIALIZAR MENÚ
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        configurarMenuMapaBaseTerri();

    }
);