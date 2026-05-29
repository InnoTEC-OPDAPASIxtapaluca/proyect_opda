/**
 * agn_cal.js - Gestión de módulos de Agenda y Calendario
 * Maneja la navegación entre Agenda y Calendario mediante iframe dinámico
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Agenda y Calendario - Inicializado');

    // ============================================
    // CONFIGURACIÓN DE MÓDULOS (SOLO AGENDA Y CALENDARIO)
    // ============================================
    const MODULOS = {
        agenda: {
            nombre: 'Agenda',
            ruta: './agenda/agenda.html',
            icono: 'fa-calendar-check',
            descripcion: 'Administra tus eventos, citas y programaciones'
        },
        calendario: {
            nombre: 'Calendario',
            ruta: './calendario/calendario.html',
            icono: 'fa-calendar-alt',
            descripcion: 'Visualiza tus eventos en formato calendario'
        }
    };

    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const moduloIframe = document.getElementById('moduloIframe');
    const iframeLoading = document.getElementById('iframeLoading');
    const iframeWrapper = document.getElementById('iframeWrapper');
    const moduloBtns = document.querySelectorAll('.modulo-btn');
    const totalEventosStat = document.getElementById('totalEventosStat');
    const moduloBadge = document.getElementById('moduloBadge');
    const headerDescripcion = document.getElementById('headerDescripcion');

    let currentModulo = 'agenda';
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
    // ACTUALIZAR HEADER SEGÚN MÓDULO
    // ============================================
    function actualizarHeader(moduloId) {
        const modulo = MODULOS[moduloId];
        if (!modulo) return;
        
        if (moduloBadge) {
            moduloBadge.textContent = modulo.nombre;
        }
        
        if (headerDescripcion) {
            headerDescripcion.textContent = modulo.descripcion;
        }
    }

    // ============================================
    // CARGAR MÓDULO EN IFRAME
    // ============================================
    function cargarModulo(moduloId) {
        const modulo = MODULOS[moduloId];
        if (!modulo) {
            console.error(`❌ Módulo no encontrado: ${moduloId}`);
            return;
        }
        
        const url = BASE_PATH + modulo.ruta;
        console.log(`🔄 Cargando módulo: ${modulo.nombre} → ${url}`);
        
        // Mostrar loading
        if (iframeLoading) {
            iframeLoading.style.display = 'flex';
        }
        isIframeLoading = true;
        
        // Actualizar header
        actualizarHeader(moduloId);
        
        // Cambiar el src del iframe
        if (moduloIframe) {
            moduloIframe.src = url;
        }
        
        actualizarBotonActivo(moduloId);
        currentModulo = moduloId;
        
        // Guardar módulo actual
        saveCurrentModulo(moduloId);
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
        return 'agenda';
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
        
        // Cargar último módulo visitado o agenda por defecto
        const moduloToLoad = getSavedModulo();
        cargarModulo(moduloToLoad);
        
        // Actualizar contadores (demo)
        actualizarContadores();
        
        console.log('✅ Agenda y Calendario - Listo (2 módulos: Agenda y Calendario)');
    }
    
    init();
});