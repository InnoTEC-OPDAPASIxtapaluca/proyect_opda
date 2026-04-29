// SISTEMA DE ACCESO INSTITUCIONAL - CON EFECTO DE REVELADO Y REDIRECCIÓN POR ÁREA

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
    const areaSelectorGroup = document.getElementById('areaSelectorGroup');
    const areaSelect = document.getElementById('areaSelect');
    
    // Elementos del efecto de revelado
    const effectTrigger = document.getElementById('effectTriggerContainer');
    const mainContainer = document.getElementById('mainContainer');
    const effectImage = document.getElementById('effectImage');
    
    // Elementos de carga
    const nominaLoading = document.getElementById('nominaLoading');
    
    // ============================================
    // VARIABLES DE CONTROL
    // ============================================
    let currentUserData = null;
    let isLoginVisible = false;
    let hideTimeout = null;
    let isTouchDevice = false;
    let triggerHideTimeout = null;
    let isClickInsideForm = false;
    let debounceTimeout = null;
    let allAreas = []; // Almacenar todas las áreas disponibles
    
    // URLs de los endpoints
    const VALIDATE_NOMINA_URL = 'php/login/validate_nomina.php';
    const LOGIN_URL = 'php/login/login.php';
    const GET_AREAS_URL = 'php/login/get_areas.php';
    
    // ============================================
    // MAPEO DE ÁREAS A URLs DE REDIRECCIÓN
    // ============================================
    const areaRedirectMap = {
        'DIRECCION_GENERAL': '/proyect_opda/html/direccion_general/direccion_general.html',
        'ATENCION_A_USUARIOS': '/proyect_opda/html/atencion_usuarios/atencion_usuarios.html',
        'RECURSOS_HUMANOS': '/proyect_opda/html/recursos_humanos/recursos_humanos.html',
        'INNOVACION_TECNOLOGICA': '/proyect_opda/html/innovacion_tecnologica/innovacion_tecnologica.html',
        'USER_TESTING': '/proyect_opda/html/user_testing/user_testing.html'
    };
    
    // URL por defecto si el área no está mapeada
    const DEFAULT_REDIRECT = '/proyect_opda/dashboard.html';
    
    function getRedirectUrlByArea(areaNombre) {
        return areaRedirectMap[areaNombre] || DEFAULT_REDIRECT;
    }
    
    // ============================================
    // FUNCIONES DE CARGA DE ÁREAS
    // ============================================
    
    async function loadAreas() {
        try {
            const response = await fetch(GET_AREAS_URL);
            const data = await response.json();
            
            if (data.success && data.areas) {
                allAreas = data.areas;
                populateAreaSelect(allAreas);
                return true;
            } else {
                console.error('Error cargando áreas:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
            return false;
        }
    }
    
    function populateAreaSelect(areas) {
        if (!areaSelect) return;
        
        areaSelect.innerHTML = '<option value="">Seleccione un área...</option>';
        
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = formatAreaName(area.area);
            areaSelect.appendChild(option);
        });
    }
    
    function formatAreaName(areaCode) {
        const nameMap = {
            'DIRECCION_GENERAL': 'Dirección General',
            'ATENCION_A_USUARIOS': 'Atención a Usuarios',
            'RECURSOS_HUMANOS': 'Recursos Humanos',
            'INNOVACION_TECNOLOGICA': 'Innovación Tecnológica',
            'USER_TESTING': 'Usuario de Pruebas'
        };
        return nameMap[areaCode] || areaCode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // ============================================
    // MOSTRAR/OCULTAR SELECTOR DE ÁREA
    // ============================================
    
    function showAreaSelector(puedeCambiarArea, currentAreaId = null) {
        if (!areaSelectorGroup) return;
        
        if (puedeCambiarArea) {
            areaSelectorGroup.style.display = 'block';
            if (currentAreaId && areaSelect) {
                areaSelect.value = currentAreaId;
            }
        } else {
            areaSelectorGroup.style.display = 'none';
            if (areaSelect) areaSelect.value = '';
        }
    }
    
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
        if (loginBtn) loginBtn.disabled = true;
        if (passwordInput) passwordInput.disabled = true;
        showAreaSelector(false);
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
                const isInputFocused = activeElement === workerCodeInput || activeElement === passwordInput || activeElement === areaSelect;
                
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
            
            if (element && element.tagName === 'INPUT') {
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
            const isInputFocused = activeElement === workerCodeInput || activeElement === passwordInput || activeElement === areaSelect;
            
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
            displayText = '✓ Acceso concedido. Redirigiendo...';
        } else if (type === 'error') {
            if (text.includes('nómina') || text.includes('Identificador')) {
                displayText = '⚠️ ' + text.replace('❌', '').trim();
            } else if (text.includes('contraseña')) {
                displayText = '🔒 ' + text.replace('❌', '').trim();
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
    // VALIDACIÓN DE NÓMINA
    // ============================================
    
    async function validateWorkerCode(nomina) {
        if (!nomina || nomina.length < 4) {
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
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const textResponse = await response.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                throw new Error('Respuesta inválida del servidor');
            }
            
            if (data.success && data.data && data.data.user) {
                currentUserData = data.data.user;
                
                // Mostrar u ocultar selector de área según permisos
                showAreaSelector(currentUserData.puede_cambiar_area, currentUserData.area_id);
                
                if (passwordInput) passwordInput.disabled = false;
                if (loginBtn) loginBtn.disabled = false;
                
                clearError('errorWorkerCode');
                clearMessage();
                
                return currentUserData;
            } else {
                currentUserData = null;
                
                if (passwordInput) passwordInput.disabled = true;
                if (loginBtn) loginBtn.disabled = true;
                showAreaSelector(false);
                
                const errorMsg = data.message || 'Nómina no encontrada';
                showError('errorWorkerCode', errorMsg);
                showMessage(errorMsg, 'error');
                return null;
            }
        } catch (error) {
            console.error('Error validando nómina:', error);
            currentUserData = null;
            
            if (passwordInput) passwordInput.disabled = true;
            if (loginBtn) loginBtn.disabled = true;
            showAreaSelector(false);
            
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
        workerCodeInput.addEventListener('input', (e) => {
            clearError('errorWorkerCode');
            clearMessage();
            
            if (debounceTimeout) clearTimeout(debounceTimeout);
            
            const nomina = e.target.value.trim();
            
            if (nomina.length >= 4) {
                debounceTimeout = setTimeout(() => {
                    validateWorkerCode(nomina);
                }, 500);
            } else if (nomina.length === 0) {
                currentUserData = null;
                if (passwordInput) passwordInput.disabled = true;
                if (loginBtn) loginBtn.disabled = true;
                showAreaSelector(false);
            }
        });
        
        workerCodeInput.addEventListener('blur', (e) => {
            const nomina = e.target.value.trim();
            if (nomina.length >= 4 && !currentUserData) {
                validateWorkerCode(nomina);
            }
        });
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
    // HANDLE LOGIN CON REDIRECCIÓN POR ÁREA
    // ============================================
    
    async function handleLogin(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const nomina = workerCodeInput ? workerCodeInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const selectedAreaId = areaSelect && areaSelectorGroup.style.display !== 'none' 
            ? parseInt(areaSelect.value) 
            : null;
        
        if (!nomina) {
            showMessage('Ingrese su número de nómina', 'error');
            if (workerCodeInput) workerCodeInput.focus();
            return;
        }
        
        if (!currentUserData) {
            showMessage('Nómina no válida', 'error');
            return;
        }
        
        // Validar que haya seleccionado un área si tiene permiso para cambiar
        if (currentUserData.puede_cambiar_area && (!selectedAreaId || selectedAreaId === '')) {
            showMessage('Por favor, seleccione el área de trabajo', 'error');
            if (areaSelect) areaSelect.focus();
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
        
        setLoading(true);
        showLoadingMessage('🔍 Verificando credenciales...');
        
        try {
            const loginData = {
                nomina: nomina,
                password: password,
                area_id: selectedAreaId || currentUserData.area_id
            };
            
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const textResponse = await response.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                throw new Error('Respuesta inválida del servidor');
            }
            
            clearLoadingMessage();
            
            if (data.success) {
                const user = data.data.user;
                // Determinar redirección según el ÁREA (no por rol)
                const redirectUrl = getRedirectUrlByArea(user.area_nombre);
                
                showMessage(`✅ Acceso concedido - ${formatAreaName(user.area_nombre)}`, 'success');
                
                if (sessionStorage) {
                    sessionStorage.setItem('usuario', JSON.stringify(user));
                }
                
                const esPrimerInicio = user.primer_inicio === true;
                
                setTimeout(() => {
                    if (esPrimerInicio) {
                        window.location.href = 'html/cambio_contraseña/cambio_contraseña.html';
                    } else {
                        window.location.href = redirectUrl;
                    }
                }, 1500);
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
    // INICIALIZACIÓN
    // ============================================
    
    async function init() {
        await loadAreas();
        
        setupTrigger();
        setupHideOnTriggerLeave();
        setupHideOnMouseLeaveDocument();
        
        // Inicialmente deshabilitar campos de login
        if (passwordInput) passwordInput.disabled = true;
        if (loginBtn) loginBtn.disabled = true;
        showAreaSelector(false);
        
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
        console.log('%c✅ Versión con efecto de revelado y redirección por ÁREA', 'color: #4CAF50; font-size: 12px;');
    }
    
    init();
});