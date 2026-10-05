// Mapbox GL JS map utility
// Usage: initializeMap('map', lat, lng, zoom, readOnly, popups)
let map;
let marker;

function initializeMap(elementId, lat = 20.5937, lng = 78.9629, zoom = 4, readOnly = true, popups = []) {
    mapboxgl.accessToken = window.MAPBOX_TOKEN;

    map = new mapboxgl.Map({
        container: elementId,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom
    });

    // Navigation controls (zoom +/-)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (!readOnly) {
        // Place a draggable marker at the default center
        marker = new mapboxgl.Marker({ color: '#e74c3c', draggable: true })
            .setLngLat([lng, lat])
            .addTo(map);

        // Pre-fill hidden inputs with initial coords
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        if (latInput && lngInput) {
            latInput.value = lat;
            lngInput.value = lng;
        }

        // Update inputs when marker is dragged
        marker.on('dragend', () => {
            const { lat: newLat, lng: newLng } = marker.getLngLat();
            const latInput = document.getElementById('latitude');
            const lngInput = document.getElementById('longitude');
            if (latInput && lngInput) {
                latInput.value = newLat;
                lngInput.value = newLng;
            }
        });

        // Click anywhere on the map to move marker
        map.on('click', (e) => {
            const { lat: newLat, lng: newLng } = e.lngLat;
            marker.setLngLat([newLng, newLat]);

            const latInput = document.getElementById('latitude');
            const lngInput = document.getElementById('longitude');
            if (latInput && lngInput) {
                latInput.value = newLat;
                lngInput.value = newLng;
            }
        });
    }

    if (popups.length > 0) {
        popups.forEach(p => {
            const [pLng, pLat] = p.coordinates;
            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(p.popupMarkup);

            new mapboxgl.Marker({ color: '#e74c3c' })
                .setLngLat([pLng, pLat])
                .setPopup(popup)
                .addTo(map);
        });
    }
}
