// ============================================================================
// Mobile Utilities for ResQ - App-Like Experience
// ============================================================================

// Initialize mobile enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Detect if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-mode');
    }

    // Add iOS-specific class
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        document.body.classList.add('ios-device');
    }

    // Add Android-specific class
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isAndroid) {
        document.body.classList.add('android-device');
    }

    // Prevent zoom on input focus (iOS)
    preventIOSZoom();

    // Network status monitoring - DISABLED until service worker issues resolved
    // initNetworkMonitoring();

    // Enhanced touch interactions
    initTouchEnhancements();

    // Auto-hide address bar on scroll (mobile browsers)
    if (window.innerWidth < 768) {
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            if (currentScroll > lastScroll && currentScroll > 100) {
                // Scrolling down
                document.body.classList.add('scrolled-down');
            } else {
                // Scrolling up
                document.body.classList.remove('scrolled-down');
            }
            lastScroll = currentScroll;
        }, { passive: true });
    }
});

// Prevent iOS zoom on double-tap
function preventIOSZoom() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        if (event.target.closest && event.target.closest('#map, .mapboxgl-map, .mapboxgl-canvas')) {
            lastTouchEnd = Date.now();
            return;
        }
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// Network status monitoring
function initNetworkMonitoring() {
    // Create indicator element (hidden by default via CSS)
    let offlineIndicator = document.querySelector('.offline-indicator');

    if (!offlineIndicator) {
        offlineIndicator = document.createElement('div');
        offlineIndicator.className = 'offline-indicator';
        // Use plain text + unicode icon, avoids Lucide re-render issues
        offlineIndicator.innerHTML = '&#9888; No Internet Connection';
        document.body.appendChild(offlineIndicator);
    }

    function updateStatus() {
        if (navigator.onLine) {
            offlineIndicator.classList.remove('show');
        } else {
            offlineIndicator.classList.add('show');
        }
    }

    window.addEventListener('online',  updateStatus);
    window.addEventListener('offline', updateStatus);

    // Only show if actually offline — don't check optimistically on load
    // (avoids false positives on localhost / first paint)
    if (!navigator.onLine) {
        offlineIndicator.classList.add('show');
    }
}

// Enhanced touch interactions
function initTouchEnhancements() {}

// Show toast notification
function showToast(message, duration = 3000) {
    let toastContainer = document.querySelector('.toast-container-mobile');

    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container-mobile';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-mobile';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Lazy load images
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-loading');
                    observer.unobserve(img);
                }
            });
        });

        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.setAttribute('data-loading', 'true');
            imageObserver.observe(img);
        });
    }
}

// Share functionality
function shareContent(title, text, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).then(() => {
            console.log('Content shared successfully');
        }).catch((error) => {
            console.log('Error sharing:', error);
        });
    } else {
        // Fallback: Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                showToast('Link copied to clipboard!');
            });
        }
    }
}

// Add to home screen prompt
// We do NOT call e.preventDefault() here — that suppresses the browser's
// native install banner without showing our own UI, which triggers a console
// warning. Only intercept if an #install-button is present on the page.
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    const installButton = document.getElementById('install-button');
    if (installButton) {
        // Only intercept when we have our own install UI to show
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'block';

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });
    }
    // No install button → let browser show its own native banner
});

// Haptic feedback (if supported)
function triggerHaptic(type = 'light') {
    if (window.navigator && window.navigator.vibrate) {
        switch(type) {
            case 'light':
                window.navigator.vibrate(10);
                break;
            case 'medium':
                window.navigator.vibrate(20);
                break;
            case 'heavy':
                window.navigator.vibrate(40);
                break;
            default:
                window.navigator.vibrate(10);
        }
    }
}

// Pull to refresh (basic implementation)
function initPullToRefresh() {
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
        if (window.pageYOffset === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;

        const currentY = e.touches[0].pageY;
        const distance = currentY - startY;

        if (distance > 80 && window.pageYOffset === 0) {
            triggerHaptic('medium');
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!isPulling) return;

        const endY = e.changedTouches[0].pageY;
        const distance = endY - startY;

        if (distance > 100 && window.pageYOffset === 0) {
            location.reload();
        }

        isPulling = false;
    }, { passive: true });
}

// Export functions for global use
window.ResQMobile = {
    showToast,
    shareContent,
    triggerHaptic,
    initLazyLoading,
    initPullToRefresh
};
