/**
 * pozos.js - Gestión de acciones del módulo Pozos
 * Los botones cambian el IFRAME PADRE completo (como en diagnosticos.html)
 * My Maps se abre en nueva pestaña
 * El contenedor inferior queda vacío para uso futuro
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Módulo Pozos - Inicializado');

    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const buttons = document.querySelectorAll('.pozo-action-btn');
    const loadingOverlay = document.getElementById('iframeLoading');

    // ============================================
    // CONFIGURACIÓN DE RUTAS (AJUSTA SEGÚN TU PROYECTO)
    // ============================================
    const rutas = {
        mapa_interno: '../html/diagnosticos/pozos/mapa_interno/mapa_interno.html',
        abrir_base_datos: '../html/diagnosticos/pozos/mapa_interno/mapa_interno.html',
        listado: '../html/diagnosticos/pozos/mapa_interno/mapa_interno.html',
        mapa_iconos: '../html/diagnosticos/pozos/mapa_interno/mapa_interno.html'
    };

    const enlaceExterno = {
        my_maps: 'https://www.google.com/maps/d/viewer?mid=18UdQ6kZIa99JLrvU9oirIymdolNGkLY&ll=19.3414686731353%2C-98.89457777252197&z=13'
    };

    // ============================================
    // FUNCIÓN PARA OBTENER EL IFRAME PADRE
    // (Igual que en diagnosticos.js)
    // ============================================
    function getParentIframe() {
        try {
            if (window.parent && window.parent.document) {
                const iframes = window.parent.document.querySelectorAll('iframe');
                for (let iframe of iframes) {
                    try {
                        if (iframe.contentWindow === window) {
                            return iframe;
                        }
                    } catch(e) {
                        continue;
                    }
                }
            }
        } catch(e) {
            console.warn('No se pudo acceder al iframe padre:', e);
        }
        return null;
    }

    // ============================================
    // FUNCIÓN PARA CAMBIAR EL IFRAME PADRE COMPLETO
    // ============================================
    function cambiarIframePadre(ruta, nombreAccion) {
        try {
            // Mostrar loading
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            }

            const iframe = getParentIframe();

            if (iframe) {
                // Cambiar el src del iframe padre
                iframe.src = ruta;
                console.log(`✅ Redirigiendo iframe padre a: ${ruta} (${nombreAccion})`);
            } else {
                // Fallback: intentar con postMessage
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'navigate',
                        url: ruta,
                        module: nombreAccion
                    }, '*');
                    console.log(`📡 Enviando postMessage para navegar a: ${ruta}`);
                } else {
                    console.error('❌ No se pudo acceder al iframe padre');
                    window.location.href = ruta;
                }
            }

            // Ocultar loading después de un tiempo
            setTimeout(() => {
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
            }, 800);

        } catch(error) {
            console.error('❌ Error al cambiar el iframe padre:', error);
            window.location.href = ruta;
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    // ============================================
    // ABRIR ENLACE EN NUEVA PESTAÑA
    // ============================================
    function abrirEnNuevaPestana(url) {
        window.open(url, '_blank');
        console.log(`🔗 Abriendo enlace externo: ${url}`);
    }

    // ============================================
    // MANEJAR CLICK EN CADA BOTÓN
    // ============================================
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.getAttribute('data-action');

            if (!action) {
                console.warn('⚠️ Botón sin atributo data-action');
                return;
            }

            // Caso especial: My Maps se abre en nueva pestaña
            if (action === 'my_maps') {
                abrirEnNuevaPestana(enlaceExterno.my_maps);
                return;
            }

            // Para las demás acciones, cambiar el iframe PADRE completo
            if (rutas[action]) {
                let nombreAccion = btn.querySelector('span')?.innerText || action;
                cambiarIframePadre(rutas[action], nombreAccion);
            } else {
                console.error(`❌ No se encontró una ruta definida para la acción: ${action}`);
            }
        });
    });

    // ============================================
    // MANEJAR POSTMESSAGE (por si viene del padre)
    // ============================================
    function handlePostMessage(event) {
        if (event.data && event.data.type === 'hideLoading') {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    window.addEventListener('message', handlePostMessage);

    // ============================================
    // OCULTAR LOADING INICIAL
    // ============================================
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }

    console.log('✅ Módulo Pozos - Listo');
});