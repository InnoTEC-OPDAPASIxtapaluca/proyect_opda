/**
 * inicio.js - Pantalla de inicio con video de fondo premium
 * Incluye cambio de video responsive y toggle de audio al hacer click/scroll
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
    let audioEnabled = false;
    let interactionHandlerAdded = false;
    
    // ============================================
    // FUNCIONES PARA VIDEO RESPONSIVE
    // ============================================
    
    /**
     * Determina qué video usar según el ancho de pantalla
     */
    function getVideoByWidth() {
        const width = window.innerWidth;
        
        if (width <= 768) {
            return VIDEO_MOBILE;
        } else {
            return VIDEO_DESKTOP;
        }
    }
    
    /**
     * Cambia el video según el tamaño de pantalla
     */
    function switchVideo() {
        if (!video) return;
        
        const newSrc = getVideoByWidth();
        
        if (currentVideoSrc !== newSrc) {
            const wasPlaying = !video.paused;
            const currentVolume = video.volume;
            const currentTime = video.currentTime;
            
            currentVideoSrc = newSrc;
            video.src = newSrc;
            video.load();
            video.volume = currentVolume;
            video.currentTime = currentTime;
            
            if (wasPlaying) {
                video.play().catch(function(error) {
                    console.log('Reproducción después de cambio:', error);
                });
            }
        }
    }
    
    /**
     * Toggle de audio (activa o silencia)
     */
    function toggleAudio() {
        if (!video) return;
        
        if (audioEnabled) {
            // Silenciar
            video.muted = true;
            audioEnabled = false;
            console.log('🔇 Audio silenciado');
        } else {
            // Activar audio
            video.muted = false;
            video.volume = 0.7;
            audioEnabled = true;
            console.log('🔊 Audio activado');
            
            // Asegurar que el video se esté reproduciendo
            if (video.paused) {
                video.play().catch(function(e) {
                    console.log('Error al reproducir:', e);
                });
            }
        }
    }
    
    /**
     * Maneja la interacción del usuario (click o scroll)
     */
    function handleUserInteraction() {
        toggleAudio();
    }
    
    /**
     * Agrega los listeners de interacción
     */
    function addInteractionListeners() {
        if (interactionHandlerAdded) return;
        
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
        document.addEventListener('scroll', handleUserInteraction);
        
        // También el scroll en el contenido
        const content = document.querySelector('.inicio-content');
        if (content) {
            content.addEventListener('scroll', handleUserInteraction);
        }
        
        interactionHandlerAdded = true;
        console.log('🎧 Listeners de interacción agregados');
    }
    
    /**
     * Inicializa el video
     */
    function initVideo() {
        if (!video) return;
        
        // Iniciar silenciado para autoplay
        video.muted = true;
        audioEnabled = false;
        video.volume = 0.7;
        
        currentVideoSrc = getVideoByWidth();
        video.src = currentVideoSrc;
        video.load();
        
        // Intentar reproducir automáticamente
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('📹 Video reproduciéndose (silenciado)');
                // Agregar listeners para toggle de audio
                addInteractionListeners();
            }).catch(function(error) {
                console.log('Auto-play prevenido:', error);
                addInteractionListeners();
            });
        }
        
        // Loop del video
        video.addEventListener('ended', function() {
            video.currentTime = 0;
            if (!video.paused) {
                video.play().catch(function() {});
            }
        });
        
        // Manejar errores
        video.addEventListener('error', function(e) {
            console.log('Error en el video:', e);
            const fallbackSrc = (video.src === VIDEO_DESKTOP) ? VIDEO_MOBILE : VIDEO_DESKTOP;
            video.src = fallbackSrc;
            video.load();
            video.play().catch(function() {});
        });
        
        console.log('🎬 Video inicializado:', video.src);
    }
    
    /**
     * Verifica visibilidad del iframe
     */
    function checkIframeVisibility() {
        try {
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
        } catch(e) {}
    }
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    initVideo();
    
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            switchVideo();
        }, 250);
    });
    
    window.addEventListener('orientationchange', function() {
        setTimeout(switchVideo, 100);
    });
    
    setInterval(checkIframeVisibility, 5000);
    
    console.log('✅ Inicio Premium - Listo');
});