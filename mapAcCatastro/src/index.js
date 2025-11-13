map.on('style.load', () => {

    // Fuente: Clasificación Plusvalía
    map.addSource('c_plusvalia', {
        type: 'geojson',
        data: '../src/data/Clasificación_Plusvalia.geojson'
    });

    // Capa categorizada por CLASIFICACION_PLUSVALIA
    map.addLayer({
        id: 'layer_plusvalia',
        source: 'c_plusvalia',
        type: 'fill',
        paint: {
            'fill-color': [
                'match',
                ['get', 'CLASIFICACION_PLUSVALIA'],

                'Muy Alta', '#e74c3c',   // rojo
                'Alta',     '#e67e22',   // naranja
                'Media',    '#f1c40f',   // amarillo
                'Baja',     '#2ecc71',   // verde
                'Muy Baja', '#3498db',   // azul

                '#bdc3c7'  // por defecto
            ],
            'fill-opacity': 0.75,
            'fill-outline-color': '#ffffff'
        }
    });

    // POPUP dinámico
    map.on('mousemove', 'layer_plusvalia', (e) => {
        const f = e.features[0];

        const clasif = f.properties.CLASIFICACION_PLUSVALIA;

        popup
            .setLngLat(e.lngLat)
            .setHTML(`
                <strong>Clasificación: </strong> ${clasif}<br>
                <a style="font-size:9px;">&#9400 EffectiveActions</a>
            `)
            .addTo(map);
    });

    map.on('mouseleave', 'layer_plusvalia', () => {
        popup.remove();
    });

});
