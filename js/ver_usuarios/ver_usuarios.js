/**
 * ver_usuarios.js - Gestión de usuarios (CRUD completo + Editar Permisos)
 * MODIFICADO: Usuario maestro detectado desde BD con campo es_maestro
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ver Usuarios - Inicializado');

    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const tablaBody = document.getElementById('tablaBody');
    const btnRefresh = document.getElementById('btnRefreshTable');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    
    // Filtros
    const filtroNombre = document.getElementById('filtroNombre');
    const filtroApellidoPaterno = document.getElementById('filtroApellidoPaterno');
    const filtroApellidoMaterno = document.getElementById('filtroApellidoMaterno');
    const filtroNoNomina = document.getElementById('filtroNoNomina');
    
    // Filtro minimizable
    const filtroContainer = document.getElementById('filtroContainer');
    const filtroToggle = document.getElementById('filtroToggle');
    const toggleIcon = document.getElementById('toggleIcon');
    
    // Modales
    const modalEditar = document.getElementById('modalEditar');
    const modalVer = document.getElementById('modalVer');
    const modalCambiarPass = document.getElementById('modalCambiarPass');
    const modalEditarPermisos = document.getElementById('modalEditarPermisos');
    
    // Elementos del modal de permisos
    const permisosUserName = document.getElementById('permisosUserName');
    const permisosUserNoNomina = document.getElementById('permisosUserNoNomina');
    const permisosContainerEdit = document.getElementById('permisosContainerEdit');
    const emptyPermisosMsgEdit = document.getElementById('emptyPermisosMsgEdit');
    const btnAgregarInterfazPermisos = document.getElementById('btnAgregarInterfazPermisos');
    const btnGuardarPermisos = document.getElementById('btnGuardarPermisos');
    
    // Modal campos
    const modalCamposEdit = document.getElementById('modalCamposEdit');
    const modalCamposBodyEdit = document.getElementById('modalCamposBodyEdit');
    const btnConfirmarCamposEdit = document.getElementById('btnConfirmarCamposEdit');
    const btnCancelarCamposEdit = document.getElementById('btnCancelarCamposEdit');
    const closeModalCamposEdit = document.getElementById('closeModalCamposEdit');
    
    // Templates
    const templatePermisoCardEdit = document.getElementById('templatePermisoCardEdit');
    const templateBotonPermisoEdit = document.getElementById('templateBotonPermisoEdit');
    
    // Formulario Editar
    const formEditar = document.getElementById('formEditarUsuario');
    const editNoNomina = document.getElementById('editNoNomina');
    const editNombre = document.getElementById('editNombre');
    const editApellidoPaterno = document.getElementById('editApellidoPaterno');
    const editApellidoMaterno = document.getElementById('editApellidoMaterno');
    const editArea = document.getElementById('editArea');
    const editRol = document.getElementById('editRol');
    const editCorreo = document.getElementById('editCorreo');
    const editTelefono = document.getElementById('editTelefono');
    const editFechaRegistro = document.getElementById('editFechaRegistro');
    
    // Modal Ver
    const verNoNomina = document.getElementById('verNoNomina');
    const verNombre = document.getElementById('verNombre');
    const verApellidoPaterno = document.getElementById('verApellidoPaterno');
    const verApellidoMaterno = document.getElementById('verApellidoMaterno');
    const verArea = document.getElementById('verArea');
    const verRol = document.getElementById('verRol');
    const verCorreo = document.getElementById('verCorreo');
    const verTelefono = document.getElementById('verTelefono');
    const verFechaRegistro = document.getElementById('verFechaRegistro');
    
    // Modal Cambiar Pass
    const passCorreoDestino = document.getElementById('passCorreoDestino');
    const btnConfirmarCambioPass = document.getElementById('btnConfirmarCambioPass');
    
    // Variables
    let currentPassUser = null;
    let currentEditPermisosUser = null;
    let areasList = [];
    let rolesList = [];
    let allUsers = [];
    let interfacesList = [];
    let usuarioActualNoNomina = null;
    
    // Variables para modal de campos
    let currentBotonContext = null;
    let camposDisponibles = [];
    
    // ============================================
    // PERMISOS DEL USUARIO ACTUAL (logueado)
    // ============================================
    let permisosUsuarioActual = {};
    let esUsuarioMaestro = false;

    async function cargarPermisosUsuarioActual() {
        try {
            const response = await fetch('../../php/interfaz_general/obtener_usuario_actual.php');
            const data = await response.json();
            
            if (!data.success || !data.usuario) {
                console.error('⚠️ No hay sesión activa');
                return;
            }
            
            usuarioActualNoNomina = data.usuario.no_nomina;
            console.log('🔍 Usuario logueado:', usuarioActualNoNomina);
            
            // ✅ MODIFICADO: Verificar si es USUARIO MAESTRO usando campo es_maestro desde BD
            esUsuarioMaestro = (data.usuario.es_maestro === true || data.usuario.es_maestro === 1);
            
            if (esUsuarioMaestro) {
                console.log('👑 USUARIO MAESTRO DETECTADO (desde base de datos) - Acceso total garantizado');
                permisosUsuarioActual = {};
                return;
            }
            
            const responsePermisos = await fetch(`../../php/ver_usuarios/obtener_permisos_usuario.php?no_nomina=${encodeURIComponent(usuarioActualNoNomina)}`);
            const permisosData = await responsePermisos.json();
            
            if (permisosData.success) {
                permisosUsuarioActual = permisosData.permisos;
                console.log('📋 Permisos del usuario actual:', permisosUsuarioActual);
            }
        } catch (error) {
            console.error('Error cargando permisos del usuario actual:', error);
        }
    }

    function tienePermisoBoton(nombreBoton) {
        if (esUsuarioMaestro) {
            return true;
        }
        
        const permisosInterfaz = permisosUsuarioActual['3'];
        
        if (!permisosInterfaz) {
            return false;
        }
        
        if (permisosInterfaz.__interfaz_acceso__ === true) {
            return false;
        }
        
        return permisosInterfaz.hasOwnProperty(nombreBoton);
    }

    // ============================================
    // FUNCIONES DE PERMISOS DE CAMPOS
    // ============================================

    function obtenerCamposPermitidos(nombreBoton) {
        if (esUsuarioMaestro) {
            return null;
        }
        
        const permisosInterfaz = permisosUsuarioActual['3'];
        if (!permisosInterfaz || permisosInterfaz.__interfaz_acceso__ === true) {
            return [];
        }
        
        const campos = permisosInterfaz[nombreBoton];
        return campos || [];
    }

    // ============================================
    // APLICAR EFECTO BLUR A CAMPOS NO PERMITIDOS
    // ============================================

    function aplicarEfectoBlurCamposEditar(camposPermitidos) {
        const camposMap = {
            'NOMBRE': editNombre,
            'APELLIDO_PATERNO': editApellidoPaterno,
            'APELLIDO_MATERNO': editApellidoMaterno,
            'AREA': editArea,
            'ROL': editRol,
            'CORREO_ELECTRONICO': editCorreo,
            'NUMERO_TELEFONICO': editTelefono,
            'FECHA_REGISTRO': editFechaRegistro
        };
        
        // Limpiar efectos previos
        for (const [campo, input] of Object.entries(camposMap)) {
            if (input) {
                const formGroup = input.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.remove('campo-sin-permiso');
                    formGroup.style.position = '';
                }
                input.disabled = false;
                input.style.opacity = '1';
                input.style.backgroundColor = '';
            }
        }
        
        // Eliminar overlay si existe
        const modalBody = document.querySelector('#modalEditar .modal-body');
        let existingOverlay = modalBody ? modalBody.querySelector('.sin-permisos-overlay') : null;
        if (existingOverlay) existingOverlay.remove();
        
        let mensajeExistente = modalBody ? modalBody.querySelector('.sin-permisos-msg-editar') : null;
        if (mensajeExistente) mensajeExistente.remove();
        
        // Usuario maestro: todo normal
        if (esUsuarioMaestro) {
            return;
        }
        
        const permitidos = camposPermitidos || [];
        const esArrayVacio = permitidos.length === 0;
        let camposHabilitados = 0;
        
        // Aplicar blur a campos no permitidos
        for (const [campo, input] of Object.entries(camposMap)) {
            if (!input) continue;
            
            const estaPermitido = esArrayVacio ? false : permitidos.includes(campo);
            const formGroup = input.closest('.form-group');
            
            if (!estaPermitido) {
                if (formGroup) {
                    formGroup.classList.add('campo-sin-permiso');
                    formGroup.style.position = 'relative';
                }
                input.disabled = true;
                input.style.opacity = '0.5';
                input.style.backgroundColor = '#2a0a15';
            } else {
                camposHabilitados++;
            }
        }
        
        // Si no hay campos habilitados, mostrar overlay
        if (camposHabilitados === 0) {
            const modalContainer = document.querySelector('#modalEditar .modal-usuario-content');
            if (modalContainer && !modalContainer.querySelector('.sin-permisos-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'sin-permisos-overlay';
                overlay.innerHTML = `
                    <div class="sin-permisos-overlay-content">
                        <i class="fas fa-lock"></i>
                        <p>No tienes permisos para editar ningún campo de este usuario</p>
                    </div>
                `;
                modalContainer.style.position = 'relative';
                modalContainer.appendChild(overlay);
            }
        }
    }

    function aplicarEfectoBlurCamposVer(camposPermitidos) {
        const camposMap = {
            'MATRICULA': verNoNomina,
            'NOMBRE': verNombre,
            'APELLIDO_PATERNO': verApellidoPaterno,
            'APELLIDO_MATERNO': verApellidoMaterno,
            'AREA': verArea,
            'ROL': verRol,
            'CORREO_ELECTRONICO': verCorreo,
            'NUMERO_TELEFONICO': verTelefono,
            'FECHA_REGISTRO': verFechaRegistro
        };
        
        // Limpiar efectos previos
        for (const [campo, input] of Object.entries(camposMap)) {
            if (input) {
                const formGroup = input.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.remove('campo-sin-permiso');
                    formGroup.style.position = '';
                }
            }
        }
        
        // Eliminar overlay si existe
        const modalBody = document.querySelector('#modalVer .modal-body');
        let existingOverlay = modalBody ? modalBody.querySelector('.sin-permisos-overlay') : null;
        if (existingOverlay) existingOverlay.remove();
        
        let mensajeExistente = modalBody ? modalBody.querySelector('.sin-permisos-msg-ver') : null;
        if (mensajeExistente) mensajeExistente.remove();
        
        // Usuario maestro: todo normal
        if (esUsuarioMaestro) {
            return;
        }
        
        const permitidos = camposPermitidos || [];
        const esArrayVacio = permitidos.length === 0;
        let camposHabilitados = 0;
        
        for (const [campo, input] of Object.entries(camposMap)) {
            if (!input) continue;
            
            const estaPermitido = esArrayVacio ? false : permitidos.includes(campo);
            const formGroup = input.closest('.form-group');
            
            if (!estaPermitido) {
                if (formGroup) {
                    formGroup.classList.add('campo-sin-permiso');
                    formGroup.style.position = 'relative';
                }
                input.style.opacity = '0.4';
            } else {
                camposHabilitados++;
            }
        }
        
        const formGrid = modalBody ? modalBody.querySelector('.form-grid') : null;
        
        if (camposHabilitados === 0) {
            if (formGrid) formGrid.style.display = 'none';
            if (modalBody && !modalBody.querySelector('.sin-permisos-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'sin-permisos-overlay';
                overlay.innerHTML = `
                    <div class="sin-permisos-overlay-content">
                        <i class="fas fa-lock"></i>
                        <p>No tienes permisos para ver ningún campo de este usuario</p>
                    </div>
                `;
                modalBody.style.position = 'relative';
                modalBody.appendChild(overlay);
            }
        } else {
            if (formGrid) formGrid.style.display = 'grid';
        }
    }

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    // ============================================
// FUNCIÓN: LIMPIAR TEXTO (MAYÚSCULAS, CONSERVANDO Ñ)
// ============================================
function limpiarTextoMayusculas(valor) {
    if (!valor) return '';
    
    // 1. Convertir a mayúsculas
    let texto = valor.toUpperCase();
    
    // 2. Reemplazar caracteres acentuados (conservando Ñ)
    const acentos = {
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'À': 'A', 'È': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U',
        'Ä': 'A', 'Ë': 'E', 'Ï': 'I', 'Ö': 'O', 'Ü': 'U',
        'Â': 'A', 'Ê': 'E', 'Î': 'I', 'Ô': 'O', 'Û': 'U',
        'Ã': 'A', 'Õ': 'O'
    };
    
    for (let [acento, letra] of Object.entries(acentos)) {
        texto = texto.replace(new RegExp(acento, 'g'), letra);
    }
    
    // 3. PERMITIR: letras (A-Z), Ñ, espacios y números
    //    NOTA: El \s ya incluye espacios, tabs, etc.
    texto = texto.replace(/[^A-ZÑ0-9\s]/g, '');
    
    // 4. Reemplazar múltiples espacios por uno solo (opcional)
    texto = texto.replace(/\s+/g, ' ').trim();
    
    return texto;
}

function limpiarNumeroNomina(valor) {
    if (!valor) return '';
    
    // Convertir a mayúsculas, permitir letras (incluyendo Ñ), números y guiones
    let texto = valor.toUpperCase();
    
    // Reemplazar acentos
    const acentos = {
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'À': 'A', 'È': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U',
        'Ä': 'A', 'Ë': 'E', 'Ï': 'I', 'Ö': 'O', 'Ü': 'U',
        'Â': 'A', 'Ê': 'E', 'Î': 'I', 'Ô': 'O', 'Û': 'U',
        'Ã': 'A', 'Õ': 'O'
    };
    
    for (let [acento, letra] of Object.entries(acentos)) {
        texto = texto.replace(new RegExp(acento, 'g'), letra);
    }
    
    // Permitir A-Z, Ñ, 0-9, y guiones
    texto = texto.replace(/[^A-ZÑ0-9-]/g, '');
    
    return texto;
}

function limpiarSoloNumeros(valor) {
    if (!valor) return '';
    return valor.replace(/[^0-9]/g, '');
}

function forzarMinusculas(valor) {
    if (!valor) return '';
    return valor.toLowerCase();
}
    
    function configurarValidacionesFiltros() {
        if (filtroNombre) {
            filtroNombre.addEventListener('input', function(e) {
                this.value = limpiarTextoMayusculas(this.value);
                filtrarTabla();
            });
        }
        if (filtroApellidoPaterno) {
            filtroApellidoPaterno.addEventListener('input', function(e) {
                this.value = limpiarTextoMayusculas(this.value);
                filtrarTabla();
            });
        }
        if (filtroApellidoMaterno) {
            filtroApellidoMaterno.addEventListener('input', function(e) {
                this.value = limpiarTextoMayusculas(this.value);
                filtrarTabla();
            });
        }
        if (filtroNoNomina) {
            filtroNoNomina.addEventListener('input', function(e) {
                this.value = limpiarNumeroNomina(this.value);
                filtrarTabla();
            });
        }
    }
    
    // ============================================
    // FUNCIONES DE ÁREAS Y ROLES
    // ============================================
    async function cargarAreasYRoles() {
        try {
            const response = await fetch('../../php/ver_usuarios/obtener_areas_roles.php');
            const data = await response.json();
            
            if (data.success) {
                areasList = data.areas;
                rolesList = data.roles;
                
                if (editArea) {
                    editArea.innerHTML = '<option value="">Seleccione un área</option>';
                    areasList.forEach(area => {
                        const option = document.createElement('option');
                        option.value = area.id_area;
                        option.textContent = area.area;
                        editArea.appendChild(option);
                    });
                }
                
                if (editRol) {
                    editRol.innerHTML = '<option value="">Seleccione un rol</option>';
                    rolesList.forEach(rol => {
                        const option = document.createElement('option');
                        option.value = rol.id_rol;
                        option.textContent = rol.rol;
                        editRol.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error cargando áreas y roles:', error);
        }
    }
    
    // ============================================
    // CARGAR TODAS LAS INTERFACES AL INICIO
    // ============================================
    async function cargarTodasLasInterfaces() {
        try {
            const response = await fetch('../../php/agregar_usuario/obtener_interfaces.php');
            const data = await response.json();
            
            if (data.success) {
                interfacesList = data.interfaces;
                console.log('✅ Interfaces cargadas:', interfacesList.length);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error cargando interfaces:', error);
            return false;
        }
    }
    
    // ============================================
    // CARGAR INTERFACES PARA SELECT
    // ============================================
    async function cargarInterfaces(selectElement) {
        if (interfacesList.length > 0) {
            selectElement.innerHTML = '<option value="">Seleccione Interfaz</option>';
            interfacesList.forEach(interfaz => {
                const option = document.createElement('option');
                option.value = interfaz.id;
                option.textContent = interfaz.nombre_interfaz;
                selectElement.appendChild(option);
            });
        } else {
            try {
                const response = await fetch('../../php/agregar_usuario/obtener_interfaces.php');
                const data = await response.json();
                
                if (data.success) {
                    interfacesList = data.interfaces;
                    selectElement.innerHTML = '<option value="">Seleccione Interfaz</option>';
                    interfacesList.forEach(interfaz => {
                        const option = document.createElement('option');
                        option.value = interfaz.id;
                        option.textContent = interfaz.nombre_interfaz;
                        selectElement.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error cargando interfaces:', error);
            }
        }
    }
    
    // ============================================
    // CARGAR BOTONES POR INTERFAZ (EDITAR PERMISOS)
    // ============================================
    async function cargarBotonesPorInterfaz(card, idInterfaz, permisosActuales = {}) {
        if (!idInterfaz) return;
        
        try {
            const response = await fetch(`../../php/agregar_usuario/obtener_botones_por_interfaz.php?id_interfaz=${idInterfaz}`);
            const data = await response.json();
            
            if (data.success) {
                const botonesContainer = card.querySelector('.botones-container');
                botonesContainer.innerHTML = '';
                
                const soloAccesoInterfaz = permisosActuales['__interfaz_acceso__'] === true;
                
                const botonesActivos = {};
                for (const [boton, campos] of Object.entries(permisosActuales)) {
                    if (boton !== '__interfaz_acceso__') {
                        botonesActivos[boton] = campos;
                    }
                }
                
                if (data.botones.length === 0) {
                    botonesContainer.innerHTML = '<div class="sin-botones-msg">No hay botones configurados para esta interfaz</div>';
                } else {
                    data.botones.forEach(boton => {
                        const botonItem = document.createElement('div');
                        botonItem.className = 'boton-permiso-item';
                        
                        const camposGuardados = botonesActivos[boton.nombre_boton] || [];
                        const camposStr = camposGuardados.join(',');
                        
                        const isChecked = !soloAccesoInterfaz && botonesActivos.hasOwnProperty(boton.nombre_boton);
                        
                        botonItem.innerHTML = `
                            <div class="boton-header">
                                <label class="checkbox-boton">
                                    <input type="checkbox" class="boton-checkbox" data-boton="${boton.nombre_boton}" ${isChecked ? 'checked' : ''}>
                                    <span class="boton-nombre">${boton.nombre_boton}</span>
                                </label>
                                <button type="button" class="btn-config-campos" data-boton="${boton.nombre_boton}">
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                            <div class="campos-seleccionados" style="${camposGuardados.length > 0 && !soloAccesoInterfaz ? 'display: block;' : 'display: none;'}">
                                <div class="campos-list">
                                    ${camposGuardados.map(campo => `<span class="campo-tag"><i class="fas fa-tag"></i> ${campo}</span>`).join('')}
                                </div>
                                <input type="hidden" class="campos-values" value="${camposStr}">
                            </div>
                        `;
                        botonesContainer.appendChild(botonItem);
                    });
                }
                
                configurarEventosBotonesPermisos(card);
            }
        } catch (error) {
            console.error('Error cargando botones:', error);
        }
    }
    
    // ============================================
    // CARGAR CAMPOS POR BOTÓN
    // ============================================
    async function cargarCamposPorBoton(idInterfaz, nombreBoton) {
        try {
            const response = await fetch(`../../php/agregar_usuario/obtener_campos_por_boton.php?id_interfaz=${idInterfaz}&nombre_boton=${encodeURIComponent(nombreBoton)}`);
            const data = await response.json();
            return data.success && data.campos ? data.campos : [];
        } catch (error) {
            console.error('Error cargando campos:', error);
            return [];
        }
    }
    
    // ============================================
    // MOSTRAR MODAL DE CAMPOS (EDITAR PERMISOS)
    // ============================================
    async function mostrarModalCamposEdit(card, botonItem, botonNombre) {
        const idInterfaz = card.querySelector('.interfaz-select').value;
        if (!idInterfaz) {
            Swal.fire({ icon: 'warning', title: 'Seleccione una interfaz', text: 'Primero debe seleccionar una interfaz', background: '#1a040b', color: '#fff' });
            return;
        }
        
        const campos = await cargarCamposPorBoton(idInterfaz, botonNombre);
        if (campos.length === 0) {
            Swal.fire({ icon: 'info', title: 'Sin campos', text: 'No hay campos disponibles para este botón', background: '#1a040b', color: '#fff' });
            return;
        }
        
        camposDisponibles = campos;
        currentBotonContext = { card, botonItem, botonNombre };
        
        const camposSeleccionados = [];
        const camposDiv = botonItem.querySelector('.campos-list');
        if (camposDiv) {
            camposDiv.querySelectorAll('.campo-tag').forEach(tag => {
                camposSeleccionados.push(tag.textContent.replace(/[^\w]/g, ''));
            });
        }
        
        let html = '<div class="campos-group">';
        campos.forEach(campo => {
            const isChecked = camposSeleccionados.includes(campo.nombre_campo);
            html += `<label class="campo-checkbox"><input type="checkbox" value="${campo.nombre_campo}" ${isChecked ? 'checked' : ''}><span>${campo.nombre_campo}</span></label>`;
        });
        html += '</div>';
        
        if (modalCamposBodyEdit) modalCamposBodyEdit.innerHTML = html;
        if (modalCamposEdit) modalCamposEdit.classList.add('active');
    }
    
    // ============================================
    // CONFIRMAR SELECCIÓN DE CAMPOS
    // ============================================
    function confirmarCamposEdit() {
        if (!currentBotonContext) return;
        
        const { card, botonItem, botonNombre } = currentBotonContext;
        const checkboxes = modalCamposBodyEdit ? modalCamposBodyEdit.querySelectorAll('input[type="checkbox"]') : [];
        const camposSeleccionados = [];
        
        checkboxes.forEach(cb => { if (cb.checked) camposSeleccionados.push(cb.value); });
        
        const camposDiv = botonItem.querySelector('.campos-list');
        const camposValues = botonItem.querySelector('.campos-values');
        const camposSeleccionadosDiv = botonItem.querySelector('.campos-seleccionados');
        
        if (camposDiv) camposDiv.innerHTML = '';
        
        if (camposSeleccionados.length > 0) {
            camposSeleccionados.forEach(campo => {
                const tag = document.createElement('span');
                tag.className = 'campo-tag';
                tag.innerHTML = `<i class="fas fa-tag"></i> ${campo}`;
                if (camposDiv) camposDiv.appendChild(tag);
            });
            if (camposValues) camposValues.value = camposSeleccionados.join(',');
            if (camposSeleccionadosDiv) camposSeleccionadosDiv.style.display = 'block';
        } else {
            if (camposValues) camposValues.value = '';
            if (camposSeleccionadosDiv) camposSeleccionadosDiv.style.display = 'none';
        }
        
        if (modalCamposEdit) modalCamposEdit.classList.remove('active');
        currentBotonContext = null;
    }
    
    // ============================================
    // CONFIGURAR EVENTOS DE BOTONES
    // ============================================
    function configurarEventosBotonesPermisos(card) {
        const botonesItems = card.querySelectorAll('.boton-permiso-item');
        
        botonesItems.forEach(botonItem => {
            const btnConfig = botonItem.querySelector('.btn-config-campos');
            const checkbox = botonItem.querySelector('.boton-checkbox');
            const botonNombre = checkbox ? checkbox.getAttribute('data-boton') : '';
            
            if (btnConfig) {
                btnConfig.removeEventListener('click', () => {});
                btnConfig.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    mostrarModalCamposEdit(card, botonItem, botonNombre);
                });
            }
            
            if (checkbox) {
                checkbox.removeEventListener('change', () => {});
                checkbox.addEventListener('change', (e) => {
                    const camposDiv = botonItem.querySelector('.campos-seleccionados');
                    if (!checkbox.checked) {
                        if (camposDiv) camposDiv.style.display = 'none';
                        const camposValues = botonItem.querySelector('.campos-values');
                        if (camposValues) camposValues.value = '';
                        const camposList = botonItem.querySelector('.campos-list');
                        if (camposList) camposList.innerHTML = '';
                    }
                });
            }
        });
    }
    

    // ============================================
// FUNCIÓN PARA HACER COLABSABLE UNA TARJETA DE PERMISOS (EDITAR PERMISOS)
// ============================================
function hacerColapsableTarjetaEdit(card) {
    const header = card.querySelector('.card-header');
    if (!header) return;
    
    // Agregar ícono de colapsar si no existe
    let collapseIcon = card.querySelector('.card-collapse-icon');
    if (!collapseIcon) {
        collapseIcon = document.createElement('i');
        collapseIcon.className = 'fas fa-chevron-down card-collapse-icon';
        header.appendChild(collapseIcon);
    }
    
    // Asegurar que la tarjeta empiece expandida
    card.classList.remove('collapsed');
    
    // Evento click en el header (excepto si se da click en el select, btn remove o config)
    header.addEventListener('click', (e) => {
        // Evitar colapsar si el click fue en elementos interactivos
        if (e.target.classList.contains('interfaz-select') || 
            e.target.closest('.interfaz-select') ||
            e.target.classList.contains('btn-remove-card') ||
            e.target.closest('.btn-remove-card') ||
            e.target.classList.contains('btn-config-campos') ||
            e.target.closest('.btn-config-campos') ||
            e.target.classList.contains('checkbox-boton') ||
            e.target.closest('.checkbox-boton') ||
            e.target.type === 'checkbox') {
            return;
        }
        
        card.classList.toggle('collapsed');
    });
}


    // ============================================
    // CREAR TARJETA DE PERMISO (EDITAR)
    // ============================================
    function crearTarjetaPermisoEdit(permisosData = {}) {
    if (emptyPermisosMsgEdit) emptyPermisosMsgEdit.style.display = 'none';
    
    const card = templatePermisoCardEdit.content.cloneNode(true).querySelector('.permiso-card');
    const interfazSelect = card.querySelector('.interfaz-select');
    
    if (interfacesList.length > 0) {
        interfazSelect.innerHTML = '<option value="">Seleccione Interfaz</option>';
        interfacesList.forEach(interfaz => {
            const option = document.createElement('option');
            option.value = interfaz.id;
            option.textContent = interfaz.nombre_interfaz;
            interfazSelect.appendChild(option);
        });
    } else {
        cargarInterfaces(interfazSelect);
    }
    
    interfazSelect.addEventListener('change', async (e) => {
        const idInterfaz = e.target.value;
        if (idInterfaz) {
            await cargarBotonesPorInterfaz(card, idInterfaz, {});
        } else {
            const botonesContainer = card.querySelector('.botones-container');
            if (botonesContainer) botonesContainer.innerHTML = '';
        }
    });
    
    const btnRemove = card.querySelector('.btn-remove-card');
    if (btnRemove) {
        btnRemove.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el click propague al header
            card.remove();
            if (permisosContainerEdit && permisosContainerEdit.querySelectorAll('.permiso-card').length === 0) {
                if (emptyPermisosMsgEdit) emptyPermisosMsgEdit.style.display = 'flex';
            }
        });
    }
    
    if (permisosContainerEdit) permisosContainerEdit.appendChild(card);
    
    // ✅ Hacer la tarjeta colapsable
    hacerColapsableTarjetaEdit(card);
    
    return card;
}
    
    // ============================================
    // CARGAR PERMISOS DEL USUARIO PARA EDITAR
    // ============================================
    async function cargarPermisosUsuario(noNomina) {
        try {
            const response = await fetch(`../../php/ver_usuarios/obtener_permisos_usuario.php?no_nomina=${encodeURIComponent(noNomina)}`);
            const data = await response.json();
            return data.success ? data.permisos : {};
        } catch (error) {
            console.error('Error cargando permisos:', error);
            return {};
        }
    }
    
    // ============================================
    // CARGAR PERMISOS ACTUALES EN EL MODAL
    // ============================================
    async function cargarPermisosEnModal(noNomina) {
        if (permisosContainerEdit) {
            permisosContainerEdit.innerHTML = '';
            if (emptyPermisosMsgEdit) {
                permisosContainerEdit.appendChild(emptyPermisosMsgEdit);
                emptyPermisosMsgEdit.style.display = 'flex';
            }
        }
        
        const permisosData = await cargarPermisosUsuario(noNomina);
        console.log('📋 Permisos obtenidos:', permisosData);
        
        const idsInterfacesConPermisos = Object.keys(permisosData);
        
        if (idsInterfacesConPermisos.length > 0 && emptyPermisosMsgEdit) {
            emptyPermisosMsgEdit.style.display = 'none';
            
            for (const idInterfaz of idsInterfacesConPermisos) {
                const interfazInfo = interfacesList.find(i => i.id == idInterfaz);
                
                if (interfazInfo) {
                    const card = crearTarjetaPermisoEdit(permisosData);
                    const select = card.querySelector('.interfaz-select');
                    
                    select.value = idInterfaz;
                    
                    await cargarBotonesPorInterfaz(card, idInterfaz, permisosData[idInterfaz]);
                } else {
                    console.warn(`⚠️ No se encontró la interfaz con ID: ${idInterfaz}`);
                }
            }
        }
    }
    
    // ============================================
    // ABRIR MODAL EDITAR PERMISOS
    // ============================================
    async function abrirModalEditarPermisos(usuario) {
        if (!esUsuarioMaestro && usuario.no_nomina === usuarioActualNoNomina) {
            Swal.fire({
                icon: 'error',
                title: 'Acción no permitida',
                text: 'No puedes modificar tus propios permisos',
                background: '#1a040b',
                color: '#fff',
                confirmButtonColor: '#bb9358'
            });
            return;
        }
        
        console.log('🔓 Abriendo modal de permisos para:', usuario);
        
        currentEditPermisosUser = usuario;
        if (permisosUserName) permisosUserName.textContent = `${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno}`;
        if (permisosUserNoNomina) permisosUserNoNomina.textContent = usuario.no_nomina;
        
        if (permisosContainerEdit) {
            permisosContainerEdit.innerHTML = '';
            if (emptyPermisosMsgEdit) {
                permisosContainerEdit.appendChild(emptyPermisosMsgEdit);
                emptyPermisosMsgEdit.style.display = 'flex';
            }
        }
        
        if (interfacesList.length === 0) {
            console.log('📋 Cargando interfaces...');
            await cargarTodasLasInterfaces();
        }
        
        await cargarPermisosEnModal(usuario.no_nomina);
        
        if (modalEditarPermisos) modalEditarPermisos.classList.add('active');
    }
    
    // ============================================
    // RECOLECTAR PERMISOS DEL MODAL
    // ============================================
    function recolectarPermisosEdit() {
        const permisos = [];
        if (!permisosContainerEdit) return permisos;
        
        const cards = permisosContainerEdit.querySelectorAll('.permiso-card');
        
        cards.forEach(card => {
            const idInterfaz = card.querySelector('.interfaz-select').value;
            if (!idInterfaz) return;
            
            const botonesItems = card.querySelectorAll('.boton-permiso-item');
            let hayBotonesMarcados = false;
            
            botonesItems.forEach(botonItem => {
                const checkbox = botonItem.querySelector('.boton-checkbox');
                if (checkbox && checkbox.checked) {
                    hayBotonesMarcados = true;
                    const nombreBoton = checkbox.getAttribute('data-boton');
                    const camposValues = botonItem.querySelector('.campos-values');
                    const campos = camposValues && camposValues.value ? camposValues.value.split(',') : [];
                    
                    permisos.push({
                        id_interfaz: idInterfaz,
                        nombre_boton: nombreBoton,
                        campos: campos.filter(c => c.trim() !== '')
                    });
                }
            });
            
            if (!hayBotonesMarcados) {
                permisos.push({
                    id_interfaz: idInterfaz,
                    nombre_boton: null,
                    campos: []
                });
            }
        });
        
        return permisos;
    }
    
    // ============================================
    // GUARDAR PERMISOS EDITADOS
    // ============================================
    async function guardarPermisosEditados() {
        if (!currentEditPermisosUser) return;
        
        const permisos = recolectarPermisosEdit();
        
        Swal.fire({
            title: 'Guardando...',
            text: 'Actualizando permisos',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        
        try {
            const response = await fetch('../../php/ver_usuarios/actualizar_permisos_usuario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    no_nomina: currentEditPermisosUser.no_nomina,
                    permisos: permisos
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Permisos actualizados!',
                    text: 'Los permisos del usuario han sido actualizados correctamente',
                    background: '#1a040b',
                    color: '#fff',
                    confirmButtonColor: '#bb9358'
                });
                if (modalEditarPermisos) modalEditarPermisos.classList.remove('active');
                currentEditPermisosUser = null;
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.mensaje || 'Error al actualizar permisos',
                    background: '#1a040b',
                    color: '#fff'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor',
                background: '#1a040b',
                color: '#fff'
            });
        }
    }
    
    // ============================================
    // CARGAR USUARIOS
    // ============================================
    async function cargarUsuarios() {
        if (tablaBody) {
            tablaBody.innerHTML = `<tr class="loading-row"><td colspan="3"><div class="loading-spinner"><i class="fas fa-spinner fa-pulse"></i>Cargando usuarios...</div></td></tr>`;
        }
        
        try {
            const response = await fetch('../../php/ver_usuarios/obtener_usuarios.php');
            const data = await response.json();
            
            if (data.success) {
                allUsers = data.usuarios;
                filtrarTabla();
            } else {
                if (tablaBody) {
                    tablaBody.innerHTML = `<tr class="empty-row"><td colspan="3"><i class="fas fa-exclamation-triangle"></i>Error al cargar usuarios</td></tr>`;
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (tablaBody) {
                tablaBody.innerHTML = `<tr class="empty-row"><td colspan="3"><i class="fas fa-wifi"></i>Error de conexión</td></tr>`;
            }
        }
    }
    
    // ============================================
    // FILTRAR TABLA
    // ============================================
    function filtrarTabla() {
        const nombreFilter = filtroNombre ? filtroNombre.value.trim() : '';
        const apPaternoFilter = filtroApellidoPaterno ? filtroApellidoPaterno.value.trim() : '';
        const apMaternoFilter = filtroApellidoMaterno ? filtroApellidoMaterno.value.trim() : '';
        const noNominaFilter = filtroNoNomina ? filtroNoNomina.value.trim() : '';
        
        const filteredUsers = allUsers.filter(user => {
            if (nombreFilter && !user.nombre.includes(nombreFilter)) return false;
            if (apPaternoFilter && !user.apellido_paterno.includes(apPaternoFilter)) return false;
            if (apMaternoFilter && !user.apellido_materno.includes(apMaternoFilter)) return false;
            if (noNominaFilter && !user.no_nomina.includes(noNominaFilter)) return false;
            return true;
        });
        
        renderizarTabla(filteredUsers);
    }
    
    // ============================================
    // RENDERIZAR TABLA CON PERMISOS
    // ============================================
    function renderizarTabla(usuarios) {
        if (!tablaBody) return;
        
        if (!usuarios || usuarios.length === 0) {
            tablaBody.innerHTML = `<tr class="empty-row"><td colspan="3"><i class="fas fa-users-slash"></i>No hay usuarios registrados</td></tr>`;
            return;
        }
        
        tablaBody.innerHTML = '';
        
        const tienePermisoVer = tienePermisoBoton('VER_USUARIO');
        
        usuarios.forEach(user => {
            const nombreCompleto = `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno}`;
            const row = document.createElement('tr');
            
            if (tienePermisoVer) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', (e) => { 
                    if (!e.target.closest('.acciones-cell')) {
                        const camposPermitidosVer = obtenerCamposPermitidos('VER_USUARIO');
                        if (!esUsuarioMaestro && camposPermitidosVer && camposPermitidosVer.length === 0) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Sin permisos',
                                text: 'No tienes permisos para ver ningún campo de este usuario',
                                background: '#1a040b',
                                color: '#fff'
                            });
                        } else {
                            abrirModalVer(user);
                        }
                    } 
                });
            } else {
                row.style.cursor = 'default';
            }
            
            const tdMatricula = document.createElement('td');
            tdMatricula.textContent = user.no_nomina;
            row.appendChild(tdMatricula);
            
            const tdNombre = document.createElement('td');
            tdNombre.textContent = nombreCompleto;
            row.appendChild(tdNombre);
            
            const tdAcciones = document.createElement('td');
            tdAcciones.className = 'acciones-cell';
            tdAcciones.style.cursor = 'default';
            
            if (tienePermisoBoton('EDITAR_USUARIO')) {
                const btnEditar = document.createElement('button');
                btnEditar.className = 'btn-accion btn-editar';
                btnEditar.title = 'Editar usuario';
                btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
                btnEditar.addEventListener('click', (e) => { e.stopPropagation(); abrirModalEditar(user); });
                tdAcciones.appendChild(btnEditar);
            }
            
            if (tienePermisoBoton('CAMBIAR_CONTRASEÑA')) {
                const btnPass = document.createElement('button');
                btnPass.className = 'btn-accion btn-pass';
                btnPass.title = 'Cambiar contraseña';
                btnPass.innerHTML = '<i class="fas fa-key"></i>';
                btnPass.addEventListener('click', (e) => { e.stopPropagation(); abrirModalCambiarPass(user); });
                tdAcciones.appendChild(btnPass);
            }
            
            if (tienePermisoBoton('EDITAR_PERMISOS')) {
                if (esUsuarioMaestro || user.no_nomina !== usuarioActualNoNomina) {
                    const btnPermisos = document.createElement('button');
                    btnPermisos.className = 'btn-accion btn-permisos';
                    btnPermisos.title = 'Editar permisos';
                    btnPermisos.innerHTML = '<i class="fas fa-lock-open"></i>';
                    btnPermisos.addEventListener('click', (e) => { e.stopPropagation(); abrirModalEditarPermisos(user); });
                    tdAcciones.appendChild(btnPermisos);
                }
            }
            
            if (tienePermisoBoton('ELIMINAR_USUARIO')) {
                const btnEliminar = document.createElement('button');
                btnEliminar.className = 'btn-accion btn-eliminar';
                btnEliminar.title = 'Eliminar usuario';
                btnEliminar.innerHTML = '<i class="fas fa-trash-alt"></i>';
                btnEliminar.addEventListener('click', (e) => { e.stopPropagation(); confirmarEliminarUsuario(user); });
                tdAcciones.appendChild(btnEliminar);
            }
            
            row.appendChild(tdAcciones);
            tablaBody.appendChild(row);
        });
        
        if (tienePermisoBoton('REFRESCAR_TABLA')) {
            if (btnRefresh) btnRefresh.style.display = 'inline-flex';
        } else {
            if (btnRefresh) btnRefresh.style.display = 'none';
        }
        
        if (tienePermisoBoton('LIMPIAR_FILTROS')) {
            if (btnLimpiarFiltros) btnLimpiarFiltros.style.display = 'inline-flex';
        } else {
            if (btnLimpiarFiltros) btnLimpiarFiltros.style.display = 'none';
        }
    }
    
    // ============================================
    // MODAL VER USUARIO
    // ============================================
    function abrirModalVer(usuario) {
        const camposPermitidos = obtenerCamposPermitidos('VER_USUARIO');
        
        if (!esUsuarioMaestro && camposPermitidos && camposPermitidos.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin permisos',
                text: 'No tienes permisos para ver ningún campo de este usuario',
                background: '#1a040b',
                color: '#fff',
                confirmButtonColor: '#bb9358'
            });
            return;
        }
        
        // Cargar valores
        if (verNoNomina) verNoNomina.value = usuario.no_nomina || '';
        if (verNombre) verNombre.value = usuario.nombre || '';
        if (verApellidoPaterno) verApellidoPaterno.value = usuario.apellido_paterno || '';
        if (verApellidoMaterno) verApellidoMaterno.value = usuario.apellido_materno || '';
        if (verArea) verArea.value = usuario.area || 'SIN ÁREA';
        if (verRol) verRol.value = usuario.rol || 'SIN ROL';
        if (verCorreo) verCorreo.value = usuario.correo || '';
        if (verTelefono) verTelefono.value = usuario.telefono || '';
        if (verFechaRegistro) verFechaRegistro.value = usuario.fecha_registro || '';
        
        // Aplicar efecto blur
        aplicarEfectoBlurCamposVer(camposPermitidos);
        
        if (modalVer) modalVer.classList.add('active');
    }
    
    // ============================================
    // MODAL EDITAR USUARIO
    // ============================================
    async function abrirModalEditar(usuario) {
        const camposPermitidos = obtenerCamposPermitidos('EDITAR_USUARIO');
        
        if (!esUsuarioMaestro && camposPermitidos && camposPermitidos.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin permisos',
                text: 'No tienes permisos para editar ningún campo de este usuario',
                background: '#1a040b',
                color: '#fff',
                confirmButtonColor: '#bb9358'
            });
            return;
        }
        
        // Cargar valores
        if (editNoNomina) editNoNomina.value = usuario.no_nomina;
        if (editNombre) editNombre.value = usuario.nombre;
        if (editApellidoPaterno) editApellidoPaterno.value = usuario.apellido_paterno;
        if (editApellidoMaterno) editApellidoMaterno.value = usuario.apellido_materno;
        if (editCorreo) editCorreo.value = usuario.correo;
        if (editTelefono) editTelefono.value = usuario.telefono;
        if (editFechaRegistro) editFechaRegistro.value = usuario.fecha_registro || '';
        if (editArea) editArea.value = usuario.area_id || '';
        if (editRol) editRol.value = usuario.rol_id || '';
        
        // Aplicar efecto blur
        aplicarEfectoBlurCamposEditar(camposPermitidos);
        
        if (modalEditar) modalEditar.classList.add('active');
    }
    
    async function guardarEditarUsuario(event) {
        event.preventDefault();
        
        const camposPermitidos = obtenerCamposPermitidos('EDITAR_USUARIO');
        const esMaestroOCamposTodos = esUsuarioMaestro || camposPermitidos === null;
        
        const datos = {
            no_nomina: editNoNomina ? editNoNomina.value : ''
        };
        
        // Solo incluir campos que estén permitidos
        if (esMaestroOCamposTodos || (camposPermitidos && camposPermitidos.includes('NOMBRE'))) {
            datos.nombre = editNombre ? editNombre.value : '';
        }
        if (esMaestroOCamposTodos || (camposPermitidos && camposPermitidos.includes('APELLIDO_PATERNO'))) {
            datos.apellido_paterno = editApellidoPaterno ? editApellidoPaterno.value : '';
        }
        if (esMaestroOCamposTodos || (camposPermitidos && camposPermitidos.includes('APELLIDO_MATERNO'))) {
            datos.apellido_materno = editApellidoMaterno ? editApellidoMaterno.value : '';
        }
        if (esMaestroOCamposTodos || (camposPermitidos && camposPermitidos.includes('AREA'))) {
            datos.area_id = editArea ? editArea.value : '';
        }
        if (esMaestroOCamposTodos || (camposPermitidos && camposPermitidos.includes('ROL'))) {
            datos.rol_id = editRol ? editRol.value : '';
        }
        if (esMaestroOCamposTodos || (camposPermitidos && camposPermitidos.includes('CORREO_ELECTRONICO'))) {
            datos.correo = editCorreo ? editCorreo.value : '';
        }
        if (esMaestroOCamposTodos || (camposPermitidos && camposPermitidos.includes('NUMERO_TELEFONICO'))) {
            datos.telefono = editTelefono ? editTelefono.value : '';
        }
        
        // Validar campos obligatorios (solo los que se están enviando)
        const camposObligatorios = ['nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'telefono', 'area_id', 'rol_id'];
        const camposFaltantes = [];
        
        for (const campo of camposObligatorios) {
            if (datos.hasOwnProperty(campo) && (!datos[campo] || datos[campo] === '')) {
                camposFaltantes.push(campo);
            }
        }
        
        if (camposFaltantes.length > 0) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Campos incompletos', 
                text: 'Todos los campos que tienes permiso para editar son obligatorios', 
                background: '#1a040b', 
                color: '#fff' 
            });
            return;
        }
        
        // Validar correo
        if (datos.correo) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(datos.correo)) {
                Swal.fire({ icon: 'error', title: 'Correo inválido', text: 'Ingrese un correo electrónico válido', background: '#1a040b', color: '#fff' });
                return;
            }
        }
        
        Swal.fire({ title: 'Guardando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            const response = await fetch('../../php/ver_usuarios/editar_usuario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({ icon: 'success', title: '¡Actualizado!', text: 'Usuario actualizado correctamente', background: '#1a040b', color: '#fff', confirmButtonColor: '#bb9358' });
                if (modalEditar) modalEditar.classList.remove('active');
                cargarUsuarios();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: result.mensaje || 'Error al actualizar', background: '#1a040b', color: '#fff' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor', background: '#1a040b', color: '#fff' });
        }
    }
    
    // ============================================
    // MODAL CAMBIAR CONTRASEÑA
    // ============================================
    function abrirModalCambiarPass(usuario) {
        currentPassUser = usuario;
        if (passCorreoDestino) passCorreoDestino.textContent = usuario.correo || 'Correo no disponible';
        if (modalCambiarPass) modalCambiarPass.classList.add('active');
    }
    
    async function cambiarContrasena() {
        if (!currentPassUser) return;
        
        Swal.fire({ title: 'Enviando...', text: 'Generando nueva contraseña', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            const response = await fetch('../../php/ver_usuarios/cambiar_contrasena.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ no_nomina: currentPassUser.no_nomina })
            });
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({ icon: 'success', title: '¡Contraseña enviada!', html: `Se ha enviado una nueva contraseña temporal al correo:<br><strong>${currentPassUser.correo}</strong>`, background: '#1a040b', color: '#fff', confirmButtonColor: '#bb9358' });
                if (modalCambiarPass) modalCambiarPass.classList.remove('active');
                currentPassUser = null;
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: result.mensaje || 'No se pudo cambiar la contraseña', background: '#1a040b', color: '#fff' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor', background: '#1a040b', color: '#fff' });
        }
    }
    
    // ============================================
    // ELIMINAR USUARIO
    // ============================================
    async function confirmarEliminarUsuario(usuario) {
        const result = await Swal.fire({
            title: '¿Eliminar usuario?',
            html: `¿Estás seguro de eliminar a <strong>${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno}</strong>?<br>Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ELIMINAR',
            cancelButtonText: 'CANCELAR',
            background: '#1a040b',
            color: '#fff',
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d'
        });
        
        if (result.isConfirmed) {
            Swal.fire({ title: 'Eliminando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            try {
                const response = await fetch('../../php/ver_usuarios/eliminar_usuario.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ no_nomina: usuario.no_nomina })
                });
                const data = await response.json();
                
                if (data.success) {
                    Swal.fire({ icon: 'success', title: '¡Eliminado!', text: 'Usuario eliminado correctamente', background: '#1a040b', color: '#fff', confirmButtonColor: '#bb9358' });
                    cargarUsuarios();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: data.mensaje || 'Error al eliminar', background: '#1a040b', color: '#fff' });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor', background: '#1a040b', color: '#fff' });
            }
        }
    }
    
    // ============================================
    // LIMPIAR FILTROS
    // ============================================
    function limpiarFiltros() {
        if (filtroNombre) filtroNombre.value = '';
        if (filtroApellidoPaterno) filtroApellidoPaterno.value = '';
        if (filtroApellidoMaterno) filtroApellidoMaterno.value = '';
        if (filtroNoNomina) filtroNoNomina.value = '';
        filtrarTabla();
    }
    
    // ============================================
    // FILTRO MINIMIZABLE
    // ============================================
    function toggleFiltro() {
        if (filtroContainer) filtroContainer.classList.toggle('minimizado');
        if (toggleIcon) toggleIcon.className = filtroContainer && filtroContainer.classList.contains('minimizado') ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    function initEventListeners() {
        if (btnRefresh) btnRefresh.addEventListener('click', cargarUsuarios);
        if (btnLimpiarFiltros) btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
        if (filtroToggle) filtroToggle.addEventListener('click', toggleFiltro);
        if (formEditar) formEditar.addEventListener('submit', guardarEditarUsuario);
        if (btnConfirmarCambioPass) btnConfirmarCambioPass.addEventListener('click', cambiarContrasena);
        if (btnAgregarInterfazPermisos) btnAgregarInterfazPermisos.addEventListener('click', () => crearTarjetaPermisoEdit({}));
        if (btnGuardarPermisos) btnGuardarPermisos.addEventListener('click', guardarPermisosEditados);
        
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = btn.getAttribute('data-modal');
                if (modalId === 'modalEditar' && modalEditar) modalEditar.classList.remove('active');
                else if (modalId === 'modalVer' && modalVer) modalVer.classList.remove('active');
                else if (modalId === 'modalCambiarPass' && modalCambiarPass) modalCambiarPass.classList.remove('active');
                else if (modalId === 'modalEditarPermisos' && modalEditarPermisos) modalEditarPermisos.classList.remove('active');
            });
        });
        
        document.querySelectorAll('.btn-cancel-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = btn.getAttribute('data-modal');
                if (modalId === 'modalEditar' && modalEditar) modalEditar.classList.remove('active');
                else if (modalId === 'modalVer' && modalVer) modalVer.classList.remove('active');
                else if (modalId === 'modalCambiarPass' && modalCambiarPass) modalCambiarPass.classList.remove('active');
                else if (modalId === 'modalEditarPermisos' && modalEditarPermisos) modalEditarPermisos.classList.remove('active');
            });
        });
        
        if (btnConfirmarCamposEdit) btnConfirmarCamposEdit.addEventListener('click', confirmarCamposEdit);
        if (btnCancelarCamposEdit) btnCancelarCamposEdit.addEventListener('click', () => { if (modalCamposEdit) modalCamposEdit.classList.remove('active'); currentBotonContext = null; });
        if (closeModalCamposEdit) closeModalCamposEdit.addEventListener('click', () => { if (modalCamposEdit) modalCamposEdit.classList.remove('active'); currentBotonContext = null; });
        
        if (modalCamposEdit) {
            modalCamposEdit.addEventListener('click', (e) => { if (e.target === modalCamposEdit) { modalCamposEdit.classList.remove('active'); currentBotonContext = null; } });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === modalEditar && modalEditar) modalEditar.classList.remove('active');
            if (e.target === modalVer && modalVer) modalVer.classList.remove('active');
            if (e.target === modalCambiarPass && modalCambiarPass) modalCambiarPass.classList.remove('active');
            if (e.target === modalEditarPermisos && modalEditarPermisos) modalEditarPermisos.classList.remove('active');
        });
        
        if (editNombre) editNombre.addEventListener('input', function() { this.value = limpiarTextoMayusculas(this.value); });
        if (editApellidoPaterno) editApellidoPaterno.addEventListener('input', function() { this.value = limpiarTextoMayusculas(this.value); });
        if (editApellidoMaterno) editApellidoMaterno.addEventListener('input', function() { this.value = limpiarTextoMayusculas(this.value); });
        if (editTelefono) editTelefono.addEventListener('input', function() { this.value = limpiarSoloNumeros(this.value).slice(0,10); });
        if (editCorreo) editCorreo.addEventListener('input', function() { this.value = forzarMinusculas(this.value); });
    }
    
    // ============================================
    // INICIALIZAR
    // ============================================
    async function init() {
        console.log('🚀 Inicializando Ver Usuarios...');
        
        await cargarPermisosUsuarioActual();
        await cargarTodasLasInterfaces();
        await cargarAreasYRoles();
        
        configurarValidacionesFiltros();
        initEventListeners();
        await cargarUsuarios();
        
        console.log('✅ Ver Usuarios - Listo');
    }
    
    init();
});