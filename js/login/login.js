// js/login/login.js

// Variable para controlar el audio
let welcomeAudio = null;
let audioPreparado = false;

// Función para PREPARAR el audio (cargarlo antes)
function prepararAudio() {
    if (!audioPreparado) {
        const audioPath = 'audios/index/bienvenido.mp3';
        welcomeAudio = new Audio(audioPath);
        welcomeAudio.volume = 0.8;
        welcomeAudio.load(); // Precargar el audio
        audioPreparado = true;
        console.log('Audio preparado:', audioPath);
    }
}

// Función para reproducir audio (se llama inmediatamente después del clic)
function playWelcomeAudio() {
    if (welcomeAudio) {
        welcomeAudio.currentTime = 0; // Reiniciar
        const playPromise = welcomeAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ Audio reproduciéndose correctamente');
            }).catch(error => {
                console.error('❌ Error al reproducir:', error);
                // Intentar crear uno nuevo en el momento
                const audioNuevo = new Audio('audios/index/bienvenido.mp3');
                audioNuevo.volume = 0.8;
                audioNuevo.play().catch(e => console.error('Falló segundo intento:', e));
            });
        }
    } else {
        // Si no está preparado, crearlo ahora
        welcomeAudio = new Audio('audios/index/bienvenido.mp3');
        welcomeAudio.volume = 0.8;
        welcomeAudio.play().catch(e => console.error('Error:', e));
    }
}

// Función para detener el audio
function stopWelcomeAudio() {
    if (welcomeAudio) {
        welcomeAudio.pause();
        welcomeAudio.currentTime = 0;
        console.log('Audio detenido');
    }
}

// PREPARAR EL AUDIO CUANDO EL USUARIO INTERACTÚA CON EL INPUT
document.getElementById('nomina').addEventListener('focus', function() {
    prepararAudio();
});

document.getElementById('password').addEventListener('focus', function() {
    prepararAudio();
});

// También preparar al hacer clic en el botón
document.getElementById('loginBtn').addEventListener('click', function() {
    prepararAudio();
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nomina = document.getElementById('nomina').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnIcon = loginBtn.querySelector('.btn-icon');
    
    // Deshabilitar botón mientras se procesa
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0.7';
    
    // Mostrar loading en el botón
    const originalText = btnText.textContent;
    btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    btnIcon.style.display = 'none';
    
    try {
        const response = await fetch('php/login/login.php', {
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
        
        console.log('Respuesta:', data);
        
        if (data.require_password_change === true) {
            // ========== CASO: REQUIERE CAMBIO DE CONTRASEÑA ==========
            // NO reproducir audio
            // NO mostrar overlay de carga
            
            // Detener audio si estaba sonando
            stopWelcomeAudio();
            
            // Mostrar mensaje
            showToastMessage('⚠️ ' + data.message + '. Redirigiendo...', 'warning');
            
            // Guardar en sessionStorage
            sessionStorage.setItem('temp_nomina', nomina);
            
            // Redirigir directamente sin overlay
            setTimeout(() => {
                window.location.href = 'html/cambio_contraseña/cambio_contraseña.html';
            }, 1500);
            
        } else if (data.success === true) {
            // ========== LOGIN EXITOSO ==========
            // Reproducir audio INMEDIATAMENTE
            playWelcomeAudio();
            
            // Mostrar overlay con círculo de carga
            showLoadingOverlay();
            
            // Redirigir después de 2.5 segundos
            setTimeout(() => {
                window.location.href = 'html/interfaz_general.html';
            }, 2500);
            
        } else {
            // ========== LOGIN FALLIDO ==========
            // Detener audio si estaba sonando
            stopWelcomeAudio();
            
            showToastMessage('❌ ' + data.message, 'error');
            btnText.textContent = originalText;
            btnIcon.style.display = 'inline-flex';
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
        }
    } catch (error) {
        console.error('Error:', error);
        stopWelcomeAudio();
        showToastMessage('❌ Error de conexión', 'error');
        btnText.textContent = originalText;
        btnIcon.style.display = 'inline-flex';
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
    }
});

// Función para mostrar overlay de carga
function showLoadingOverlay() {
    if (document.getElementById('loadingOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    
    overlay.innerHTML = `
        <div class="loading-container">
            <div class="loading-ring">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="loading-text">
                <i class="fas fa-language"></i>
                <span>Cargando gramáticas...</span>
            </div>
            <div class="loading-dots">
                <span>.</span><span>.</span><span>.</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
}

function showToastMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'block';
    
    if (type === 'error') {
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
    } else if (type === 'warning') {
        messageDiv.style.background = '#fff3cd';
        messageDiv.style.color = '#856404';
    } else {
        messageDiv.style.background = '#d4edda';
        messageDiv.style.color = '#155724';
    }
    
    messageDiv.innerHTML = message;
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}