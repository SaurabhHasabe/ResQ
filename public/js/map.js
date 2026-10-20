let map;
let marker;

function setCoordInputs(lat, lng) {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput && lngInput) {
        latInput.value = lat;
        lngInput.value = lng;
    }
}

function setLocationStatus(text, kind = '') {
    const el = document.getElementById('location-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'location-status small mb-0' + (kind ? ` location-status--${kind}` : '');
}

async function reverseGeocode(lng, lat) {
    const token = window.MAPBOX_TOKEN;
    if (!token) return null;
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(lng)},${encodeURIComponent(lat)}.json?types=address,poi,place,locality,neighborhood&limit=1&access_token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.features && data.features[0] ? data.features[0].place_name : null;
    } catch {
        return null;
    }
}

async function applyDetectedLocation(lat, lng, { fillAddress = true } = {}) {
    if (marker) marker.setLngLat([lng, lat]);
    if (map) map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
    setCoordInputs(lat, lng);
    if (fillAddress) {
        const place = await reverseGeocode(lng, lat);
        const address = document.getElementById('address');
        if (place && address) address.value = place;
    }
}

function detectUserLocation({ fillAddress = true } = {}) {
    if (!navigator.geolocation) {
        setLocationStatus('Geolocation is not supported. Tap the map to set a pin.', 'warn');
        return;
    }

    setLocationStatus('Detecting your location…', 'info');

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            await applyDetectedLocation(lat, lng, { fillAddress });
            setLocationStatus('Using your current location. Drag the pin if it is slightly off.', 'ok');
        },
        (err) => {
            const messages = {
                1: 'Location permission denied. Allow access or tap the map to pin it.',
                2: 'Location unavailable. Tap the map to pin it.',
                3: 'Location timed out. Tap the map or try Use my location again.'
            };
            setLocationStatus(messages[err.code] || 'Could not detect location. Tap the map to pin it.', 'warn');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
}

function initializeMap(elementId, lat = 20.5937, lng = 78.9629, zoom = 4, readOnly = true, popups = [], options = {}) {
    mapboxgl.accessToken = window.MAPBOX_TOKEN;

    map = new mapboxgl.Map({
        container: elementId,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom,
        fadeDuration: 0
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => map.resize());
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (map) map.resize();
        }, 150);
    }, { passive: true });

    if (!readOnly) {
        marker = new mapboxgl.Marker({ color: '#e74c3c', draggable: true })
            .setLngLat([lng, lat])
            .addTo(map);

        setCoordInputs(lat, lng);

        marker.on('dragend', async () => {
            const { lat: newLat, lng: newLng } = marker.getLngLat();
            setCoordInputs(newLat, newLng);
            const place = await reverseGeocode(newLng, newLat);
            const address = document.getElementById('address');
            if (place && address) address.value = place;
            setLocationStatus('Pin updated. Address filled from the map.', 'ok');
        });

        map.on('click', async (e) => {
            const { lat: newLat, lng: newLng } = e.lngLat;
            marker.setLngLat([newLng, newLat]);
            setCoordInputs(newLat, newLng);
            const place = await reverseGeocode(newLng, newLat);
            const address = document.getElementById('address');
            if (place && address) address.value = place;
            setLocationStatus('Pin updated. Address filled from the map.', 'ok');
        });

        if (options.detectLocation) {
            detectUserLocation({ fillAddress: true });
        }

        const locateBtn = document.getElementById('use-my-location');
        if (locateBtn) {
            locateBtn.addEventListener('click', () => detectUserLocation({ fillAddress: true }));
        }
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
