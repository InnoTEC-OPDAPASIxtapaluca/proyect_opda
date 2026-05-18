/**
 * diagnosticos.js - Gestión premium de tarjetas de diagnóstico
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Diagnosticos Premium - Inicializado');
    
    // ============================================
    // DEFINICIÓN DE LAS TARJETAS CON CATEGORÍAS
    // ============================================
    const diagnosticosData = [
        {
            id: 'almacen',
            nombre: 'ALMACÉN',
            categoria: 'infraestructura',
            descripcion: 'Gestión integral de almacenes, inventario de materiales, equipos y suministros del sistema hidráulico con control de existencias.',
            imagenFondo: '../../imagenes/diagnosticos/general/almacen.png',
            iconoCentral: 'fa-warehouse',
            ruta: '../html/diagnosticos/almacen/almacen.html',
            stats: { registros: '1,284', actualizacion: 'Hoy' }
        },
        {
            id: 'almacen_usuario',
            nombre: 'ATENCIÓN A USUARIO',
            categoria: 'control',
            descripcion: 'Sistema de asignación y seguimiento de materiales desde almacenes centrales hacia usuarios finales y áreas operativas.',
            imagenFondo: '../../imagenes/diagnosticos/general/atencion_usuario.png',
            iconoCentral: 'fa-exchange-alt',
            ruta: '../html/diagnosticos/almacen_usuario/almacen_usuario.html',
            stats: { registros: '3,567', actualizacion: 'Hoy' }
        },
        {
            id: 'canales_cielo_abierto',
            nombre: 'CANALES DE CIELO ABIERTO',
            categoria: 'agua',
            descripcion: 'Monitoreo en tiempo real de canales de conducción de agua superficial para riego agrícola y distribución municipal.',
            imagenFondo: '../../imagenes/diagnosticos/general/canales_cielo_abierto.png',
            iconoCentral: 'fa-water',
            ruta: '../html/diagnosticos/canales_cielo_abierto/canales_cielo_abierto.html',
            stats: { registros: '47', actualizacion: 'Ayer' }
        },
        {
            id: 'carcamos',
            nombre: 'CÁRCAMOS',
            categoria: 'infraestructura',
            descripcion: 'Supervisión avanzada de cárcamos de bombeo, niveles hidráulicos, estado de equipos y alarmas en tiempo real.',
            imagenFondo: '../../imagenes/diagnosticos/general/carcamos.png',
            iconoCentral: 'fa-industry',
            ruta: '../html/diagnosticos/carcamos/carcamos.html',
            stats: { registros: '23', actualizacion: 'Hoy' }
        },
        {
            id: 'dashboard',
            nombre: 'DASHBOARD',
            categoria: 'monitoreo',
            descripcion: 'Panel de control ejecutivo con indicadores clave de rendimiento (KPIs) del sistema hidráulico y métricas operativas.',
            imagenFondo: '../../imagenes/diagnosticos/general/dashboard.png',
            iconoCentral: 'fa-chart-line',
            ruta: '../html/diagnosticos/dashboard/dashboard.html',
            stats: { registros: '12', actualizacion: 'En vivo' }
        },
        {
            id: 'drenaje',
            nombre: 'DRENAJE',
            categoria: 'infraestructura',
            descripcion: 'Gestión completa de redes de drenaje pluvial y sanitario, mantenimiento preventivo y limpieza de alcantarillas.',
            imagenFondo: '../../imagenes/diagnosticos/general/drenaje.png',
            iconoCentral: 'fa-tint-slash',
            ruta: '../html/diagnosticos/drenaje/drenaje.html',
            stats: { registros: '156', actualizacion: 'Hace 2 días' }
        },
        {
            id: 'lineas_agua',
            nombre: 'LÍNEAS DE AGUA',
            categoria: 'agua',
            descripcion: 'Red de distribución de agua potable con análisis de presiones, caudales, y detección de fugas en tiempo real.',
            imagenFondo: '../../imagenes/diagnosticos/general/lineas_agua.png',
            iconoCentral: 'fa-water',
            ruta: '../html/diagnosticos/lineas_agua/lineas_agua.html',
            stats: { registros: '342', actualizacion: 'Hoy' }
        },
        {
            id: 'pipas',
            nombre: 'PIPAS',
            categoria: 'control',
            descripcion: 'Flotilla de pipas de agua con GPS, rutas optimizadas, abastecimiento y mantenimiento de unidades operativas.',
            imagenFondo: '../../imagenes/diagnosticos/general/pipas.png',
            iconoCentral: 'fa-truck',
            ruta: '../html/diagnosticos/pipas/pipas.html',
            stats: { registros: '28', actualizacion: 'Hoy' }
        },
        {
            id: 'plantas',
            nombre: 'PLANTAS',
            categoria: 'infraestructura',
            descripcion: 'Gestión de plantas potabilizadoras y de tratamiento de agua, control de procesos químicos y calidad del agua.',
            imagenFondo: '../../imagenes/diagnosticos/general/plantas.png',
            iconoCentral: 'fa-building',
            ruta: '../html/diagnosticos/plantas/plantas.html',
            stats: { registros: '8', actualizacion: 'Hoy' }
        },
        {
            id: 'plantas_sedimentadoras',
            nombre: 'PLANTAS SEDIMENTADORAS',
            categoria: 'infraestructura',
            descripcion: 'Plantas de sedimentación para tratamiento primario, monitoreo de lodos y eficiencia de clarificación.',
            imagenFondo: '../../imagenes/diagnosticos/general/plantas_sedimentadoras.png',
            iconoCentral: 'fa-filter',
            ruta: '../html/diagnosticos/plantas_sedimentadoras/plantas_sedimentadoras.html',
            stats: { registros: '5', actualizacion: 'Ayer' }
        },
        {
            id: 'pozos',
            nombre: 'POZOS',
            categoria: 'agua',
            descripcion: 'Monitoreo avanzado de pozos de extracción de agua, niveles estáticos, dinámicos y calidad del agua subterránea.',
            imagenFondo: '../../imagenes/diagnosticos/general/pozos.png',
            iconoCentral: 'fa-oil-can',
            ruta: '../html/diagnosticos/pozos/pozos.html',
            stats: { registros: '45', actualizacion: 'Hoy' }
        },
        {
            id: 'pozos_absorcion',
            nombre: 'POZOS DE ABSORCIÓN',
            categoria: 'infraestructura',
            descripcion: 'Pozos de absorción para infiltración de agua pluvial al subsuelo, control de capacidad y mantenimiento.',
            imagenFondo: '../../imagenes/diagnosticos/general/pozos_absorcion.png',
            iconoCentral: 'fa-arrow-down',
            ruta: '../html/diagnosticos/pozos_absorcion/pozos_absorcion.html',
            stats: { registros: '32', actualizacion: 'Ayer' }
        },
        {
            id: 'presas_gavion',
            nombre: 'PRESAS DE GAVIÓN',
            categoria: 'infraestructura',
            descripcion: 'Estructuras de retención de agua y control de sedimentos con gaviones, monitoreo estructural y sedimentación.',
            imagenFondo: '../../imagenes/diagnosticos/general/presas_gavion.png',
            iconoCentral: 'fa-mountain',
            ruta: '../html/diagnosticos/presas_gavion/presas_gavion.html',
            stats: { registros: '18', actualizacion: 'Hace 3 días' }
        },
        {
            id: 'tanques',
            nombre: 'TANQUES',
            categoria: 'infraestructura',
            descripcion: 'Tanques de almacenamiento de agua, control de niveles, capacidad disponible y mantenimiento programado.',
            imagenFondo: '../../imagenes/diagnosticos/general/tanques.png',
            iconoCentral: 'fa-drum',
            ruta: '../html/diagnosticos/tanques/tanques.html',
            stats: { registros: '67', actualizacion: 'Hoy' }
        },
        {
            id: 'valvulas',
            nombre: 'VÁLVULAS',
            categoria: 'control',
            descripcion: 'Control y monitoreo de válvulas de seccionamiento, regulación de caudal y presión en la red hidráulica.',
            imagenFondo: '../../imagenes/diagnosticos/general/valvulas.png',
            iconoCentral: 'fa-hand-paper',
            ruta: '../html/diagnosticos/valvulas/valvulas.html',
            stats: { registros: '89', actualizacion: 'Hoy' }
        },
        {
            id: 'zonas_inundacion',
            nombre: 'ZONAS DE INUNDACIÓN',
            categoria: 'monitoreo',
            descripcion: 'Identificación y monitoreo de zonas vulnerables a inundaciones, alertas tempranas y gestión de riesgos.',
            imagenFondo: '../../imagenes/diagnosticos/general/zonas_inundacion.png',
            iconoCentral: 'fa-map-marked-alt',
            ruta: '../html/diagnosticos/zonas_inundacion/zonas_inundacion.html',
            stats: { registros: '24', actualizacion: 'Hoy' }
        }
    ];
    
    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const cardsGrid = document.getElementById('cardsGrid');
    const iframeLoading = document.getElementById('iframeLoading');
    const totalCardsSpan = document.getElementById('totalCards');
    const totalCardsStat = document.getElementById('totalCardsStat');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    let currentFilter = 'all';
    
    // Actualizar contador
    if (totalCardsSpan) {
        totalCardsSpan.textContent = diagnosticosData.length;
    }
    if (totalCardsStat) {
        totalCardsStat.textContent = diagnosticosData.length;
    }
    
    // ============================================
    // FUNCIÓN PARA CAMBIAR IFRAME PADRE
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
    
    function cambiarIframePadre(ruta, nombre) {
        try {
            if (iframeLoading) {
                iframeLoading.style.display = 'flex';
            }
            
            const iframe = getParentIframe();
            
            if (iframe) {
                iframe.src = ruta;
                console.log(`✅ Redirigiendo iframe a: ${ruta} (${nombre})`);
            } else {
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'navigate',
                        url: ruta,
                        module: nombre
                    }, '*');
                    console.log(`📡 Enviando postMessage para navegar a: ${ruta}`);
                } else {
                    console.error('❌ No se pudo acceder al iframe padre');
                    window.location.href = ruta;
                }
            }
            
            setTimeout(() => {
                if (iframeLoading) {
                    iframeLoading.style.display = 'none';
                }
            }, 800);
            
        } catch(error) {
            console.error('❌ Error al cambiar el iframe:', error);
            window.location.href = ruta;
            if (iframeLoading) {
                iframeLoading.style.display = 'none';
            }
        }
    }
    
    // ============================================
    // CREAR TARJETA PREMIUM
    // ============================================
    function crearTarjeta(diagnostico, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-id', diagnostico.id);
        card.setAttribute('data-categoria', diagnostico.categoria);
        card.setAttribute('data-ruta', diagnostico.ruta);
        card.setAttribute('data-tooltip', `Ver detalles de ${diagnostico.nombre}`);
        card.style.animationDelay = `${index * 0.03}s`;
        
        // Efecto de glow con mouse
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
        
        // Obtener emoji de badge según categoría
        const getBadgeEmoji = (categoria) => {
            const emojis = {
                infraestructura: '🏗️',
                agua: '💧',
                monitoreo: '📊',
                control: '🎮'
            };
            return emojis[categoria] || '🔧';
        };
        
        // Obtener nombre legible de categoría
        const getCategoriaNombre = (categoria) => {
            const nombres = {
                infraestructura: 'Infraestructura',
                agua: 'Agua',
                monitoreo: 'Monitoreo',
                control: 'Control'
            };
            return nombres[categoria] || categoria;
        };
        
        // Obtener icono de stats
        const getStatsIcon = (categoria) => {
            const icons = {
                infraestructura: 'fa-hard-hat',
                agua: 'fa-tint',
                monitoreo: 'fa-eye',
                control: 'fa-sliders-h'
            };
            return icons[categoria] || 'fa-chart-simple';
        };
        
        card.innerHTML = `
            <div class="card-glow"></div>
            <div class="card-header">
                <div class="card-header-bg">
                    <img src="${diagnostico.imagenFondo}" alt="${diagnostico.nombre}" class="card-bg-image" onerror="this.style.display='none'">
                </div>
                <div class="card-icon">
                    <i class="fas ${diagnostico.iconoCentral}"></i>
                </div>
            </div>
            <div class="card-body">
                <div class="card-title">
                    ${diagnostico.nombre}
                    <span class="card-badge">${getBadgeEmoji(diagnostico.categoria)} ${getCategoriaNombre(diagnostico.categoria)}</span>
                </div>
                <div class="card-description">${diagnostico.descripcion}</div>
                <div class="card-footer">
                    <div class="card-stats">
                        <div class="card-stat">
                            <i class="fas ${getStatsIcon(diagnostico.categoria)}"></i>
                            <span>${diagnostico.stats.registros} registros</span>
                        </div>
                        <div class="card-stat">
                            <i class="fas fa-sync-alt"></i>
                            <span>${diagnostico.stats.actualizacion}</span>
                        </div>
                    </div>
                    <div class="card-action">
                        <span>Acceder</span>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        `;
        
        // Evento click
        card.addEventListener('click', () => {
            cambiarIframePadre(diagnostico.ruta, diagnostico.nombre);
        });
        
        return card;
    }
    
    // ============================================
    // RENDERIZAR TARJETAS CON FILTRO
    // ============================================
    function renderizarTarjetas() {
        if (!cardsGrid) {
            console.error('❌ Contenedor cardsGrid no encontrado');
            return;
        }
        
        cardsGrid.innerHTML = '';
        
        const filteredData = currentFilter === 'all' 
            ? diagnosticosData 
            : diagnosticosData.filter(d => d.categoria === currentFilter);
        
        filteredData.forEach((diagnostico, index) => {
            const tarjeta = crearTarjeta(diagnostico, index);
            cardsGrid.appendChild(tarjeta);
        });
        
        console.log(`✅ Renderizadas ${filteredData.length} tarjetas (filtro: ${currentFilter})`);
    }
    
    // ============================================
    // CONFIGURAR FILTROS
    // ============================================
    function setupFilters() {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                
                // Actualizar clase activa
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Aplicar filtro
                currentFilter = filter;
                renderizarTarjetas();
            });
        });
    }
    
    // ============================================
    // MANEJAR POSTMESSAGE
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
    function init() {
        renderizarTarjetas();
        setupFilters();
        window.addEventListener('message', handlePostMessage);
        
        if (iframeLoading) {
            iframeLoading.style.display = 'none';
        }
        
        console.log('✅ Diagnosticos Premium - Listo');
    }
    
    init();
});