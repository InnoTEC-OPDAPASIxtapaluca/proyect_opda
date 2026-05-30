/**
 * calendario.js - Módulo de Calendario
 * VERSIÓN COMPLETA - CON MAPA Y GOOGLE MAPS INTEGRADO
 * Basado en el módulo de agenda existente
 */

const CalendarioModule = {
    
    // Datos
    eventos: [],
    fechaActual: new Date(),
    mesActual: new Date().getMonth(),
    anioActual: new Date().getFullYear(),
    fechaReferenciaSemana: null,
    diaSeleccionado: null,
    fechaSeleccionadaStr: null,
    editandoId: null,
    archivosSeleccionados: [],
    archivosAEliminar: [],
    modalAnterior: null,
    vistaActual: 'mes',
    
    // Usuarios y áreas
    areasConUsuarios: [],
    usuariosSeleccionados: [],
    
    // Ubicación
    ubicacionLinkSeleccionado: null,
    mapaEvento: null,
    marcadorEvento: null,
    linkGoogleMapsEvento: null,
    
    // Configuración
    config: {
        api: {
            agenda: '../../../php/agenda_calendario/agenda/agenda_api.php'
        },
        rutas: {
            agenda: '../../../html/agenda_calendario/agenda/agenda.html'
        }
    },
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    init: function() {
        console.log('📅 Inicializando módulo de calendario...');
        
        $('#calendarioLoading').show();
        
        const hoy = new Date();
        this.anioActual = hoy.getFullYear();
        this.mesActual = hoy.getMonth();
        this.diaSeleccionado = hoy.getDate();
        this.fechaReferenciaSemana = new Date(hoy);
        
        this.cargarEventos();
        this.setupEventListeners();
        this.inicializarSelectMeses();
        this.renderVistaActual();
        
        console.log('✅ Módulo de calendario listo');
    },
    
    // Obtener no_nomina del usuario actual
    obtenerIdentificadorActual: function() {
        try {
            let usuarioStr = sessionStorage.getItem('usuario');
            
            if (!usuarioStr) {
                usuarioStr = localStorage.getItem('usuario');
            }
            
            if (usuarioStr) {
                const usuario = JSON.parse(usuarioStr);
                console.log('👤 Usuario encontrado:', usuario);
                
                let identificador = usuario.no_nomina || '';
                
                if (!identificador) {
                    console.warn('⚠️ No se encontró campo "no_nomina" en el usuario');
                    console.log('🔍 Campos disponibles:', Object.keys(usuario));
                    return '';
                }
                
                console.log('✅ No_nomina a usar:', identificador);
                return String(identificador).trim();
            }
            
            console.error('❌ No se encontró usuario en sessionStorage ni localStorage');
            return '';
        } catch(e) {
            console.error('❌ Error al obtener no_nomina:', e);
            return '';
        }
    },
    
    // Inicializar select de meses
    inicializarSelectMeses: function() {
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        
        let options = '<option value="">SELECCIONAR MES</option>';
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
        $('#btnIrAgenda').off('click').on('click', () => {
            window.location.href = this.config.rutas.agenda;
        });
        
        // Filtros
        $('#filtroDia, #filtroMes, #filtroAnio').off('input change').on('input change', () => {
            this.filtrarEventos();
        });
        
        $('#btnLimpiarFiltros').off('click').on('click', () => this.limpiarFiltros());
        $('#btnBuscarCalendario').off('click').on('click', () => this.filtrarEventos());
        
        // Selector de vista
        $('.btn-vista').off('click').on('click', (e) => {
            const vista = $(e.currentTarget).data('vista');
            this.cambiarVista(vista);
        });
        
        // Navegación
        $('#btnMesAnterior').off('click').on('click', () => this.navegarMes(-1));
        $('#btnMesSiguiente').off('click').on('click', () => this.navegarMes(1));
        
        $('#btnSemanaAnterior').off('click').on('click', () => this.navegarSemana(-1));
        $('#btnSemanaSiguiente').off('click').on('click', () => this.navegarSemana(1));
        
        $('#btnDiaAnterior').off('click').on('click', () => this.navegarDia(-1));
        $('#btnDiaSiguiente').off('click').on('click', () => this.navegarDia(1));
        
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
        
        // Modales de día
        $('#btnCerrarModalDia').off('click').on('click', () => {
            this.cerrarModal('#modalDiaOpciones');
        });
        
        $('#btnRegresarDia').off('click').on('click', () => {
            this.cerrarModal('#modalDiaOpciones');
        });
        
        $('#btnVerAnotaciones').off('click').on('click', () => {
            this.cerrarModal('#modalDiaOpciones');
            this.mostrarListaAnotaciones();
        });
        
        $('#btnNuevaAnotacionDia').off('click').on('click', () => {
            this.cerrarModal('#modalDiaOpciones');
            this.abrirModalNuevaAnotacion(this.fechaSeleccionadaStr);
        });
        
        $('#btnCerrarListaAnotaciones').off('click').on('click', () => {
            this.cerrarModal('#modalListaAnotaciones');
        });
        
        $('#btnRegresarDeLista').off('click').on('click', () => {
            this.cerrarModal('#modalListaAnotaciones');
            this.abrirModal('#modalDiaOpciones');
        });
    },
    
    // ============================================
    // CARGAR EVENTOS
    // ============================================
    cargarEventos: function() {
        const self = this;
        const identificador = this.obtenerIdentificadorActual();
        
        console.log('🔍 Cargando eventos para no_nomina:', identificador);
        
        $.ajax({
            url: this.config.api.agenda,
            type: 'GET',
            data: { action: 'getAll', identificador: identificador },
            dataType: 'json',
            success: function(response) {
                console.log('✅ Eventos cargados:', response);
                $('#calendarioLoading').hide();
                
                if (response.success && response.data) {
                    self.eventos = response.data;
                } else {
                    console.warn('⚠️ No se pudieron cargar eventos:', response.message);
                    self.eventos = [];
                }
                
                self.renderVistaActual();
                self.actualizarContadores();
            },
            error: function(xhr, status, error) {
                console.error('❌ Error al cargar eventos:', error);
                $('#calendarioLoading').hide();
                self.eventos = [];
                self.renderVistaActual();
            }
        });
    },
    
    // Actualizar contadores del header
    actualizarContadores: function() {
        const totalEventos = this.eventos.length;
        $('#totalEventosStat').text(totalEventos);
    },
    
    // ============================================
    // VISTAS DEL CALENDARIO
    // ============================================
    cambiarVista: function(vista) {
        this.vistaActual = vista;
        
        $('.btn-vista').removeClass('active');
        $(`.btn-vista[data-vista="${vista}"]`).addClass('active');
        
        $('.vista-calendario').removeClass('active');
        $(`#vista${vista.charAt(0).toUpperCase() + vista.slice(1)}`).addClass('active');
        
        if (vista === 'semana') {
            if (this.diaSeleccionado && this.mesActual !== undefined && this.anioActual !== undefined) {
                this.fechaReferenciaSemana = new Date(this.anioActual, this.mesActual, this.diaSeleccionado);
            } else {
                this.fechaReferenciaSemana = new Date();
            }
        }
        
        this.renderVistaActual();
    },
    
    renderVistaActual: function() {
        switch(this.vistaActual) {
            case 'mes':
                this.renderCalendarioMes();
                break;
            case 'semana':
                this.renderVistaSemana();
                break;
            case 'dia':
                this.renderVistaDia();
                break;
        }
    },
    
    // Renderizar calendario mensual
    renderCalendarioMes: function() {
        try {
            const primerDiaMes = new Date(this.anioActual, this.mesActual, 1);
            const ultimoDiaMes = new Date(this.anioActual, this.mesActual + 1, 0);
            const primerDiaSemana = primerDiaMes.getDay();
            const diasEnMes = ultimoDiaMes.getDate();
            const diasDelMesAnterior = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
            const mesAnterior = new Date(this.anioActual, this.mesActual, 0);
            const diasMesAnterior = mesAnterior.getDate();
            
            const hoy = new Date();
            const hoyFecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
            
            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            $('#mesActual').text(`${meses[this.mesActual]} ${this.anioActual}`);
            
            let html = '';
            let diaCount = 1;
            let diaSiguienteMes = 1;
            
            for (let i = 0; i < 42; i++) {
                if (i < diasDelMesAnterior) {
                    const dia = diasMesAnterior - diasDelMesAnterior + i + 1;
                    const fecha = `${this.anioActual}-${String(this.mesActual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                    const elementosDia = this.obtenerElementosPorFecha(fecha);
                    
                    html += `
                        <div class="dia-calendario otro-mes" data-fecha="${fecha}">
                            <span class="numero-dia">${dia}</span>
                            ${elementosDia.length > 0 ? `<span class="eventos-count">${elementosDia.length}</span>` : ''}
                        </div>
                    `;
                } else if (diaCount <= diasEnMes) {
                    const fecha = `${this.anioActual}-${String(this.mesActual + 1).padStart(2, '0')}-${String(diaCount).padStart(2, '0')}`;
                    const elementosDia = this.obtenerElementosPorFecha(fecha);
                    const esHoy = fecha === hoyFecha;
                    
                    html += `
                        <div class="dia-calendario ${esHoy ? 'hoy' : ''}" data-fecha="${fecha}">
                            <span class="numero-dia">${diaCount}</span>
                            ${elementosDia.length > 0 ? `<span class="eventos-count">${elementosDia.length}</span>` : ''}
                        </div>
                    `;
                    diaCount++;
                } else {
                    const fecha = `${this.anioActual}-${String(this.mesActual + 2).padStart(2, '0')}-${String(diaSiguienteMes).padStart(2, '0')}`;
                    const elementosDia = this.obtenerElementosPorFecha(fecha);
                    
                    html += `
                        <div class="dia-calendario otro-mes" data-fecha="${fecha}">
                            <span class="numero-dia">${diaSiguienteMes}</span>
                            ${elementosDia.length > 0 ? `<span class="eventos-count">${elementosDia.length}</span>` : ''}
                        </div>
                    `;
                    diaSiguienteMes++;
                }
            }
            
            $('#calendarioGrid').html(html);
            
            $('.dia-calendario').off('click').on('click', (e) => {
                const fecha = $(e.currentTarget).data('fecha');
                this.seleccionarDia(fecha);
            });
        } catch(e) {
            console.error('Error renderizando mes:', e);
        }
    },
    
    // Renderizar vista semana
    renderVistaSemana: function() {
        try {
            if (!this.fechaReferenciaSemana) {
                this.fechaReferenciaSemana = new Date(this.anioActual, this.mesActual, this.diaSeleccionado || 1);
            }
            
            const lunes = this.obtenerLunesDeSemana(this.fechaReferenciaSemana);
            
            const dias = [];
            for (let i = 0; i < 7; i++) {
                const fecha = new Date(lunes);
                fecha.setDate(lunes.getDate() + i);
                dias.push(fecha);
            }
            
            this.anioActual = lunes.getFullYear();
            this.mesActual = lunes.getMonth();
            this.diaSeleccionado = lunes.getDate();
            
            const rangoTexto = this.formatearRangoSemana(this.fechaReferenciaSemana);
            $('#semanaActual').text(rangoTexto);
            
            let html = `
                <div class="hora-columna">
                    <div class="hora-label"></div>
            `;
            
            for (let h = 0; h < 24; h++) {
                const hora = h < 10 ? `0${h}:00` : `${h}:00`;
                html += `<div class="hora-label">${hora}</div>`;
            }
            html += '</div>';
            
            dias.forEach((fecha, index) => {
                const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                const elementosDia = this.obtenerElementosPorFecha(fechaStr);
                const esHoy = this.esFechaHoy(fecha);
                
                html += `
                    <div class="dia-columna" data-fecha="${fechaStr}">
                        <div class="dia-header-semana ${esHoy ? 'hoy-header' : ''}">
                            ${this.obtenerNombreDia(index)}<br>
                            <small>${fecha.getDate()}</small>
                        </div>
                `;
                
                for (let h = 0; h < 24; h++) {
                    const elementosHora = elementosDia.filter(item => {
                        const horaItem = item.hora;
                        if (!horaItem) return false;
                        const horaEvento = parseInt(horaItem.split(':')[0]);
                        return horaEvento === h;
                    });
                    
                    html += `<div class="hora-celda" data-fecha="${fechaStr}" data-hora="${h}">`;
                    elementosHora.forEach(item => {
                        let tituloCorto = item.titulo;
                        if (tituloCorto && tituloCorto.length > 20) {
                            tituloCorto = tituloCorto.substring(0, 18) + '...';
                        }
                        html += `<div class="evento-mini" title="${this.escapeHTML(item.titulo)}">${this.escapeHTML(tituloCorto)}</div>`;
                    });
                    html += '</div>';
                }
                
                html += '</div>';
            });
            
            $('#semanaGrid').html(html);
            
            $('.hora-celda').off('click').on('click', (e) => {
                e.stopPropagation();
                const fecha = $(e.currentTarget).data('fecha');
                const hora = $(e.currentTarget).data('hora');
                if (fecha) {
                    this.seleccionarHora(fecha, hora);
                }
            });
            
            $('.dia-columna').off('click').on('click', (e) => {
                if ($(e.target).hasClass('hora-celda') || $(e.target).hasClass('evento-mini')) {
                    return;
                }
                const fecha = $(e.currentTarget).data('fecha');
                if (fecha) {
                    this.seleccionarDia(fecha);
                }
            });
            
        } catch(e) {
            console.error('Error renderizando semana:', e);
        }
    },
    
    // Renderizar vista día
    // Renderizar vista día - CORREGIDO para mostrar siempre la fecha actual o la seleccionada
renderVistaDia: function() {
    try {
        // Si no hay un día seleccionado, usar la fecha actual
        if (!this.diaSeleccionado) {
            const hoy = new Date();
            this.anioActual = hoy.getFullYear();
            this.mesActual = hoy.getMonth();
            this.diaSeleccionado = hoy.getDate();
        }
        
        // Crear fecha con los valores actuales
        const fecha = new Date(this.anioActual, this.mesActual, this.diaSeleccionado);
        
        // Validar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
            console.error('Fecha inválida:', this.anioActual, this.mesActual, this.diaSeleccionado);
            const hoy = new Date();
            this.anioActual = hoy.getFullYear();
            this.mesActual = hoy.getMonth();
            this.diaSeleccionado = hoy.getDate();
            fecha.setFullYear(this.anioActual, this.mesActual, this.diaSeleccionado);
        }
        
        // Actualizar variables de clase con la fecha correcta
        this.anioActual = fecha.getFullYear();
        this.mesActual = fecha.getMonth();
        this.diaSeleccionado = fecha.getDate();
        
        const fechaStr = `${this.anioActual}-${String(this.mesActual + 1).padStart(2, '0')}-${String(this.diaSeleccionado).padStart(2, '0')}`;
        this.fechaSeleccionadaStr = fechaStr;
        
        // Obtener eventos para este día
        const elementosDia = this.obtenerElementosPorFecha(fechaStr);
        
        // Formatear el título del día
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        $('#diaActual').text(`${this.diaSeleccionado} ${meses[this.mesActual]} ${this.anioActual}`);
        
        // Renderizar grid de horas
        let html = `<div class="horas-diarias">`;
        for (let h = 0; h < 24; h++) {
            const hora = h < 10 ? `0${h}:00` : `${h}:00`;
            html += `<div class="hora-diaria">${hora}</div>`;
        }
        html += '</div><div class="eventos-diarios">';
        
        // Para cada hora del día, mostrar eventos que coincidan
        for (let h = 0; h < 24; h++) {
            const elementosHora = elementosDia.filter(item => {
                const horaItem = item.hora;
                if (!horaItem) return false;
                const horaEvento = parseInt(horaItem.split(':')[0]);
                return horaEvento === h;
            });
            
            html += `<div class="evento-hora" data-fecha="${fechaStr}" data-hora="${h}">`;
            if (elementosHora.length > 0) {
                elementosHora.forEach(item => {
                    html += `
                        <div class="evento-titulo-dia">${this.escapeHTML(item.titulo || 'SIN TÍTULO')}</div>
                        <div class="evento-descripcion-dia">${this.escapeHTML(item.descripcion || 'SIN DESCRIPCIÓN')}</div>
                    `;
                });
            }
            html += '</div>';
        }
        html += '</div>';
        
        $('#diaGrid').html(html);
        
        // Evento click para crear anotación en una hora específica
        $('.evento-hora').off('click').on('click', (e) => {
            const fecha = $(e.currentTarget).data('fecha');
            const hora = $(e.currentTarget).data('hora');
            if (fecha) {
                this.seleccionarHora(fecha, hora);
            }
        });
        
    } catch(e) {
        console.error('Error renderizando día:', e);
    }
},
    
    // Obtener elementos por fecha
    obtenerElementosPorFecha: function(fecha) {
        return this.eventos.filter(item => item.fecha === fecha);
    },
    
    // Obtener lunes de semana
    obtenerLunesDeSemana: function(fecha) {
        const fechaObj = new Date(fecha);
        const dia = fechaObj.getDay();
        const diasARestar = dia === 0 ? 6 : dia - 1;
        fechaObj.setDate(fechaObj.getDate() - diasARestar);
        return fechaObj;
    },
    
    // Obtener número de semana
    obtenerNumeroSemana: function(fecha) {
        const fechaObj = new Date(fecha);
        const inicioAnio = new Date(fechaObj.getFullYear(), 0, 1);
        const dias = Math.floor((fechaObj - inicioAnio) / (24 * 60 * 60 * 1000));
        const diaInicioAnio = inicioAnio.getDay();
        const ajuste = diaInicioAnio === 0 ? 6 : diaInicioAnio - 1;
        return Math.ceil((dias + ajuste + 1) / 7);
    },
    
    // Formatear rango de semana
    formatearRangoSemana: function(fechaReferencia) {
        const lunes = this.obtenerLunesDeSemana(fechaReferencia);
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        
        const diaInicio = lunes.getDate();
        const mesInicio = meses[lunes.getMonth()];
        const anioInicio = lunes.getFullYear();
        const diaFin = domingo.getDate();
        const mesFin = meses[domingo.getMonth()];
        const anioFin = domingo.getFullYear();
        const numeroSemana = this.obtenerNumeroSemana(lunes);
        
        if (anioInicio === anioFin && mesInicio === mesFin) {
            return `SEMANA ${numeroSemana} - ${diaInicio} AL ${diaFin} ${mesInicio} ${anioInicio}`;
        } else if (anioInicio === anioFin) {
            return `SEMANA ${numeroSemana} - ${diaInicio} ${mesInicio} AL ${diaFin} ${mesFin} ${anioInicio}`;
        } else {
            return `SEMANA ${numeroSemana} - ${diaInicio} ${mesInicio} ${anioInicio} AL ${diaFin} ${mesFin} ${anioFin}`;
        }
    },
    
    // Obtener nombre del día
    obtenerNombreDia: function(index) {
        const dias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
        return dias[index];
    },
    
    // Verificar si es hoy
    esFechaHoy: function(fecha) {
        const hoy = new Date();
        return fecha.getDate() === hoy.getDate() &&
               fecha.getMonth() === hoy.getMonth() &&
               fecha.getFullYear() === hoy.getFullYear();
    },
    
    // Navegación
    navegarMes: function(direccion) {
        this.mesActual += direccion;
        
        if (this.mesActual < 0) {
            this.mesActual = 11;
            this.anioActual--;
        } else if (this.mesActual > 11) {
            this.mesActual = 0;
            this.anioActual++;
        }
        
        this.renderCalendarioMes();
    },
    
    navegarSemana: function(direccion) {
        if (!this.fechaReferenciaSemana) {
            this.fechaReferenciaSemana = new Date(this.anioActual, this.mesActual, this.diaSeleccionado || 1);
        }
        
        this.fechaReferenciaSemana.setDate(this.fechaReferenciaSemana.getDate() + (direccion * 7));
        this.renderVistaSemana();
    },
    
    navegarDia: function(direccion) {
        try {
            let fecha;
            if (this.diaSeleccionado) {
                fecha = new Date(this.anioActual, this.mesActual, this.diaSeleccionado);
            } else {
                fecha = new Date(this.anioActual, this.mesActual, 1);
            }
            
            fecha.setDate(fecha.getDate() + direccion);
            this.anioActual = fecha.getFullYear();
            this.mesActual = fecha.getMonth();
            this.diaSeleccionado = fecha.getDate();
            
            this.renderVistaDia();
        } catch(e) {
            console.error('Error navegando día:', e);
        }
    },
    
    // Filtros
    filtrarEventos: function() {
        const dia = $('#filtroDia').val().padStart(2, '0');
        const mes = $('#filtroMes').val();
        const anio = $('#filtroAnio').val();
        
        if (!dia || !mes || !anio) {
            this.mostrarNotificacion('DEBE INGRESAR DÍA, MES Y AÑO PARA BUSCAR', 'warning');
            return;
        }
        
        try {
            const fechaStr = `${anio}-${mes}-${dia}`;
            const fecha = new Date(anio, parseInt(mes) - 1, dia);
            
            if (isNaN(fecha.getTime())) {
                this.mostrarNotificacion('FECHA NO VÁLIDA', 'error');
                return;
            }
            
            this.anioActual = parseInt(anio);
            this.mesActual = parseInt(mes) - 1;
            this.diaSeleccionado = parseInt(dia);
            this.fechaSeleccionadaStr = fechaStr;
            
            this.cambiarVista('dia');
            this.mostrarNotificacion(`MOSTRANDO DÍA ${dia}/${mes}/${anio}`, 'success');
        } catch(e) {
            this.mostrarNotificacion('ERROR AL PROCESAR LA FECHA', 'error');
        }
    },
    
    limpiarFiltros: function() {
        $('#filtroDia, #filtroAnio').val('');
        $('#filtroMes').val('');
        this.mostrarNotificacion('FILTROS LIMPIADOS', 'success');
    },
    
    // ============================================
    // SELECCIÓN DE DÍA Y HORA
    // ============================================
    seleccionarHora: function(fecha, hora) {
        try {
            this.fechaSeleccionadaStr = fecha;
            if (fecha) {
                const partesFecha = fecha.split('-');
                if (partesFecha.length === 3) {
                    this.anioActual = parseInt(partesFecha[0]);
                    this.mesActual = parseInt(partesFecha[1]) - 1;
                    this.diaSeleccionado = parseInt(partesFecha[2]);
                }
            }
            this.seleccionarDia(fecha);
        } catch(e) {
            console.error('Error seleccionando hora:', e);
        }
    },
    
    seleccionarDia: function(fecha) {
        try {
            this.fechaSeleccionadaStr = fecha;
            const fechaObj = new Date(fecha + 'T12:00:00');
            if (isNaN(fechaObj.getTime())) {
                console.error('Fecha inválida:', fecha);
                return;
            }
            
            const dia = fechaObj.getDate();
            const mes = fechaObj.getMonth() + 1;
            const anio = fechaObj.getFullYear();
            
            this.anioActual = anio;
            this.mesActual = mes - 1;
            this.diaSeleccionado = dia;
            
            this.fechaReferenciaSemana = new Date(anio, mes - 1, dia);
            
            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            const titulo = `${dia} ${meses[mes - 1]} ${anio}`;
            
            $('#diaSeleccionadoTitulo').text(titulo);
            const elementosDia = this.obtenerElementosPorFecha(fecha);
            $('#totalEventosDia').text(`${elementosDia.length} ANOTACIONES EN ESTE DÍA`);
            
            this.abrirModal('#modalDiaOpciones');
        } catch(e) {
            console.error('Error seleccionando día:', e);
        }
    },
    
    // ============================================
    // MOSTRAR LISTA DE ANOTACIONES
    // ============================================
    mostrarListaAnotaciones: function() {
        const elementosDia = this.obtenerElementosPorFecha(this.fechaSeleccionadaStr);
        
        if (elementosDia.length === 0) {
            $('#listaAnotacionesContainer').html(`
                <div class="no-results-book" style="padding: 40px; text-align: center;">
                    <i class="fas fa-calendar-times" style="font-size: 55px; color: rgba(187,147,88,0.4); margin-bottom: 15px;"></i>
                    <p style="font-size: 16px; font-weight: 700; color: var(--text-white); margin-bottom: 8px;">NO HAY ANOTACIONES</p>
                    <span style="font-size: 13px; color: var(--text-white-50);">NO HAY ANOTACIONES PARA ESTE DÍA</span>
                </div>
            `);
        } else {
            let html = '';
            elementosDia.sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00')).forEach(evento => {
                const archivos = evento.archivos ? JSON.parse(evento.archivos) : [];
                html += `
                    <div class="anotacion-item" data-id="${evento.id_evento}">
                        <div class="anotacion-titulo">
                            <i class="fas fa-calendar-check"></i>
                            <h4>${this.escapeHTML(evento.titulo || 'SIN TÍTULO')}</h4>
                        </div>
                        <div class="anotacion-hora">
                            <i class="fas fa-clock"></i> ${evento.hora || 'HORA NO ESPECIFICADA'}
                        </div>
                        <div class="anotacion-descripcion">
                            ${evento.descripcion ? (evento.descripcion.substring(0, 100) + (evento.descripcion.length > 100 ? '...' : '')) : 'SIN DESCRIPCIÓN'}
                        </div>
                        ${archivos.length > 0 ? `<div class="anotacion-archivos"><i class="fas fa-paperclip"></i> ${archivos.length} ARCHIVOS ADJUNTOS</div>` : ''}
                    </div>
                `;
            });
            
            $('#listaAnotacionesContainer').html(html);
            
            $('.anotacion-item').off('click').on('click', (e) => {
                const id = $(e.currentTarget).data('id');
                this.mostrarDetalleAnotacion(id);
            });
        }
        
        this.abrirModal('#modalListaAnotaciones');
    },
    
    // ============================================
    // MOSTRAR DETALLE DE ANOTACIÓN
    // ============================================
    mostrarDetalleAnotacion: function(id) {
        const evento = this.eventos.find(e => e.id_evento == id);
        if (!evento) return;
        
        this.editandoId = id;
        
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
            archivosHtml = '<div style="margin-top: 10px;">';
            archivos.forEach((archivo, index) => {
                const archivoJson = JSON.stringify(archivo).replace(/'/g, "&#39;");
                const todosJson = JSON.stringify(archivos).replace(/'/g, "&#39;");
                
                archivosHtml += `
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <i class="fas fa-file"></i>
                        <span>${this.escapeHTML(archivo.nombre)}</span>
                        <button class="btn-descargar-archivo" 
                                data-ruta="../../${archivo.ruta}" 
                                data-nombre="${archivo.nombre}"
                                style="background: none; border: none; color: #bb9358; margin-left: auto; cursor: pointer;">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-ver-archivo" 
                                data-archivo='${archivoJson}'
                                data-todos='${todosJson}'
                                style="background: none; border: none; color: #bb9358; cursor: pointer;">
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
            const idEvento = this.editandoId;
            
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
        
        this.cerrarModal('#modalListaAnotaciones');
        this.abrirModal('#modalDetalleAnotacion');
    },
    
    // ============================================
    // NUEVA ANOTACIÓN - MODAL
    // ============================================
    abrirModalNuevaAnotacion: function(fecha = null, modalAnterior = null) {
        this.editandoId = null;
        this.archivosAEliminar = [];
        this.modalAnterior = modalAnterior;
        this.usuariosSeleccionados = [];
        this.ubicacionLinkSeleccionado = null;
        this.linkGoogleMapsEvento = null;
        
        $('#modalAnotacionTitulo').text('NUEVA ANOTACIÓN');
        $('#formAnotacion')[0].reset();
        
        // Resetear archivos
        $('#archivosContainer').html(`
            <div class="archivo-input-group-book">
                <input type="file" id="anotacionArchivo1" class="form-control-book archivo-input" multiple>
                <button type="button" class="btn-agregar-archivo-book" onclick="CalendarioModule.agregarCampoArchivo()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `);
        
        if (fecha) {
            $('#anotacionFecha').val(fecha);
        } else {
            const hoy = new Date();
            const year = hoy.getFullYear();
            const month = String(hoy.getMonth() + 1).padStart(2, '0');
            const day = String(hoy.getDate()).padStart(2, '0');
            $('#anotacionFecha').val(`${year}-${month}-${day}`);
        }
        
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
    // CARGAR USUARIOS POR ÁREA
    // ============================================
    cargarUsuariosPorArea: function() {
        const identificadorActual = this.obtenerIdentificadorActual();
        
        console.log('🔍 Cargando usuarios por área - Mi no_nomina:', identificadorActual);
        
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.config.api.agenda,
                type: 'GET',
                data: { 
                    action: 'getUsuariosPorArea', 
                    no_nomina_actual: identificadorActual
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
        
        // Guardar qué áreas están abiertas
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
            
            const wasOpen = openAreas.includes(String(areaId));
            const openClass = wasOpen ? 'open' : '';
            const chevronClass = wasOpen ? 'fa-chevron-down' : 'fa-chevron-right';
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
                const noNomina = usuario.no_nomina;
                const nombreCompleto = `${usuario.nombre} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim();
                const isSelected = this.usuariosSeleccionados.includes(noNomina);
                
                html += `
                    <div class="usuario-item-book ${isSelected ? 'selected' : ''}" data-no_nomina="${noNomina}">
                        <input type="checkbox" class="usuario-checkbox" value="${noNomina}" ${isSelected ? 'checked' : ''}>
                        <div class="usuario-nombre-book">
                            ${this.escapeHTML(nombreCompleto)}
                            <small>${this.escapeHTML(noNomina)}</small>
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
            const noNomina = checkbox.val();
            const item = checkbox.closest('.usuario-item-book');
            
            if (checkbox.prop('checked')) {
                if (!this.usuariosSeleccionados.includes(noNomina)) {
                    this.usuariosSeleccionados.push(noNomina);
                }
                item.addClass('selected');
            } else {
                this.usuariosSeleccionados = this.usuariosSeleccionados.filter(n => n !== noNomina);
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
                    const noNomina = usuario.no_nomina;
                    if (!self.usuariosSeleccionados.includes(noNomina)) {
                        self.usuariosSeleccionados.push(noNomina);
                    }
                });
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
                    self.usuariosSeleccionados = self.usuariosSeleccionados.filter(n => n !== usuario.no_nomina);
                });
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
                <button type="button" class="btn-agregar-archivo-book" onclick="CalendarioModule.agregarCampoArchivo()">
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
                    <button type="button" class="btn-eliminar-archivo" onclick="CalendarioModule.marcarArchivoEliminar(this)" style="background: none; border: none; color: #e74c3c; cursor: pointer;">
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
                <button type="button" class="btn-remover-archivo-book" onclick="CalendarioModule.removerCampoArchivo(this)">
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
        const semana = this.obtenerNumeroSemana(fecha);
        
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
window.CalendarioModule = CalendarioModule;

$(document).ready(function() {
    CalendarioModule.init();
});

// Escuchar mensajes desde el iframe padre
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'abrirDetalle') {
        const id = event.data.id;
        
        if (CalendarioModule.eventos && CalendarioModule.eventos.length > 0) {
            const evento = CalendarioModule.eventos.find(e => e.id_evento == id);
            if (evento) {
                CalendarioModule.mostrarDetalleAnotacion(id);
                return;
            }
        }
        
        CalendarioModule.mostrarNotificacion('CARGANDO DATOS...', 'info');
        CalendarioModule.cargarEventos();
        
        let intentos = 0;
        const maxIntentos = 20;
        const checkInterval = setInterval(() => {
            intentos++;
            if (CalendarioModule.eventos && CalendarioModule.eventos.length > 0) {
                clearInterval(checkInterval);
                const evento = CalendarioModule.eventos.find(e => e.id_evento == id);
                if (evento) {
                    CalendarioModule.mostrarDetalleAnotacion(id);
                } else {
                    CalendarioModule.mostrarNotificacion('No se encontró la anotación', 'error');
                }
            } else if (intentos >= maxIntentos) {
                clearInterval(checkInterval);
                CalendarioModule.mostrarNotificacion('Error: No se pudieron cargar los datos', 'error');
            }
        }, 500);
    }
});