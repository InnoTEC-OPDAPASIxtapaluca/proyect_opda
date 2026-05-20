/**
 * agregar_usuario.js - Gestión de usuarios y permisos
 * MODIFICADO: Usuario maestro detectado desde BD con campo es_maestro
 * MODIFICADO: Botones colapsables - clic en contenedor despliega/contrae
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Agregar Usuario - Inicializado');
    
    // ============================================
    // REFERENCIAS DOM
    // ============================================
    const form = document.getElementById('formAgregarUsuario');
    const btnAgregarInterfaz = document.getElementById('btnAgregarInterfaz');
    const permisosContainer = document.getElementById('permisosContainer');
    const emptyPermisosMsg = document.getElementById('emptyPermisosMsg');
    const btnCancelar = document.getElementById('btnCancelar');
    
    // Modal de campos
    const modalCampos = document.getElementById('modalCampos');
    const modalCamposBody = document.getElementById('modalCamposBody');
    const btnConfirmarCampos = document.getElementById('btnConfirmarCampos');
    const btnCancelarCampos = document.getElementById('btnCancelarCampos');
    const closeModalCampos = document.getElementById('closeModalCampos');
    
    // Templates
    const templatePermisoCard = document.getElementById('templatePermisoCard');
    const templateBotonPermiso = document.getElementById('templateBotonPermiso');
    
    // Variables globales
    let currentBotonContext = null;
    let camposDisponibles = [];
    
    // ============================================
    // PERMISOS DEL USUARIO ACTUAL (logueado)
    // ============================================
    let permisosUsuarioActual = {};
    let esUsuarioMaestro = false;
    let usuarioActualNoNomina = null;

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
            
            // Cargar permisos del usuario normal
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

    function tieneAccesoAInterfaz(idInterfaz) {
        // 👑 USUARIO MAESTRO: Acceso a todo
        if (esUsuarioMaestro) {
            return true;
        }
        
        // Verificar permisos para la interfaz específica
        const permisosInterfaz = permisosUsuarioActual[idInterfaz];
        
        if (!permisosInterfaz) {
            return false; // Sin acceso a la interfaz
        }
        
        // Tiene acceso si tiene __interfaz_acceso__ o cualquier botón
        return true;
    }

    // ============================================
    // VERIFICAR PERMISO PARA AGREGAR INTERFAZ
    // ============================================
    function tienePermisoAgregarInterfaz() {
        // 👑 USUARIO MAESTRO: Acceso a todo
        if (esUsuarioMaestro) {
            return true;
        }
        
        // Verificar permisos para la interfaz actual (ID 4 = agregar_usuario)
        const permisosInterfaz = permisosUsuarioActual['4'];
        
        if (!permisosInterfaz) {
            return false;
        }
        
        // Si solo tiene acceso a interfaz, NO tiene permisos de botones
        if (permisosInterfaz.__interfaz_acceso__ === true) {
            return false;
        }
        
        // Verificar si el botón AGREGAR_INTERFAZ está activo
        return permisosInterfaz.hasOwnProperty('AGREGAR_INTERFAZ');
    }

    // ============================================
    // FUNCIÓN: LIMPIAR TEXTO (MAYÚSCULAS, SIN ACENTOS, SIN SÍMBOLOS)
    // ============================================
    function limpiarTextoMayusculas(valor) {
        if (!valor) return '';
        // Primero convertir a mayúsculas
        let resultado = valor.toUpperCase();
        // Reemplazar vocales con tilde por vocales sin tilde
        resultado = resultado.replace(/[ÁÀÄÂÃ]/g, 'A');
        resultado = resultado.replace(/[ÉÈËÊ]/g, 'E');
        resultado = resultado.replace(/[ÍÌÏÎ]/g, 'I');
        resultado = resultado.replace(/[ÓÒÖÔÕ]/g, 'O');
        resultado = resultado.replace(/[ÚÙÜÛ]/g, 'U');
        // Eliminar cualquier otro carácter que no sea letra (A-Z), Ñ, o espacio
        resultado = resultado.replace(/[^A-ZÑ\s]/g, '');
        return resultado;
    }

    function limpiarNumeroNomina(valor) {
        if (!valor) return '';
        const sinAcentos = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const soloPermitidos = sinAcentos.replace(/[^A-Za-z0-9-]/g, '');
        return soloPermitidos.toUpperCase();
    }

    function limpiarSoloNumeros(valor) {
        if (!valor) return '';
        return valor.replace(/[^0-9]/g, '');
    }

    function forzarMinusculas(valor) {
        if (!valor) return '';
        return valor.toLowerCase();
    }
    
    // ============================================
    // CONFIGURAR VALIDACIONES EN CAMPOS DE DATOS PERSONALES
    // ============================================
    function configurarValidacionesCampos() {
        const nombreInput = document.getElementById('nombre');
        if (nombreInput) {
            nombreInput.addEventListener('input', function(e) {
                this.value = limpiarTextoMayusculas(this.value);
            });
        }

        const apellidoPaternoInput = document.getElementById('apellido_paterno');
        if (apellidoPaternoInput) {
            apellidoPaternoInput.addEventListener('input', function(e) {
                this.value = limpiarTextoMayusculas(this.value);
            });
        }

        const apellidoMaternoInput = document.getElementById('apellido_materno');
        if (apellidoMaternoInput) {
            apellidoMaternoInput.addEventListener('input', function(e) {
                this.value = limpiarTextoMayusculas(this.value);
            });
        }

        const noNominaInput = document.getElementById('no_nomina');
        if (noNominaInput) {
            noNominaInput.addEventListener('input', function(e) {
                this.value = limpiarNumeroNomina(this.value);
            });
        }

        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            telefonoInput.addEventListener('input', function(e) {
                this.value = limpiarSoloNumeros(this.value);
                if (this.value.length > 10) {
                    this.value = this.value.slice(0, 10);
                }
            });
        }

        const correoInput = document.getElementById('correo');
        if (correoInput) {
            correoInput.addEventListener('input', function(e) {
                this.value = forzarMinusculas(this.value);
            });
        }
    }
    
    // ============================================
    // CARGAR ÁREAS Y ROLES
    // ============================================
    async function cargarAreasYRoles() {
        try {
            const response = await fetch('../../php/agregar_usuario/obtener_areas_roles.php');
            const data = await response.json();
            
            if (data.success) {
                const selectArea = document.getElementById('area');
                const selectRol = document.getElementById('rol');
                
                selectArea.innerHTML = '<option value="">Seleccione un área</option>';
                selectRol.innerHTML = '<option value="">Seleccione un rol</option>';
                
                data.areas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.id_area;
                    option.textContent = area.area;
                    selectArea.appendChild(option);
                });
                
                data.roles.forEach(rol => {
                    const option = document.createElement('option');
                    option.value = rol.id_rol;
                    option.textContent = rol.rol;
                    selectRol.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando áreas y roles:', error);
        }
    }
    
    // ============================================
    // CARGAR INTERFACES PARA SELECT
    // ============================================
    async function cargarInterfaces(selectElement) {
        try {
            const response = await fetch('../../php/agregar_usuario/obtener_interfaces.php');
            const data = await response.json();
            
            if (data.success) {
                selectElement.innerHTML = '<option value="">Seleccione Interfaz</option>';
                data.interfaces.forEach(interfaz => {
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
    
    // ============================================
    // CARGAR BOTONES POR INTERFAZ (LOS MANTIENE OCULTOS INICIALMENTE)
    // ============================================
    async function cargarBotonesPorInterfaz(card, idInterfaz) {
        if (!idInterfaz) return;
        
        try {
            const response = await fetch(`../../php/agregar_usuario/obtener_botones_por_interfaz.php?id_interfaz=${idInterfaz}`);
            const data = await response.json();
            
            if (data.success) {
                const botonesContainer = card.querySelector('.botones-container');
                botonesContainer.innerHTML = '';
                
                if (data.botones.length === 0) {
                    botonesContainer.innerHTML = '<div class="sin-botones-msg">No hay botones configurados para esta interfaz</div>';
                    // Si no hay botones, ocultamos el container o mostramos mensaje
                } else {
                    data.botones.forEach(boton => {
                        const botonItem = document.createElement('div');
                        botonItem.className = 'boton-permiso-item';
                        botonItem.innerHTML = `
                            <div class="boton-header">
                                <label class="checkbox-boton">
                                    <input type="checkbox" class="boton-checkbox" data-boton="${boton.nombre_boton}">
                                    <span class="boton-nombre">${boton.nombre_boton}</span>
                                </label>
                                <button type="button" class="btn-config-campos" data-boton="${boton.nombre_boton}">
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                            <div class="campos-seleccionados" style="display: none;">
                                <div class="campos-list"></div>
                                <input type="hidden" class="campos-values" value="">
                            </div>
                        `;
                        botonesContainer.appendChild(botonItem);
                    });
                }
                
                // ✅ NUEVO: Inicialmente los botones están ocultos (contraídos)
                botonesContainer.style.display = 'none';
                
                configurarEventosBotones(card);
            }
        } catch (error) {
            console.error('Error cargando botones:', error);
        }
    }
    
    // ============================================
    // ALTERNAR VISIBILIDAD DE LOS BOTONES (DESPLEGAR/CONTRAER)
    // ============================================
    function toggleBotonesContainer(card) {
        const botonesContainer = card.querySelector('.botones-container');
        if (!botonesContainer) return;
        
        // Si está oculto, lo mostramos; si está visible, lo ocultamos
        if (botonesContainer.style.display === 'none') {
            botonesContainer.style.display = 'block';
        } else {
            botonesContainer.style.display = 'none';
        }
    }
    
    // ============================================
    // CARGAR CAMPOS POR BOTÓN
    // ============================================
    async function cargarCamposPorBoton(idInterfaz, nombreBoton) {
        try {
            const response = await fetch(`../../php/agregar_usuario/obtener_campos_por_boton.php?id_interfaz=${idInterfaz}&nombre_boton=${encodeURIComponent(nombreBoton)}`);
            const data = await response.json();
            
            if (data.success && data.campos) {
                return data.campos;
            }
            return [];
        } catch (error) {
            console.error('Error cargando campos:', error);
            return [];
        }
    }
    
    // ============================================
    // MOSTRAR MODAL DE CAMPOS
    // ============================================
    async function mostrarModalCampos(card, botonItem, botonNombre) {
        const idInterfaz = card.querySelector('.interfaz-select').value;
        if (!idInterfaz) {
            Swal.fire({
                icon: 'warning',
                title: 'Seleccione una interfaz',
                text: 'Primero debe seleccionar una interfaz',
                background: '#1a040b',
                color: '#fff'
            });
            return;
        }
        
        const campos = await cargarCamposPorBoton(idInterfaz, botonNombre);
        if (campos.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin campos',
                text: 'No hay campos disponibles para este botón',
                background: '#1a040b',
                color: '#fff'
            });
            return;
        }
        
        camposDisponibles = campos;
        currentBotonContext = { card, botonItem, botonNombre };
        
        const camposDiv = botonItem.querySelector('.campos-list');
        const camposSeleccionados = [];
        camposDiv.querySelectorAll('.campo-tag').forEach(tag => {
            camposSeleccionados.push(tag.getAttribute('data-campo'));
        });
        
        let html = '<div class="campos-group">';
        campos.forEach(campo => {
            const isChecked = camposSeleccionados.includes(campo.nombre_campo);
            html += `
                <label class="campo-checkbox">
                    <input type="checkbox" value="${campo.nombre_campo}" ${isChecked ? 'checked' : ''}>
                    <span>${campo.nombre_campo}</span>
                </label>
            `;
        });
        html += '</div>';
        
        modalCamposBody.innerHTML = html;
        modalCampos.classList.add('active');
    }
    
    // ============================================
    // CONFIRMAR SELECCIÓN DE CAMPOS
    // ============================================
    function confirmarCampos() {
        if (!currentBotonContext) return;
        
        const { card, botonItem, botonNombre } = currentBotonContext;
        const checkboxes = modalCamposBody.querySelectorAll('input[type="checkbox"]');
        const camposSeleccionados = [];
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                camposSeleccionados.push(cb.value);
            }
        });
        
        const camposDiv = botonItem.querySelector('.campos-list');
        const camposValues = botonItem.querySelector('.campos-values');
        const camposSeleccionadosDiv = botonItem.querySelector('.campos-seleccionados');
        
        camposDiv.innerHTML = '';
        
        if (camposSeleccionados.length > 0) {
            camposSeleccionados.forEach(campo => {
                const tag = document.createElement('span');
                tag.className = 'campo-tag';
                tag.setAttribute('data-campo', campo);
                tag.innerHTML = `<i class="fas fa-tag"></i> ${campo}`;
                camposDiv.appendChild(tag);
            });
            camposValues.value = camposSeleccionados.join(',');
            camposSeleccionadosDiv.style.display = 'block';
        } else {
            camposValues.value = '';
            camposSeleccionadosDiv.style.display = 'none';
        }
        
        modalCampos.classList.remove('active');
        currentBotonContext = null;
    }
    
    // ============================================
    // CONFIGURAR EVENTOS DE BOTONES EN TARJETA
    // ============================================
    function configurarEventosBotones(card) {
        const botonesItems = card.querySelectorAll('.boton-permiso-item');
        
        botonesItems.forEach(botonItem => {
            const checkbox = botonItem.querySelector('.boton-checkbox');
            const btnConfig = botonItem.querySelector('.btn-config-campos');
            const botonNombre = checkbox ? checkbox.getAttribute('data-boton') : '';
            
            if (btnConfig) {
                const newBtnConfig = btnConfig.cloneNode(true);
                btnConfig.parentNode.replaceChild(newBtnConfig, btnConfig);
                
                newBtnConfig.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    mostrarModalCampos(card, botonItem, botonNombre);
                });
            }
        });
    }
    
    // ============================================
    // CREAR NUEVA TARJETA DE PERMISOS
    // ============================================
    function crearTarjetaPermiso() {
        if (emptyPermisosMsg) emptyPermisosMsg.style.display = 'none';
        
        const card = templatePermisoCard.content.cloneNode(true).querySelector('.permiso-card');
        
        // ✅ NUEVO: Agregar evento de clic a la tarjeta para desplegar/contraer botones
        card.style.cursor = 'pointer';
        
        const interfazSelect = card.querySelector('.interfaz-select');
        cargarInterfaces(interfazSelect);
        
        // Variable para evitar que el clic en el select propague y cierre/abra inmediatamente
        let isSelectChanging = false;
        
        interfazSelect.addEventListener('change', async (e) => {
            e.stopPropagation();
            isSelectChanging = true;
            const idInterfaz = e.target.value;
            if (idInterfaz) {
                await cargarBotonesPorInterfaz(card, idInterfaz);
                // ✅ Después de cargar, aseguramos que esté contraído
                const botonesContainer = card.querySelector('.botones-container');
                if (botonesContainer) {
                    botonesContainer.style.display = 'none';
                }
            } else {
                // Si no selecciona interfaz, vaciamos y ocultamos
                const botonesContainer = card.querySelector('.botones-container');
                if (botonesContainer) {
                    botonesContainer.innerHTML = '';
                    botonesContainer.style.display = 'none';
                }
            }
            setTimeout(() => {
                isSelectChanging = false;
            }, 100);
        });
        
        // ✅ Evento de clic en la tarjeta (pero NO cuando se hace clic en el select o en botones)
        card.addEventListener('click', (e) => {
            // Evitar que el clic en el select o en elementos internos (checkboxes, botones de config) dispare el toggle
            if (e.target.closest('.interfaz-select') || 
                e.target.closest('.btn-remove-card') ||
                e.target.closest('.boton-checkbox') ||
                e.target.closest('.btn-config-campos') ||
                e.target.closest('.btn-add-permission')) {
                return;
            }
            
            // Si estamos cambiando el select, no hacer toggle
            if (isSelectChanging) return;
            
            toggleBotonesContainer(card);
        });
        
        const btnRemove = card.querySelector('.btn-remove-card');
        if (btnRemove) {
            btnRemove.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que el clic en eliminar despliegue/contraiga
                card.remove();
                if (permisosContainer.querySelectorAll('.permiso-card').length === 0) {
                    if (emptyPermisosMsg) emptyPermisosMsg.style.display = 'flex';
                }
            });
        }
        
        permisosContainer.appendChild(card);
    }
    
    // ============================================
    // RECOLECTAR PERMISOS
    // ============================================
    function recolectarPermisos() {
        const permisos = [];
        const cards = permisosContainer.querySelectorAll('.permiso-card');
        
        cards.forEach(card => {
            const idInterfaz = card.querySelector('.interfaz-select').value;
            if (!idInterfaz) return;
            
            const botonesItems = card.querySelectorAll('.boton-permiso-item');
            
            let hayBotonesMarcados = false;
            const permisosInterfaz = [];
            
            botonesItems.forEach(botonItem => {
                const checkbox = botonItem.querySelector('.boton-checkbox');
                if (checkbox && checkbox.checked) {
                    hayBotonesMarcados = true;
                    const nombreBoton = checkbox.getAttribute('data-boton');
                    const camposValues = botonItem.querySelector('.campos-values');
                    const campos = camposValues && camposValues.value ? camposValues.value.split(',') : [];
                    
                    permisosInterfaz.push({
                        id_interfaz: idInterfaz,
                        nombre_boton: nombreBoton,
                        campos: campos
                    });
                }
            });
            
            if (!hayBotonesMarcados) {
                permisos.push({
                    id_interfaz: idInterfaz,
                    nombre_boton: null,
                    campos: []
                });
            } else {
                permisos.push(...permisosInterfaz);
            }
        });
        
        return permisos;
    }
    
    // ============================================
    // VALIDAR FORMULARIO
    // ============================================
    function validarFormulario() {
        const camposRequeridos = [
            'nombre', 'apellido_paterno', 'apellido_materno',
            'no_nomina', 'correo', 'telefono', 'area', 'rol'
        ];
        
        for (let campo of camposRequeridos) {
            const elemento = document.getElementById(campo);
            if (!elemento || !elemento.value.trim()) {
                Swal.fire({
                    icon: 'error',
                    title: 'Campos incompletos',
                    text: `El campo ${campo.replace('_', ' ')} es obligatorio`,
                    background: '#1a040b',
                    color: '#fff'
                });
                return false;
            }
        }
        
        const email = document.getElementById('correo').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: 'error',
                title: 'Correo inválido',
                text: 'Ingrese un correo electrónico válido',
                background: '#1a040b',
                color: '#fff'
            });
            return false;
        }
        
        const telefono = document.getElementById('telefono').value;
        const telefonoRegex = /^[0-9]{10}$/;
        if (!telefonoRegex.test(telefono.replace(/[^0-9]/g, ''))) {
            Swal.fire({
                icon: 'error',
                title: 'Teléfono inválido',
                text: 'Ingrese un número telefónico de 10 dígitos',
                background: '#1a040b',
                color: '#fff'
            });
            return false;
        }

        const nombre = document.getElementById('nombre').value;
        if (nombre.trim().length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Nombre inválido',
                text: 'El nombre debe contener al menos una letra',
                background: '#1a040b',
                color: '#fff'
            });
            return false;
        }
        
        return true;
    }
    
    // ============================================
    // GUARDAR USUARIO
    // ============================================
    async function guardarUsuario(event) {
        event.preventDefault();
        
        if (!validarFormulario()) return;
        
        const datosUsuario = {
            nombre: document.getElementById('nombre').value,
            apellido_paterno: document.getElementById('apellido_paterno').value,
            apellido_materno: document.getElementById('apellido_materno').value,
            no_nomina: document.getElementById('no_nomina').value,
            correo: document.getElementById('correo').value,
            telefono: document.getElementById('telefono').value,
            area_id: document.getElementById('area').value,
            rol_id: document.getElementById('rol').value,
            permisos: recolectarPermisos()
        };
        
        Swal.fire({
            title: 'Guardando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        try {
            const response = await fetch('../../php/agregar_usuario/guardar_usuario_permisos.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosUsuario)
            });
            
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Usuario creado!',
                    html: `Usuario registrado exitosamente.<br>Se ha enviado un correo a <strong>${datosUsuario.correo}</strong> con sus credenciales.`,
                    background: '#1a040b',
                    color: '#fff',
                    confirmButtonColor: '#bb9358'
                }).then(() => {
                    form.reset();
                    permisosContainer.innerHTML = '';
                    if (emptyPermisosMsg) {
                        permisosContainer.appendChild(emptyPermisosMsg);
                        emptyPermisosMsg.style.display = 'flex';
                    }
                    cargarAreasYRoles();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.mensaje || 'Ocurrió un error al guardar',
                    background: '#1a040b',
                    color: '#fff',
                    confirmButtonColor: '#bb9358'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor',
                background: '#1a040b',
                color: '#fff',
                confirmButtonColor: '#bb9358'
            });
        }
    }
    
    // ============================================
    // CANCELAR / LIMPIAR
    // ============================================
    function cancelarFormulario() {
        Swal.fire({
            title: '¿Limpiar formulario?',
            text: 'Se perderán todos los datos no guardados',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar',
            background: '#1a040b',
            color: '#fff',
            confirmButtonColor: '#bb9358',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                form.reset();
                permisosContainer.innerHTML = '';
                if (emptyPermisosMsg) {
                    permisosContainer.appendChild(emptyPermisosMsg);
                    emptyPermisosMsg.style.display = 'flex';
                }
            }
        });
    }
    
    // ============================================
    // VERIFICAR ACCESO A LA PÁGINA
    // ============================================
    async function verificarAcceso() {
        await cargarPermisosUsuarioActual();
        
        // ✅ Verificar acceso a la interfaz de Agregar Usuario (ID 4)
        const tieneAcceso = tieneAccesoAInterfaz('4');
        
        if (!tieneAcceso) {
            await Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: 'No tienes permisos para acceder a esta página',
                background: '#1a040b',
                color: '#fff',
                confirmButtonColor: '#bb9358'
            });
            window.location.href = '../dashboard/dashboard.html';
            return false;
        }
        
        console.log('✅ Acceso concedido a Agregar Usuario');
        return true;
    }
    
    // ============================================
    // EVENTOS GLOBALES
    // ============================================
    function initEventListeners() {
        // ✅ Solo mostrar el botón si tiene permiso AGREGAR_INTERFAZ
        if (btnAgregarInterfaz) {
            if (tienePermisoAgregarInterfaz()) {
                btnAgregarInterfaz.style.display = 'inline-flex';
                btnAgregarInterfaz.addEventListener('click', crearTarjetaPermiso);
            } else {
                btnAgregarInterfaz.style.display = 'none';
            }
        }
        
        if (form) {
            form.addEventListener('submit', guardarUsuario);
        }
        
        if (btnCancelar) {
            btnCancelar.addEventListener('click', cancelarFormulario);
        }
        
        if (btnConfirmarCampos) {
            btnConfirmarCampos.addEventListener('click', confirmarCampos);
        }
        
        if (btnCancelarCampos) {
            btnCancelarCampos.addEventListener('click', () => {
                modalCampos.classList.remove('active');
                currentBotonContext = null;
            });
        }
        
        if (closeModalCampos) {
            closeModalCampos.addEventListener('click', () => {
                modalCampos.classList.remove('active');
                currentBotonContext = null;
            });
        }
        
        if (modalCampos) {
            modalCampos.addEventListener('click', (e) => {
                if (e.target === modalCampos) {
                    modalCampos.classList.remove('active');
                    currentBotonContext = null;
                }
            });
        }
    }
    
    // ============================================
    // INICIALIZAR
    // ============================================
    async function init() {
        console.log('🚀 Inicializando Agregar Usuario...');
        
        // ✅ Verificar acceso antes de cargar cualquier cosa
        const tieneAcceso = await verificarAcceso();
        if (!tieneAcceso) return;
        
        await cargarAreasYRoles();
        configurarValidacionesCampos();
        
        // ✅ Verificar permiso para AGREGAR_INTERFAZ antes de mostrar el botón
        if (btnAgregarInterfaz) {
            if (!tienePermisoAgregarInterfaz()) {
                btnAgregarInterfaz.style.display = 'none';
            }
        }
        
        initEventListeners();
        
        console.log('✅ Agregar Usuario - Listo');
    }
    
    init();
});