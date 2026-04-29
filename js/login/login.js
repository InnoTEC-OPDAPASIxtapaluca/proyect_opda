// SISTEMA DE ACCESO INSTITUCIONAL

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // ELEMENTOS DOM PRINCIPALES
    // ============================================
    const form = document.getElementById('loginForm');
    const workerCodeInput = document.getElementById('workerCode');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const areaSelectorGroup = document.getElementById('areaSelectorGroup');
    const areaSelect = document.getElementById('areaSelect');
    
    // Elementos de carga
    const nominaLoading = document.getElementById('nominaLoading');
    
    // ============================================
    // VARIABLES DE CONTROL
    // ============================================
    let currentUserData = null;
    let debounceTimeout = null;
    let allAreas = [];
    
    // URLs de los endpoints
    const VALIDATE_NOMINA_URL = 'php/login/validate_nomina.php';
    const LOGIN_URL = 'php/login/login.php';
    const GET_AREAS_URL = 'php/login/get_areas.php';
    const GET_ALL_AREAS_URL = 'php/login/get_all_areas.php';
    
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
            
            console.log('Respuesta de get_areas:', data);
            
            if (data.success && data.data && data.data.areas) {
                allAreas = data.data.areas;
                populateAreaSelect(allAreas);
                return true;
            } 
            else if (data.success && data.areas) {
                allAreas = data.areas;
                populateAreaSelect(allAreas);
                return true;
            }
            else {
                console.error('Error cargando áreas:', data.message);
                if (areaSelect) {
                    areaSelect.innerHTML = '<option value="">Error al cargar áreas</option>';
                }
                return false;
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
            if (areaSelect) {
                areaSelect.innerHTML = '<option value="">Error de conexión</option>';
            }
            return false;
        }
    }
    
    async function loadAllAreas() {
        try {
            const response = await fetch(GET_ALL_AREAS_URL);
            const data = await response.json();
            
            console.log('Respuesta de get_all_areas:', data);
            
            if (data.success && data.data && data.data.areas) {
                return data.data.areas;
            } else if (data.success && data.areas) {
                return data.areas;
            } else {
                console.error('Error cargando todas las áreas:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching all areas:', error);
            return [];
        }
    }
    
    function populateAreaSelect(areas) {
        if (!areaSelect) return;
        
        areaSelect.innerHTML = '<option value="">Seleccione un área...</option>';
        
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            // Mostrar el nombre EXACTAMENTE como viene de la base de datos (en mayúsculas)
            option.textContent = area.area;
            areaSelect.appendChild(option);
        });
    }
    
    // ============================================
    // MODAL PARA SELECCIONAR ÁREA POST-LOGIN
    // ============================================
    
    async function showAreaSelectionModal(userData) {
        return new Promise(async (resolve) => {
            const allAreasList = await loadAllAreas();
            
            if (allAreasList.length === 0) {
                resolve(userData.area_id);
                return;
            }
            
            // Crear el modal
            const modalHtml = `
                <div class="area-selection-modal" id="areaSelectionModal">
                    <div class="area-modal-content">
                        <div class="area-modal-header">
                            <i class="fas fa-building"></i>
                            <h2>Seleccionar Área de Trabajo</h2>
                        </div>
                        <div class="area-modal-body">
                            <p>Hola <strong>${userData.nombre} ${userData.apellido_paterno}</strong>,</p>
                            <p>Por favor selecciona el área a la que deseas acceder:</p>
                            <div class="area-select-wrapper">
                                <select id="postLoginAreaSelect" class="area-select-premium">
                                    <option value="">-- Seleccione un área --</option>
                                    ${allAreasList.map(area => `
                                        <option value="${area.id}" ${area.id == userData.area_id ? 'selected' : ''}>
                                            ${area.area}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="area-modal-footer">
                            <button id="confirmAreaBtn" class="area-modal-btn area-modal-btn-confirm">
                                <i class="fas fa-check"></i> Acceder
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar modal al body
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);
            
            const modal = document.getElementById('areaSelectionModal');
            const select = document.getElementById('postLoginAreaSelect');
            const confirmBtn = document.getElementById('confirmAreaBtn');
            
            // Estilos del modal
            const style = document.createElement('style');
            style.textContent = `
                .area-selection-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 20000;
                    animation: fadeInModal 0.3s ease;
                }
                
                @keyframes fadeInModal {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .area-modal-content {
                    background: linear-gradient(145deg, #1a1a24 0%, #14141e 100%);
                    border-radius: 24px;
                    padding: 30px;
                    width: 90%;
                    max-width: 450px;
                    border: 1px solid rgba(187, 147, 88, 0.3);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    animation: scaleInModal 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @keyframes scaleInModal {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .area-modal-header {
                    text-align: center;
                    margin-bottom: 25px;
                }
                
                .area-modal-header i {
                    font-size: 3rem;
                    color: #bb9358;
                    margin-bottom: 10px;
                }
                
                .area-modal-header h2 {
                    color: #ffffff;
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                
                .area-modal-body {
                    margin-bottom: 25px;
                }
                
                .area-modal-body p {
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 15px;
                    line-height: 1.5;
                }
                
                .area-select-wrapper {
                    margin-top: 20px;
                }
                
                .area-select-premium {
                    width: 100%;
                    padding: 14px 18px;
                    background: linear-gradient(145deg, #1e1e2a, #181824);
                    border: 2px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    color: #ffffff;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .area-select-premium:focus {
                    outline: none;
                    border-color: #bb9358;
                }
                
                .area-modal-footer {
                    display: flex;
                    justify-content: center;
                }
                
                .area-modal-btn {
                    padding: 14px 30px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1rem;
                    border: none;
                }
                
                .area-modal-btn-confirm {
                    background: linear-gradient(145deg, #691a30 0%, #8a1c3a 100%);
                    color: white;
                    width: 100%;
                    justify-content: center;
                }
                
                .area-modal-btn-confirm:hover {
                    background: linear-gradient(145deg, #7a1e38 0%, #9b2142 100%);
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
            
            // Manejar confirmación
            const handleConfirm = () => {
                const selectedId = parseInt(select.value);
                if (selectedId && !isNaN(selectedId)) {
                    modal.remove();
                    resolve(selectedId);
                } else {
                    let errorDiv = modal.querySelector('.area-modal-error');
                    if (!errorDiv) {
                        errorDiv = document.createElement('div');
                        errorDiv.className = 'area-modal-error';
                        errorDiv.style.cssText = 'color: #ff6b6b; margin-top: 15px; text-align: center; font-size: 0.9rem;';
                        modal.querySelector('.area-modal-body').appendChild(errorDiv);
                    }
                    errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Por favor seleccione un área';
                    setTimeout(() => errorDiv.remove(), 3000);
                }
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            
            select.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirm();
                }
            });
        });
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
    // FUNCIONES DE MENSAJES
    // ============================================
    
    const messageContainer = document.getElementById('errorMessage');
    
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
                
                showAreaSelector(currentUserData.puede_cambiar_area, currentUserData.area_id);
                
                if (passwordInput) {
                    passwordInput.disabled = false;
                    passwordInput.focus();
                }
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
                
                let finalAreaId = user.area_id;
                let finalAreaNombre = user.area_nombre;
                
                if (!user.primer_inicio && user.puede_cambiar_area) {
                    const selectedAreaIdFromModal = await showAreaSelectionModal(user);
                    if (selectedAreaIdFromModal) {
                        finalAreaId = selectedAreaIdFromModal;
                        const allAreasList = await loadAllAreas();
                        const selectedArea = allAreasList.find(a => a.id === selectedAreaIdFromModal);
                        if (selectedArea) {
                            finalAreaNombre = selectedArea.area;
                        }
                    }
                }
                
                const redirectUrl = getRedirectUrlByArea(finalAreaNombre);
                showMessage(`✅ Acceso concedido - ${finalAreaNombre}`, 'success');
                
                const userToStore = {
                    ...user,
                    area_id: finalAreaId,
                    area_nombre: finalAreaNombre
                };
                
                if (sessionStorage) {
                    sessionStorage.setItem('usuario', JSON.stringify(userToStore));
                }
                
                setTimeout(() => {
                    window.location.href = redirectUrl;
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
        
        if (passwordInput) passwordInput.disabled = true;
        if (loginBtn) loginBtn.disabled = true;
        showAreaSelector(false);
        
        console.log('%c🏛️ SISTEMA DE ACCESO INSTITUCIONAL', 'color: #e8d5a3; font-size: 14px; font-weight: bold;');
        console.log('%c✅ Versión con auto-focus a contraseña y selector post-login', 'color: #4CAF50; font-size: 12px;');
    }
    
    init();
});