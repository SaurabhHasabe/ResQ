(() => {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach((form) => {
        form.addEventListener('submit', (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    const phone = document.getElementById('phone');
    if (phone) {
        phone.addEventListener('input', () => {
            phone.value = phone.value.replace(/[^\d+]/g, '').slice(0, 13);
        });
    }

    const cap = document.getElementById('totalCapacity');
    const occ = document.getElementById('currentOccupancy');
    if (cap && occ) {
        const sync = () => {
            if (Number(occ.value) > Number(cap.value)) {
                occ.setCustomValidity('Occupancy cannot exceed capacity');
            } else {
                occ.setCustomValidity('');
            }
        };
        cap.addEventListener('input', sync);
        occ.addEventListener('input', sync);
    }
})();
