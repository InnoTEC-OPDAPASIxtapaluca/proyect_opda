// SISTEMA DE ACCESO INSTITUCIONAL - CON COMPORTAMIENTO CONDICIONAL Y EFECTO DE REVELADO
// VERSIÓN COMPLETA CORREGIDA - ÁREAS EDITABLES PARA INNOVACIÓN Y DIRECCIÓN GENERAL

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // ELEMENTOS DOM PRINCIPALES
    // ============================================
    const form = document.getElementById('loginForm');
    const workerCodeInput = document.getElementById('workerCode');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const messageContainer = document.getElementById('errorMessage');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    
    // Elementos del efecto de revelado
    const effectTrigger = document.getElementById('effectTriggerContainer');
    const mainContainer = document.getElementById('mainContainer');
    const effectImage = document.getElementById('effectImage');
    
    // Elementos de área y rol
    const areaSelect = document.getElementById('area');
    const userRoleHidden = document.getElementById('userRole');
    const nominaLoading = document.getElementById('nominaLoading');
    
    // ============================================
    // VARIABLES DE CONTROL
    // ============================================
    let currentUserData = null;
    let isAreaEditable = false;
    let isLoginVisible = false;
    let hideTimeout = null;
    let isTouchDevice = false;
    let triggerHideTimeout = null;
    let isClickInsideForm = false;
    let debounceTimeout = null;
    
    // URLs de los endpoints
    const VALIDATE_NOMINA_URL = 'php/login/validate_nomina.php';
    const LOGIN_URL = 'php/login/login.php';
    
    // ============================================
    // FUNCIONES DEL EFECTO DE REVELADO
    // ============================================
    
    function detectTouchDevice() {
        isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        return isTouchDevice;
    }
    
    function revealLogin() {
        if (isLoginVisible) return;
        
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        
        if (triggerHideTimeout) {
            clearTimeout(triggerHideTimeout);
            triggerHideTimeout = null;
        }
        
        isLoginVisible = true;
        
        if (effectTrigger) {
            effectTrigger.classList.remove('show-trigger');
            effectTrigger.classList.add('hide-trigger');
        }
        
        if (mainContainer) {
            mainContainer.classList.remove('hiding');
            mainContainer.classList.add('visible');
        }
        
        setTimeout(() => {
            if (workerCodeInput && isLoginVisible) {
                workerCodeInput.focus();
            }
        }, 600);
    }
    
    function hideLogin() {
        if (!isLoginVisible) return;
        
        isLoginVisible = false;
        
        if (mainContainer) {
            mainContainer.classList.remove('visible');
            mainContainer.classList.add('hiding');
        }
        
        if (effectTrigger) {
            effectTrigger.classList.remove('hide-trigger');
            effectTrigger.classList.add('show-trigger');
            
            setTimeout(() => {
                if (effectTrigger) {
                    effectTrigger.classList.remove('show-trigger');
                }
            }, 500);
        }
        
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
        
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        if (workerCodeInput) {
            workerCodeInput.value = '';
        }
        
        // Resetear datos del usuario al cerrar
        currentUserData = null;
        isAreaEditable = false;
        
        if (areaSelect) {
            areaSelect.disabled = true;
            areaSelect.value = '';
            areaSelect.classList.remove('editable-field');
        }
        
        if (userRoleHidden) userRoleHidden.value = '';
        if (loginBtn) loginBtn.disabled = true;
        if (passwordInput) passwordInput.disabled = true;
    }
    
    // ============================================
    // CONTROL DE CIERRE DEL FORMULARIO
    // ============================================
    
    if (mainContainer) {
        mainContainer.addEventListener('mouseenter', () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            if (triggerHideTimeout) {
                clearTimeout(triggerHideTimeout);
                triggerHideTimeout = null;
            }
        });
        
        mainContainer.addEventListener('mouseleave', () => {
            if (isLoginVisible && !isTouchDevice) {
                const activeElement = document.activeElement;
                const isInputFocused = activeElement === workerCodeInput || activeElement === passwordInput;
                
                if (!isInputFocused) {
                    hideTimeout = setTimeout(() => {
                        hideLogin();
                    }, 300);
                }
            }
        });
    }
    
    // Prevenir cierre cuando se interactúa con elementos del formulario
    const formElements = [workerCodeInput, passwordInput, loginBtn, togglePasswordBtn, areaSelect];
    formElements.forEach(element => {
        if (element) {
            element.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                isClickInsideForm = true;
            });
            
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                isClickInsideForm = true;
                setTimeout(() => {
                    isClickInsideForm = false;
                }, 100);
            });
            
            if (element && (element.tagName === 'INPUT' || element.tagName === 'SELECT')) {
                element.addEventListener('focus', (e) => {
                    e.stopPropagation();
                    if (isLoginVisible) {
                        if (hideTimeout) {
                            clearTimeout(hideTimeout);
                            hideTimeout = null;
                        }
                    }
                });
            }
        }
    });
    
    document.addEventListener('mousedown', (e) => {
        if (!isLoginVisible) return;
        
        const isClickInsideMain = mainContainer && mainContainer.contains(e.target);
        const isClickOnTrigger = effectTrigger && effectTrigger.contains(e.target);
        
        if (isClickInsideMain || isClickOnTrigger) {
            return;
        }
        
        hideLogin();
    });
    
    function setupTrigger() {
        if (!effectTrigger) return;
        
        detectTouchDevice();
        
        if (isTouchDevice) {
            effectTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                revealLogin();
            });
            
            if (effectImage) {
                effectImage.addEventListener('click', (e) => {
                    e.stopPropagation();
                    revealLogin();
                });
            }
        } else {
            effectTrigger.addEventListener('mouseenter', revealLogin);
        }
    }
    
    function setupHideOnTriggerLeave() {
        if (!effectTrigger) return;
        
        effectTrigger.addEventListener('mouseleave', () => {
            if (!isLoginVisible) return;
            
            const isMouseOverMain = mainContainer && mainContainer.matches(':hover');
            const activeElement = document.activeElement;
            const isInputFocused = activeElement === workerCodeInput || activeElement === passwordInput;
            
            if (!isMouseOverMain && !isInputFocused && !isTouchDevice) {
                triggerHideTimeout = setTimeout(() => {
                    hideLogin();
                }, 300);
            }
        });
        
        effectTrigger.addEventListener('mouseenter', () => {
            if (triggerHideTimeout) {
                clearTimeout(triggerHideTimeout);
                triggerHideTimeout = null;
            }
        });
    }
    
    function setupHideOnMouseLeaveDocument() {
        document.addEventListener('mouseleave', () => {
            if (isLoginVisible && !isTouchDevice) {
                hideLogin();
            }
        });
    }
    
    // ============================================
    // FUNCIONES DE MENSAJES
    // ============================================
    
    function showMessage(text, type = 'error') {
        if (!messageContainer) return;
        
        messageContainer.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        let displayText = text;
        
        if (type === 'success') {
            if (text.includes('conectado') || text.includes('acceso') || text.includes('bienvenido')) {
                displayText = '✓ Acceso concedido. Redirigiendo...';
            }
        } else if (type === 'error') {
            if (text.includes('nómina') || text.includes('Identificador')) {
                displayText = '⚠️ ' + text.replace('❌', '').trim();
            } else if (text.includes('contraseña')) {
                displayText = '🔒 ' + text.replace('❌', '').trim();
            } else if (text.includes('Credenciales')) {
                displayText = '❌ Error en credenciales';
            } else {
                displayText = '❌ ' + text;
            }
        }
        
        messageDiv.textContent = displayText;
        messageContainer.appendChild(messageDiv);
        
        if (type === 'error') {
            const card = document.querySelector('.glass-card');
            if (card) {
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 400);
            }
        }
        
        setTimeout(() => {
            if (messageContainer.firstChild) {
                const msg = messageContainer.firstChild;
                msg.classList.add('fade-out');
                setTimeout(() => {
                    if (messageContainer.firstChild === msg) {
                        messageContainer.innerHTML = '';
                    }
                }, 300);
            }
        }, 4000);
    }
    
    function showLoadingMessage(text = 'Verificando credenciales...') {
        if (!messageContainer) return;
        messageContainer.innerHTML = '';
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-message';
        loadingDiv.textContent = text;
        messageContainer.appendChild(loadingDiv);
        return loadingDiv;
    }
    
    function clearLoadingMessage() {
        if (!messageContainer) return;
        if (messageContainer.firstChild && messageContainer.firstChild.classList && messageContainer.firstChild.classList.contains('loading-message')) {
            messageContainer.innerHTML = '';
        }
    }
    
    function clearMessage() {
        if (messageContainer && messageContainer.firstChild) {
            messageContainer.innerHTML = '';
        }
    }
    
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            showMessage(message, 'error');
        }
    }
    
    function clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
    // ============================================
    // FUNCIONES DE ÁREAS Y VALIDACIÓN DE NÓMINA
    // ============================================
    
    async function loadAreas() {
        try {
            const response = await fetch('php/login/get_areas.php');
            const data = await response.json();
            
            if (data.success && data.areas && areaSelect) {
                areaSelect.innerHTML = '<option value="">Seleccione un área</option>';
                
                data.areas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.id;
                    option.textContent = area.area.replace(/_/g, ' ');
                    areaSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando áreas:', error);
        }
    }
    
    async function validateWorkerCode(nomina) {
        console.log('Validando nómina:', nomina);
        
        if (!nomina || nomina.length < 4) {
            console.log('Nómina demasiado corta');
            return null;
        }
        
        if (nominaLoading) nominaLoading.style.display = 'inline-block';
        
        try {
            const response = await fetch(VALIDATE_NOMINA_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nomina: nomina })
            });
            
            const data = await response.json();
            console.log('Respuesta del servidor:', data);
            
            if (data.success && data.data && data.data.user) {
                currentUserData = data.data.user;
                console.log('Usuario encontrado:', currentUserData);
                
                const editableAreas = ['INNOVACION_TECNOLOGICA', 'DIRECCION_GENERAL'];
                isAreaEditable = editableAreas.includes(currentUserData.area_nombre);
                console.log('Área editable:', isAreaEditable);
                
                if (userRoleHidden) {
                    userRoleHidden.value = currentUserData.rol_nombre;
                }
                
                if (areaSelect) {
                    if (isAreaEditable) {
                        areaSelect.disabled = false;
                        if (currentUserData.area_id) {
                            areaSelect.value = currentUserData.area_id;
                        }
                        areaSelect.classList.add('editable-field');
                    } else {
                        areaSelect.disabled = true;
                        if (currentUserData.area_id) {
                            areaSelect.value = currentUserData.area_id;
                        }
                        areaSelect.classList.remove('editable-field');
                    }
                }
                
                if (passwordInput) passwordInput.disabled = false;
                if (loginBtn) loginBtn.disabled = false;
                
                clearError('errorWorkerCode');
                if (messageContainer) clearMessage();
                
                return currentUserData;
            } else {
                console.log('Usuario no encontrado:', data.message);
                currentUserData = null;
                isAreaEditable = false;
                
                if (areaSelect) {
                    areaSelect.disabled = true;
                    areaSelect.value = '';
                    areaSelect.classList.remove('editable-field');
                }
                
                if (passwordInput) passwordInput.disabled = true;
                if (loginBtn) loginBtn.disabled = true;
                if (userRoleHidden) userRoleHidden.value = '';
                
                const errorMsg = data.message || 'Nómina no encontrada';
                showError('errorWorkerCode', errorMsg);
                showMessage(errorMsg, 'error');
                return null;
            }
        } catch (error) {
            console.error('Error validando nómina:', error);
            currentUserData = null;
            isAreaEditable = false;
            
            if (areaSelect) {
                areaSelect.disabled = true;
                areaSelect.value = '';
                areaSelect.classList.remove('editable-field');
            }
            
            if (passwordInput) passwordInput.disabled = true;
            if (loginBtn) loginBtn.disabled = true;
            
            showError('errorWorkerCode', 'Error de conexión al servidor');
            showMessage('Error de conexión al servidor', 'error');
            return null;
        } finally {
            if (nominaLoading) nominaLoading.style.display = 'none';
        }
    }
    
    // ============================================
    // EVENTOS DE NÓMINA
    // ============================================
    
    if (workerCodeInput) {
        console.log('Configurando eventos para workerCodeInput');
        
        workerCodeInput.addEventListener('input', (e) => {
            console.log('Input event - valor:', e.target.value);
            clearError('errorWorkerCode');
            if (messageContainer) clearMessage();
            
            if (debounceTimeout) clearTimeout(debounceTimeout);
            
            const nomina = e.target.value.trim();
            
            if (nomina.length >= 4) {
                debounceTimeout = setTimeout(() => {
                    validateWorkerCode(nomina);
                }, 500);
            } else if (nomina.length === 0) {
                currentUserData = null;
                isAreaEditable = false;
                
                if (areaSelect) {
                    areaSelect.disabled = true;
                    areaSelect.value = '';
                    areaSelect.classList.remove('editable-field');
                }
                
                if (passwordInput) passwordInput.disabled = true;
                if (loginBtn) loginBtn.disabled = true;
                if (userRoleHidden) userRoleHidden.value = '';
            }
        });
        
        workerCodeInput.addEventListener('blur', (e) => {
            const nomina = e.target.value.trim();
            console.log('Blur event - nómina:', nomina);
            if (nomina.length >= 4 && !currentUserData) {
                validateWorkerCode(nomina);
            }
        });
    } else {
        console.error('No se encontró el elemento workerCode');
    }
    
    // ============================================
    // TOGGLE CONTRASEÑA
    // ============================================
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            // Cambiar ícono Font Awesome
            if (type === 'text') {
                togglePasswordBtn.classList.remove('fa-eye');
                togglePasswordBtn.classList.add('fa-eye-slash');
            } else {
                togglePasswordBtn.classList.remove('fa-eye-slash');
                togglePasswordBtn.classList.add('fa-eye');
            }
        });
    }
    
    // ============================================
    // VALIDACIONES
    // ============================================
    
    function validateNomina(nomina) {
        const regex = /^\d{4,}$/;
        return regex.test(nomina);
    }
    
    function validatePassword(password) {
        return password && password.length >= 4;
    }
    
    function setLoading(isLoading) {
        if (loginBtn) {
            if (isLoading) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            } else {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Ingresar al Sistema</span>';
            }
        }
    }
    
    // ============================================
    // HANDLE LOGIN
    // ============================================
    
    async function handleLogin(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const nomina = workerCodeInput ? workerCodeInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const areaId = areaSelect ? areaSelect.value : null;
        const rol = userRoleHidden ? userRoleHidden.value : null;
        
        console.log('Intentando login:', { nomina, areaId, rol, isAreaEditable });
        
        // Validaciones
        if (!nomina) {
            showMessage('Ingrese su número de nómina', 'error');
            if (workerCodeInput) workerCodeInput.focus();
            return;
        }
        
        if (!currentUserData) {
            showMessage('Nómina no válida', 'error');
            return;
        }
        
        if (!password) {
            showMessage('Ingrese su contraseña', 'error');
            if (passwordInput) passwordInput.focus();
            return;
        }
        
        if (!validateNomina(nomina)) {
            showMessage('La nómina debe contener solo números (mínimo 4 dígitos)', 'error');
            if (workerCodeInput) workerCodeInput.focus();
            return;
        }
        
        if (!validatePassword(password)) {
            showMessage('La contraseña debe tener al menos 4 caracteres', 'error');
            if (passwordInput) passwordInput.focus();
            return;
        }
        
        // Validar área si es editable y no está seleccionada
        if (isAreaEditable && areaSelect && areaSelect.disabled === false && !areaId) {
            showMessage('Seleccione un área', 'error');
            return;
        }
        
        setLoading(true);
        showLoadingMessage('🔍 Verificando credenciales...');
        
        try {
            const loginData = {
                nomina: nomina,
                password: password
            };
            
            // Si el área es editable, enviar el área seleccionada
            if (isAreaEditable && areaId) {
                loginData.area_id = areaId;
                loginData.rol = rol;
            } else if (currentUserData && currentUserData.area_id) {
                // Usar el área del usuario
                loginData.area_id = currentUserData.area_id;
                loginData.rol = currentUserData.rol_nombre;
            }
            
            console.log('Enviando datos de login:', loginData);
            
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            console.log('Respuesta login:', data);
            clearLoadingMessage();
            
            if (data.success) {
                showMessage(`✅ Acceso concedido`, 'success');
                
                if (data.data && data.data.user) {
                    sessionStorage.setItem('usuario', JSON.stringify(data.data.user));
                    const esPrimerInicio = data.data.user.primer_inicio === true;
                    
                    setTimeout(() => {
                        if (esPrimerInicio) {
                            window.location.href = 'html/cambio_contraseña/cambio_contraseña.html';
                        } else {
                            window.location.href = data.data.redirect || 'dashboard.html';
                        }
                    }, 1500);
                } else {
                    setTimeout(() => {
                        window.location.href = data.data.redirect || 'dashboard.html';
                    }, 1500);
                }
            } else {
                setLoading(false);
                showMessage(data.message || 'Error en credenciales', 'error');
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            }
        } catch (error) {
            console.error('Error en login:', error);
            setLoading(false);
            clearLoadingMessage();
            showMessage('Error de conexión con el servidor', 'error');
        }
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    if (workerCodeInput) workerCodeInput.addEventListener('input', clearMessage);
    if (passwordInput) passwordInput.addEventListener('input', clearMessage);
    
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // ============================================
    // ESTILOS ADICIONALES PARA CAMPO EDITABLE
    // ============================================
    
    const style = document.createElement('style');
    style.textContent = `
        .editable-field {
            background-color: #fff8e1 !important;
            border-color: #ffc107 !important;
        }
        .editable-field option {
            background-color: white;
        }
        .select-wrapper select:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
            opacity: 0.8;
        }
        .input-field select:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    loadAreas();
    setupTrigger();
    setupHideOnTriggerLeave();
    setupHideOnMouseLeaveDocument();
    
    // Inicialmente deshabilitar campos de login
    if (passwordInput) passwordInput.disabled = true;
    if (loginBtn) loginBtn.disabled = true;
    if (areaSelect) {
        areaSelect.disabled = true;
        areaSelect.classList.remove('editable-field');
    }
    
    // Efecto de focus en inputs
    const inputs = document.querySelectorAll('.input-field input, .input-field select');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const field = input.closest('.input-field');
            if (field) field.style.transform = 'scale(1.01)';
        });
        
        input.addEventListener('blur', () => {
            const field = input.closest('.input-field');
            if (field) field.style.transform = 'scale(1)';
        });
    });
    
    console.log('%c🏛️ SISTEMA DE ACCESO INSTITUCIONAL', 'color: #e8d5a3; font-size: 14px; font-weight: bold;');
    console.log('%c✅ Versión completa corregida - workerCode como input principal', 'color: #4CAF50; font-size: 12px;');
    console.log('%c📝 Elementos encontrados:', 'color: #2196F3; font-size: 12px;');
    console.log('   - workerCode:', workerCodeInput);
    console.log('   - areaSelect:', areaSelect);
    console.log('   - passwordInput:', passwordInput);
    console.log('   - loginBtn:', loginBtn);
});