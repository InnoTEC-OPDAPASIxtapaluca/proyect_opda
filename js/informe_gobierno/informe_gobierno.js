/**
 * informe_gobierno.js - Gestión de tarjetas para Informe de Gobierno
 * Incluye control de permisos desde la base de datos (interfaz ID 8)
 * Botones: VER_INFORME (pendiente) y ACCEDER_INFORME (redirección)
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Informe de Gobierno - Inicializado');
    
    // ============================================
    // PERMISOS DEL USUARIO ACTUAL (logueado)
    // ============================================
    let permisosUsuarioActual = {};
    let esUsuarioMaestro = false;
    let usuarioActualNoNomina = null;
    
    // ID de la interfaz para este módulo (INFORME DE GOBIERNO)
    const ID_INTERFAZ_INFORME = 8;
    
    // Variables para control de permisos de botones
    let tienePermisoVer = false;
    let tienePermisoAcceder = false;
    
    // ============================================
    // DEFINICIÓN DE LAS 4 TARJETAS
    // ============================================
    const informesData = [
        {
            id: 'agua',
            nombre: 'AGUA',
            categoria: 'agua',
            descripcion: 'Informe detallado de la gestión del agua potable, producción, distribución y calidad del servicio durante el periodo 2024-2026.',
            imagenFondo: '../../imagenes/informe_gobierno/agua.jpeg',
            iconoCentral: 'fa-tint',
            linkAcceder: 'https://docs.google.com/spreadsheets/d/1UzUislYB4zXStf6jyCu857Jpl6zdWOJePy_TEbVRApo/edit?gid=0#gid=0', // ← REEMPLAZAR CON LINK REAL
            stats: { actualizacion: '2024-2026' }
        },
        {
            id: 'drenaje',
            nombre: 'DRENAJE',
            categoria: 'drenaje',
            descripcion: 'Informe de la red de drenaje sanitario y pluvial, mantenimiento, ampliaciones y proyectos ejecutados en el periodo.',
            imagenFondo: '../../imagenes/informe_gobierno/drenaje.jpg',
            iconoCentral: 'fa-tint-slash',
            linkAcceder: 'https://docs.google.com/spreadsheets/d/12lAoW5FcoogRZli3ZFeNW4FwLqA1X4IfmRQS90teTxk/edit?usp=sharing', // ← REEMPLAZAR CON LINK REAL
            stats: { actualizacion: '2024-2026' }
        },
        {
            id: 'domestico',
            nombre: 'DOMÉSTICO',
            categoria: 'domestico',
            descripcion: 'Informe de servicios domésticos, padrón de usuarios, consumo promedio, eficiencia de cobro y cobertura del servicio.',
            imagenFondo: '../../imagenes/informe_gobierno/domestico.jpeg',
            iconoCentral: 'fa-home',
            linkAcceder: 'https://docs.google.com/spreadsheets/d/1Sa5_JaLlcXd_W5Sgh8DSX7iTpJ3SM192RTzpbm1k9sw/edit?usp=sharing', // ← REEMPLAZAR CON LINK REAL
            stats: { actualizacion: '2024-2026' }
        },
        {
            id: 'comercial',
            nombre: 'COMERCIAL',
            categoria: 'comercial',
            descripcion: 'Informe de servicios comerciales e industriales, grandes contribuyentes, consumo y facturación del sector empresarial.',
            imagenFondo: '../../imagenes/informe_gobierno/comercial.png',
            iconoCentral: 'fa-building',
            linkAcceder: 'https://docs.google.com/spreadsheets/d/1m88RswW0k-nlgEk6LKufbpxLzXXUD5YN8hy3ZlCQ5Iw/edit?usp=sharing', // ← REEMPLAZAR CON LINK REAL
            stats: { actualizacion: '2024-2026' }
        }
    ];
    
    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const cardsGrid = document.getElementById('cardsGridInforme');
    const iframeLoading = document.getElementById('iframeLoading');
    const totalCardsStat = document.getElementById('totalCardsStat');
    
    // Actualizar contador de tarjetas
    if (totalCardsStat) {
        totalCardsStat.textContent = informesData.length;
    }
    
    // ============================================
    // CARGAR PERMISOS DEL USUARIO ACTUAL
    // ============================================
    async function cargarPermisosUsuarioActual() {
        try {
            // Obtener usuario actual
            const responseUsuario = await fetch('../../php/interfaz_general/obtener_usuario_actual.php');
            const dataUsuario = await responseUsuario.json();
            
            if (!dataUsuario.success || !dataUsuario.usuario) {
                console.error('⚠️ No hay sesión activa');
                return;
            }
            
            usuarioActualNoNomina = dataUsuario.usuario.no_nomina;
            console.log('🔍 Usuario logueado:', usuarioActualNoNomina);
            
            // Verificar si es USUARIO MAESTRO
            esUsuarioMaestro = (dataUsuario.usuario.es_maestro === true || dataUsuario.usuario.es_maestro === 1);
            
            if (esUsuarioMaestro) {
                console.log('👑 USUARIO MAESTRO DETECTADO - Acceso total a todos los botones');
                tienePermisoVer = true;
                tienePermisoAcceder = true;
                return;
            }
            
            // Cargar permisos específicos para la interfaz de INFORME DE GOBIERNO (ID = 8)
            const responsePermisos = await fetch(`../../php/ver_usuarios/obtener_permisos_usuario.php?no_nomina=${encodeURIComponent(usuarioActualNoNomina)}`);
            const permisosData = await responsePermisos.json();
            
            if (permisosData.success && permisosData.permisos) {
                permisosUsuarioActual = permisosData.permisos;
                console.log('📋 Permisos del usuario actual:', permisosUsuarioActual);
                
                // Obtener permisos específicos de la interfaz 8
                const permisosInterfaz = permisosUsuarioActual[ID_INTERFAZ_INFORME] || {};
                
                // Verificar permisos de botones
                // NOTA: Los botones se llaman "VER_INFORME" y "ACCEDER_INFORME"
                if (permisosInterfaz.hasOwnProperty('VER_INFORME')) {
                    tienePermisoVer = true;
                    console.log('✅ Permiso VER_INFORME: ACTIVADO');
                } else {
                    console.log('❌ Permiso VER_INFORME: DESACTIVADO');
                }
                
                if (permisosInterfaz.hasOwnProperty('ACCEDER_INFORME')) {
                    tienePermisoAcceder = true;
                    console.log('✅ Permiso ACCEDER_INFORME: ACTIVADO');
                } else {
                    console.log('❌ Permiso ACCEDER_INFORME: DESACTIVADO');
                }
            } else {
                console.log('⚠️ No se encontraron permisos para este usuario');
            }
            
        } catch (error) {
            console.error('Error cargando permisos del usuario actual:', error);
        }
    }
    
    // ============================================
    // FUNCIÓN PARA CAMBIAR IFRAME PADRE (Acceder)
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
    
    function abrirLinkExterno(url, nombre) {
        try {
            // Abrir en una nueva pestaña (comportamiento estándar)
            window.open(url, '_blank');
            console.log(`🔗 Abriendo link externo: ${url} (${nombre})`);
        } catch(error) {
            console.error('❌ Error al abrir el enlace:', error);
            // Fallback: redirigir en la misma ventana
            window.location.href = url;
        }
    }
    
    // ============================================
    // FUNCIÓN PARA BOTÓN VER (PENDIENTE - SOLO ALERTA)
    // ============================================
    function verInforme(nombre, id) {
        // FUNCIÓN PENDIENTE - Solo muestra mensaje
        Swal.fire({
            icon: 'info',
            title: 'Función en desarrollo',
            html: `El módulo de visualización para <strong>${nombre}</strong> estará disponible próximamente.<br><br>Por favor, consulte con el área de sistemas.`,
            background: '#1a040b',
            color: '#fff',
            confirmButtonColor: '#bb9358',
            confirmButtonText: 'Entendido'
        });
        console.log(`📄 Botón VER presionado para: ${nombre} (ID: ${id}) - Función pendiente`);
    }
    
    // ============================================
    // CREAR TARJETA INDIVIDUAL
    // ============================================
    function crearTarjeta(informe, index) {
        const card = document.createElement('div');
        card.className = 'card-informe';
        card.setAttribute('data-id', informe.id);
        card.setAttribute('data-tooltip', `Ver informe de ${informe.nombre}`);
        card.style.animationDelay = `${index * 0.05}s`;
        
        // Efecto de glow con mouse
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
        
        // Obtener color de badge según categoría
        const getBadgeColor = (categoria) => {
            const colores = {
                agua: '💧',
                drenaje: '🕳️',
                domestico: '🏠',
                comercial: '🏢'
            };
            return colores[categoria] || '📄';
        };
        
        // Construir HTML de la tarjeta
        card.innerHTML = `
            <div class="card-glow-informe"></div>
            <div class="card-header-informe">
                <div class="card-header-bg-informe">
                    <img src="${informe.imagenFondo}" alt="${informe.nombre}" class="card-bg-image-informe" onerror="this.style.display='none'">
                </div>
                <div class="card-icon-informe">
                    <i class="fas ${informe.iconoCentral}"></i>
                </div>
            </div>
            <div class="card-body-informe">
                <div class="card-title-informe">
                    ${informe.nombre}
                    <span class="card-badge" style="display: inline-block; margin-left: 8px; font-size: 14px;">${getBadgeColor(informe.categoria)}</span>
                </div>
                <div class="card-description-informe">${informe.descripcion}</div>
                <div class="card-footer-informe">
                    ${tienePermisoVer ? `<button class="btn-informe-ver" data-ver="${informe.id}"><i class="fas fa-eye"></i> VER</button>` : ''}
                    ${tienePermisoAcceder ? `<button class="btn-informe-acceder" data-acceder="${informe.id}"><i class="fas fa-external-link-alt"></i> ACCEDER</button>` : ''}
                </div>
            </div>
        `;
        
        // Evento para botón VER
        if (tienePermisoVer) {
            const btnVer = card.querySelector(`[data-ver="${informe.id}"]`);
            if (btnVer) {
                btnVer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    verInforme(informe.nombre, informe.id);
                });
            }
        }
        
        // Evento para botón ACCEDER
        if (tienePermisoAcceder) {
            const btnAcceder = card.querySelector(`[data-acceder="${informe.id}"]`);
            if (btnAcceder) {
                btnAcceder.addEventListener('click', (e) => {
                    e.stopPropagation();
                    abrirLinkExterno(informe.linkAcceder, informe.nombre);
                });
            }
        }
        
        return card;
    }
    
    // ============================================
    // RENDERIZAR TARJETAS
    // ============================================
    function renderizarTarjetas() {
        if (!cardsGrid) {
            console.error('❌ Contenedor cardsGridInforme no encontrado');
            return;
        }
        
        cardsGrid.innerHTML = '';
        
        informesData.forEach((informe, index) => {
            const tarjeta = crearTarjeta(informe, index);
            cardsGrid.appendChild(tarjeta);
        });
        
        console.log(`✅ Renderizadas ${informesData.length} tarjetas de Informe de Gobierno`);
        console.log(`📊 Permisos activos - VER: ${tienePermisoVer}, ACCEDER: ${tienePermisoAcceder}`);
    }
    
    // ============================================
    // MANEJAR POSTMESSAGE (ocultar loading)
    // ============================================
    function handlePostMessage(event) {
        if (event.data && event.data.type === 'hideLoading') {
            if (iframeLoading) {
                iframeLoading.style.display = 'none';
            }
        }
    }
    
    // ============================================
    // INICIALIZAR
    // ============================================
    async function init() {
        console.log('🚀 Inicializando Informe de Gobierno...');
        
        // Mostrar loading
        if (iframeLoading) {
            iframeLoading.style.display = 'flex';
        }
        
        // Cargar permisos del usuario actual
        await cargarPermisosUsuarioActual();
        
        // Renderizar tarjetas (depende de los permisos cargados)
        renderizarTarjetas();
        
        // Configurar listener de postMessage
        window.addEventListener('message', handlePostMessage);
        
        // Ocultar loading después de un breve momento
        setTimeout(() => {
            if (iframeLoading) {
                iframeLoading.style.display = 'none';
            }
        }, 500);
        
        console.log('✅ Informe de Gobierno - Listo');
    }
    
    init();
});