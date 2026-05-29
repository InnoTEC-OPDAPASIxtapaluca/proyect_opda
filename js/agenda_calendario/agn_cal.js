/**
 * agn_cal.js - Gestión de módulos de Agenda y Calendario
 * Maneja la navegación entre Inicio, Agenda y Calendario mediante iframe dinámico
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Agenda y Calendario - Inicializado');

    // ============================================
    // CONFIGURACIÓN DE MÓDULOS (3 BOTONES)
    // ============================================
    const MODULOS = {
        inicio: {
            nombre: 'Inicio',
            ruta: null,  // No tiene iframe, muestra el video
            icono: 'fa-home'
        },
        agenda: {
            nombre: 'Agenda',
            ruta: './agenda/agenda.html',
            icono: 'fa-calendar-check'
        },
        calendario: {
            nombre: 'Calendario',
            ruta: './calendario/calendario.html',
            icono: 'fa-calendar-alt'
        }
    };

    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const moduloIframe = document.getElementById('moduloIframe');
    const iframeLoading = document.getElementById('iframeLoading');
    const iframeWrapper = document.getElementById('iframeWrapper');
    const videoBackground = document.getElementById('videoBackground');
    const moduloBtns = document.querySelectorAll('.modulo-btn');
    const totalEventosStat = document.getElementById('totalEventosStat');

    let currentModulo = 'inicio';
    let isIframeLoading = false;

    // ============================================
    // OBTENER RUTA BASE CORRECTA
    // ============================================
    function getBasePath() {
        const scripts = document.getElementsByTagName('script');
        const currentScript = scripts[scripts.length - 1];
        const scriptSrc = currentScript.src;
        
        if (scriptSrc && scriptSrc.includes('/js/agenda_calendario/')) {
            const base = scriptSrc.substring(0, scriptSrc.lastIndexOf('/js/'));
            return base + '/html/agenda_calendario/';
        }
        
        return '../../html/agenda_calendario/';
    }

    const BASE_PATH = getBasePath();
    console.log(`📁 Ruta base: ${BASE_PATH}`);

    // ============================================
    // ACTUALIZAR CONTADORES (Demo)
    // ============================================
    function actualizarContadores() {
        setTimeout(() => {
            const totalEventos = 42;
            if (totalEventosStat) totalEventosStat.textContent = totalEventos;
        }, 100);
    }

    // ============================================
    // MOSTRAR VIDEO DE INICIO (con overlay)
    // ============================================
    function mostrarVideo() {
        // Ocultar iframe wrapper con animación
        if (iframeWrapper) {
            iframeWrapper.style.opacity = '0';
            setTimeout(() => {
                iframeWrapper.style.display = 'none';
                if (moduloIframe) {
                    moduloIframe.src = 'about:blank';
                }
            }, 300);
        }
        
        // Mostrar video
        if (videoBackground) {
            videoBackground.style.display = 'block';
            setTimeout(() => {
                videoBackground.style.opacity = '1';
            }, 50);
            
            // Reiniciar y reproducir video
            const video = videoBackground.querySelector('video');
            if (video) {
                video.currentTime = 0;
                video.play().catch(e => console.log('⚠️ Autoplay bloqueado:', e));
            }
        }
    }

    // ============================================
    // CARGAR MÓDULO EN IFRAME (Agenda o Calendario)
    // ============================================
    function cargarModulo(moduloId) {
        const modulo = MODULOS[moduloId];
        if (!modulo) {
            console.error(`❌ Módulo no encontrado: ${moduloId}`);
            return;
        }
        
        // Si es el módulo de inicio, solo mostrar el video
        if (moduloId === 'inicio') {
            mostrarVideo();
            actualizarBotonActivo(moduloId);
            currentModulo = moduloId;
            return;
        }
        
        const url = BASE_PATH + modulo.ruta;
        console.log(`🔄 Cargando módulo: ${modulo.nombre} → ${url}`);
        
        // Ocultar video
        if (videoBackground) {
            videoBackground.style.opacity = '0';
            setTimeout(() => {
                videoBackground.style.display = 'none';
            }, 300);
        }
        
        // Mostrar iframe wrapper
        if (iframeWrapper) {
            iframeWrapper.style.display = 'block';
            iframeWrapper.style.opacity = '0';
            setTimeout(() => {
                iframeWrapper.style.opacity = '1';
            }, 50);
        }
        
        // Mostrar loading
        if (iframeLoading) {
            iframeLoading.style.display = 'flex';
        }
        isIframeLoading = true;
        
        // Cambiar el src del iframe
        if (moduloIframe) {
            moduloIframe.src = url;
        }
        
        actualizarBotonActivo(moduloId);
        currentModulo = moduloId;
    }

    // ============================================
    // ACTUALIZAR BOTÓN ACTIVO
    // ============================================
    function actualizarBotonActivo(moduloId) {
        moduloBtns.forEach(btn => {
            const btnModulo = btn.getAttribute('data-modulo');
            if (btnModulo === moduloId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // ============================================
    // MANEJAR CARGA COMPLETA DEL IFRAME
    // ============================================
    function onIframeLoad() {
        if (isIframeLoading) {
            setTimeout(() => {
                if (iframeLoading) {
                    iframeLoading.style.display = 'none';
                }
                isIframeLoading = false;
                console.log(`✅ Módulo cargado correctamente: ${currentModulo}`);
            }, 500);
        }
    }

    // ============================================
    // CONFIGURAR EVENTOS DE BOTONES
    // ============================================
    function setupEventos() {
        moduloBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduloId = btn.getAttribute('data-modulo');
                if (moduloId && moduloId !== currentModulo) {
                    cargarModulo(moduloId);
                }
            });
        });
    }

    // ============================================
    // MANEJAR POSTMESSAGE DESDE IFRAMES HIJOS
    // ============================================
    function handlePostMessage(event) {
        const data = event.data;
        
        if (data && typeof data === 'object') {
            // Ocultar loading
            if (data.type === 'hideLoading') {
                if (iframeLoading) {
                    iframeLoading.style.display = 'none';
                }
                isIframeLoading = false;
            }
            
            // Navegar a inicio (mostrar video)
            if (data.type === 'goToInicio') {
                mostrarVideo();
                actualizarBotonActivo('inicio');
                currentModulo = 'inicio';
            }
            
            // Actualizar contadores
            if (data.type === 'updateEventosCount' && data.total) {
                if (totalEventosStat) totalEventosStat.textContent = data.total;
            }
            
            // Navegar a otro módulo
            if (data.type === 'navigate' && data.modulo && MODULOS[data.modulo]) {
                cargarModulo(data.modulo);
            }
        }
    }

    // ============================================
    // RECUPERAR MÓDULO GUARDADO
    // ============================================
    function getSavedModulo() {
        try {
            const saved = sessionStorage.getItem('agenda_calendario_modulo');
            if (saved && MODULOS[saved]) {
                return saved;
            }
        } catch(e) {}
        return 'inicio';
    }

    function saveCurrentModulo(moduloId) {
        try {
            sessionStorage.setItem('agenda_calendario_modulo', moduloId);
        } catch(e) {}
    }

    // ============================================
    // INICIALIZAR
    // ============================================
    function init() {
        // Configurar evento de carga del iframe
        if (moduloIframe) {
            moduloIframe.addEventListener('load', onIframeLoad);
        }
        
        // Configurar eventos de botones
        setupEventos();
        
        // Escuchar mensajes de iframes hijos
        window.addEventListener('message', handlePostMessage);
        
        // Ocultar loading inicial
        if (iframeLoading) {
            iframeLoading.style.display = 'none';
        }
        
        // Ocultar iframe inicialmente, mostrar video
        if (iframeWrapper) {
            iframeWrapper.style.display = 'none';
        }
        
        if (videoBackground) {
            videoBackground.style.display = 'block';
            videoBackground.style.opacity = '1';
            
            // Intentar reproducir video automáticamente
            const video = videoBackground.querySelector('video');
            if (video) {
                video.play().catch(e => console.log('⚠️ Autoplay bloqueado por el navegador'));
            }
        }
        
        // Cargar último módulo visitado
        const moduloToLoad = getSavedModulo();
        if (moduloToLoad === 'inicio') {
            mostrarVideo();
            actualizarBotonActivo('inicio');
            currentModulo = 'inicio';
        } else if (moduloToLoad) {
            cargarModulo(moduloToLoad);
        } else {
            mostrarVideo();
            actualizarBotonActivo('inicio');
            currentModulo = 'inicio';
        }
        
        // Actualizar contadores (demo)
        actualizarContadores();
        
        // Guardar módulo actual al cambiar
        moduloBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                saveCurrentModulo(currentModulo);
            });
        });
        
        console.log('✅ Agenda y Calendario - Listo (3 módulos: Inicio, Agenda, Calendario)');
    }
    
    init();
});