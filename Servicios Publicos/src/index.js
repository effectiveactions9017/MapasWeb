// =====================================================
// ✅ VISOR SOLO CAPA ENERGIA.geojson
// =====================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9yZ2VwYXRpbm8iLCJhIjoiY2tnc2R0c20zMWVvdTJ5bXRpZ3Z4bDN1dCJ9.2LgsqgR7lXR6YFH2IaNc-w";

// =====================================================
// MAPA
// =====================================================

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-v9",
  center: [-73.79724, 5.04463],
  zoom: 15,
  antialias: true,
});

map.addControl(new mapboxgl.NavigationControl());

// =====================================================
// POPUP
// =====================================================

const popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  className: "custom-popup",
});

// =====================================================
// HELPERS
// =====================================================

function safeOff(evt, layer) {
  try {
    map.off(evt, layer);
  } catch (e) {}
}

function getPointLngLat(feature) {
  const c = feature?.geometry?.coordinates;

  if (Array.isArray(c) && c.length >= 2) {
    return [Number(c[0]), Number(c[1])];
  }

  return [-73.79724, 5.04463];
}

function streetViewUrl([lng, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

function valTxt(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  return v;
}

// =====================================================
// POPUP ENERGIA
// SOLO MUESTRA: tiene_luz
// =====================================================

function popupHTMLEnergia(props, lngLat) {

  props = props || {};

  return `
    <div style="font-weight:700; margin-bottom:6px;">
      Red de Energía
    </div>

    <strong>Tiene luz:</strong> ${valTxt(props.tiene_luz)}<br>

    <div style="margin-top:10px;">
      <a href="${streetViewUrl(lngLat)}"
         target="_blank"
         style="
            display:inline-block;
            padding:6px 10px;
            border-radius:6px;
            background:#facc15;
            color:#000;
            font-weight:700;
            font-size:12px;
            text-decoration:none;
         ">
        📷 Street View
      </a>
    </div>

    <br>
    <a style="font-size:9px;">
      &#9400 EffectiveActions
    </a>
  `;
}

// =====================================================
// CAPA ENERGIA
// =====================================================

function addEnergiaLayer() {

  fetch("../src/data/ENERGIA.geojson")

    .then((r) => r.json())

    .then((data) => {

      // SOURCE
      if (map.getSource("energia")) {

        map.getSource("energia").setData(data);

      } else {

        map.addSource("energia", {
          type: "geojson",
          data,
        });
      }

      // LAYER
      if (!map.getLayer("energia_layer")) {

        map.addLayer({
          id: "energia_layer",
          type: "circle",
          source: "energia",

          paint: {

            "circle-radius": 6,

            "circle-color": "#facc15",

            "circle-stroke-color": "#ffffff",

            "circle-stroke-width": 1.5,

            "circle-opacity": 0.95,
          },
        });
      }

      // EVENTOS
      safeOff("mouseenter", "energia_layer");
      safeOff("mouseleave", "energia_layer");
      safeOff("click", "energia_layer");

      map.on("mouseenter", "energia_layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "energia_layer", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "energia_layer", (e) => {

        const f = e.features && e.features[0];

        if (!f) return;

        const lngLat = getPointLngLat(f);

        popup
          .setLngLat(lngLat)
          .setHTML(
            popupHTMLEnergia(
              f.properties || {},
              lngLat
            )
          )
          .addTo(map);
      });
    })

    .catch((err) => {
      console.error("Error cargando ENERGIA.geojson:", err);
    });
}

// =====================================================
// CARGA
// =====================================================

map.on("style.load", () => {

  addEnergiaLayer();

});
