/**
 * visor_archivos.js - Visor de Archivos Personalizado
 * CORREGIDO - Manejo de rutas API para descarga de archivos
 */

const VisorArchivos = {
    
    // Configuración
    archivoActual: null,
    archivos: [],
    indiceActual: 0,
    zoom: 100,
    rotacion: 0,
    tipoArchivo: '',
    
    // Variables para PDF
    pdfDoc: null,
    paginaActual: 1,
    totalPaginas: 1,
    pdfCanvas: null,
    pdfContext: null,
    pdfScale: 1.5,
    
    // Configuración de rutas - CORREGIDO
    config: {
        apiAgenda: '../../../php/agenda_calendario/agenda/agenda_api.php'
    },
    
    // Inicializar
    init: function() {
        console.log('🔧 Inicializando visor de archivos personalizado...');
        this.crearEstructuraVisor();
        this.setupEventListeners();
    },
    
    // Crear estructura del visor
    crearEstructuraVisor: function() {
        if ($('#visorPersonalizado').length) return;
        
        const visorHTML = `
        <div id="visorPersonalizado" class="visor-overlay">
            <div class="visor-container">
                <!-- HEADER -->
                <div class="visor-header">
                    <div class="visor-titulo">
                        <i class="fas fa-file-alt"></i>
                        <h3 id="visorTitulo">VISOR DE ARCHIVOS</h3>
                        <span id="visorContador" class="visor-contador"></span>
                    </div>
                    
                    <div class="visor-controles">
                        <!-- Navegación entre archivos -->
                        <div class="visor-nav-archivos">
                            <button class="visor-btn" id="visorArchivoAnterior" title="Archivo anterior">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="visor-btn" id="visorArchivoSiguiente" title="Archivo siguiente">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        
                        <!-- Controles PDF (visibles solo para PDF) -->
                        <div class="visor-pdf-controles" style="display: none;">
                            <button class="visor-btn" id="visorPaginaAnterior" title="Página anterior">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span id="visorInfoPagina">1 / 1</span>
                            <button class="visor-btn" id="visorPaginaSiguiente" title="Página siguiente">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        
                        <!-- Zoom -->
                        <button class="visor-btn" id="visorZoomOut" title="Disminuir zoom">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <span class="visor-zoom-info" id="visorZoomInfo">100%</span>
                        <button class="visor-btn" id="visorZoomIn" title="Aumentar zoom">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="visor-btn" id="visorZoomReset" title="Zoom original">
                            <i class="fas fa-expand"></i>
                        </button>
                        
                        <!-- Rotación (solo imágenes) -->
                        <button class="visor-btn" id="visorRotar" title="Rotar">
                            <i class="fas fa-redo-alt"></i>
                        </button>
                        
                        <!-- Acciones -->
                        <button class="visor-btn" id="visorDescargar" title="Descargar">
                            <i class="fas fa-download"></i>
                        </button>
                        
                        <!-- Cerrar -->
                        <button class="visor-btn cerrar" id="visorCerrar" title="Cerrar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <!-- BODY -->
                <div class="visor-body" id="visorBody">
                    <div id="visorContenido" class="visor-contenido"></div>
                </div>
            </div>
        </div>
        `;
        
        $('body').append(visorHTML);
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Cerrar visor
        $('#visorCerrar').off('click').on('click', () => this.cerrarVisor());
        
        // Navegación entre archivos
        $('#visorArchivoAnterior').off('click').on('click', () => this.navegarArchivo(-1));
        $('#visorArchivoSiguiente').off('click').on('click', () => this.navegarArchivo(1));
        
        // Zoom
        $('#visorZoomIn').off('click').on('click', () => this.ajustarZoom(25));
        $('#visorZoomOut').off('click').on('click', () => this.ajustarZoom(-25));
        $('#visorZoomReset').off('click').on('click', () => this.resetZoom());
        
        // Rotación
        $('#visorRotar').off('click').on('click', () => this.rotarImagen());
        
        // Descargar
        $('#visorDescargar').off('click').on('click', () => this.descargarArchivo());
        
        // Controles PDF
        $('#visorPaginaAnterior').off('click').on('click', () => this.paginaAnterior());
        $('#visorPaginaSiguiente').off('click').on('click', () => this.paginaSiguiente());
        
        // Cerrar con ESC
        $(document).off('keydown.visor').on('keydown.visor', (e) => {
            if (!$('#visorPersonalizado').hasClass('active')) return;
            if (e.key === 'Escape') this.cerrarVisor();
        });
    },
    
    // Obtener URL absoluta de la API - CORREGIDO
    obtenerUrlApi: function() {
        // Usar ruta absoluta desde la raíz del proyecto
        // Asumiendo que la estructura es: html/agenda_calendario/agenda/agenda.html
        // La API está en: php/agenda_calendario/agenda/agenda_api.php
        return '../../../php/agenda_calendario/agenda/agenda_api.php';
    },
    
    // Abrir visor con archivo
    abrirVisor: function(archivo, todosArchivos = []) {
        console.log('📂 Abriendo visor personalizado para:', archivo);
        
        if (typeof archivo === 'string') {
            try {
                archivo = JSON.parse(archivo);
            } catch(e) {
                console.error('Error al parsear archivo:', e);
                return;
            }
        }
        
        if (typeof todosArchivos === 'string') {
            try {
                todosArchivos = JSON.parse(todosArchivos);
            } catch(e) {
                todosArchivos = [archivo];
            }
        }
        
        // Para reportes, no necesitamos id_evento
        if (archivo.origen !== 'reporte') {
            if (!archivo.id_evento) {
                console.error('❌ El archivo no tiene id_evento:', archivo);
                this.mostrarNotificacion('Error: El archivo no tiene identificador de evento', 'error');
                return;
            }
        }
        
        this.archivoActual = archivo;
        this.archivos = Array.isArray(todosArchivos) && todosArchivos.length > 0 ? todosArchivos : [archivo];
        this.indiceActual = this.archivos.findIndex(a => {
            if (a.origen === 'reporte' && archivo.origen === 'reporte') {
                return a.id_reporte === archivo.id_reporte && a.nombre === archivo.nombre;
            }
            if (a.id_evento && archivo.id_evento) {
                return a.id_evento === archivo.id_evento && a.nombre === archivo.nombre;
            }
            return a.ruta === archivo.ruta;
        });
        if (this.indiceActual === -1) this.indiceActual = 0;
        
        // Resetear estado
        this.zoom = 100;
        this.rotacion = 0;
        this.pdfDoc = null;
        this.paginaActual = 1;
        
        // Actualizar título y contador
        $('#visorTitulo').text(archivo.nombre || 'Archivo sin nombre');
        this.actualizarContador();
        
        this.determinarTipoArchivo();
        this.renderizarArchivo();
        this.abrirModal();
    },
    
    // Determinar tipo de archivo
    determinarTipoArchivo: function() {
        if (!this.archivoActual || !this.archivoActual.nombre) {
            this.tipoArchivo = 'desconocido';
            return;
        }
        
        const extension = this.archivoActual.nombre.split('.').pop().toLowerCase();
        const imagenes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const textos = ['txt', 'csv', 'log', 'json', 'xml', 'html', 'css', 'js', 'php', 'sql'];
        
        if (imagenes.includes(extension)) {
            this.tipoArchivo = 'imagen';
            $('#visorRotar').show();
            $('.visor-pdf-controles').hide();
        } else if (extension === 'pdf') {
            this.tipoArchivo = 'pdf';
            $('#visorRotar').hide();
            $('.visor-pdf-controles').show();
        } else if (textos.includes(extension)) {
            this.tipoArchivo = 'texto';
            $('#visorRotar').hide();
            $('.visor-pdf-controles').hide();
        } else {
            this.tipoArchivo = 'desconocido';
            $('#visorRotar').hide();
            $('.visor-pdf-controles').hide();
        }
    },
    
    // Renderizar según tipo
    renderizarArchivo: function() {
        const contenedor = $('#visorContenido');
        contenedor.empty();
        
        switch(this.tipoArchivo) {
            case 'imagen':
                this.renderizarImagen();
                break;
            case 'pdf':
                this.renderizarPDF();
                break;
            case 'texto':
                this.renderizarTexto();
                break;
            default:
                this.renderizarNoSoportado();
        }
        
        $('#visorZoomInfo').text(this.zoom + '%');
    },
    
    // Renderizar imagen - CORREGIDO
    renderizarImagen: function() {
        const contenedor = $('#visorContenido');
        
        if (!this.archivoActual.id_evento) {
            contenedor.html(`
                <div class="visor-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>ERROR AL CARGAR IMAGEN</h3>
                    <p>El archivo no tiene identificador de evento</p>
                </div>
            `);
            return;
        }
        
        const idEvento = this.archivoActual.id_evento;
        const nombreArchivo = encodeURIComponent(this.archivoActual.nombre);
        const apiUrl = this.obtenerUrlApi();
        const urlArchivo = `${apiUrl}?descargar=1&id_evento=${idEvento}&nombre=${nombreArchivo}`;
        
        console.log('🖼️ Cargando imagen desde:', urlArchivo);
        
        const img = $('<img>')
            .addClass('visor-imagen')
            .attr('src', urlArchivo)
            .attr('alt', this.archivoActual.nombre)
            .on('error', function() {
                console.error('❌ Error al cargar la imagen');
                contenedor.html(`
                    <div class="visor-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>ERROR AL CARGAR IMAGEN</h3>
                        <p>No se pudo cargar la imagen. Verifica que el archivo existe.</p>
                    </div>
                `);
            })
            .css({
                'transform': `rotate(${this.rotacion}deg) scale(${this.zoom/100})`,
                'max-width': '100%',
                'height': 'auto',
                'object-fit': 'contain',
                'transition': 'transform 0.2s ease',
                'display': 'block',
                'margin': '0 auto'
            });
        
        contenedor.empty().append(img);
    },
    
    // Renderizar PDF - CORREGIDO
    renderizarPDF: function() {
        const contenedor = $('#visorContenido');
        const self = this;
        
        // Mostrar loading
        contenedor.html(`
            <div class="visor-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>CARGANDO PDF...</p>
            </div>
        `);
        
        // Si es un reporte, ya tiene el contenido en base64
        if (this.archivoActual.origen === 'reporte' && this.archivoActual.contenido) {
            console.log('📄 Cargando PDF desde base64 (reporte)');
            
            // Convertir base64 a blob
            const binaryString = atob(this.archivoActual.contenido);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            this.pdfCanvas = $('<canvas>').addClass('visor-pdf-canvas').css({
                'max-width': '100%',
                'height': 'auto',
                'box-shadow': '0 4px 20px rgba(0,0,0,0.3)',
                'border-radius': '8px',
                'display': 'block',
                'margin': '0 auto'
            });
            
            contenedor.empty().css({
                'display': 'block',
                'text-align': 'center'
            }).append(this.pdfCanvas);
            
            this.pdfContext = this.pdfCanvas[0].getContext('2d');
            
            pdfjsLib.getDocument(url).promise.then(function(pdf) {
                self.pdfDoc = pdf;
                self.totalPaginas = pdf.numPages;
                self.paginaActual = 1;
                
                $('#visorInfoPagina').text(`1 / ${pdf.numPages}`);
                self.cargarPaginaPDF(1);
                
                URL.revokeObjectURL(url);
                
            }).catch(function(error) {
                console.error('❌ Error al cargar PDF:', error);
                contenedor.html(`
                    <div class="visor-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>ERROR AL CARGAR PDF</h3>
                        <p>El archivo PDF no se pudo cargar correctamente</p>
                        <p><small>${error.message || 'Error desconocido'}</small></p>
                    </div>
                `);
            });
            
            return;
        }
        
        // Archivo normal de agenda
        if (!this.archivoActual.id_evento) {
            contenedor.html(`
                <div class="visor-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>ERROR AL CARGAR PDF</h3>
                    <p>El archivo no tiene identificador de evento</p>
                </div>
            `);
            return;
        }
        
        const idEvento = this.archivoActual.id_evento;
        const nombreArchivo = encodeURIComponent(this.archivoActual.nombre);
        const apiUrl = this.obtenerUrlApi();
        const urlArchivo = `${apiUrl}?descargar=1&id_evento=${idEvento}&nombre=${nombreArchivo}`;
        
        console.log('📄 Cargando PDF desde:', urlArchivo);
        
        this.pdfCanvas = $('<canvas>').addClass('visor-pdf-canvas').css({
            'max-width': '100%',
            'height': 'auto',
            'box-shadow': '0 4px 20px rgba(0,0,0,0.3)',
            'border-radius': '8px',
            'display': 'block',
            'margin': '0 auto'
        });
        
        contenedor.empty().css({
            'display': 'block',
            'text-align': 'center'
        }).append(this.pdfCanvas);
        
        this.pdfContext = this.pdfCanvas[0].getContext('2d');
        
        // Usar withCredentials si es necesario
        pdfjsLib.getDocument({
            url: urlArchivo,
            withCredentials: false
        }).promise.then(function(pdf) {
            self.pdfDoc = pdf;
            self.totalPaginas = pdf.numPages;
            self.paginaActual = 1;
            
            console.log(`✅ PDF cargado correctamente. ${self.totalPaginas} páginas.`);
            $('#visorInfoPagina').text(`1 / ${pdf.numPages}`);
            self.cargarPaginaPDF(1);
            
        }).catch(function(error) {
            console.error('❌ Error al cargar PDF:', error);
            contenedor.html(`
                <div class="visor-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>ERROR AL CARGAR PDF</h3>
                    <p>El archivo PDF no se pudo cargar correctamente</p>
                    <p><small>${error.message || 'Error desconocido'}</small></p>
                    <button class="btn-descargar-visor" id="visorDescargarDesdeError" style="margin-top: 15px;">
                        <i class="fas fa-download"></i> DESCARGAR ARCHIVO
                    </button>
                </div>
            `);
            
            $('#visorDescargarDesdeError').off('click').on('click', () => this.descargarArchivo());
        });
    },
    
    // Cargar página específica del PDF
    cargarPaginaPDF: function(numeroPagina) {
        if (!this.pdfDoc) return;
        
        const self = this;
        const escala = this.pdfScale * (this.zoom / 100);
        
        this.pdfDoc.getPage(numeroPagina).then(function(page) {
            const viewport = page.getViewport({ scale: escala });
            
            self.pdfCanvas.attr({
                'width': viewport.width,
                'height': viewport.height
            });
            
            const renderContext = {
                canvasContext: self.pdfContext,
                viewport: viewport
            };
            
            return page.render(renderContext).promise;
        }).then(function() {
            console.log(`✅ Página ${numeroPagina} renderizada`);
            $('#visorBody').scrollTop(0);
        }).catch(function(error) {
            console.error('Error al renderizar página PDF:', error);
        });
    },
    
    // Navegación de páginas PDF
    paginaAnterior: function() {
        if (this.paginaActual > 1) {
            this.paginaActual--;
            this.cargarPaginaPDF(this.paginaActual);
            $('#visorInfoPagina').text(`${this.paginaActual} / ${this.totalPaginas}`);
        }
    },
    
    paginaSiguiente: function() {
        if (this.paginaActual < this.totalPaginas) {
            this.paginaActual++;
            this.cargarPaginaPDF(this.paginaActual);
            $('#visorInfoPagina').text(`${this.paginaActual} / ${this.totalPaginas}`);
        }
    },
    
    // Renderizar texto - CORREGIDO
    renderizarTexto: function() {
        const contenedor = $('#visorContenido');
        
        if (!this.archivoActual.id_evento) {
            contenedor.html(`
                <div class="visor-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>ERROR AL CARGAR TEXTO</h3>
                    <p>El archivo no tiene identificador de evento</p>
                </div>
            `);
            return;
        }
        
        const idEvento = this.archivoActual.id_evento;
        const nombreArchivo = encodeURIComponent(this.archivoActual.nombre);
        const apiUrl = this.obtenerUrlApi();
        const self = this;
        
        contenedor.html('<div class="visor-loading"><i class="fas fa-spinner fa-spin"></i> CARGANDO...</div>');
        
        $.ajax({
            url: `${apiUrl}?descargar=1&id_evento=${idEvento}&nombre=${nombreArchivo}`,
            type: 'GET',
            dataType: 'text',
            success: function(data) {
                contenedor.html(`
                    <pre class="visor-texto">${self.escapeHTML(data)}</pre>
                `);
            },
            error: function(xhr, status, error) {
                console.error('Error al cargar texto:', error);
                contenedor.html(`
                    <div class="visor-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>ERROR AL CARGAR TEXTO</h3>
                        <p>No se pudo cargar el contenido del archivo</p>
                        <p><small>${error}</small></p>
                    </div>
                `);
            }
        });
    },
    
    // Renderizar no soportado
    renderizarNoSoportado: function() {
        $('#visorContenido').html(`
            <div class="visor-no-soportado">
                <i class="fas fa-file-excel"></i>
                <h3>ARCHIVO NO SOPORTADO</h3>
                <p>${this.archivoActual.nombre}</p>
                <p>Este tipo de archivo no se puede visualizar directamente</p>
                <button class="btn-descargar-visor" id="visorDescargarNoSoportado">
                    <i class="fas fa-download"></i> DESCARGAR ARCHIVO
                </button>
            </div>
        `);
        
        $('#visorDescargarNoSoportado').off('click').on('click', () => this.descargarArchivo());
    },
    
    // Ajustar zoom
    ajustarZoom: function(delta) {
        if (this.tipoArchivo === 'desconocido') return;
        
        let nuevoZoom = this.zoom + delta;
        if (nuevoZoom < 25) nuevoZoom = 25;
        if (nuevoZoom > 300) nuevoZoom = 300;
        
        this.zoom = nuevoZoom;
        
        if (this.tipoArchivo === 'imagen') {
            $('#visorContenido img').css('transform', `rotate(${this.rotacion}deg) scale(${this.zoom/100})`);
        } else if (this.tipoArchivo === 'pdf' && this.pdfDoc) {
            this.cargarPaginaPDF(this.paginaActual);
        } else if (this.tipoArchivo === 'texto') {
            $('#visorContenido pre').css('font-size', (this.zoom / 100) + 'em');
        }
        
        $('#visorZoomInfo').text(this.zoom + '%');
    },
    
    resetZoom: function() {
        this.zoom = 100;
        
        if (this.tipoArchivo === 'imagen') {
            $('#visorContenido img').css('transform', `rotate(${this.rotacion}deg) scale(1)`);
        } else if (this.tipoArchivo === 'pdf' && this.pdfDoc) {
            this.cargarPaginaPDF(this.paginaActual);
        } else if (this.tipoArchivo === 'texto') {
            $('#visorContenido pre').css('font-size', '1em');
        }
        
        $('#visorZoomInfo').text('100%');
    },
    
    // Rotar imagen
    rotarImagen: function() {
        if (this.tipoArchivo !== 'imagen') return;
        
        this.rotacion = (this.rotacion + 90) % 360;
        $('#visorContenido img').css('transform', `rotate(${this.rotacion}deg) scale(${this.zoom/100})`);
    },
    
    // Navegar entre archivos
    navegarArchivo: function(direccion) {
        if (this.archivos.length <= 1) {
            this.mostrarNotificacion('No hay más archivos', 'info');
            return;
        }
        
        const nuevoIndice = this.indiceActual + direccion;
        if (nuevoIndice < 0 || nuevoIndice >= this.archivos.length) {
            this.mostrarNotificacion(
                nuevoIndice < 0 ? 'Primer archivo' : 'Último archivo',
                'info'
            );
            return;
        }
        
        this.indiceActual = nuevoIndice;
        this.archivoActual = this.archivos[this.indiceActual];
        
        // Resetear estado
        this.zoom = 100;
        this.rotacion = 0;
        this.pdfDoc = null;
        this.paginaActual = 1;
        
        // Actualizar UI
        $('#visorTitulo').text(this.archivoActual.nombre);
        this.actualizarContador();
        this.determinarTipoArchivo();
        this.renderizarArchivo();
    },
    
    // Actualizar contador de archivos
    actualizarContador: function() {
        if (this.archivos.length > 1) {
            $('#visorContador').text(`${this.indiceActual + 1} / ${this.archivos.length}`);
        } else {
            $('#visorContador').text('');
        }
    },
    
    // ============================================
    // DESCARGA DE ARCHIVOS - CORREGIDA
    // ============================================
    descargarArchivo: function() {
        if (!this.archivoActual) {
            this.mostrarNotificacion('No hay archivo para descargar', 'error');
            return;
        }
        
        console.log('📥 Descargando archivo:', this.archivoActual);
        
        // Caso 1: Reporte (origen === 'reporte' con contenido base64)
        if (this.archivoActual.origen === 'reporte' && this.archivoActual.contenido) {
            console.log('📥 Descargando reporte desde base64');
            this.descargarDesdeBase64(this.archivoActual.contenido, this.archivoActual.nombre);
            return;
        }
        
        // Caso 2: Archivo normal de agenda (con id_evento)
        if (this.archivoActual.id_evento) {
            console.log('📥 Descargando archivo normal desde API');
            const idEvento = this.archivoActual.id_evento;
            const nombreArchivo = encodeURIComponent(this.archivoActual.nombre);
            const apiUrl = this.obtenerUrlApi();
            
            const enlace = document.createElement('a');
            enlace.href = `${apiUrl}?descargar=1&id_evento=${idEvento}&nombre=${nombreArchivo}`;
            enlace.download = this.archivoActual.nombre;
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            this.mostrarNotificacion(`Descargando: ${this.archivoActual.nombre}`, 'success');
            return;
        }
        
        // Caso 3: No se puede descargar
        this.mostrarNotificacion('Error: No se puede descargar este archivo', 'error');
    },
    
    /**
     * Descargar archivo desde base64 (para reportes PDF)
     */
    descargarDesdeBase64: function(base64Content, nombreArchivo) {
        try {
            // Decodificar base64 a binario
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Crear blob y descargar
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = nombreArchivo;
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            
            // Limpiar URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            this.mostrarNotificacion(`Descargando: ${nombreArchivo}`, 'success');
            console.log('✅ Descarga desde base64 completada');
            
        } catch(error) {
            console.error('❌ Error al descargar desde base64:', error);
            this.mostrarNotificacion('Error al descargar el archivo', 'error');
        }
    },
    
    // Escapar HTML para texto
    escapeHTML: function(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        });
    },
    
    // Abrir modal
    abrirModal: function() {
        $('#visorPersonalizado').addClass('active');
        $('body').css('overflow', 'hidden');
    },
    
    // Cerrar visor
    cerrarVisor: function() {
        $('#visorPersonalizado').removeClass('active');
        $('body').css('overflow', 'auto');
        
        setTimeout(() => {
            $('#visorContenido').empty();
            this.archivoActual = null;
            this.archivos = [];
            this.pdfDoc = null;
        }, 300);
    },
    
    // Mostrar notificación
    mostrarNotificacion: function(mensaje, tipo = 'info') {
        const notificacion = $(`
            <div class="visor-notificacion visor-notificacion-${tipo}">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${mensaje}</span>
            </div>
        `);
        
        $('body').append(notificacion);
        
        setTimeout(() => {
            notificacion.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
};

// Inicializar
$(document).ready(function() {
    window.VisorArchivos = VisorArchivos;
    VisorArchivos.init();
});