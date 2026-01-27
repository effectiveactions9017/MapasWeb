// Use own access token
mapboxgl.accessToken =
  'pk.eyJ1IjoiZWZmZWN0aXZlYWN0aW9uczkwMTciLCJhIjoiY21iOWY1eGtiMGQ2cjJqcG9xbTRjZnQxMiJ9.8p55iS2R45-p8lxTerDL9Q';

const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-73.79724, 5.04463],
  zoom: 14,
  pitch: 0,
  bearing: 0,
  container: 'map',
  antialias: true
});

let geojsonData = null;

let popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'custom-popup'
});

map.on('style.load', () => {
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
  )?.id;

  // =====================================================
  // ✅ 1) CARGAR EDIFICIOS (resultado_completo_final.geojson)
  // =====================================================
  fetch('../src/data/resultado_completo_final.geojson')
    .then((response) => response.json())
    .then((data) => {
      geojsonData = data;

      if (map.getSource('buildings')) {
        map.getSource('buildings').setData(geojsonData);
      } else {
        map.addSource('buildings', {
          type: 'geojson',
          data: geojsonData
        });
      }

      if (!map.getLayer('buildings')) {
        map.addLayer(
          {
            id: 'buildings',
            source: 'buildings',
            type: 'fill',
            minzoom: 12,
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'const_year'],
                1985, '#D53E4F',
                1990, '#F46D43',
                1995, '#FDAE61',
                2000, '#FEE08B',
                2005, '#FFFFBF',
                2010, '#E6F598',
                2015, '#ABDDA4',
                2020, '#66C2A5',
                2024, '#3288BD'
              ],
              'fill-opacity': 1
            }
            // ❌ OJO: NO pongas filter aquí, porque tú luego usas setFilter() con <=
          },
          labelLayerId // debajo de labels (si existe)
        );
      }

      // ✅ Popup SOLO en buildings (hover como lo tienes)
      try { map.off('mousemove', 'buildings'); } catch(e){}
      try { map.off('mouseenter', 'buildings'); } catch(e){}
      try { map.off('mouseleave', 'buildings'); } catch(e){}

      map.on('mousemove', 'buildings', (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;

        const year = feature.properties?.const_year ?? 'N/A';
        const area = feature.properties?.area_in_me;
        const areaRedondeada = (area !== null && area !== undefined) ? Math.round(Number(area)) : 'N/A';

        const popupContent = `
          <strong>Año:</strong> ${year}<br>
          <strong>Área:</strong> ${areaRedondeada} &#x33A1<br>
          <a style="font-size:9px;">&#9400 EffectiveActions</a>
        `;

        popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
      });

      map.on('mouseenter', 'buildings', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'buildings', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      // =====================================================
      // ✅ 2) AGREGAR LIMITES (SOLO CONTORNO, SIN RELLENO)
      //    - LIMITE_URBANO_SESQUILE.geojson
      //    - Limite_sesquile.geojson
      // =====================================================
      addOutlineOnly({
        geojsonFile: 'LIMITE_URBANO_SESQUILE.geojson',
        sourceId: 'limite_urbano',
        layerId: 'limite_urbano_outline',
        lineColor: '#00bcd4',
        lineWidth: 2.5,
        lineOpacity: 0.95
      });

      addOutlineOnly({
        geojsonFile: 'Limite_sesquile.geojson',
        sourceId: 'limite_municipal',
        layerId: 'limite_municipal_outline',
        lineColor: '#ffffff',
        lineWidth: 2,
        lineOpacity: 0.85
      });

      // ✅ Asegurar que los límites queden arriba de buildings
      setTimeout(() => {
        try {
          if (map.getLayer('limite_urbano_outline')) map.moveLayer('limite_urbano_outline');
          if (map.getLayer('limite_municipal_outline')) map.moveLayer('limite_municipal_outline');
        } catch (e) {}
      }, 250);

      // =====================================================
      // ✅ 3) SLIDER DE AÑO (FILTRO <=)
      // =====================================================
      const yearSlider = document.getElementById('year-slider');
      const yearLabel = document.getElementById('year-label');

      if (yearSlider && yearLabel) {
        yearSlider.value = yearSlider.min; // inicia en 1985
        yearLabel.textContent = `${yearSlider.value}`;

        // filtro inicial
        map.setFilter('buildings', ['<=', ['get', 'const_year'], parseInt(yearSlider.value)]);

        yearSlider.addEventListener('input', (event) => {
          const selectedYear = event.target.value;
          yearLabel.textContent = `${selectedYear}`;
          map.setFilter('buildings', ['<=', ['get', 'const_year'], parseInt(selectedYear)]);
        });
      }
    })
    .catch((err) => console.error('Error cargando buildings:', err));
});

// =====================================================
// ✅ Función: agregar capa contorno (sin relleno)
// Soporta LineString / MultiLineString / Polygon / MultiPolygon
// =====================================================
function addOutlineOnly({
  geojsonFile,
  sourceId,
  layerId,
  lineColor = '#ffffff',
  lineWidth = 2,
  lineOpacity = 0.9
}) {
  fetch(`../src/data/${geojsonFile}`)
    .then((r) => r.json())
    .then((data) => {
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }

      // Si el GeoJSON es de líneas, usar type=line. Si es de polígonos, también sirve con line.
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          minzoom: 10,
          paint: {
            'line-color': lineColor,
            'line-width': lineWidth,
            'line-opacity': lineOpacity
          }
        });
      }
    })
    .catch((err) => console.error(`Error cargando límite ${geojsonFile}:`, err));
}
