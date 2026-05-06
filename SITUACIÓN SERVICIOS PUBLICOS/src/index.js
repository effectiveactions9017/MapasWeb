// =====================================================
// ✅ ACTUALIZADO Y CORREGIDO
// ✅ Corrige geometrías dañadas
// ✅ Fuerza coordenadas desde longitud_geo / latitud_geo
// ✅ Hace visibles los puntos nuevamente
// =====================================================

// =====================================================
// ✅ HELPERS NUEVOS
// =====================================================
function numCoord(v) {
  if (v === null || v === undefined || v === "") return NaN;

  return Number(
    String(v)
      .replace(",", ".")
      .trim()
  );
}

// =====================================================
// ✅ SERVICIOS
// =====================================================
function addServiciosPublicos() {

  const FILE = "Servicios_publicos_puntos_nuevo.geojson";

  fetch(`../src/data/${FILE}?v=${Date.now()}`)

    .then((r) => {

      if (!r.ok) {
        throw new Error(`No se pudo cargar ${FILE}`);
      }

      return r.json();
    })

    .then((data) => {

      // =================================================
      // ✅ LIMPIAR GEOMETRÍAS
      // =================================================

      const limpio = {

        type: "FeatureCollection",

        features: data.features

          .map((f) => {

            const p = f.properties || {};

            // =============================================
            // PRIORIDAD:
            // 1. longitud_geo / latitud_geo
            // 2. x / y
            // 3. geometry original
            // =============================================

            let lng =
              numCoord(p.longitud_geo);

            let lat =
              numCoord(p.latitud_geo);

            // fallback x/y
            if (isNaN(lng)) lng = numCoord(p.x);
            if (isNaN(lat)) lat = numCoord(p.y);

            // fallback geometry
            if (
              (isNaN(lng) || isNaN(lat)) &&
              f.geometry &&
              Array.isArray(f.geometry.coordinates)
            ) {

              lng = numCoord(f.geometry.coordinates[0]);
              lat = numCoord(f.geometry.coordinates[1]);
            }

            // =============================================
            // VALIDAR
            // =============================================

            if (
              isNaN(lng) ||
              isNaN(lat)
            ) {
              return null;
            }

            // =============================================
            // RANGO COLOMBIA
            // =============================================

            if (
              lng < -75 ||
              lng > -72 ||
              lat < 4 ||
              lat > 6
            ) {
              return null;
            }

            // =============================================
            // FEATURE LIMPIO
            // =============================================

            return {

              type: "Feature",

              properties: p,

              geometry: {
                type: "Point",

                coordinates: [
                  lng,
                  lat
                ]
              }
            };
          })

          .filter(Boolean)
      };

      // =================================================
      // DEBUG
      // =================================================

      console.log("✅ Features originales:",
        data.features?.length
      );

      console.log("✅ Features válidos:",
        limpio.features?.length
      );

      console.log(
        "📍 Primera coordenada:",
        limpio.features?.[0]?.geometry?.coordinates
      );

      // =================================================
      // GUARDAR
      // =================================================

      SERVICIOS_DATA = limpio;

      // =================================================
      // SOURCE
      // =================================================

      if (map.getSource("servicios_publicos")) {

        map.getSource("servicios_publicos")
          .setData(limpio);

      } else {

        map.addSource("servicios_publicos", {

          type: "geojson",

          data: limpio
        });
      }

      // =================================================
      // CAPAS
      // =================================================

      ensureServiciosFilterLayers();

      wireServiciosLayerInteractions();

      wireServiciosToggleList();

      wireFilterPanelToggle();

      // =================================================
      // FORZAR VISIBILIDAD
      // =================================================

      if (map.getLayer("L_BASE")) {

        map.setLayoutProperty(
          "L_BASE",
          "visibility",
          "visible"
        );

        map.setPaintProperty(
          "L_BASE",
          "circle-radius",
          9
        );

        map.setPaintProperty(
          "L_BASE",
          "circle-color",
          "#ff0000"
        );

        map.setPaintProperty(
          "L_BASE",
          "circle-opacity",
          1
        );
      }

      // =================================================
      // ORDEN
      // =================================================

      ordenarCapas();

      // =================================================
      // ZOOM TEST
      // =================================================

      if (limpio.features.length) {

        const c =
          limpio.features[0].geometry.coordinates;

        map.flyTo({
          center: c,
          zoom: 15
        });
      }
    })

    .catch((err) => {

      console.error(
        "❌ Error cargando servicios públicos:",
        err
      );
    });
}
