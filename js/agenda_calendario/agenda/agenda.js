/**
 * agenda.js - Módulo de Agenda con diseño tipo libro/bitácora
 * VERSIÓN COMPLETA - CON COMPARTIR POR ÁREA
 */

const AgendaModule = {
    
    // Datos
    eventos: [],
    editandoId: null,
    archivosSeleccionados: [],
    archivosAEliminar: [],
    modalAnterior: null,
    
    // Usuarios y áreas
    areasConUsuarios: [],      // [{ area_id, area_nombre, usuarios: [...] }]
    usuariosSeleccionados: [], // Array de identificadores
    
    // Ubicación
    ubicacionLinkSeleccionado: null,
    mapaEvento: null,
    marcadorEvento: null,
    linkGoogleMapsEvento: null,
    
    // Filtro actual (all, mine, shared)
    filtroActual: 'all',
    
    // Configuración
    config: {
        api: {
            agenda: '../../../php/agenda_calendario/agenda/agenda_api.php'
        },
        rutas: {
            calendario: '../../../html/agenda_calendario/calendario/calendario.html'
        }
    },
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    init: function() {
        console.log('📋 Inicializando módulo de agenda (diseño libro)...');
        
        $('#agendaLoading').show();
        
        this.cargarEventos();
        this.setupEventListeners();
        this.inicializarSelectMeses();
        
        console.log('✅ Módulo de agenda listo');
    },
    
    // Obtener identificador del usuario actual
    obtenerIdentificadorActual: function() {
        try {
            let usuarioStr = sessionStorage.getItem('usuario');
            
            if (!usuarioStr) {
                usuarioStr = localStorage.getItem('usuario');
            }
            
            if (usuarioStr) {
                const usuario = JSON.parse(usuarioStr);
                console.log('👤 Usuario encontrado:', usuario);
                
                let identificador = usuario.identificador || '';
                
                if (!identificador) {
                    console.warn('⚠️ No se encontró campo "identificador" en el usuario');
                    console.log('🔍 Campos disponibles:', Object.keys(usuario));
                    return '';
                }
                
                console.log('✅ Identificador a usar:', identificador);
                return String(identificador).trim();
            }
            
            console.error('❌ No se encontró usuario en sessionStorage ni localStorage');
            return '';
        } catch(e) {
            console.error('❌ Error al obtener identificador:', e);
            return '';
        }
    },
    
    // Inicializar select de meses
    inicializarSelectMeses: function() {
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        
        let options = '<option value="">MES</option>';
        meses.forEach((mes, index) => {
            const mesNum = String(index + 1).padStart(2, '0');
            options += `<option value="${mesNum}">${mes}</option>`;
        });
        
        $('#filtroMes').html(options);
        
        // También para los selects de reportes
        $('#reporteMes, #reporteMesMes').html(options);
    },
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    setupEventListeners: function() {
        // Botones principales
        $('#btnNuevoEvento').off('click').on('click', () => this.abrirModalNuevaAnotacion());
        $('#btnGenerarReporte').off('click').on('click', () => this.generarReporte());
        $('#btnIrCalendario').off('click').on('click', () => {
            window.location.href = this.config.rutas.calendario;
        });
        
        // Filtros
        $('#filtroDia, #filtroMes, #filtroAnio').off('input change').on('input change', () => {
            this.aplicarFiltros();
        });
        
        $('#btnLimpiarFiltros').off('click').on('click', () => this.limpiarFiltros());
        
        // Pestañas de filtro
        $('.filter-tab').off('click').on('click', (e) => {
            const tab = $(e.currentTarget);
            const filter = tab.data('filter');
            
            $('.filter-tab').removeClass('active');
            tab.addClass('active');
            
            this.filtroActual = filter;
            this.aplicarFiltros();
        });
        
        // Vista (lista/grid)
        $('.events-view-toggle i').off('click').on('click', (e) => {
            const icon = $(e.currentTarget);
            const view = icon.data('view');
            
            $('.events-view-toggle i').removeClass('active');
            icon.addClass('active');
            
            if (view === 'grid') {
                $('#eventosLista').addClass('grid');
            } else {
                $('#eventosLista').removeClass('grid');
            }
        });
        
        // Modales
        $('#btnCerrarModalAnotacion, #btnCancelarAnotacion').off('click').on('click', () => {
            this.cerrarModal('#modalNuevaAnotacion');
        });
        
        $('#btnCerrarDetalleAnotacion').off('click').on('click', () => {
            this.cerrarModal('#modalDetalleAnotacion');
        });
        
        $('#btnRegresarDesdeNueva, #btnRegresarDeDetalle').off('click').on('click', () => {
            this.cerrarModal('#modalNuevaAnotacion');
            this.cerrarModal('#modalDetalleAnotacion');
        });
        
        // Formulario
        $('#formAnotacion').off('submit').on('submit', (e) => this.guardarAnotacion(e));
        
        // Botones de detalle
        $('#btnEditarAnotacion').off('click').on('click', () => this.editarAnotacion());
        $('#btnEliminarAnotacion').off('click').on('click', () => this.eliminarAnotacion());
        
        // Filtros de entrada (solo números)
        $('#filtroDia').on('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').substring(0, 2);
        });
        
        $('#filtroAnio').on('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').substring(0, 4);
        });
        
        // Mayúsculas en título y descripción
        $('#anotacionTitulo, #anotacionDescripcion').on('input', function() {
            this.value = this.value.toUpperCase();
        });
        
        // Configurar reportes
        this.configurarReportes();
        
        // Configurar ubicación
        this.configurarToggleUbicacion();
        this.configurarGoogleMapsModo();
    },
    
    // ============================================
    // CARGAR USUARIOS POR ÁREA
    // ============================================
    cargarUsuariosPorArea: function() {
        const identificadorActual = this.obtenerIdentificadorActual();
        
        console.log('🔍 Cargando usuarios por área - Mi identificador:', identificadorActual);
        
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.config.api.agenda,
                type: 'GET',
                data: { 
                    action: 'getUsuariosPorArea', 
                    identificador: identificadorActual
                },
                dataType: 'json',
                success: (response) => {
                    console.log('✅ Usuarios por área recibidos:', response);
                    
                    if (response.success) {
                        this.areasConUsuarios = response.data;
                        this.renderAreasConUsuarios();
                        resolve(response.data);
                    } else {
                        this.areasConUsuarios = [];
                        this.renderAreasConUsuarios();
                        reject(response.message);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Error al cargar usuarios por área:', error);
                    this.areasConUsuarios = [];
                    this.renderAreasConUsuarios();
                    reject(error);
                }
            });
        });
    },
    
    // Renderizar áreas con acordeón y usuarios
