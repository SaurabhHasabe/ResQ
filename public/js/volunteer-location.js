(function () {
    const role = document.body.getAttribute('data-role');
    if (role !== 'volunteer') return;
    if (!navigator.geolocation) return;

    const token = document.querySelector('meta[name="csrf-token"]');
    const csrf = token ? token.getAttribute('content') : '';

    function ping(lat, lng) {
        fetch('/volunteer/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng, _csrf: csrf }),
            credentials: 'same-origin'
        }).catch(() => {});
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => ping(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
})();
