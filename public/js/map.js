// Usage: initializeMap('map', 0, 0, 2);
let map;
let marker;

function initializeMap(elementId, lat = 20.5937, lng = 78.9629, zoom = 4, readOnly = true, popups = []) {
    map = L.map(elementId).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    if (!readOnly) {
        marker = L.marker([lat, lng]).addTo(map);

        // Pre-fill hidden inputs with initial coords so form doesnt silently fail
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        if (latInput && lngInput) {
            latInput.value = lat;
            lngInput.value = lng;
        }

        map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker([lat, lng]).addTo(map);

            // Set values to hidden inputs if they exist
            const latInput = document.getElementById('latitude');
            const lngInput = document.getElementById('longitude');
            if (latInput && lngInput) {
                latInput.value = lat;
                lngInput.value = lng;
            }
        });
    }

    if (popups.length > 0) {
        popups.forEach(p => {
            const [lng, lat] = p.coordinates;
            L.marker([lat, lng])
                .addTo(map)
                .bindPopup(p.popupMarkup);
        });
    }
}
