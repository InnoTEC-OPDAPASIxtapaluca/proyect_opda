// SISTEMA DE ACCESO INSTITUCIONAL - CON BASE DE DATOS
// VERSIÓN CORREGIDA - PROBLEMA DE FOCO EN INPUTS RESUELTO

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const form = document.getElementById('loginForm');
    const nominaInput = document.getElementById('nomina');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const messageContainer = document.getElementById('errorMessage');
    const togglePasswordBtn = document.getElementById('togglePassword');
    
    // Elementos del efecto de revelado
    const effectTrigger = document.getElementById('effectTriggerContainer');
    const mainContainer = document.getElementById('mainContainer');
    const effectImage = document.getElementById('effectImage');

    // URL del endpoint de login
    const LOGIN_URL = 'php/login/login.php';

    // Variables de control
    let isLoginVisible = false;
    let hideTimeout = null;
    let isTouchDevice = false;
    let triggerHideTimeout = null;
    
    // NUEVA VARIABLE: Para controlar si estamos haciendo clic dentro del formulario
    let isClickInsideForm = false;

    // Detectar dispositivo táctil
    function detectTouchDevice() {
        isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        return isTouchDevice;
    }

    // Función para mostrar el login
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
            if (nominaInput && isLoginVisible) {
                nominaInput.focus();
            }
        }, 600);
    }

    // Función para ocultar el login
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
    }

    // ============================================
    // NUEVA ESTRATEGIA: Bloquear cierre cuando se interactúa con inputs
    // ============================================
    
    // 1. Prevenir cualquier cierre cuando el mouse está DENTRO del formulario
    if (mainContainer) {
        mainContainer.addEventListener('mouseenter', () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            // Cancelar cualquier cierre pendiente del trigger
            if (triggerHideTimeout) {
                clearTimeout(triggerHideTimeout);
                triggerHideTimeout = null;
            }
        });
        
        mainContainer.addEventListener('mouseleave', () => {
            // Solo ocultar si NO estamos sobre un input activo
            // y si el mouse no está sobre algún elemento interactivo del formulario
            if (isLoginVisible && !isTouchDevice) {
                // Verificar si algún input tiene el foco
                const activeElement = document.activeElement;
                const isInputFocused = activeElement === nominaInput || activeElement === passwordInput;
                
                if (!isInputFocused) {
                    hideTimeout = setTimeout(() => {
                        hideLogin();
                    }, 300);
                }
            }
        });
    }
    
    // 2. Prevenir cierre cuando se hace clic en inputs o en el botón
    const formElements = [nominaInput, passwordInput, loginBtn, togglePasswordBtn];
    formElements.forEach(element => {
        if (element) {
            element.addEventListener('mousedown', (e) => {
                // Evitar que el evento se propague al documento
                e.stopPropagation();
                // Marcar que estamos dentro del formulario
                isClickInsideForm = true;
            });
            
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                isClickInsideForm = true;
                // Pequeño delay para resetear la bandera
                setTimeout(() => {
                    isClickInsideForm = false;
                }, 100);
            });
            
            // Para inputs, también asegurar el focus
            if (element.tagName === 'INPUT') {
                element.addEventListener('focus', (e) => {
                    e.stopPropagation();
                    // Asegurar que el login siga visible
                    if (isLoginVisible) {
                        // Cancelar cualquier cierre pendiente
                        if (hideTimeout) {
                            clearTimeout(hideTimeout);
                            hideTimeout = null;
                        }
                    }
                });
            }
        }
    });
    
    // 3. Control de cierre por clic fuera (VERSIÓN SUAVE)
    document.addEventListener('mousedown', (e) => {
        if (!isLoginVisible) return;
        
        // Verificar si el clic fue dentro del mainContainer
        const isClickInsideMain = mainContainer && mainContainer.contains(e.target);
        const isClickOnTrigger = effectTrigger && effectTrigger.contains(e.target);
        
        // Si estamos dentro del formulario o trigger, NO hacer nada
        if (isClickInsideMain || isClickOnTrigger) {
            return;
        }
        
        // Si el clic fue fuera, ocultar el login
        hideLogin();
    });

    // Función para manejar el trigger (hover/click)
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

    // Función para manejar cierre al salir del trigger
    function setupHideOnTriggerLeave() {
        if (!effectTrigger) return;
        
        effectTrigger.addEventListener('mouseleave', () => {
            if (!isLoginVisible) return;
            
            // Verificar si el mouse está dentro del mainContainer o si algún input tiene foco
            const isMouseOverMain = mainContainer && mainContainer.matches(':hover');
            const activeElement = document.activeElement;
            const isInputFocused = activeElement === nominaInput || activeElement === passwordInput;
            
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

    // Función para manejar cierre al salir del documento
    function setupHideOnMouseLeaveDocument() {
        document.addEventListener('mouseleave', () => {
            if (isLoginVisible && !isTouchDevice) {
                hideLogin();
            }
        });
    }

    // Mostrar mensajes
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
    
    if (nominaInput) nominaInput.addEventListener('input', clearMessage);
    if (passwordInput) passwordInput.addEventListener('input', clearMessage);

    // Toggle mostrar/ocultar contraseña
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const svg = togglePasswordBtn.querySelector('svg');
            if (svg) {
                if (type === 'text') {
                    svg.innerHTML = `
                        <path d="M12 5C5 5 2 12 2 12C2 12 5 19 12 19C19 19 22 12 22 12C22 12 19 5 12 5Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    `;
                } else {
                    svg.innerHTML = `
                        <path d="M12 5C5 5 2 12 2 12C2 12 5 19 12 19C19 19 22 12 22 12C22 12 19 5 12 5Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    `;
                }
            }
        });
    }

    function validateNomina(nomina) {
        const regex = /^\d{4,}$/;
        return regex.test(nomina);
    }

    function validatePassword(password) {
        return password.length >= 4;
    }

    function setLoading(isLoading) {
        if (loginBtn) {
            if (isLoading) {
                loginBtn.classList.add('loading');
                const btnText = loginBtn.querySelector('.btn-text');
                if (btnText) btnText.innerHTML = 'Verificando acceso';
                loginBtn.disabled = true;
            } else {
                loginBtn.classList.remove('loading');
                const btnText = loginBtn.querySelector('.btn-text');
                if (btnText) btnText.innerHTML = 'Iniciar Sesión';
                loginBtn.disabled = false;
            }
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const nomina = nominaInput ? nominaInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        
        if (!nomina) {
            showMessage('Ingrese su número de nómina', 'error');
            if (nominaInput) nominaInput.focus();
            return;
        }
        
        if (!password) {
            showMessage('Ingrese su contraseña', 'error');
            if (passwordInput) passwordInput.focus();
            return;
        }
        
        if (!validateNomina(nomina)) {
            showMessage('La nómina debe contener solo números (mínimo 4 dígitos)', 'error');
            if (nominaInput) nominaInput.focus();
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
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nomina: nomina,
                    password: password
                })
            });
            
            const data = await response.json();
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
                showMessage('Error en credenciales', 'error');
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            }
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
            clearLoadingMessage();
            showMessage('Error en credenciales', 'error');
        }
    }
    
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // Inicializar
    setupTrigger();
    setupHideOnTriggerLeave();
    setupHideOnMouseLeaveDocument();
    
    // Efecto de focus en inputs
    const inputs = document.querySelectorAll('.input-field input');
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
    
    console.log('%c🏛️ SISTEMA DE ACCESO INSTITUCIONAL - CORREGIDO', 'color: #e8d5a3; font-size: 14px; font-weight: bold;');
    console.log('%c✅ Problema de foco en inputs resuelto', 'color: #4CAF50; font-size: 12px;');
});