/**
 * interfaz_general.js - Interfaz General con menú dinámico
 * MODIFICADO: Sidebar ultra compacto al colapsar
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 === INTERFAZ GENERAL ===');
    
    // ============================================
    // REFERENCIAS A ELEMENTOS DEL DOM
    // ============================================
    const sidebar = document.getElementById('mainSidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const navMenu = document.getElementById('navMenu');
    const mobileNavMenu = document.getElementById('mobileNavMenu');
    const mainIframe = document.getElementById('mainIframe');
    const pageTitle = document.getElementById('pageTitle');
    const logoutModal = document.getElementById('logoutModal');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    
    // Botón toggle para colapsar sidebar
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    
    // Tooltip elementos
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const userTooltip = document.getElementById('userTooltip');
    const tooltipUserName = document.getElementById('tooltipUserName');
    const tooltipUserRole = document.getElementById('tooltipUserRole');
    const tooltipUserArea = document.getElementById('tooltipUserArea');
    
    let menuItems = [];
    let isInitialized = false;
    let currentPageId = 'inicio';
    
    // Variable para almacenar datos del usuario
    let currentUserData = null;
    
    // ============================================
    // FUNCIONES PARA COLAPSAR SIDEBAR (ULTRA COMPACTO)
    // ============================================
    function toggleSidebar() {
        if (!sidebar) return;
        
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expandir sidebar
            sidebar.classList.remove('collapsed');
            localStorage.setItem('sidebar_collapsed', 'false');
            if (sidebarToggleBtn) {
                sidebarToggleBtn.querySelector('i').className = 'fas fa-chevron-left';
            }
        } else {
            // Colapsar sidebar
            sidebar.classList.add('collapsed');
            localStorage.setItem('sidebar_collapsed', 'true');
            if (sidebarToggleBtn) {
                sidebarToggleBtn.querySelector('i').className = 'fas fa-chevron-right';
            }
        }
        
        // Cerrar tooltip si está abierto
        cerrarTooltip();
        
        // Forzar reflow del iframe para ajustar tamaño
        setTimeout(() => {
            if (mainIframe) {
                const event = new Event('resize');
                window.dispatchEvent(event);
            }
        }, 300);
    }
    
    function expandSidebar() {
        if (!sidebar) return;
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            localStorage.setItem('sidebar_collapsed', 'false');
            if (sidebarToggleBtn) {
                sidebarToggleBtn.querySelector('i').className = 'fas fa-chevron-left';
            }
        }
    }
    
    function collapseSidebar() {
        if (!sidebar) return;
        if (!sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
            localStorage.setItem('sidebar_collapsed', 'true');
            if (sidebarToggleBtn) {
                sidebarToggleBtn.querySelector('i').className = 'fas fa-chevron-right';
            }
        }
    }
    
    function restaurarEstadoSidebar() {
        // Solo en desktop (ancho > 1024px)
        if (window.innerWidth > 1024) {
            const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
            if (isCollapsed) {
                collapseSidebar();
            } else {
                expandSidebar();
            }
        } else {
            // En móvil, asegurar que no está colapsado y que el sidebar está oculto
            if (sidebar && sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
            }
        }
    }
    
    // ============================================
    // FUNCIONES DEL MENÚ
    // ============================================
    function abrirMenuMobile() {
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function cerrarMenuMobile() {
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    function abrirMenuDesktop() {
        if (sidebar) {
            sidebar.classList.add('open');
        }
    }
    
    function cerrarMenuDesktop() {
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
    
    // ============================================
    // FUNCIONES DEL TOOLTIP
    // ============================================
    function actualizarTooltipUsuario(usuario) {
        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim();
        if (tooltipUserName) tooltipUserName.textContent = nombreCompleto || 'USUARIO';
        if (tooltipUserRole) tooltipUserRole.textContent = usuario.rol || 'SIN ROL';
        if (tooltipUserArea) tooltipUserArea.textContent = usuario.area || 'SIN ÁREA';
    }
    
    function mostrarTooltip(event) {
        if (!userTooltip) return;
        
        if (currentUserData) {
            actualizarTooltipUsuario(currentUserData);
        }
        
        const rect = userAvatarBtn.getBoundingClientRect();
        
        let top = rect.bottom + 8;
        let left = rect.left + (rect.width / 2) - (userTooltip.offsetWidth / 2);
        
        if (left < 10) left = 10;
        if (left + userTooltip.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - userTooltip.offsetWidth - 10;
        }
        
        userTooltip.style.top = top + 'px';
        userTooltip.style.left = left + 'px';
        
        userTooltip.classList.add('active');
        
        setTimeout(() => {
            cerrarTooltip();
        }, 3000);
    }
    
    function cerrarTooltip() {
        if (userTooltip) {
            userTooltip.classList.remove('active');
        }
    }
    
    function toggleTooltip(event) {
        event.stopPropagation();
        if (userTooltip && userTooltip.classList.contains('active')) {
            cerrarTooltip();
        } else {
            mostrarTooltip(event);
        }
    }
    
    function handleDocumentClickForTooltip(event) {
        if (!userTooltip) return;
        const isClickOnAvatar = userAvatarBtn && userAvatarBtn.contains(event.target);
        const isClickOnTooltip = userTooltip.contains(event.target);
        
        if (!isClickOnAvatar && !isClickOnTooltip && userTooltip.classList.contains('active')) {
            cerrarTooltip();
        }
    }
    
    // ============================================
    // MOSTRAR PÁGINA DE INICIO
    // ============================================
    function mostrarPaginaInicio() {
        if (!mainIframe) return;
        mainIframe.src = '../html/inicio/inicio.html';
        mainIframe.style.display = 'block';
    }
    
    // ============================================
    // ACTUALIZAR DATOS DEL USUARIO EN UI
    // ============================================
    function actualizarDatosUsuarioEnUI(usuario) {
        currentUserData = usuario;
        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim();
        
        const headerUserName = document.getElementById('headerUserName');
        const headerUserRole = document.getElementById('headerUserRole');
        const headerUserArea = document.getElementById('headerUserArea');
        
        if (headerUserName) headerUserName.textContent = nombreCompleto || 'USUARIO';
        if (headerUserRole) headerUserRole.textContent = usuario.rol || 'SIN ROL';
        if (headerUserArea) headerUserArea.textContent = usuario.area || 'SIN ÁREA';
        
        actualizarTooltipUsuario(usuario);
        
        window.USUARIO_MAESTRO = usuario.es_maestro === true || usuario.es_maestro === 1;
        
        if (window.USUARIO_MAESTRO) {
            console.log('👑 Usuario MAESTRO detectado');
        } else {
            console.log('👤 Usuario normal detectado');
        }
    }
    
    // ============================================
    // CARGAR DATOS DEL USUARIO
    // ============================================
    async function cargarDatosUsuario() {
        console.log('📋 Cargando datos del usuario...');
        
        try {
            const response = await fetch('../php/interfaz_general/obtener_usuario_actual.php');
            const data = await response.json();
            
            if (data.success && data.usuario) {
                const usuario = data.usuario;
                sessionStorage.setItem('usuario', JSON.stringify(usuario));
                actualizarDatosUsuarioEnUI(usuario);
                
                console.log('✅ Usuario cargado');
                return usuario;
            } else {
                console.error('❌ Error:', data.mensaje);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.mensaje || 'Error al cargar datos',
                    background: '#1a040b',
                    color: '#fff',
                    confirmButtonColor: '#bb9358'
                });
                setTimeout(() => window.location.href = '../index.html', 2000);
                return null;
            }
        } catch (error) {
            console.error('❌ Error de red:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor',
                background: '#1a040b',
                color: '#fff',
                confirmButtonColor: '#bb9358'
            });
            setTimeout(() => window.location.href = '../index.html', 2000);
            return null;
        }
    }
    
    // ============================================
    // CARGAR MENÚ DINÁMICO
    // ============================================
    async function cargarMenu() {
        console.log('📋 Cargando menú...');
        
        try {
            const response = await fetch('../php/interfaz_general/obtener_menu_usuario.php');
            const data = await response.json();
            
            if (data.success && data.menu && data.menu.length > 0) {
                const existingItems = navMenu.querySelectorAll('.nav-item:not([data-page="inicio"])');
                existingItems.forEach(item => item.remove());
                
                const existingMobileItems = mobileNavMenu.querySelectorAll('.mobile-nav-item:not([data-page="inicio"])');
                existingMobileItems.forEach(item => item.remove());
                
                menuItems = data.menu;
                
                menuItems.forEach(item => {
    const pageId = item.nombre.toLowerCase().replace(/ /g, '_');
    const camposPorBotonJSON = item.campos_por_boton ? JSON.stringify(item.campos_por_boton) : '';
    
    // Usar el ícono de la base de datos, si no existe usar el respaldo
    const iconoModulo = item.icono ? item.icono : getIconForModule(item.nombre);
    
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.setAttribute('data-page', pageId);
    li.setAttribute('data-ruta', item.ruta);
    li.setAttribute('data-botones', item.botones || '');
    li.setAttribute('data-campos-por-boton', camposPorBotonJSON);
    li.setAttribute('data-nombre', item.nombre);
    li.innerHTML = `
        <div class="nav-icon"><i class="fas ${iconoModulo}"></i></div>
        <span class="nav-text">${escapeHtml(item.nombre)}</span>
        <div class="nav-glow"></div>
        <div class="nav-active-indicator"></div>
    `;
    navMenu.appendChild(li);
    
    // Menú mobile
    const mobileLi = document.createElement('li');
    mobileLi.className = 'mobile-nav-item';
    mobileLi.setAttribute('data-page', pageId);
    mobileLi.setAttribute('data-ruta', item.ruta);
    mobileLi.setAttribute('data-botones', item.botones || '');
    mobileLi.setAttribute('data-campos-por-boton', camposPorBotonJSON);
    mobileLi.setAttribute('data-nombre', item.nombre);
    mobileLi.innerHTML = `
        <div class="mobile-nav-icon"><i class="fas ${iconoModulo}"></i></div>
        <span class="mobile-nav-text">${escapeHtml(item.nombre)}</span>
    `;
    mobileNavMenu.appendChild(mobileLi);
});
                
                console.log(`✅ Menú cargado: ${menuItems.length} módulos`);
                return true;
            } else {
                console.warn('⚠️ No se cargaron módulos');
                return false;
            }
        } catch (error) {
            console.error('❌ Error:', error);
            return false;
        }
    }
    
    function getIconForModule(nombre) {
    // Esta función ahora es solo un respaldo para cuando no haya ícono en BD
    // Los íconos vendrán directamente de la base de datos
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes('usuario') || nombreLower.includes('operativo')) return 'fa-users';
    if (nombreLower.includes('programa')) return 'fa-list-alt';
    if (nombreLower.includes('evento')) return 'fa-calendar-alt';
    if (nombreLower.includes('solicitante')) return 'fa-user-plus';
    if (nombreLower.includes('reporte')) return 'fa-chart-line';
    if (nombreLower.includes('config')) return 'fa-cog';
    if (nombreLower.includes('ayuda')) return 'fa-question-circle';
    return 'fa-folder';
}
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ============================================
    // CARGAR PÁGINA EN IFRAME
    // ============================================
    function cargarPagina(pageId, ruta, nombrePagina, botones, camposPorBoton) {
        console.log(`📄 Cargando página: ${pageId}`);
        
        if (currentPageId === pageId && pageId !== 'inicio') {
            return;
        }
        
        let tituloMostrado = nombrePagina || pageId.toUpperCase().replace(/_/g, ' ');
        if (pageId === 'inicio') tituloMostrado = 'INICIO';
        if (pageTitle) pageTitle.textContent = tituloMostrado;
        
        const allNavItems = document.querySelectorAll('.nav-item');
        allNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) item.classList.add('active');
        });
        
        const allMobileNavItems = document.querySelectorAll('.mobile-nav-item');
        allMobileNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) item.classList.add('active');
        });
        
        if (botones) {
            sessionStorage.setItem('permisos_botones_' + pageId, botones);
        } else {
            sessionStorage.removeItem('permisos_botones_' + pageId);
        }
        
        if (camposPorBoton) {
            if (typeof camposPorBoton === 'object') {
                sessionStorage.setItem('permisos_campos_por_boton_' + pageId, JSON.stringify(camposPorBoton));
            } else if (typeof camposPorBoton === 'string' && camposPorBoton.startsWith('{')) {
                sessionStorage.setItem('permisos_campos_por_boton_' + pageId, camposPorBoton);
            } else if (typeof camposPorBoton === 'string') {
                const objetoSimple = { default: camposPorBoton };
                sessionStorage.setItem('permisos_campos_por_boton_' + pageId, JSON.stringify(objetoSimple));
            }
        } else {
            sessionStorage.removeItem('permisos_campos_por_boton_' + pageId);
        }
        
        localStorage.setItem('interfaz_general_pagina_activa', pageId);
        localStorage.setItem('interfaz_general_ruta_activa', ruta || '');
        
        if (window.innerWidth <= 1024) {
            cerrarMenuMobile();
        }
        
        if (mainIframe) {
            if (pageId === 'inicio' || !ruta) {
                mostrarPaginaInicio();
            } else {
                mainIframe.src = ruta;
                mainIframe.style.display = 'block';
            }
        }
        
        currentPageId = pageId;
    }
    
    // ============================================
    // CONFIGURAR EVENTOS DEL MENÚ
    // ============================================
    function configurarEventosMenu() {
        navMenu.removeEventListener('click', handleMenuClick);
        navMenu.addEventListener('click', handleMenuClick);
        
        mobileNavMenu.removeEventListener('click', handleMobileMenuClick);
        mobileNavMenu.addEventListener('click', handleMobileMenuClick);
    }
    
    function handleMenuClick(e) {
        const targetItem = e.target.closest('.nav-item');
        if (!targetItem) return;
        
        const pageId = targetItem.getAttribute('data-page');
        const ruta = targetItem.getAttribute('data-ruta');
        const botones = targetItem.getAttribute('data-botones') || '';
        const camposPorBotonAttr = targetItem.getAttribute('data-campos-por-boton') || '';
        const nombre = targetItem.getAttribute('data-nombre') || targetItem.querySelector('.nav-text')?.textContent || pageId.toUpperCase();
        
        let camposPorBoton = null;
        if (camposPorBotonAttr) {
            try {
                camposPorBoton = JSON.parse(camposPorBotonAttr);
            } catch (e) {
                console.warn('Error parsing camposPorBoton:', e);
                camposPorBoton = camposPorBotonAttr;
            }
        }
        
        if (pageId === 'inicio') {
            cargarPagina('inicio', '', 'INICIO', '', null);
        } else if (ruta) {
            cargarPagina(pageId, ruta, nombre, botones, camposPorBoton);
        }
    }
    
    function handleMobileMenuClick(e) {
        const targetItem = e.target.closest('.mobile-nav-item');
        if (!targetItem) return;
        
        const pageId = targetItem.getAttribute('data-page');
        const ruta = targetItem.getAttribute('data-ruta');
        const botones = targetItem.getAttribute('data-botones') || '';
        const camposPorBotonAttr = targetItem.getAttribute('data-campos-por-boton') || '';
        const nombre = targetItem.getAttribute('data-nombre') || targetItem.querySelector('.mobile-nav-text')?.textContent || pageId.toUpperCase();
        
        let camposPorBoton = null;
        if (camposPorBotonAttr) {
            try {
                camposPorBoton = JSON.parse(camposPorBotonAttr);
            } catch (e) {
                console.warn('Error parsing camposPorBoton:', e);
                camposPorBoton = camposPorBotonAttr;
            }
        }
        
        if (pageId === 'inicio') {
            cargarPagina('inicio', '', 'INICIO', '', null);
        } else if (ruta) {
            cargarPagina(pageId, ruta, nombre, botones, camposPorBoton);
        }
        
        cerrarMenuMobile();
    }
    
    // ============================================
    // CIERRE DE SESIÓN
    // ============================================
    function cerrarSesion() {
        Swal.fire({
            title: 'Cerrando sesión',
            text: 'Hasta pronto',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#1a040b',
            color: '#fff'
        });
        
        sessionStorage.removeItem('usuario');
        localStorage.removeItem('interfaz_general_pagina_activa');
        localStorage.removeItem('interfaz_general_ruta_activa');
        
        setTimeout(() => window.location.href = '../index.html', 1500);
    }
    
    function mostrarModalCierreSesion() {
        if (logoutModal) logoutModal.classList.add('active');
    }
    
    function cerrarModalCierre() {
        if (logoutModal) logoutModal.classList.remove('active');
    }
    
    // ============================================
    // RESTAURAR PÁGINA ACTIVA
    // ============================================
    function restaurarPaginaActiva() {
        const paginaActiva = localStorage.getItem('interfaz_general_pagina_activa');
        
        if (paginaActiva && paginaActiva !== 'inicio') {
            const moduloExistente = menuItems.find(item => 
                item.nombre.toLowerCase().replace(/ /g, '_') === paginaActiva
            );
            if (moduloExistente) {
                cargarPagina(
                    paginaActiva, 
                    moduloExistente.ruta, 
                    moduloExistente.nombre, 
                    moduloExistente.botones, 
                    moduloExistente.campos_por_boton
                );
                return;
            }
        }
        cargarPagina('inicio', '', 'INICIO', '', null);
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    function initEventListeners() {
        if (mobileMenuBtn) {
            mobileMenuBtn.removeEventListener('click', abrirMenuMobile);
            mobileMenuBtn.addEventListener('click', abrirMenuMobile);
        }
        
        if (mobileMenuClose) {
            mobileMenuClose.removeEventListener('click', cerrarMenuMobile);
            mobileMenuClose.addEventListener('click', cerrarMenuMobile);
        }
        
        if (mobileMenuOverlay) {
            mobileMenuOverlay.removeEventListener('click', handleMobileOverlayClick);
            mobileMenuOverlay.addEventListener('click', handleMobileOverlayClick);
        }
        
        // Evento para colapsar sidebar
        if (sidebarToggleBtn) {
            sidebarToggleBtn.removeEventListener('click', toggleSidebar);
            sidebarToggleBtn.addEventListener('click', toggleSidebar);
        }
        
        document.removeEventListener('click', handleOutsideClick);
        document.addEventListener('click', handleOutsideClick);
        
        if (userAvatarBtn) {
            userAvatarBtn.removeEventListener('click', toggleTooltip);
            userAvatarBtn.addEventListener('click', toggleTooltip);
        }
        
        document.removeEventListener('click', handleDocumentClickForTooltip);
        document.addEventListener('click', handleDocumentClickForTooltip);
        
        const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
        if (logoutBtnSidebar) {
            logoutBtnSidebar.removeEventListener('click', mostrarModalCierreSesion);
            logoutBtnSidebar.addEventListener('click', mostrarModalCierreSesion);
        }
        
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.removeEventListener('click', mostrarModalCierreSesion);
            mobileLogoutBtn.addEventListener('click', mostrarModalCierreSesion);
        }
        
        if (modalCancelBtn) {
            modalCancelBtn.removeEventListener('click', cerrarModalCierre);
            modalCancelBtn.addEventListener('click', cerrarModalCierre);
        }
        
        if (modalConfirmBtn) {
            modalConfirmBtn.removeEventListener('click', handleConfirmLogout);
            modalConfirmBtn.addEventListener('click', handleConfirmLogout);
        }
        
        if (logoutModal) {
            logoutModal.removeEventListener('click', handleModalOutsideClick);
            logoutModal.addEventListener('click', handleModalOutsideClick);
        }
        
        document.removeEventListener('keydown', handleEscapeKey);
        document.addEventListener('keydown', handleEscapeKey);
        
        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);
    }
    
    function handleMobileOverlayClick(e) {
        if (e.target === mobileMenuOverlay) cerrarMenuMobile();
    }
    
    function handleOutsideClick(e) {
        if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
                cerrarMenuDesktop();
            }
        }
    }
    
    function handleConfirmLogout() {
        cerrarModalCierre();
        cerrarSesion();
    }
    
    function handleModalOutsideClick(e) {
        if (e.target === logoutModal) cerrarModalCierre();
    }
    
    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            if (logoutModal?.classList.contains('active')) cerrarModalCierre();
            if (mobileMenuOverlay?.classList.contains('active')) cerrarMenuMobile();
            if (window.innerWidth <= 1024 && sidebar?.classList.contains('open')) cerrarMenuDesktop();
            cerrarTooltip();
        }
    }
    
    function handleResize() {
        if (window.innerWidth > 1024) {
            if (sidebar) sidebar.classList.remove('open');
            if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            cerrarTooltip();
            
            const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
            if (isCollapsed && !sidebar.classList.contains('collapsed')) {
                collapseSidebar();
            } else if (!isCollapsed && sidebar.classList.contains('collapsed')) {
                expandSidebar();
            }
        } else {
            if (sidebar && sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
            }
        }
    }
    
    // ============================================
    // INIT
    // ============================================
    async function init() {
        console.log('🚀 Inicializando...');
        
        if (isInitialized) return;
        
        const usuario = await cargarDatosUsuario();
        if (!usuario) return;
        
        await cargarMenu();
        configurarEventosMenu();
        initEventListeners();
        restaurarPaginaActiva();
        restaurarEstadoSidebar();
        
        isInitialized = true;
        console.log('✅ Listo');
    }
    
    init();
});