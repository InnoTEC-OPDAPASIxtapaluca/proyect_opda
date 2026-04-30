// js/cambio_contraseña/cambio_contraseña.js
document.addEventListener('DOMContentLoaded', function() {
    // ==================== ELEMENTOS DEL DOM ====================
    const form = document.getElementById('cambioPasswordForm');
    const newPasswordInput = document.getElementById('new_password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const messageDiv = document.getElementById('message');
    
    // Elementos de validación
    const ruleLength = document.getElementById('rule-length');
    const ruleNumber = document.getElementById('rule-number');
    const ruleUppercase = document.getElementById('rule-uppercase');
    const ruleLowercase = document.getElementById('rule-lowercase');
    const ruleSpecial = document.getElementById('rule-special');
    const ruleMatch = document.getElementById('rule-match');
    
    // Toggles de contraseña
    const toggleNew = document.querySelector('.toggle-new');
    const toggleConfirm = document.querySelector('.toggle-confirm');
    
    // ==================== FUNCIÓN: VALIDAR CONTRASEÑA ====================
    function validatePassword() {
        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;
        
        // Reglas de validación
        const lengthValid = newPass.length >= 12;
        const numberValid = /[0-9]/.test(newPass);
        const uppercaseValid = /[A-Z]/.test(newPass);
        const lowercaseValid = /[a-z]/.test(newPass);
        const specialValid = /[!@#$%^&*(),.?":{}|<>]/.test(newPass);
        const matchValid = newPass === confirmPass && newPass !== '' && confirmPass !== '';
        
        // Actualizar indicadores visuales
        updateRuleStatus(ruleLength, lengthValid);
        updateRuleStatus(ruleNumber, numberValid);
        updateRuleStatus(ruleUppercase, uppercaseValid);
        updateRuleStatus(ruleLowercase, lowercaseValid);
        updateRuleStatus(ruleSpecial, specialValid);
        updateRuleStatus(ruleMatch, matchValid);
        
        // Verificar si todas las reglas se cumplen
        const allValid = lengthValid && numberValid && uppercaseValid && 
                         lowercaseValid && specialValid && matchValid;
        
        // Habilitar/deshabilitar botón guardar
        if (allValid) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        } else {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';
            saveBtn.style.cursor = 'not-allowed';
        }
        
        return allValid;
    }
    
    // ==================== FUNCIÓN: ACTUALIZAR ESTADO DE REGLA ====================
    function updateRuleStatus(ruleElement, isValid) {
        if (isValid) {
            ruleElement.classList.add('valid');
            ruleElement.querySelector('i').className = 'fas fa-check-circle';
        } else {
            ruleElement.classList.remove('valid');
            ruleElement.querySelector('i').className = 'fas fa-circle';
        }
    }
    
    // ==================== TOGGLE CONTRASEÑA ====================
    if (toggleNew) {
        toggleNew.addEventListener('click', function() {
            const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            newPasswordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleConfirm) {
        toggleConfirm.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    // ==================== EVENTOS DE VALIDACIÓN ====================
    newPasswordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePassword);
    
    // ==================== BOTÓN CANCELAR ====================
    cancelBtn.addEventListener('click', async function() {
        const result = await Swal.fire({
            title: '¿Cancelar cambio?',
            text: 'Si cancelas, no se guardarán los cambios y tendrás que iniciar sesión nuevamente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#691a30',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'Seguir editando'
        });
        
        if (result.isConfirmed) {
            sessionStorage.removeItem('temp_nomina');
            window.location.href = '../../login.html';
        }
    });
    
    // ==================== ENVÍO DEL FORMULARIO ====================
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validaciones
        if (newPassword !== confirmPassword) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ Las contraseñas no coinciden';
            return;
        }
        
        if (newPassword.length < 12) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ La contraseña debe tener al menos 12 caracteres';
            return;
        }
        
        if (!/[0-9]/.test(newPassword)) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ La contraseña debe contener al menos 1 número';
            return;
        }
        
        if (!/[A-Z]/.test(newPassword)) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ La contraseña debe contener al menos 1 mayúscula';
            return;
        }
        
        if (!/[a-z]/.test(newPassword)) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ La contraseña debe contener al menos 1 minúscula';
            return;
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ La contraseña debe contener al menos 1 carácter especial (!@#$%^&*)';
            return;
        }
        
        // Deshabilitar botón y mostrar carga
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="btn-text"><i class="fas fa-spinner fa-spin"></i> Actualizando...</span>';
        
        messageDiv.innerHTML = 'Actualizando contraseña...';
        messageDiv.style.background = '#e7f3ff';
        messageDiv.style.color = '#004085';
        
        const nomina = sessionStorage.getItem('temp_nomina');
        
        console.log('Nómina recuperada:', nomina);
        
        if (!nomina) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ Error: No se encontró la información del usuario';
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="btn-text">Guardar Contraseña</span><span class="btn-icon"><i class="fas fa-save"></i></span><span class="btn-ripple"></span>';
            return;
        }
        
        try {
            const response = await fetch('../../php/cambio_contraseña/actualizar_contraseña.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nomina: nomina,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            console.log('Respuesta del servidor:', data);
            
            if (data.success) {
                messageDiv.style.background = '#d4edda';
                messageDiv.style.color = '#155724';
                messageDiv.innerHTML = '✅ Contraseña actualizada correctamente! Redirigiendo al login...';
                
                sessionStorage.removeItem('temp_nomina');
                
                await Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña Actualizada!',
                    text: 'Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión.',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    color: '#691a30'
                });
                
                setTimeout(() => {
                    window.location.href = '../../login.html';
                }, 500);
            } else {
                messageDiv.style.background = '#f8d7da';
                messageDiv.style.color = '#721c24';
                messageDiv.innerHTML = '❌ ' + data.message;
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<span class="btn-text">Guardar Contraseña</span><span class="btn-icon"><i class="fas fa-save"></i></span><span class="btn-ripple"></span>';
                validatePassword();
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ Error de conexión con el servidor';
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="btn-text">Guardar Contraseña</span><span class="btn-icon"><i class="fas fa-save"></i></span><span class="btn-ripple"></span>';
        }
    });
    
    // Validación inicial
    validatePassword();
});