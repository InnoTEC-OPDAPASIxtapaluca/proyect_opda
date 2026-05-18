/**
 * inicio.js - Pantalla de inicio con video de fondo premium
 * Incluye cambio de video responsive y manejo de reproducción
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicio Premium - Inicializado');
    
    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const video = document.getElementById('mainVideo');
    
    // URLs de los videos
    const VIDEO_DESKTOP = '../../videos/video_intprin4.mp4';
    const VIDEO_MOBILE = '../../videos/video_intprin4.1.mp4';
    
    let currentVideoSrc = '';
    
    // ============================================
    // FUNCIONES PARA VIDEO RESPONSIVE
    // ============================================
    
    /**
     * Determina qué video usar según el ancho de pantalla
     */
    function getVideoByWidth() {
        const width = window.innerWidth;
        
        // Basado en los breakpoints del interfaz_general.css
        // Móvil (768px o menos)
        if (width <= 768) {
            return VIDEO_MOBILE;
        }
        // Desktop y tablet (769px o más)
        else {
            return VIDEO_DESKTOP;
        }
    }
    
    /**
     * Cambia el video según el tamaño de pantalla
     */
    function switchVideo() {
        if (!video) return;
        
        const newSrc = getVideoByWidth();
        
        // Solo cambiar si es diferente al actual
        if (currentVideoSrc !== newSrc) {
            currentVideoSrc = newSrc;
            
            // Guardar el tiempo actual
            const currentTime = video.currentTime;
            
            // Cambiar el src del video
            video.src = newSrc;
            video.load();
            
            // Restaurar el tiempo aproximado
            video.currentTime = currentTime;
            
            // Intentar reproducir
            video.play().catch(function(error) {
                console.log('Auto-play prevenido:', error);
            });
        }
    }
    
    /**
     * Fuerza la reproducción en móviles (por si el autoplay falla)
     */
    function forcePlayOnMobile() {
        const width = window.innerWidth;
        if (width <= 768 && video) {
            // En móvil, intentar reproducir al tocar cualquier parte
            const tryPlay = function() {
                if (video.paused) {
                    video.play().catch(function(e) {
                        console.log('No se pudo reproducir:', e);
                    });
                }
            };
            document.addEventListener('click', tryPlay);
            document.addEventListener('touchstart', tryPlay);
        }
    }
    
    /**
     * Inicializa el video correcto
     */
    function initVideo() {
        if (!video) return;
        
        currentVideoSrc = getVideoByWidth();
        video.src = currentVideoSrc;
        video.load();
        
        // Intentar reproducir automáticamente
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(function(error) {
                console.log('Auto-play prevenido en', window.innerWidth <= 768 ? 'móvil' : 'desktop', error);
                // Si falla, esperar interacción del usuario
                forcePlayOnMobile();
            });
        }
        
        // Asegurar loop del video
        video.addEventListener('ended', function() {
            video.currentTime = 0;
            video.play().catch(function() {});
        });
        
        // Manejar errores
        video.addEventListener('error', function(e) {
            console.log('Error en el video:', e);
            // Si hay error, intentar con el otro video
            const fallbackSrc = (video.src === VIDEO_DESKTOP) ? VIDEO_MOBILE : VIDEO_DESKTOP;
            video.src = fallbackSrc;
            video.load();
            video.play().catch(function() {});
        });
        
        console.log('🎬 Video inicializado:', video.src);
    }
    
    /**
     * Verifica si el iframe está visible y reinicia el video si es necesario
     */
    function checkIframeVisibility() {
        try {
            // Obtener el iframe padre
            let parentIframe = null;
            if (window.parent && window.parent.document) {
                const iframes = window.parent.document.querySelectorAll('iframe');
                for (let iframe of iframes) {
                    try {
                        if (iframe.contentWindow === window) {
                            parentIframe = iframe;
                            break;
                        }
                    } catch(e) {
                        continue;
                    }
                }
            }
            
            if (parentIframe) {
                const rect = parentIframe.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                
                if (isVisible && video && video.paused) {
                    video.play().catch(function() {});
                }
            }
        } catch(e) {
            console.log('No se pudo verificar visibilidad del iframe');
        }
    }
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    // Inicializar video
    initVideo();
    
    // Escuchar cambios de tamaño para cambiar video (útil para rotación de pantalla)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            switchVideo();
        }, 250);
    });
    
    // Escuchar cambios de orientación
    window.addEventListener('orientationchange', function() {
        setTimeout(switchVideo, 100);
    });
    
    // Verificar visibilidad cada 5 segundos
    setInterval(checkIframeVisibility, 5000);
    
    // LOG PARA DEPURACIÓN
    console.log('✅ Inicio Premium - Listo');
});