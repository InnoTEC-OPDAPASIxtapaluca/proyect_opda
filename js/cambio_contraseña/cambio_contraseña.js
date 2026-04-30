// js/cambio_contraseña/cambio_contraseña.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cambioPasswordForm');
    
    if (!form) {
        console.error('No se encontró el formulario');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        const messageDiv = document.getElementById('message');
        
        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ Las contraseñas no coinciden';
            return;
        }
        
        // Validar longitud mínima
        if (newPassword.length < 6) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ La contraseña debe tener al menos 6 caracteres';
            return;
        }
        
        messageDiv.innerHTML = 'Actualizando contraseña...';
        messageDiv.style.background = '#e7f3ff';
        messageDiv.style.color = '#004085';
        
        // Obtener la nómina del sessionStorage (guardada durante el login)
        const nomina = sessionStorage.getItem('temp_nomina');
        
        console.log('Nómina recuperada:', nomina);
        
        if (!nomina) {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ Error: No se encontró la información del usuario';
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
                setTimeout(() => {
                    window.location.href = '../../login.html';
                }, 1500);
            } else {
                messageDiv.style.background = '#f8d7da';
                messageDiv.style.color = '#721c24';
                messageDiv.innerHTML = '❌ ' + data.message;
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.innerHTML = '❌ Error de conexión con el servidor';
        }
    });
});