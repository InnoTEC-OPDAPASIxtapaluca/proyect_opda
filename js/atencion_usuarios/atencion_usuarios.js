/**
 * atencion_usuarios.js - Gestión de módulos de Atención a Usuarios
 * Maneja la navegación entre los 7 submódulos mediante iframe dinámico
 * (Inicio, Solicitudes, Aprobados, Visitas, Reporte, Ciudadanos, Archivo)
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Atención a Usuarios - Inicializado');

    // ============================================
    // CONFIGURACIÓN DE MÓDULOS (AHORA CON INICIO)
    // ============================================
    const MODULOS = {
        inicio: {
            nombre: 'Inicio',
            ruta: './inicio/inicio.html',
            icono: 'fa-home',
            color: '#bb9358',
            esDashboard: true
        },
        solicitudes: {
            nombre: 'Solicitudes',
            ruta: './solicitudes/solicitudes.html',
            icono: 'fa-envelope-open-text',
            color: '#3498db'
        },
        aprobados: {
            nombre: 'Aprobados',
            ruta: './aprobados/aprobados.html',
            icono: 'fa-check-double',
            color: '#27ae60'
        },
        visitas: {
            nombre: 'Visitas',
            ruta: './visitas/visitas.html',
            icono: 'fa-calendar-check',
            color: '#f39c12'
        },
        reporte: {
            nombre: 'Reporte',
            ruta: './reporte/reporte.html',
            icono: 'fa-chart-bar',
            color: '#9b59b6'
        },
        ciudadanos: {
            nombre: 'Ciudadanos',
            ruta: './ciudadanos/ciudadanos.html',
            icono: 'fa-id-card',
            color: '#1abc9c'
        },
        archivo: {
            nombre: 'Archivo',
            ruta: './archivo/archivo.html',
            icono: 'fa-archive',
            color: '#e74c3c'
        }
    };

    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const moduloIframe = document.getElementById('moduloIframe');
    const iframeLoading = document.getElementById('iframeLoading');
    const moduloBtns = document.querySelectorAll('.modulo-btn');
    
    // Elementos de contadores
    const solicitudesCount = document.getElementById('solicitudesCount');
    const aprobadosCount = document.getElementById('aprobadosCount');
    const visitasCount = document.getElementById('visitasCount');
    const ciudadanosCount = document.getElementById('ciudadanosCount');
    const archivoCount = document.getElementById('archivoCount');
    const totalSolicitudesStat = document.getElementById('totalSolicitudesStat');
    const totalAprobadosStat = document.getElementById('totalAprobadosStat');
    const totalCiudadanosStat = document.getElementById('totalCiudadanosStat');

    let currentModulo = 'inicio'; // Ahora el módulo por defecto es INICIO
    let isIframeLoading = false;

    // ============================================
    // OBTENER RUTA BASE CORRECTA
    // ============================================
    function getBasePath() {
        // Obtener la ruta actual del script
        const scripts = document.getElementsByTagName('script');
        const currentScript = scripts[scripts.length - 1];
        const scriptSrc = currentScript.src;
        
        // Si el script tiene una ruta, extraer el directorio base
        if (scriptSrc && scriptSrc.includes('/js/atencion_usuarios/')) {
            const base = scriptSrc.substring(0, scriptSrc.lastIndexOf('/js/'));
            return base + '/html/atencion_usuarios/';
        }
        
        // Fallback: ruta relativa estándar
        return '../../html/atencion_usuarios/';
    }

    const BASE_PATH = getBasePath();
    console.log(`📁 Ruta base para módulos: ${BASE_PATH}`);

    // ============================================
    // ACTUALIZAR CONTADORES (Demo - Reemplazar con API real)
    // ============================================
    function actualizarContadores() {
        // Estos valores deberían venir de una API en producción
        // Son datos de ejemplo para demostración
        
        // Simular carga de conteos
        setTimeout(() => {
            const datosDemo = {
                solicitudes: 24,
                aprobados: 18,
                visitas: 12,
                ciudadanos: 156,
                archivo: 45
            };
            
            if (solicitudesCount) solicitudesCount.textContent = datosDemo.solicitudes;
            if (aprobadosCount) aprobadosCount.textContent = datosDemo.aprobados;
            if (visitasCount) visitasCount.textContent = datosDemo.visitas;
            if (ciudadanosCount) ciudadanosCount.textContent = datosDemo.ciudadanos;
            if (archivoCount) archivoCount.textContent = datosDemo.archivo;
            
            if (totalSolicitudesStat) totalSolicitudesStat.textContent = datosDemo.solicitudes;
            if (totalAprobadosStat) totalAprobadosStat.textContent = datosDemo.aprobados;
            if (totalCiudadanosStat) totalCiudadanosStat.textContent = datosDemo.ciudadanos;
        }, 100);
    }

    // ============================================
    // ACTUALIZAR TÍTULO DEL HEADER SEGÚN MÓDULO
    // ============================================
    function actualizarHeaderTitulo(moduloId) {
        const modulo = MODULOS[moduloId];
        if (!modulo) return;
        
        const headerTitle = document.querySelector('.page-header-premium .header-text h1');
        const headerSubtitle = document.querySelector('.page-header-premium .header-text p');
        
        if (headerTitle && moduloId === 'inicio') {
            // No cambiar el título principal, solo actualizar el badge si existe
            const badge = headerTitle.querySelector('.header-badge');
            if (badge) {
                badge.textContent = 'PANEL DE CONTROL';
            }
        } else if (headerSubtitle && moduloId !== 'inicio') {
            // Restaurar subtítulo original si no está en inicio
            headerSubtitle.textContent = `Gestión de ${modulo.nombre.toLowerCase()}`;
        } else if (headerSubtitle && moduloId === 'inicio') {
            headerSubtitle.textContent = 'Panel de control ejecutivo con métricas y accesos rápidos';
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
        
        // Cambiar el src del iframe
        if (moduloIframe) {
            moduloIframe.src = url;
        }
        
        // Actualizar clase activa en botones
        moduloBtns.forEach(btn => {
            const btnModulo = btn.getAttribute('data-modulo');
            if (btnModulo === moduloId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Actualizar título del header
        actualizarHeaderTitulo(moduloId);
        
        currentModulo = moduloId;
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
        // Validar origen en producción
        const data = event.data;
        
        if (data && typeof data === 'object') {
            // Ocultar loading cuando el iframe hijo lo solicite
            if (data.type === 'hideLoading') {
                if (iframeLoading) {
                    iframeLoading.style.display = 'none';
                }
                isIframeLoading = false;
            }
            
            // Actualizar contadores desde el iframe hijo
            if (data.type === 'updateCounts') {
                if (data.solicitudes && solicitudesCount) {
                    solicitudesCount.textContent = data.solicitudes;
                    if (totalSolicitudesStat) totalSolicitudesStat.textContent = data.solicitudes;
                }
                if (data.aprobados && aprobadosCount) {
                    aprobadosCount.textContent = data.aprobados;
                    if (totalAprobadosStat) totalAprobadosStat.textContent = data.aprobados;
                }
                if (data.ciudadanos && ciudadanosCount) {
                    ciudadanosCount.textContent = data.ciudadanos;
                    if (totalCiudadanosStat) totalCiudadanosStat.textContent = data.ciudadanos;
                }
                if (data.visitas && visitasCount) visitasCount.textContent = data.visitas;
                if (data.archivo && archivoCount) archivoCount.textContent = data.archivo;
            }
            
            // Navegar a otro módulo desde dentro del iframe
            if (data.type === 'navigate' && data.modulo && MODULOS[data.modulo]) {
                cargarModulo(data.modulo);
            }
            
            // Actualizar estadísticas desde el dashboard de inicio
            if (data.type === 'updateDashboardStats' && data.stats) {
                if (data.stats.solicitudes && totalSolicitudesStat) {
                    totalSolicitudesStat.textContent = data.stats.solicitudes;
                    if (solicitudesCount) solicitudesCount.textContent = data.stats.solicitudes;
                }
                if (data.stats.aprobados && totalAprobadosStat) {
                    totalAprobadosStat.textContent = data.stats.aprobados;
                    if (aprobadosCount) aprobadosCount.textContent = data.stats.aprobados;
                }
                if (data.stats.ciudadanos && totalCiudadanosStat) {
                    totalCiudadanosStat.textContent = data.stats.ciudadanos;
                    if (ciudadanosCount) ciudadanosCount.textContent = data.stats.ciudadanos;
                }
                if (data.stats.visitas && visitasCount) visitasCount.textContent = data.stats.visitas;
                if (data.stats.archivo && archivoCount) archivoCount.textContent = data.stats.archivo;
            }
        }
    }

    // ============================================
    // RECUPERAR MÓDULO GUARDADO
    // ============================================
    function getSavedModulo() {
        try {
            const saved = sessionStorage.getItem('atencion_usuarios_modulo');
            if (saved && MODULOS[saved]) {
                return saved;
            }
        } catch(e) {}
        return 'inicio'; // Ahora el default es INICIO
    }

    function saveCurrentModulo(moduloId) {
        try {
            sessionStorage.setItem('atencion_usuarios_modulo', moduloId);
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
        
        // Cargar el último módulo visitado o el default (INICIO)
        const moduloToLoad = getSavedModulo();
        cargarModulo(moduloToLoad);
        
        // Actualizar contadores (demo)
        actualizarContadores();
        
        // Guardar módulo actual al cambiar
        moduloBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                saveCurrentModulo(currentModulo);
            });
        });
        
        console.log('✅ Atención a Usuarios - Listo (7 módulos disponibles: Inicio, Solicitudes, Aprobados, Visitas, Reporte, Ciudadanos, Archivo)');
    }
    
    init();
});