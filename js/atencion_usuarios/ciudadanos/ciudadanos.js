/**
 * ciudadanos.js - Gestión de ciudadanos para Atención a Usuarios
 * Maneja: CRUD de ciudadanos, filtros, modal, carga de datos desde API
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 Módulo de Ciudadanos - Inicializado');

    // ============================================
    // VARIABLES GLOBALES
    // ============================================
    let ciudadanos = [];
    let formaciones = [];
    let asentamientos = [];
    let dependenciasList = [];
    let currentEditId = null;

    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const filtroContainer = document.getElementById('filtroContainer');
    const filtroToggle = document.getElementById('filtroToggle');
    const filtroBody = document.getElementById('filtroBody');
    const filtroNombre = document.getElementById('filtroNombre');
    const filtroFormacionInput = document.getElementById('filtroFormacionInput');
    const filtroFormacionHidden = document.getElementById('filtroFormacion');
    const filtroDependenciaInput = document.getElementById('filtroDependenciaInput');
    const filtroDependenciaHidden = document.getElementById('filtroDependencia');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    
    const ciudadanosGrid = document.getElementById('ciudadanosGrid');
    const totalCiudadanosCount = document.getElementById('totalCiudadanosCount');
    const mostrandoCount = document.getElementById('mostrandoCount');
    
    const modalCiudadano = document.getElementById('modalCiudadano');
    const btnAgregarCiudadano = document.getElementById('btnAgregarCiudadano');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const formCiudadano = document.getElementById('formCiudadano');
    
    // Campos del formulario
    const nombreCompleto = document.getElementById('nombreCompleto');
    const formacionAcademicaInput = document.getElementById('formacionAcademicaInput');
    const formacionAcademicaHidden = document.getElementById('formacionAcademica');
    const nombre = document.getElementById('nombre');
    const apellidoPaterno = document.getElementById('apellidoPaterno');
    const apellidoMaterno = document.getElementById('apellidoMaterno');
    const telefonoCasa = document.getElementById('telefonoCasa');
    const telefonoCelular = document.getElementById('telefonoCelular');
    const calle = document.getElementById('calle');
    const numExterior = document.getElementById('numExterior');
    const numInterior = document.getElementById('numInterior');
    const tipoAsentamiento = document.getElementById('tipoAsentamiento');
    const asentamientoInput = document.getElementById('asentamientoInput');
    const asentamientoHidden = document.getElementById('asentamiento');
    const municipio = document.getElementById('municipio');
    const codigoPostal = document.getElementById('codigoPostal');
    const dependenciaInput = document.getElementById('dependenciaInput');
    const dependenciaHidden = document.getElementById('dependencia');

    // Modales selectores
    const modalSelectorFormacion = document.getElementById('modalSelectorFormacion');
    const modalSelectorDependencia = document.getElementById('modalSelectorDependencia');
    const modalSelectorAsentamiento = document.getElementById('modalSelectorAsentamiento');
    const modalSelectorFiltroFormacion = document.getElementById('modalSelectorFiltroFormacion');
    const modalSelectorFiltroDependencia = document.getElementById('modalSelectorFiltroDependencia');
    
    const formacionList = document.getElementById('formacionList');
    const dependenciaList = document.getElementById('dependenciaList');
    const asentamientoList = document.getElementById('asentamientoList');
    const filtroFormacionList = document.getElementById('filtroFormacionList');
    const filtroDependenciaList = document.getElementById('filtroDependenciaList');
    
    const searchFormacion = document.getElementById('searchFormacion');
    const searchDependencia = document.getElementById('searchDependencia');
    const searchAsentamiento = document.getElementById('searchAsentamiento');
    const searchFiltroFormacion = document.getElementById('searchFiltroFormacion');
    const searchFiltroDependencia = document.getElementById('searchFiltroDependencia');

    // ============================================
    // FUNCIONES DE ACTUALIZACIÓN DE NOMBRE COMPLETO
    // ============================================
    function actualizarNombreCompleto() {
        const formacionText = formacionAcademicaInput.value;
        const nombreText = nombre.value.trim();
        const apellidoPText = apellidoPaterno.value.trim();
        const apellidoMText = apellidoMaterno.value.trim();
        
        let completo = '';
        if (formacionText) completo += formacionText + ' ';
        if (nombreText) completo += nombreText;
        if (apellidoPText) completo += ' ' + apellidoPText;
        if (apellidoMText) completo += ' ' + apellidoMText;
        
        if (nombreCompleto) nombreCompleto.value = completo.trim().toUpperCase();
    }

    if (nombre) nombre.addEventListener('input', actualizarNombreCompleto);
    if (apellidoPaterno) apellidoPaterno.addEventListener('input', actualizarNombreCompleto);
    if (apellidoMaterno) apellidoMaterno.addEventListener('input', actualizarNombreCompleto);

    // ============================================
    // FUNCIONES DE MODALES SELECTORES
    // ============================================
    function cerrarModalesSelector() {
        const modales = [
            modalSelectorFormacion, modalSelectorDependencia, modalSelectorAsentamiento,
            modalSelectorFiltroFormacion, modalSelectorFiltroDependencia
        ];
        modales.forEach(modal => {
            if (modal) modal.classList.remove('active');
        });
        if (searchFormacion) searchFormacion.value = '';
        if (searchDependencia) searchDependencia.value = '';
        if (searchAsentamiento) searchAsentamiento.value = '';
        if (searchFiltroFormacion) searchFiltroFormacion.value = '';
        if (searchFiltroDependencia) searchFiltroDependencia.value = '';
    }

    // Formulario - Formaciones
    function abrirModalFormacion() {
        if (!modalSelectorFormacion) return;
        renderizarListaFormaciones(formacionList, formaciones, '', (item) => {
            if (formacionAcademicaInput) formacionAcademicaInput.value = item.formacion;
            if (formacionAcademicaHidden) formacionAcademicaHidden.value = item.id_formacion;
            actualizarNombreCompleto();
            cerrarModalesSelector();
        });
        modalSelectorFormacion.classList.add('active');
    }

    // Formulario - Dependencias
    function abrirModalDependencia() {
        if (!modalSelectorDependencia) return;
        renderizarListaDependencias(dependenciaList, dependenciasList, '', (item) => {
            if (dependenciaInput) dependenciaInput.value = item.DEPENDENCIA;
            if (dependenciaHidden) dependenciaHidden.value = item.IDDEPENDENCIA;
            cerrarModalesSelector();
        });
        modalSelectorDependencia.classList.add('active');
    }

    // Formulario - Asentamientos
    function abrirModalAsentamiento() {
        if (!modalSelectorAsentamiento) return;
        renderizarListaAsentamientos(asentamientoList, asentamientos, '', (item) => {
            if (asentamientoInput) asentamientoInput.value = item.ASENTAMIENTO;
            if (asentamientoHidden) asentamientoHidden.value = item.IDasentamiento;
            if (tipoAsentamiento) tipoAsentamiento.value = item.TIPO_ASENTAMIENTO || '';
            if (municipio) municipio.value = item.MUNICIPIO || '';
            cerrarModalesSelector();
        });
        modalSelectorAsentamiento.classList.add('active');
    }

    // Filtro - Formaciones
    function abrirModalFiltroFormacion() {
        if (!modalSelectorFiltroFormacion) return;
        renderizarListaFormaciones(filtroFormacionList, formaciones, '', (item) => {
            if (filtroFormacionInput) filtroFormacionInput.value = item.formacion;
            if (filtroFormacionHidden) filtroFormacionHidden.value = item.id_formacion;
            renderizarCiudadanos();
            cerrarModalesSelector();
        }, true);
        modalSelectorFiltroFormacion.classList.add('active');
    }

    // Filtro - Dependencias
    function abrirModalFiltroDependencia() {
        if (!modalSelectorFiltroDependencia) return;
        renderizarListaDependencias(filtroDependenciaList, dependenciasList, '', (item) => {
            if (filtroDependenciaInput) filtroDependenciaInput.value = item.DEPENDENCIA;
            if (filtroDependenciaHidden) filtroDependenciaHidden.value = item.IDDEPENDENCIA;
            renderizarCiudadanos();
            cerrarModalesSelector();
        }, true);
        modalSelectorFiltroDependencia.classList.add('active');
    }

    function renderizarListaFormaciones(container, datos, filtro, onSelect, incluirTodos = false) {
        if (!container) return;
        let filtradas = datos;
        if (filtro) {
            filtradas = datos.filter(f => f.formacion.toLowerCase().includes(filtro.toLowerCase()));
        }
        
        container.innerHTML = '';
        
        if (incluirTodos) {
            const itemTodos = document.createElement('div');
            itemTodos.className = 'selector-item';
            itemTodos.textContent = 'TODAS LAS FORMACIONES';
            itemTodos.addEventListener('click', () => {
                if (onSelect) onSelect({ formacion: '', id_formacion: '' });
            });
            container.appendChild(itemTodos);
        }
        
        filtradas.forEach(f => {
            const item = document.createElement('div');
            item.className = 'selector-item';
            item.textContent = f.formacion;
            item.addEventListener('click', () => {
                if (onSelect) onSelect(f);
            });
            container.appendChild(item);
        });
        
        if (filtradas.length === 0 && !incluirTodos) {
            container.innerHTML = '<div class="selector-item" style="text-align: center; cursor: default;">NO SE ENCONTRARON RESULTADOS</div>';
        }
    }

    function renderizarListaDependencias(container, datos, filtro, onSelect, incluirTodos = false) {
        if (!container) return;
        let filtradas = datos;
        if (filtro) {
            filtradas = datos.filter(d => d.DEPENDENCIA.toLowerCase().includes(filtro.toLowerCase()));
        }
        
        container.innerHTML = '';
        
        if (incluirTodos) {
            const itemTodos = document.createElement('div');
            itemTodos.className = 'selector-item';
            itemTodos.textContent = 'TODAS LAS DEPENDENCIAS';
            itemTodos.addEventListener('click', () => {
                if (onSelect) onSelect({ DEPENDENCIA: '', IDDEPENDENCIA: '' });
            });
            container.appendChild(itemTodos);
        }
        
        filtradas.forEach(d => {
            const item = document.createElement('div');
            item.className = 'selector-item';
            item.textContent = d.DEPENDENCIA;
            item.addEventListener('click', () => {
                if (onSelect) onSelect(d);
            });
            container.appendChild(item);
        });
        
        if (filtradas.length === 0 && !incluirTodos) {
            container.innerHTML = '<div class="selector-item" style="text-align: center; cursor: default;">NO SE ENCONTRARON RESULTADOS</div>';
        }
    }

    function renderizarListaAsentamientos(container, datos, filtro, onSelect) {
        if (!container) return;
        let filtradas = datos;
        if (filtro) {
            filtradas = datos.filter(a => a.ASENTAMIENTO.toLowerCase().includes(filtro.toLowerCase()));
        }
        
        container.innerHTML = '';
        filtradas.forEach(a => {
            const item = document.createElement('div');
            item.className = 'selector-item';
            item.textContent = a.ASENTAMIENTO;
            item.addEventListener('click', () => {
                if (onSelect) onSelect(a);
            });
            container.appendChild(item);
        });
        
        if (filtradas.length === 0) {
            container.innerHTML = '<div class="selector-item" style="text-align: center; cursor: default;">NO SE ENCONTRARON RESULTADOS</div>';
        }
    }

    // ============================================
    // FUNCIONES DE API
    // ============================================
    async function obtenerCiudadanos() {
        try {
            const response = await fetch('../../../php/atencion_usuarios/ciudadanos/obtener_ciudadanos.php');
            const result = await response.json();
            if (result.success) return result.data;
            else return [];
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }
    
    async function guardarCiudadano(ciudadanoData) {
        try {
            const response = await fetch('../../../php/atencion_usuarios/ciudadanos/guardar_ciudadano.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ciudadanoData)
            });
            const result = await response.json();
            if (result.success) return result.data;
            else throw new Error(result.error);
        } catch (error) {
            console.error('Error al guardar:', error);
            throw error;
        }
    }
    
    async function eliminarCiudadano(id) {
        try {
            const response = await fetch('../../../php/atencion_usuarios/ciudadanos/eliminar_ciudadano.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            if (result.success) return true;
            else throw new Error(result.error);
        } catch (error) {
            console.error('Error al eliminar:', error);
            throw error;
        }
    }
    
    async function obtenerFormaciones() {
        try {
            const response = await fetch('../../../php/atencion_usuarios/ciudadanos/obtener_formaciones.php');
            const result = await response.json();
            if (result.success) return result.data;
            else return [];
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }
    
    async function obtenerAsentamientos() {
        try {
            const response = await fetch('../../../php/atencion_usuarios/ciudadanos/obtener_asentamientos.php');
            const result = await response.json();
            if (result.success) return result.data;
            else return [];
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }
    
    async function obtenerDependencias() {
        try {
            const response = await fetch('../../../php/atencion_usuarios/ciudadanos/obtener_dependencias.php');
            const result = await response.json();
            if (result.success) return result.data;
            else return [];
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }
    
    function notificarActualizacionPadre() {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'updateCounts', ciudadanos: ciudadanos.length }, '*');
        }
    }

    // ============================================
    // FUNCIONES DE RENDERIZADO
    // ============================================
    function renderizarCiudadanos() {
        if (!ciudadanosGrid) return;
        let filtrados = filtrarCiudadanos();
        
        if (totalCiudadanosCount) totalCiudadanosCount.textContent = ciudadanos.length;
        if (mostrandoCount) mostrandoCount.textContent = filtrados.length;
        
        ciudadanosGrid.innerHTML = '';
        
        if (filtrados.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-users-slash"></i>
                <p>NO SE ENCONTRARON CIUDADANOS</p>
                <span>${ciudadanos.length === 0 ? 'HAZ CLIC EN "AGREGAR CIUDADANO" PARA COMENZAR' : 'INTENTA CON OTROS FILTROS DE BÚSQUEDA'}</span>
            `;
            ciudadanosGrid.appendChild(emptyState);
            return;
        }
        
        filtrados.forEach(ciudadano => {
            const nombreCompletoTexto = `${ciudadano.nombre || ''} ${ciudadano.apellidoPaterno || ''} ${ciudadano.apellidoMaterno || ''}`.trim();
            const formacionTexto = obtenerNombreFormacion(ciudadano.formacionId);
            
            const card = document.createElement('div');
            card.className = 'ciudadano-card';
            card.setAttribute('data-id', ciudadano.id);
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-id"><i class="fas fa-id-badge"></i> ID: ${ciudadano.id}</span>
                    <div class="card-actions">
                        <button class="btn-card-action btn-editar" data-id="${ciudadano.id}" title="EDITAR"><i class="fas fa-edit"></i></button>
                        <button class="btn-card-action btn-eliminar" data-id="${ciudadano.id}" title="ELIMINAR"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="card-name">
                    <h4>${formacionTexto ? formacionTexto + ' ' + nombreCompletoTexto.toUpperCase() : nombreCompletoTexto.toUpperCase()}</h4>
                </div>
                <div class="card-info">
                    <div class="info-item"><i class="fas fa-building"></i><span>${ciudadano.dependenciaNombre || 'SIN DEPENDENCIA'}</span></div>
                    <div class="info-item"><i class="fas fa-map-marker-alt"></i><span>${ciudadano.asentamientoNombre || 'SIN DOMICILIO'}</span></div>
                    ${ciudadano.telefonoCelular ? `<div class="info-item"><i class="fas fa-mobile-alt"></i><span>${ciudadano.telefonoCelular}</span></div>` : ''}
                </div>
            `;
            ciudadanosGrid.appendChild(card);
        });
        
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); editarCiudadano(btn.getAttribute('data-id')); });
        });
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); confirmarEliminar(btn.getAttribute('data-id')); });
        });
    }
    
    function filtrarCiudadanos() {
        let filtrados = [...ciudadanos];
        const textoFiltro = filtroNombre ? filtroNombre.value.trim().toUpperCase() : '';
        if (textoFiltro) {
            filtrados = filtrados.filter(c => {
                const nombreCompleto = `${c.nombre || ''} ${c.apellidoPaterno || ''} ${c.apellidoMaterno || ''}`.toUpperCase();
                return nombreCompleto.includes(textoFiltro);
            });
        }
        const formacionFiltro = filtroFormacionHidden ? filtroFormacionHidden.value : '';
        if (formacionFiltro) filtrados = filtrados.filter(c => c.formacionId === formacionFiltro);
        const dependenciaFiltro = filtroDependenciaHidden ? filtroDependenciaHidden.value : '';
        if (dependenciaFiltro) filtrados = filtrados.filter(c => c.dependenciaId === dependenciaFiltro);
        return filtrados;
    }
    
    function obtenerNombreFormacion(formacionId) {
        const formacion = formaciones.find(f => f.id_formacion.toString() === formacionId?.toString());
        return formacion ? formacion.formacion : null;
    }
    
    function obtenerNombreDependencia(dependenciaId) {
        const dep = dependenciasList.find(d => d.IDDEPENDENCIA === dependenciaId);
        return dep ? dep.DEPENDENCIA : null;
    }
    
    function obtenerNombreAsentamiento(asentamientoId) {
        const asent = asentamientos.find(a => a.IDasentamiento === asentamientoId);
        return asent ? asent.ASENTAMIENTO : null;
    }

    // ============================================
    // FUNCIONES DEL MODAL PRINCIPAL
    // ============================================
    function abrirModalNuevo() {
        currentEditId = null;
        formCiudadano.reset();
        if (formacionAcademicaInput) formacionAcademicaInput.value = '';
        if (formacionAcademicaHidden) formacionAcademicaHidden.value = '';
        if (dependenciaInput) dependenciaInput.value = '';
        if (dependenciaHidden) dependenciaHidden.value = '';
        if (asentamientoInput) asentamientoInput.value = '';
        if (asentamientoHidden) asentamientoHidden.value = '';
        if (tipoAsentamiento) tipoAsentamiento.value = '';
        if (municipio) municipio.value = '';
        if (nombreCompleto) nombreCompleto.value = '';
        
        const modalTitle = document.querySelector('#modalCiudadano .modal-header h3');
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> REGISTRAR NUEVO CIUDADANO';
        modalCiudadano.classList.add('active');
    }
    
    function editarCiudadano(id) {
        const ciudadano = ciudadanos.find(c => c.id == id);
        if (!ciudadano) return;
        currentEditId = id;
        
        const formacion = formaciones.find(f => f.id_formacion.toString() === ciudadano.formacionId?.toString());
        if (formacionAcademicaInput) formacionAcademicaInput.value = formacion ? formacion.formacion : '';
        if (formacionAcademicaHidden) formacionAcademicaHidden.value = ciudadano.formacionId || '';
        if (nombre) nombre.value = ciudadano.nombre || '';
        if (apellidoPaterno) apellidoPaterno.value = ciudadano.apellidoPaterno || '';
        if (apellidoMaterno) apellidoMaterno.value = ciudadano.apellidoMaterno || '';
        if (telefonoCasa) telefonoCasa.value = ciudadano.telefonoCasa || '';
        if (telefonoCelular) telefonoCelular.value = ciudadano.telefonoCelular || '';
        if (calle) calle.value = ciudadano.calle || '';
        if (numExterior) numExterior.value = ciudadano.numExterior || '';
        if (numInterior) numInterior.value = ciudadano.numInterior || '';
        if (tipoAsentamiento) tipoAsentamiento.value = ciudadano.tipoAsentamiento || '';
        
        const asentamientoObj = asentamientos.find(a => a.IDasentamiento === ciudadano.asentamientoId);
        if (asentamientoInput) asentamientoInput.value = asentamientoObj ? asentamientoObj.ASENTAMIENTO : '';
        if (asentamientoHidden) asentamientoHidden.value = ciudadano.asentamientoId || '';
        
        if (municipio) municipio.value = ciudadano.municipio || '';
        if (codigoPostal) codigoPostal.value = ciudadano.codigoPostal || '';
        
        const dependenciaObj = dependenciasList.find(d => d.IDDEPENDENCIA === ciudadano.dependenciaId);
        if (dependenciaInput) dependenciaInput.value = dependenciaObj ? dependenciaObj.DEPENDENCIA : '';
        if (dependenciaHidden) dependenciaHidden.value = ciudadano.dependenciaId || '';
        
        actualizarNombreCompleto();
        
        const modalTitle = document.querySelector('#modalCiudadano .modal-header h3');
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> EDITAR CIUDADANO';
        modalCiudadano.classList.add('active');
    }
    
    function cerrarModal() {
        modalCiudadano.classList.remove('active');
        formCiudadano.reset();
        currentEditId = null;
    }
    
    async function confirmarEliminar(id) {
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: '¿ELIMINAR CIUDADANO?',
                text: 'ESTA ACCIÓN NO SE PUEDE DESHACER',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'SÍ, ELIMINAR',
                cancelButtonText: 'CANCELAR',
                background: 'linear-gradient(135deg, rgba(26, 4, 11, 0.98), rgba(15, 2, 24, 0.98))',
                backdrop: 'rgba(0, 0, 0, 0.8)'
            });
            if (result.isConfirmed) {
                try {
                    await eliminarCiudadano(id);
                    await cargarDatosIniciales();
                    renderizarCiudadanos();
                    notificarActualizacionPadre();
                    Swal.fire({ title: '¡ELIMINADO!', text: 'EL CIUDADANO HA SIDO ELIMINADO', icon: 'success', timer: 2000, showConfirmButton: false });
                } catch (error) { Swal.fire('ERROR', 'NO SE PUDO ELIMINAR EL CIUDADANO', 'error'); }
            }
        } else {
            if (confirm('¿ELIMINAR CIUDADANO? ESTA ACCIÓN NO SE PUEDE DESHACER')) {
                try {
                    await eliminarCiudadano(id);
                    await cargarDatosIniciales();
                    renderizarCiudadanos();
                    notificarActualizacionPadre();
                    alert('CIUDADANO ELIMINADO');
                } catch (error) { alert('ERROR AL ELIMINAR'); }
            }
        }
    }
    
    // ============================================
    // CARGAR DATOS
    // ============================================
    async function cargarFormaciones() {
        formaciones = await obtenerFormaciones();
    }
    
    async function cargarAsentamientos() {
        asentamientos = await obtenerAsentamientos();
    }
    
    async function cargarDependencias() {
        dependenciasList = await obtenerDependencias();
    }
    
    async function cargarCiudadanos() {
        ciudadanos = await obtenerCiudadanos();
        renderizarCiudadanos();
    }
    
    async function cargarDatosIniciales() {
        await Promise.all([cargarFormaciones(), cargarAsentamientos(), cargarDependencias(), cargarCiudadanos()]);
    }
    
    // ============================================
    // GUARDAR CIUDADANO
    // ============================================
    async function onSubmitCiudadano(e) {
        e.preventDefault();
        
        if (!formacionAcademicaHidden.value) {
            if (typeof Swal !== 'undefined') Swal.fire('ERROR', 'SELECCIONE UNA FORMACIÓN ACADÉMICA', 'error');
            else alert('SELECCIONE UNA FORMACIÓN ACADÉMICA');
            return;
        }
        if (!nombre.value.trim()) {
            if (typeof Swal !== 'undefined') Swal.fire('ERROR', 'INGRESE EL NOMBRE(S)', 'error');
            else alert('INGRESE EL NOMBRE(S)');
            return;
        }
        if (!apellidoPaterno.value.trim()) {
            if (typeof Swal !== 'undefined') Swal.fire('ERROR', 'INGRESE EL APELLIDO PATERNO', 'error');
            else alert('INGRESE EL APELLIDO PATERNO');
            return;
        }
        if (!dependenciaHidden.value) {
            if (typeof Swal !== 'undefined') Swal.fire('ERROR', 'SELECCIONE UNA DEPENDENCIA', 'error');
            else alert('SELECCIONE UNA DEPENDENCIA');
            return;
        }
        if (!asentamientoHidden.value) {
            if (typeof Swal !== 'undefined') Swal.fire('ERROR', 'SELECCIONE UN ASENTAMIENTO', 'error');
            else alert('SELECCIONE UN ASENTAMIENTO');
            return;
        }
        
        const ciudadanoData = {
            id: currentEditId,
            formacionId: formacionAcademicaHidden.value,
            nombre: nombre.value.trim().toUpperCase(),
            apellidoPaterno: apellidoPaterno.value.trim().toUpperCase(),
            apellidoMaterno: apellidoMaterno.value.trim().toUpperCase(),
            telefonoCasa: telefonoCasa.value.trim(),
            telefonoCelular: telefonoCelular.value.trim(),
            calle: calle.value.trim().toUpperCase(),
            numExterior: numExterior.value.trim().toUpperCase(),
            numInterior: numInterior.value.trim().toUpperCase(),
            tipoAsentamiento: tipoAsentamiento.value,
            asentamientoId: asentamientoHidden.value,
            municipio: municipio.value,
            codigoPostal: codigoPostal.value.trim(),
            dependenciaId: dependenciaHidden.value,
            dependenciaNombre: dependenciaInput.value,
            asentamientoNombre: asentamientoInput.value
        };
        
        const btnGuardar = document.getElementById('btnGuardarCiudadano');
        const originalText = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';
        btnGuardar.disabled = true;
        
        try {
            await guardarCiudadano(ciudadanoData);
            await cargarCiudadanos();
            cerrarModal();
            notificarActualizacionPadre();
            if (typeof Swal !== 'undefined') {
                Swal.fire({ title: '¡ÉXITO!', text: currentEditId ? 'CIUDADANO ACTUALIZADO CORRECTAMENTE' : 'CIUDADANO REGISTRADO CORRECTAMENTE', icon: 'success', timer: 2000, showConfirmButton: false });
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            if (typeof Swal !== 'undefined') Swal.fire('ERROR', 'OCURRIÓ UN ERROR AL GUARDAR: ' + error.message, 'error');
            else alert('ERROR AL GUARDAR: ' + error.message);
        } finally {
            btnGuardar.innerHTML = originalText;
            btnGuardar.disabled = false;
        }
    }
    
    // ============================================
    // FILTRO MINIMIZABLE Y LIMPIEZA
    // ============================================
    function setupFiltroMinimizable() {
        if (!filtroContainer || !filtroToggle || !filtroBody) return;
        const isMinimized = localStorage.getItem('filtro_ciudadanos_minimizado') === 'true';
        if (isMinimized) {
            filtroContainer.classList.add('minimizado');
            filtroToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
        filtroToggle.addEventListener('click', () => {
            filtroContainer.classList.toggle('minimizado');
            const isNowMinimized = filtroContainer.classList.contains('minimizado');
            filtroToggle.innerHTML = isNowMinimized ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
            localStorage.setItem('filtro_ciudadanos_minimizado', isNowMinimized);
        });
    }
    
    function limpiarFiltros() {
        if (filtroNombre) filtroNombre.value = '';
        if (filtroFormacionInput) filtroFormacionInput.value = '';
        if (filtroFormacionHidden) filtroFormacionHidden.value = '';
        if (filtroDependenciaInput) filtroDependenciaInput.value = '';
        if (filtroDependenciaHidden) filtroDependenciaHidden.value = '';
        renderizarCiudadanos();
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    function setupEventListeners() {
        if (btnAgregarCiudadano) btnAgregarCiudadano.addEventListener('click', abrirModalNuevo);
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', cerrarModal);
        if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModal);
        if (modalCiudadano) modalCiudadano.addEventListener('click', (e) => { if (e.target === modalCiudadano) cerrarModal(); });
        if (formCiudadano) formCiudadano.addEventListener('submit', onSubmitCiudadano);
        if (filtroNombre) filtroNombre.addEventListener('input', () => renderizarCiudadanos());
        if (btnLimpiarFiltros) btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
        
        setupFiltroMinimizable();
        
        // Botones selectores del formulario
        document.querySelectorAll('.btn-selector').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.getAttribute('data-type');
                if (type === 'formacion') abrirModalFormacion();
                else if (type === 'dependencia') abrirModalDependencia();
                else if (type === 'asentamiento') abrirModalAsentamiento();
            });
        });
        
        // Botones selectores de filtros
        document.querySelectorAll('.btn-selector-filtro').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.getAttribute('data-type');
                if (type === 'filtroFormacion') abrirModalFiltroFormacion();
                else if (type === 'filtroDependencia') abrirModalFiltroDependencia();
            });
        });
        
        // Cerrar modales selector
        document.querySelectorAll('.modal-selector-close').forEach(btn => {
            btn.addEventListener('click', cerrarModalesSelector);
        });
        document.querySelectorAll('.modal-selector').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModalesSelector(); });
        });
        
        // Búsquedas en tiempo real
        if (searchFormacion) searchFormacion.addEventListener('input', (e) => {
            renderizarListaFormaciones(formacionList, formaciones, e.target.value, (item) => {
                if (formacionAcademicaInput) formacionAcademicaInput.value = item.formacion;
                if (formacionAcademicaHidden) formacionAcademicaHidden.value = item.id_formacion;
                actualizarNombreCompleto();
                cerrarModalesSelector();
            });
        });
        
        if (searchDependencia) searchDependencia.addEventListener('input', (e) => {
            renderizarListaDependencias(dependenciaList, dependenciasList, e.target.value, (item) => {
                if (dependenciaInput) dependenciaInput.value = item.DEPENDENCIA;
                if (dependenciaHidden) dependenciaHidden.value = item.IDDEPENDENCIA;
                cerrarModalesSelector();
            });
        });
        
        if (searchAsentamiento) searchAsentamiento.addEventListener('input', (e) => {
            renderizarListaAsentamientos(asentamientoList, asentamientos, e.target.value, (item) => {
                if (asentamientoInput) asentamientoInput.value = item.ASENTAMIENTO;
                if (asentamientoHidden) asentamientoHidden.value = item.IDasentamiento;
                if (tipoAsentamiento) tipoAsentamiento.value = item.TIPO_ASENTAMIENTO || '';
                if (municipio) municipio.value = item.MUNICIPIO || '';
                cerrarModalesSelector();
            });
        });
        
        if (searchFiltroFormacion) searchFiltroFormacion.addEventListener('input', (e) => {
            renderizarListaFormaciones(filtroFormacionList, formaciones, e.target.value, (item) => {
                if (filtroFormacionInput) filtroFormacionInput.value = item.formacion;
                if (filtroFormacionHidden) filtroFormacionHidden.value = item.id_formacion;
                renderizarCiudadanos();
                cerrarModalesSelector();
            }, true);
        });
        
        if (searchFiltroDependencia) searchFiltroDependencia.addEventListener('input', (e) => {
            renderizarListaDependencias(filtroDependenciaList, dependenciasList, e.target.value, (item) => {
                if (filtroDependenciaInput) filtroDependenciaInput.value = item.DEPENDENCIA;
                if (filtroDependenciaHidden) filtroDependenciaHidden.value = item.IDDEPENDENCIA;
                renderizarCiudadanos();
                cerrarModalesSelector();
            }, true);
        });
    }
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    async function init() {
        setupEventListeners();
        await cargarDatosIniciales();
        if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'hideLoading' }, '*');
        console.log('✅ Módulo de Ciudadanos - Listo');
    }
    
    init();
});