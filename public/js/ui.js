(() => {
    const nav = document.querySelector('.navbar-custom');
    if (!nav) return;
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            nav.classList.toggle('is-scrolled', window.scrollY > 8);
            ticking = false;
        });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
})();