renderAreasConUsuarios: function() {
    const container = $('#compartirAreasContainer');
    
    if (!this.areasConUsuarios || this.areasConUsuarios.length === 0) {
        container.html(`
            <div class="no-results-book" style="padding: 30px;">
                <i class="fas fa-users-slash"></i>
                <p>NO HAY OTROS USUARIOS EN EL SISTEMA</p>
            </div>
        `);
        return;
    }
    
    // Guardar qué áreas están abiertas ANTES de re-renderizar
    const openAreas = [];
    $('.area-acordeon').each(function() {
        const areaDiv = $(this);
        const usuariosDiv = areaDiv.find('.area-usuarios');
        if (usuariosDiv.hasClass('open')) {
            const areaId = areaDiv.data('area-id');
            if (areaId) openAreas.push(String(areaId));
        }
    });
    
    let html = '';
    
    this.areasConUsuarios.forEach(area => {
        const areaId = area.area_id;
        const areaNombre = area.area_nombre;
        const usuarios = area.usuarios || [];
        
        // Verificar si esta área estaba abierta antes
        const wasOpen = openAreas.includes(String(areaId));
        const openClass = wasOpen ? 'open' : '';
        const chevronClass = wasOpen ? 'fa-chevron-down' : 'fa-chevron-right';
        
        // Ícono según el área
        let areaIcon = this.getAreaIcon(areaNombre);
        
        html += `
            <div class="area-acordeon" data-area-id="${areaId}">
                <div class="area-acordeon-header">
                    <i class="${areaIcon}"></i>
                    <span class="area-nombre">${this.escapeHTML(areaNombre)}</span>
                    <div class="area-actions">
                        <button type="button" class="btn-select-all-area" data-area="${areaId}">
                            <i class="fas fa-check-double"></i> TODOS
                        </button>
                        <button type="button" class="btn-deselect-all-area" data-area="${areaId}">
                            <i class="fas fa-times-circle"></i> NINGUNO
                        </button>
                    </div>
                    <i class="fas ${chevronClass}"></i>
                </div>
                <div class="area-usuarios ${openClass}">
                    <div class="usuarios-grid">
        `;
        
        usuarios.forEach(usuario => {
            const identificador = usuario.identificador;
            const nombreCompleto = `${usuario.nombre} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim();
            const isSelected = this.usuariosSeleccionados.includes(identificador);
            
            html += `
                <div class="usuario-item-book ${isSelected ? 'selected' : ''}" data-identificador="${identificador}">
                    <input type="checkbox" class="usuario-checkbox" value="${identificador}" ${isSelected ? 'checked' : ''}>
                    <div class="usuario-nombre-book">
                        ${this.escapeHTML(nombreCompleto)}
                        <small>${this.escapeHTML(identificador)}</small>
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    container.html(html);
    
    // Configurar eventos de los acordeones
    $('.area-acordeon-header').off('click').on('click', function(e) {
        if ($(e.target).closest('.area-actions').length) return;
        
        const areaDiv = $(this).closest('.area-acordeon');
        const usuariosDiv = areaDiv.find('.area-usuarios');
        const icon = $(this).find('.fa-chevron-right, .fa-chevron-down');
        
        if (usuariosDiv.hasClass('open')) {
            usuariosDiv.removeClass('open');
            icon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
        } else {
            usuariosDiv.addClass('open');
            icon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
        }
    });
    
    // Configurar eventos de selección de usuarios
    $('.usuario-item-book').off('click').on('click', function(e) {
        if ($(e.target).hasClass('usuario-checkbox')) return;
        const checkbox = $(this).find('.usuario-checkbox');
        checkbox.prop('checked', !checkbox.prop('checked'));
        checkbox.trigger('change');
    });
    
    $('.usuario-checkbox').off('change').on('change', (e) => {
        e.stopPropagation();
        const checkbox = $(e.currentTarget);
        const identificador = checkbox.val();
        const item = checkbox.closest('.usuario-item-book');
        
        if (checkbox.prop('checked')) {
            if (!this.usuariosSeleccionados.includes(identificador)) {
                this.usuariosSeleccionados.push(identificador);
            }
            item.addClass('selected');
        } else {
            this.usuariosSeleccionados = this.usuariosSeleccionados.filter(n => n !== identificador);
            item.removeClass('selected');
        }
    });
    
    // Configurar eventos de seleccionar/deseleccionar por área
    const self = this;
    $('.btn-select-all-area').off('click').on('click', function(e) {
        e.stopPropagation();
        const areaId = $(this).data('area');
        const area = self.areasConUsuarios.find(a => a.area_id == areaId);
        
        if (area && area.usuarios) {
            area.usuarios.forEach(usuario => {
                const identificador = usuario.identificador;
                if (!self.usuariosSeleccionados.includes(identificador)) {
                    self.usuariosSeleccionados.push(identificador);
                }
            });
            // Re-renderizar SIN perder el estado de los acordeones
            self.renderAreasConUsuarios();
            self.mostrarNotificacion(`TODOS LOS USUARIOS DE ${area.area_nombre} SELECCIONADOS`, 'success');
        }
    });
    
    $('.btn-deselect-all-area').off('click').on('click', function(e) {
        e.stopPropagation();
        const areaId = $(this).data('area');
        const area = self.areasConUsuarios.find(a => a.area_id == areaId);
        
        if (area && area.usuarios) {
            area.usuarios.forEach(usuario => {
                self.usuariosSeleccionados = self.usuariosSeleccionados.filter(n => n !== usuario.identificador);
            });
            // Re-renderizar SIN perder el estado de los acordeones
            self.renderAreasConUsuarios();
            self.mostrarNotificacion(`USUARIOS DE ${area.area_nombre} DESELECCIONADOS`, 'info');
        }
    });
},
    
    // Obtener ícono según el nombre del área
    getAreaIcon: function(areaNombre) {
        const nombre = areaNombre.toUpperCase();
        if (nombre.includes('INNOVACION') || nombre.includes('TECNOLOGICA')) {
            return 'fas fa-microchip';
        } else if (nombre.includes('DIRECCION') || nombre.includes('GENERAL')) {
            return 'fas fa-building';
        } else if (nombre.includes('ATENCION') || nombre.includes('USUARIOS')) {
            return 'fas fa-headset';
        } else if (nombre.includes('ALMACEN')) {
            return 'fas fa-warehouse';
        } else {
            return 'fas fa-users';
        }
    },
    
    // ============================================
    // CARGAR EVENTOS
    // ============================================
    cargarEventos: function() {
        const self = this;
        const identificador = this.obtenerIdentificadorActual();
        
        console.log('🔍 Cargando eventos para identificador:', identificador);
        
        $.ajax({
            url: this.config.api.agenda,
            type: 'GET',
            data: { action: 'getAll', identificador: identificador },
            dataType: 'json',
            success: function(response) {
                console.log('✅ Eventos cargados:', response);
                $('#agendaLoading').hide();
                
                if (response.success && response.data) {
                    self.eventos = response.data;
                } else {
                    console.warn('⚠️ No se pudieron cargar eventos:', response.message);
                    self.eventos = [];
                }
                
                self.aplicarFiltros();
                self.actualizarContadores();
            },
            error: function(xhr, status, error) {
                console.error('❌ Error al cargar eventos:', error);
                $('#agendaLoading').hide();
                self.eventos = [];
                self.renderEventos([]);
            }
        });
    },
    
    // Actualizar contadores del header
    actualizarContadores: function() {
        const identificadorActual = this.obtenerIdentificadorActual();
        const misEventos = this.eventos.filter(e => e.identificador_creador === identificadorActual);
        const totalEventos = this.eventos.length;
        
        $('#totalEventosStat').text(totalEventos);
        $('#totalEventos').text(`${totalEventos} ANOTACIONES`);
    },
    
    // Aplicar filtros (fecha + pestañas)
    aplicarFiltros: function() {
        const dia = $('#filtroDia').val();
        const mes = $('#filtroMes').val();
        const anio = $('#filtroAnio').val();
        const identificadorActual = this.obtenerIdentificadorActual();
        
        let eventosFiltrados = [...this.eventos];
        
        // Filtro por pestaña
        if (this.filtroActual === 'mine') {
            eventosFiltrados = eventosFiltrados.filter(e => e.identificador_creador === identificadorActual);
        } else if (this.filtroActual === 'shared') {
            eventosFiltrados = eventosFiltrados.filter(e => e.identificador_creador !== identificadorActual);
        }
        
        // Filtro por fecha
        if (dia || mes || anio) {
            eventosFiltrados = eventosFiltrados.filter(evento => {
                const fechaEvento = evento.fecha;
                const [eventoAnio, eventoMes, eventoDia] = fechaEvento.split('-');
                
                let coincide = true;
                if (anio && eventoAnio !== anio) coincide = false;
                if (coincide && mes && eventoMes !== mes) coincide = false;
                if (coincide && dia && eventoDia !== dia.padStart(2, '0')) coincide = false;
                
                return coincide;
            });
        }
        
        this.renderEventos(eventosFiltrados);
        $('#totalEventos').text(`${eventosFiltrados.length} ANOTACIONES`);
    },
    
    // Renderizar eventos en tarjetas
    renderEventos: function(eventos) {
        const lista = $('#eventosLista');
        const identificadorActual = this.obtenerIdentificadorActual();
        
        if (!eventos || eventos.length === 0) {
            lista.html(`
                <div class="no-results-book">
                    <i class="fas fa-book-open"></i>
                    <h3>BITÁCORA VACÍA</h3>
                    <p>NO HAY EVENTOS EN LA AGENDA</p>
                </div>
            `);
            return;
        }
        
        // Ordenar por fecha descendente
        eventos.sort((a, b) => b.fecha.localeCompare(a.fecha));
        
        let html = '';
        eventos.forEach(evento => {
            const fechaObj = new Date(evento.fecha + 'T12:00:00');
            const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).toUpperCase();
            
            const esCreador = (evento.identificador_creador === identificadorActual);
            const archivos = evento.archivos ? JSON.parse(evento.archivos) : [];
            
            html += `
                <div class="event-card" data-id="${evento.id_evento}">
                    <div class="event-card-header">
                        <div class="event-fecha">
                            <i class="fas fa-calendar-alt"></i>
                            ${fechaFormateada}
                        </div>
                        <div class="event-badge ${esCreador ? 'mine' : 'shared'}">
                            <i class="fas ${esCreador ? 'fa-user-pen' : 'fa-share-alt'}"></i>
                            ${esCreador ? 'MÍA' : 'COMPARTIDA'}
                        </div>
                    </div>
                    <div class="event-titulo">
                        <h4>${this.escapeHTML(evento.titulo || 'SIN TÍTULO')}</h4>
                    </div>
                    <div class="event-hora">
                        <i class="fas fa-clock"></i>
                        ${evento.hora || 'HORA NO ESPECIFICADA'}
                    </div>
                    <div class="event-descripcion">
                        ${this.escapeHTML(evento.descripcion || 'SIN DESCRIPCIÓN')}
                    </div>
                    <div class="event-footer">
                        ${archivos.length > 0 ? `<span><i class="fas fa-paperclip"></i> ${archivos.length} ARCHIVOS</span>` : ''}
                        ${evento.ubicacion_link || (evento.ubicacion_lat && evento.ubicacion_lng) ? `<span><i class="fas fa-map-marker-alt"></i> UBICACIÓN</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        lista.html(html);
        
        // Evento click en tarjeta
        $('.event-card').off('click').on('click', (e) => {
            const id = $(e.currentTarget).data('id');
            this.mostrarDetalleAnotacion(id);
        });
    },
    
    // Limpiar filtros
    limpiarFiltros: function() {
        $('#filtroDia, #filtroAnio').val('');
        $('#filtroMes').val('');
        this.filtroActual = 'all';
        $('.filter-tab').removeClass('active');
        $('.filter-tab[data-filter="all"]').addClass('active');
        this.aplicarFiltros();
        this.mostrarNotificacion('FILTROS LIMPIADOS', 'success');
    },
    
    // ============================================
    // MOSTRAR DETALLE DE ANOTACIÓN
    // ============================================
    mostrarDetalleAnotacion: function(id) {
        const evento = this.eventos.find(e => e.id_evento == id);
        if (!evento) return;
        
        this.editandoId = id;
        
        const usuarioActual = this.obtenerIdentificadorActual();
        const esCreador = (evento.identificador_creador === usuarioActual);
        
        // Habilitar/deshabilitar botones según permisos
        if (!esCreador) {
            $('#btnEditarAnotacion').prop('disabled', true).css('opacity', '0.5').css('cursor', 'not-allowed');
            $('#btnEliminarAnotacion').prop('disabled', true).css('opacity', '0.5').css('cursor', 'not-allowed');
        } else {
            $('#btnEditarAnotacion').prop('disabled', false).css('opacity', '1').css('cursor', 'pointer');
            $('#btnEliminarAnotacion').prop('disabled', false).css('opacity', '1').css('cursor', 'pointer');
        }
        
        const fechaObj = new Date(evento.fecha + 'T12:00:00');
        const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).toUpperCase();
        
        const archivos = evento.archivos ? JSON.parse(evento.archivos) : [];
        
        let archivosHtml = '';
        if (archivos.length > 0) {
            archivosHtml = '<div class="archivos-lista-detalle">';
            archivos.forEach((archivo, index) => {
                const archivoJson = JSON.stringify(archivo).replace(/'/g, "&#39;");
                const todosJson = JSON.stringify(archivos).replace(/'/g, "&#39;");
                
                archivosHtml += `
                    <div class="archivo-detalle-item" style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(187,147,88,0.1);">
                        <i class="fas fa-file-alt" style="color: #bb9358; width: 24px;"></i>
                        <span style="flex: 1; word-break: break-all; font-size: 0.85rem;">${this.escapeHTML(archivo.nombre)}</span>
                        <button class="btn-descargar-archivo" data-ruta="../../${archivo.ruta}" data-nombre="${archivo.nombre}" data-id="${evento.id_evento}"
                                style="background: rgba(187, 147, 88, 0.15); border: none; border-radius: 8px; padding: 6px 10px; color: #bb9358; cursor: pointer;">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-ver-archivo" data-archivo='${archivoJson}' data-todos='${todosJson}'
                                style="background: rgba(187, 147, 88, 0.15); border: none; border-radius: 8px; padding: 6px 10px; color: #bb9358; cursor: pointer;">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;
            });
            archivosHtml += '</div>';
        } else {
            archivosHtml = '<span style="color: var(--text-white-50);">NO HAY ARCHIVOS ADJUNTOS</span>';
        }
        
        let ubicacionHtml = '';
        if (evento.ubicacion_link) {
            let link = evento.ubicacion_link;
            let textoAmigable = link.length > 50 ? link.substring(0, 47) + '...' : link;
            
            ubicacionHtml = `
                <div class="detalle-item-book" style="flex-direction: column; align-items: flex-start;">
                    <span class="detalle-label-book" style="margin-bottom: 10px;">UBICACIÓN:</span>
                    <div class="detalle-value-book" style="width: 100%;">
                        <a href="${link}" target="_blank" class="btn-detalle-edit" style="text-decoration: none; display: inline-flex;">
                            <i class="fab fa-google"></i> VER EN GOOGLE MAPS
                        </a>
                        <small style="display: block; margin-top: 8px; color: var(--text-white-50); word-break: break-all;">
                            ${this.escapeHTML(textoAmigable)}
                        </small>
                    </div>
                </div>
            `;
        } else if (evento.ubicacion_lat && evento.ubicacion_lng) {
            const googleMapsLink = `https://www.google.com/maps?q=${evento.ubicacion_lat},${evento.ubicacion_lng}`;
            ubicacionHtml = `
                <div class="detalle-item-book" style="flex-direction: column; align-items: flex-start;">
                    <span class="detalle-label-book" style="margin-bottom: 10px;">UBICACIÓN:</span>
                    <div class="detalle-value-book" style="width: 100%;">
                        <a href="${googleMapsLink}" target="_blank" class="btn-detalle-edit" style="text-decoration: none; display: inline-flex;">
                            <i class="fas fa-map-marker-alt"></i> VER EN GOOGLE MAPS
                        </a>
                        <small style="display: block; margin-top: 8px; color: var(--text-white-50);">
                            Coordenadas: ${evento.ubicacion_lat}, ${evento.ubicacion_lng}
                        </small>
                    </div>
                </div>
            `;
        }
        
        let html = `
            <div class="detalle-item-book">
                <span class="detalle-label-book">FECHA:</span>
                <span class="detalle-value-book">${fechaFormateada}</span>
            </div>
            <div class="detalle-item-book">
                <span class="detalle-label-book">HORA:</span>
                <span class="detalle-value-book">${evento.hora || 'NO ESPECIFICADA'}</span>
            </div>
            <div class="detalle-item-book">
                <span class="detalle-label-book">TÍTULO:</span>
                <span class="detalle-value-book">${this.escapeHTML(evento.titulo || 'SIN TÍTULO')}</span>
            </div>
            <div class="detalle-item-book descripcion-item-book">
                <span class="detalle-label-book">DESCRIPCIÓN:</span>
                <div class="detalle-value-book">${this.escapeHTML(evento.descripcion || 'SIN DESCRIPCIÓN')}</div>
            </div>
            ${ubicacionHtml}
            <div class="detalle-item-book" style="flex-direction: column; align-items: flex-start;">
                <span class="detalle-label-book" style="margin-bottom: 10px;">ARCHIVOS:</span>
                <div class="detalle-value-book" style="width: 100%;">${archivosHtml}</div>
            </div>
        `;
        
        $('#detalleAnotacionContent').html(html);
        
        // Eventos de archivos
        $('.btn-descargar-archivo').off('click').on('click', (e) => {
            e.stopPropagation();
            const boton = $(e.currentTarget);
            const nombre = boton.data('nombre');
            const idEvento = boton.data('id');
            
            const enlace = document.createElement('a');
            enlace.href = `${this.config.api.agenda}?descargar=1&id_evento=${idEvento}&nombre=${encodeURIComponent(nombre)}`;
            enlace.download = nombre;
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            
            this.mostrarNotificacion(`DESCARGANDO: ${nombre}`, 'info');
        });
        
        $('.btn-ver-archivo').off('click').on('click', (e) => {
            e.stopPropagation();
            const boton = $(e.currentTarget);
            const archivoStr = boton.data('archivo');
            const todosStr = boton.data('todos');
            
            try {
                const archivo = typeof archivoStr === 'string' ? JSON.parse(archivoStr.replace(/&#39;/g, "'")) : archivoStr;
                const todos = typeof todosStr === 'string' ? JSON.parse(todosStr.replace(/&#39;/g, "'")) : todosStr;
                
                if (window.VisorArchivos) {
                    window.VisorArchivos.abrirVisor(archivo, todos);
                } else {
                    this.mostrarNotificacion('Error: El visor de archivos no está disponible', 'error');
                }
            } catch(error) {
                console.error('Error al parsear datos del archivo:', error);
                this.mostrarNotificacion('Error al cargar el visor de archivos', 'error');
            }
        });
        
        this.abrirModal('#modalDetalleAnotacion');
    },
    
    // ============================================
    // NUEVA ANOTACIÓN - MODAL
    // ============================================
    abrirModalNuevaAnotacion: function(modalAnterior = null) {
        this.editandoId = null;
        this.archivosAEliminar = [];
        this.modalAnterior = modalAnterior;
        this.usuariosSeleccionados = [];
        this.linkGoogleMapsEvento = null;
        
        $('#modalAnotacionTitulo').text('NUEVA ANOTACIÓN');
        $('#formAnotacion')[0].reset();
        
        // Resetear archivos
        $('#archivosContainer').html(`
            <div class="archivo-input-group-book">
                <input type="file" id="anotacionArchivo1" class="form-control-book archivo-input" multiple>
                <button type="button" class="btn-agregar-archivo-book" onclick="AgendaModule.agregarCampoArchivo()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `);
        
        // Fecha actual
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        $('#anotacionFecha').val(`${year}-${month}-${day}`);
        
        // Limpiar ubicación
        $('#ubicacion_lat, #ubicacion_lng, #ubicacion_link').val('');
        $('#linkGoogleMapsEvento').val('');
        $('#linkPreviewMapsEvento').hide();
        $('#ubicacionPreviewEvento').html('');
        
        // Resetear modos
        $('#btnModoMapa').addClass('active');
        $('#btnModoGoogleMaps').removeClass('active');
        $('#modoMapaContainer').show();
        $('#modoGoogleMapsContainer').hide();
        
        // Inicializar mapa
        setTimeout(() => {
            this.iniciarMapa();
        }, 200);
        
        // Cargar usuarios por área
        $('#compartirAreasContainer').html(`
            <div style="text-align: center; padding: 30px;">
                <div class="book-loader-page" style="display: inline-block; margin: 0 5px;"></div>
                <p style="margin-top: 10px;">CARGANDO USUARIOS...</p>
            </div>
        `);
        this.cargarUsuariosPorArea();
        
        this.abrirModal('#modalNuevaAnotacion');
    },
    
    // ============================================
    // GUARDAR ANOTACIÓN
    // ============================================
    guardarAnotacion: function(e) {
        e.preventDefault();
        
        const fecha = $('#anotacionFecha').val();
        const titulo = $('#anotacionTitulo').val().trim();
        
        const formData = new FormData();
        formData.append('action', this.editandoId !== null ? 'update' : 'insert');
        
        let fechaFinal = fecha || new Date().toISOString().split('T')[0];
        formData.append('fecha', fechaFinal);
        formData.append('hora', $('#anotacionHora').val() || '');
        formData.append('titulo', titulo || 'SIN TÍTULO');
        formData.append('descripcion', $('#anotacionDescripcion').val().trim() || '');
        formData.append('identificador_creador', this.obtenerIdentificadorActual());
        formData.append('usuarios_compartidos', JSON.stringify(this.usuariosSeleccionados));
        
        // Ubicación
        const ubicacionLink = $('#ubicacion_link').val();
        const ubicacionLat = $('#ubicacion_lat').val();
        const ubicacionLng = $('#ubicacion_lng').val();
        
        if (ubicacionLink) formData.append('ubicacion_link', ubicacionLink);
        if (ubicacionLat && ubicacionLng) {
            formData.append('ubicacion_lat', ubicacionLat);
            formData.append('ubicacion_lng', ubicacionLng);
        }
        
        if (this.editandoId !== null) {
            formData.append('id_evento', this.editandoId);
            if (this.archivosAEliminar && this.archivosAEliminar.length > 0) {
                formData.append('archivos_eliminar', JSON.stringify(this.archivosAEliminar));
            }
        }
        
        // Archivos
        $('.archivo-input').each(function() {
            const files = this.files;
            for (let i = 0; i < files.length; i++) {
                formData.append('archivos[]', files[i]);
            }
        });
        
        this.mostrarNotificacion('GUARDANDO...', 'info');
        
        const self = this;
        $.ajax({
            url: this.config.api.agenda,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                console.log('✅ Respuesta del servidor:', response);
                
                if (response.success) {
                    self.cargarEventos();
                    self.cerrarModal('#modalNuevaAnotacion');
                    if (self.editandoId !== null) self.cerrarModal('#modalDetalleAnotacion');
                    
                    self.mostrarNotificacion(
                        self.editandoId !== null ? 'ANOTACIÓN ACTUALIZADA' : 'ANOTACIÓN GUARDADA',
                        'success'
                    );
                } else {
                    self.mostrarNotificacion('ERROR: ' + (response.message || 'NO SE PUDO GUARDAR'), 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ Error en la petición:', error);
                self.mostrarNotificacion('ERROR DE CONEXIÓN CON EL SERVIDOR', 'error');
            }
        });
    },
    
    // ============================================
    // EDITAR ANOTACIÓN
    // ============================================
    editarAnotacion: function() {
        const evento = this.eventos.find(e => e.id_evento == this.editandoId);
        if (!evento) return;
        
        this.cerrarModal('#modalDetalleAnotacion');
        
        $('#modalAnotacionTitulo').text('EDITAR ANOTACIÓN');
        $('#anotacionFecha').val(evento.fecha);
        $('#anotacionHora').val(evento.hora || '');
        $('#anotacionTitulo').val(evento.titulo || '');
        $('#anotacionDescripcion').val(evento.descripcion || '');
        
        // Usuarios seleccionados
        this.usuariosSeleccionados = (evento.usuarios_compartidos && Array.isArray(evento.usuarios_compartidos)) 
            ? [...evento.usuarios_compartidos] 
            : [];
        
        // Archivos existentes
        this.archivosAEliminar = [];
        const archivos = evento.archivos ? JSON.parse(evento.archivos) : [];
        this.mostrarArchivosExistentes(archivos);
        
        $('#archivosContainer').html(`
            <div class="archivo-input-group-book">
                <input type="file" id="anotacionArchivo1" class="form-control-book archivo-input" multiple>
                <button type="button" class="btn-agregar-archivo-book" onclick="AgendaModule.agregarCampoArchivo()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `);
        
        // Configurar ubicación
        if (evento.ubicacion_lat && evento.ubicacion_lng) {
            $('#ubicacion_lat').val(evento.ubicacion_lat);
            $('#ubicacion_lng').val(evento.ubicacion_lng);
            $('#ubicacion_link').val('');
            $('#btnModoMapa').addClass('active');
            $('#btnModoGoogleMaps').removeClass('active');
            $('#modoMapaContainer').show();
            $('#modoGoogleMapsContainer').hide();
            setTimeout(() => {
                this.iniciarMapa();
                if (this.marcadorEvento) {
                    this.marcadorEvento.setLatLng([parseFloat(evento.ubicacion_lat), parseFloat(evento.ubicacion_lng)]);
                    this.mapaEvento.setView([parseFloat(evento.ubicacion_lat), parseFloat(evento.ubicacion_lng)], 15);
                }
            }, 200);
        } else if (evento.ubicacion_link) {
            $('#ubicacion_link').val(evento.ubicacion_link);
            $('#ubicacion_lat, #ubicacion_lng').val('');
            $('#btnModoGoogleMaps').addClass('active');
            $('#btnModoMapa').removeClass('active');
            $('#modoMapaContainer').hide();
            $('#modoGoogleMapsContainer').show();
            let textoAmigable = evento.ubicacion_link.length > 60 ? evento.ubicacion_link.substring(0, 57) + '...' : evento.ubicacion_link;
            $('#linkPreviewTextMapsEvento').html(`<a href="${evento.ubicacion_link}" target="_blank">${textoAmigable}</a>`);
            $('#linkPreviewMapsEvento').show();
        } else {
            $('#ubicacion_lat, #ubicacion_lng, #ubicacion_link').val('');
            $('#btnModoMapa').addClass('active');
            $('#btnModoGoogleMaps').removeClass('active');
            $('#modoMapaContainer').show();
            $('#modoGoogleMapsContainer').hide();
            setTimeout(() => this.iniciarMapa(), 200);
        }
        
        // Cargar usuarios
        $('#compartirAreasContainer').html(`
            <div style="text-align: center; padding: 30px;">
                <div class="book-loader-page" style="display: inline-block; margin: 0 5px;"></div>
                <p style="margin-top: 10px;">CARGANDO USUARIOS...</p>
            </div>
        `);
        
        const self = this;
        this.cargarUsuariosPorArea().then(function() {
            self.renderAreasConUsuarios();
        }).catch(function() {
            self.renderAreasConUsuarios();
        });
        
        this.modalAnterior = '#modalDetalleAnotacion';
        this.abrirModal('#modalNuevaAnotacion');
    },
    
    // Mostrar archivos existentes en edición
    mostrarArchivosExistentes: function(archivos) {
        if (!archivos || archivos.length === 0) return;
        
        let archivosHtml = `
            <div class="archivos-existentes" style="margin-bottom: 15px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 16px;">
                <h4 style="font-size: 12px; color: var(--color-primary); margin-bottom: 12px;"><i class="fas fa-paperclip"></i> ARCHIVOS ACTUALES</h4>
                <div class="lista-archivos-existentes">
        `;
        
        archivos.forEach((archivo, index) => {
            archivosHtml += `
                <div class="archivo-existente-item" style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(187,147,88,0.1);" data-ruta="${archivo.ruta}" data-nombre="${archivo.nombre}">
                    <i class="fas fa-file"></i>
                    <div class="archivo-info" style="flex: 1;">
                        <span class="archivo-nombre" style="font-size: 12px;">${this.escapeHTML(archivo.nombre)}</span>
                        <small style="font-size: 9px; color: var(--text-white-50);">${archivo.tipo || 'Archivo'}</small>
                    </div>
                    <button type="button" class="btn-eliminar-archivo" onclick="AgendaModule.marcarArchivoEliminar(this)" style="background: none; border: none; color: #e74c3c; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        archivosHtml += `</div></div>`;
        
        $('#archivosContainer').before(archivosHtml);
    },
    
    // Marcar archivo para eliminar
    marcarArchivoEliminar: function(boton) {
        const item = $(boton).closest('.archivo-existente-item');
        const ruta = item.data('ruta');
        const nombre = item.data('nombre');
        
        this.archivosAEliminar.push({ ruta: ruta, nombre: nombre });
        
        item.fadeOut(300, function() {
            $(this).remove();
            if ($('.archivo-existente-item').length === 0) {
                $('.archivos-existentes').fadeOut(300);
            }
        });
        
        this.mostrarNotificacion(`Archivo marcado para eliminar: ${nombre}`, 'info');
    },
    
    // Agregar campo de archivo
    agregarCampoArchivo: function() {
        const container = $('#archivosContainer');
        const nuevoIndex = container.children().length + 1;
        
        const nuevoGrupo = $(`
            <div class="archivo-input-group-book">
                <input type="file" id="anotacionArchivo${nuevoIndex}" class="form-control-book archivo-input" multiple>
                <button type="button" class="btn-remover-archivo-book" onclick="AgendaModule.removerCampoArchivo(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);
        
        container.append(nuevoGrupo);
    },
    
    removerCampoArchivo: function(boton) {
        $(boton).closest('.archivo-input-group-book').remove();
    },
    
    // ============================================
    // ELIMINAR ANOTACIÓN
    // ============================================
    eliminarAnotacion: function() {
        const self = this;
        const eventoAEliminar = this.editandoId;
        
        if (!eventoAEliminar) return;
        
        this.abrirModal('#modalConfirmarEliminar');
        
        $('#btnConfirmarEliminar').off('click').on('click', function() {
            self.cerrarModal('#modalConfirmarEliminar');
            self.mostrarNotificacion('ELIMINANDO ANOTACIÓN...', 'info');
            
            $.ajax({
                url: self.config.api.agenda,
                type: 'POST',
                data: { action: 'delete', id_evento: eventoAEliminar },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        self.cargarEventos();
                        self.cerrarModal('#modalDetalleAnotacion');
                        self.mostrarNotificacion('ANOTACIÓN ELIMINADA', 'success');
                    } else {
                        self.mostrarNotificacion('ERROR: ' + (response.message || 'NO SE PUDO ELIMINAR'), 'error');
                    }
                },
                error: function() {
                    self.mostrarNotificacion('ERROR DE CONEXIÓN', 'error');
                }
            });
        });
        
        $('#btnCancelarEliminar, #btnCerrarConfirmarEliminar').off('click').on('click', function() {
            self.cerrarModal('#modalConfirmarEliminar');
        });
    },
    
    // ============================================
    // MAPA Y GOOGLE MAPS
    // ============================================
    iniciarMapa: function() {
        const mapContainer = document.getElementById('mapaEvento');
        if (!mapContainer) return;
        
        if (this.mapaEvento) {
            this.mapaEvento.remove();
            this.mapaEvento = null;
        }
        
        let latInicial = 19.3152;
        let lngInicial = -98.8364;
        
        const latHidden = $('#ubicacion_lat').val();
        const lngHidden = $('#ubicacion_lng').val();
        
        if (latHidden && lngHidden) {
            latInicial = parseFloat(latHidden);
            lngInicial = parseFloat(lngHidden);
        }
        
        this.mapaEvento = L.map('mapaEvento').setView([latInicial, lngInicial], 15);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.mapaEvento);
        
        const iconoPredeterminado = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        this.marcadorEvento = L.marker([latInicial, lngInicial], { icon: iconoPredeterminado, draggable: true }).addTo(this.mapaEvento);
        
        const self = this;
        this.marcadorEvento.on('dragend', function(e) {
            const pos = self.marcadorEvento.getLatLng();
            self.actualizarCoordenadas(pos.lat, pos.lng);
        });
        
        this.mapaEvento.on('click', function(e) {
            self.marcadorEvento.setLatLng(e.latlng);
            self.actualizarCoordenadas(e.latlng.lat, e.latlng.lng);
        });
        
        // Botones de mapa
        $('#btnBuscarUbicacionEvento').off('click').on('click', () => this.buscarDireccion());
        $('#btnMiUbicacionEvento').off('click').on('click', () => this.obtenerMiUbicacion());
        
        $('#buscarUbicacionEvento').off('keypress').on('keypress', (e) => {
            if (e.which === 13) this.buscarDireccion();
        });
    },
    
    actualizarCoordenadas: function(lat, lng) {
        $('#ubicacion_lat').val(lat.toFixed(6));
        $('#ubicacion_lng').val(lng.toFixed(6));
        $('#ubicacion_link').val('');
        this.linkGoogleMapsEvento = null;
        
        const previewDiv = $('#ubicacionPreviewEvento');
        const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
        previewDiv.html(`
            <i class="fas fa-map-pin" style="color: #27ae60;"></i>
            Ubicación seleccionada: <a href="${googleMapsLink}" target="_blank">${lat.toFixed(6)}, ${lng.toFixed(6)}</a>
            <button type="button" id="btnLimpiarUbicacion" style="background: none; border: none; color: #e74c3c; cursor: pointer; margin-left: 8px;">
                <i class="fas fa-trash-alt"></i>
            </button>
        `);
        
        $('#btnLimpiarUbicacion').off('click').on('click', () => this.limpiarUbicacion());
    },
    
    limpiarUbicacion: function() {
        $('#ubicacion_lat, #ubicacion_lng, #ubicacion_link').val('');
        $('#ubicacionPreviewEvento').html('');
        this.linkGoogleMapsEvento = null;
        
        if (this.mapaEvento) {
            this.mapaEvento.setView([19.3152, -98.8364], 13);
            this.marcadorEvento.setLatLng([19.3152, -98.8364]);
        }
    },
    
    buscarDireccion: function() {
        const direccion = $('#buscarUbicacionEvento').val().trim();
        if (!direccion) {
            this.mostrarNotificacion('Ingrese una dirección para buscar', 'info');
            return;
        }
        
        this.mostrarNotificacion('Buscando dirección...', 'info');
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1&countrycodes=mx`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    this.mapaEvento.setView([lat, lon], 16);
                    this.marcadorEvento.setLatLng([lat, lon]);
                    this.actualizarCoordenadas(lat, lon);
                    this.mostrarNotificacion('Ubicación encontrada', 'success');
                } else {
                    this.mostrarNotificacion('No se encontró la dirección', 'error');
                }
            })
            .catch(error => {
                console.error('Error buscando dirección:', error);
                this.mostrarNotificacion('Error al buscar la dirección', 'error');
            });
    },
    
    obtenerMiUbicacion: function() {
        if (!navigator.geolocation) {
            this.mostrarNotificacion('Geolocalización no soportada', 'error');
            return;
        }
        
        this.mostrarNotificacion('Obteniendo ubicación...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                this.mapaEvento.setView([lat, lng], 16);
                this.marcadorEvento.setLatLng([lat, lng]);
                this.actualizarCoordenadas(lat, lng);
                this.mostrarNotificacion('Ubicación actual obtenida', 'success');
            },
            (error) => {
                let mensaje = 'Error al obtener ubicación';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        mensaje = 'Permiso de ubicación denegado';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        mensaje = 'Ubicación no disponible';
                        break;
                    case error.TIMEOUT:
                        mensaje = 'Tiempo de espera agotado';
                        break;
                }
                this.mostrarNotificacion(mensaje, 'error');
            }
        );
    },
    
    configurarToggleUbicacion: function() {
        $('#btnModoMapa').off('click').on('click', () => {
            $('#btnModoMapa').addClass('active');
            $('#btnModoGoogleMaps').removeClass('active');
            $('#modoMapaContainer').show();
            $('#modoGoogleMapsContainer').hide();
            setTimeout(() => {
                if (this.mapaEvento) {
                    this.mapaEvento.invalidateSize();
                } else {
                    this.iniciarMapa();
                }
            }, 100);
        });
        
        $('#btnModoGoogleMaps').off('click').on('click', () => {
            $('#btnModoGoogleMaps').addClass('active');
            $('#btnModoMapa').removeClass('active');
            $('#modoMapaContainer').hide();
            $('#modoGoogleMapsContainer').show();
        });
    },
    
    configurarGoogleMapsModo: function() {
        $('#btnAbrirGoogleMapsEvento').off('click').on('click', () => {
            const esMovil = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent.toLowerCase());
            if (esMovil) {
                window.location.href = 'comgooglemaps://';
                setTimeout(() => window.open('https://www.google.com/maps', '_blank'), 500);
            } else {
                window.open('https://www.google.com/maps', '_blank');
            }
        });
        
        $('#btnGuardarLinkMapsEvento').off('click').on('click', () => {
            const link = $('#linkGoogleMapsEvento').val().trim();
            
            if (!link) {
                this.mostrarNotificacion('Ingresa un link de Google Maps', 'warning');
                return;
            }
            
            const esGoogleMaps = link.includes('google.com/maps') || link.includes('maps.app.goo.gl') || link.includes('goo.gl/maps');
            
            if (!esGoogleMaps) {
                this.mostrarNotificacion('Link de Google Maps no válido', 'error');
                return;
            }
            
            this.linkGoogleMapsEvento = link;
            $('#ubicacion_link').val(link);
            $('#ubicacion_lat, #ubicacion_lng').val('');
            
            let textoAmigable = link.length > 60 ? link.substring(0, 57) + '...' : link;
            $('#linkPreviewTextMapsEvento').html(`<a href="${link}" target="_blank">${textoAmigable}</a>`);
            $('#linkPreviewMapsEvento').show();
            $('#linkGoogleMapsEvento').val('');
            
            this.mostrarNotificacion('Ubicación guardada correctamente', 'success');
        });
        
        $('#btnQuitarLinkMapsEvento').off('click').on('click', () => {
            this.linkGoogleMapsEvento = null;
            $('#ubicacion_link').val('');
            $('#linkPreviewMapsEvento').hide();
            $('#linkGoogleMapsEvento').val('');
            this.mostrarNotificacion('Ubicación eliminada', 'info');
        });
        
        $('#linkGoogleMapsEvento').off('keypress').on('keypress', (e) => {
            if (e.which === 13) $('#btnGuardarLinkMapsEvento').click();
        });
    },
    
    // ============================================
    // REPORTES PDF
    // ============================================
    generarReporte: function() {
        this.abrirModal('#modalSeleccionarReporte');
    },
    
    configurarReportes: function() {
        $('#btnCerrarSeleccionarReporte').off('click').on('click', () => {
            this.cerrarModal('#modalSeleccionarReporte');
        });
        
        $('.btn-opcion-reporte-book[data-tipo="dia"]').off('click').on('click', () => {
            this.cerrarModal('#modalSeleccionarReporte');
            this.abrirModal('#modalSeleccionarDia');
        });
        
        $('.btn-opcion-reporte-book[data-tipo="semana"]').off('click').on('click', () => {
            this.cerrarModal('#modalSeleccionarReporte');
            this.abrirModal('#modalSeleccionarSemana');
        });
        
        $('.btn-opcion-reporte-book[data-tipo="mes"]').off('click').on('click', () => {
            this.cerrarModal('#modalSeleccionarReporte');
            this.abrirModal('#modalSeleccionarMes');
        });
        
        $('#btnRegresarDeReporte, #btnRegresarDesdeDia, #btnRegresarDesdeSemana, #btnRegresarDesdeMes').off('click').on('click', () => {
            this.cerrarModal('#modalSeleccionarDia, #modalSeleccionarSemana, #modalSeleccionarMes');
            this.abrirModal('#modalSeleccionarReporte');
        });
        
        $('#btnCerrarSeleccionarDia, #btnCerrarSeleccionarSemana, #btnCerrarSeleccionarMes').off('click').on('click', () => {
            this.cerrarModal('#modalSeleccionarDia, #modalSeleccionarSemana, #modalSeleccionarMes');
        });
        
        $('#reporteFechaSemana').off('change').on('change', (e) => {
            this.calcularSemanaDesdeFecha(e.target.value);
        });
        
        $('#formSeleccionarDia').off('submit').on('submit', (e) => this.generarReporteDia(e));
        $('#formSeleccionarSemana').off('submit').on('submit', (e) => this.generarReporteSemana(e));
        $('#formSeleccionarMes').off('submit').on('submit', (e) => this.generarReporteMes(e));
    },
    
    calcularSemanaDesdeFecha: function(fechaStr) {
        if (!fechaStr) return;
        
        const fecha = new Date(fechaStr + 'T12:00:00');
        const inicioAnio = new Date(fecha.getFullYear(), 0, 1);
        const dias = Math.floor((fecha - inicioAnio) / (24 * 60 * 60 * 1000));
        const semana = Math.ceil((dias + inicioAnio.getDay() + 1) / 7);
        
        $('#reporteNumeroSemana').val(semana);
        $('#reporteNumeroSemana').data('anio', fecha.getFullYear());
    },
    
    generarReporteDia: function(e) {
        e.preventDefault();
        
        const dia = $('#reporteDia').val().padStart(2, '0');
        const mes = $('#reporteMes').val();
        const anio = $('#reporteAnio').val();
        
        if (!dia || !mes || !anio) {
            this.mostrarNotificacion('Complete todos los campos', 'error');
            return;
        }
        
        this.generarPDF('dia', { dia, mes, anio });
    },
    
    generarReporteSemana: function(e) {
        e.preventDefault();
        
        const semana = $('#reporteNumeroSemana').val();
        const anio = $('#reporteNumeroSemana').data('anio') || new Date().getFullYear();
        
        if (!semana) {
            this.mostrarNotificacion('Seleccione una fecha válida', 'error');
            return;
        }
        
        this.generarPDF('semana', { semana, anio });
    },
    
    generarReporteMes: function(e) {
        e.preventDefault();
        
        const mes = $('#reporteMesMes').val();
        const anio = $('#reporteMesAnio').val();
        
        if (!mes || !anio) {
            this.mostrarNotificacion('Complete todos los campos', 'error');
            return;
        }
        
        this.generarPDF('mes', { mes, anio });
    },
    
    generarPDF: function(tipo, params) {
        this.mostrarLoadingReporte('GENERANDO REPORTE PDF...');
        
        let url = '../../../php/agenda_calendario/reporte_pdf.php?formato=visor&tipo=' + tipo;
        const identificador = this.obtenerIdentificadorActual();
        url += '&identificador=' + encodeURIComponent(identificador);
        
        for (let [key, value] of Object.entries(params)) {
            url += '&' + key + '=' + encodeURIComponent(value);
        }
        
        console.log('📄 Generando reporte en:', url);
        
        const self = this;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                self.ocultarLoadingReporte();
                
                if (response.success) {
                    const archivoPDF = response.archivo;
                    
                    if (window.VisorArchivos) {
                        window.VisorArchivos.abrirVisor(archivoPDF, [archivoPDF]);
                    } else {
                        const link = document.createElement('a');
                        link.href = 'data:application/pdf;base64,' + archivoPDF.contenido;
                        link.download = archivoPDF.nombre;
                        link.click();
                    }
                    
                    self.cerrarModal('#modalSeleccionarDia, #modalSeleccionarSemana, #modalSeleccionarMes, #modalSeleccionarReporte');
                    self.mostrarNotificacion('REPORTE GENERADO EXITOSAMENTE', 'success');
                } else {
                    self.mostrarNotificacion(response.message || 'Error al generar reporte', 'error');
                }
            },
            error: function(xhr, status, error) {
                self.ocultarLoadingReporte();
                console.error('Error al generar reporte:', error);
                self.mostrarNotificacion('Error de conexión al generar reporte', 'error');
            }
        });
    },
    
    mostrarLoadingReporte: function(mensaje) {
        $('.reporte-loading').remove();
        
        const loading = $(`
            <div class="reporte-loading" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); z-index: 20000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;">
                <div class="book-loader"><div class="book-loader-page"></div><div class="book-loader-page"></div><div class="book-loader-page"></div></div>
                <p style="color: var(--color-primary); font-size: 14px; letter-spacing: 2px;">${mensaje}</p>
                <small style="color: var(--text-white-50);">ESTO PUEDE TARDAR UNOS SEGUNDOS</small>
            </div>
        `);
        
        $('body').append(loading);
    },
    
    ocultarLoadingReporte: function() {
        $('.reporte-loading').fadeOut(300, function() {
            $(this).remove();
        });
    },
    
    // ============================================
    // UTILIDADES
    // ============================================
    escapeHTML: function(text) {
        if (!text) return '';
        return String(text).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    },
    
    abrirModal: function(modalId) {
        $(modalId).addClass('active');
        $('body').css('overflow', 'hidden');
    },
    
    cerrarModal: function(modalId) {
        $(modalId).removeClass('active');
        $('body').css('overflow', 'auto');
    },
    
    mostrarNotificacion: function(mensaje, tipo = 'info') {
        $('.notification-global').remove();
        
        const notificationId = 'notification-' + Date.now();
        const iconos = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const notification = $(`
            <div id="${notificationId}" class="notification-global notification-${tipo}">
                <i class="fas ${iconos[tipo] || iconos.info}"></i>
                <span>${mensaje}</span>
            </div>
        `);
        
        $('body').append(notification);
        
        setTimeout(() => {
            $(`#${notificationId}`).css('transform', 'translateX(0)');
        }, 10);
        
        setTimeout(() => {
            $(`#${notificationId}`).css('transform', 'translateX(150%)');
            setTimeout(() => {
                $(`#${notificationId}`).remove();
            }, 300);
        }, 3000);
    }
};

// Inicializar
window.AgendaModule = AgendaModule;

$(document).ready(function() {
    AgendaModule.init();
});

// Escuchar mensajes desde el iframe padre
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'abrirDetalle') {
        const id = event.data.id;
        
        if (AgendaModule.eventos && AgendaModule.eventos.length > 0) {
            const evento = AgendaModule.eventos.find(e => e.id_evento == id);
            if (evento) {
                AgendaModule.mostrarDetalleAnotacion(id);
                return;
            }
        }
        
        AgendaModule.mostrarNotificacion('CARGANDO DATOS...', 'info');
        AgendaModule.cargarEventos();
        
        let intentos = 0;
        const maxIntentos = 20;
        const checkInterval = setInterval(() => {
            intentos++;
            if (AgendaModule.eventos && AgendaModule.eventos.length > 0) {
                clearInterval(checkInterval);
                const evento = AgendaModule.eventos.find(e => e.id_evento == id);
                if (evento) {
                    AgendaModule.mostrarDetalleAnotacion(id);
                } else {
                    AgendaModule.mostrarNotificacion('No se encontró la anotación', 'error');
                }
            } else if (intentos >= maxIntentos) {
                clearInterval(checkInterval);
                AgendaModule.mostrarNotificacion('Error: No se pudieron cargar los datos', 'error');
            }
        }, 500);
    }
});