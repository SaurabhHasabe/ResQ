(() => {
    const nav = document.querySelector('.navbar-custom');
    if (!nav) return;
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
            nav.classList.toggle('is-scrolled', y > 8);
            ticking = false;
        });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.body.addEventListener('scroll', onScroll, { passive: true });
})();
