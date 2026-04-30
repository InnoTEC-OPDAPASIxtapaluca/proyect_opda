// js/login/login.js
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nomina = document.getElementById('nomina').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    messageDiv.innerHTML = 'Verificando...';
    messageDiv.style.background = '#e7f3ff';
    messageDiv.style.color = '#004085';
    
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
        
        if (data.success) {
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.innerHTML = '✅ Login exitoso! Redirigiendo...';
            setTimeout(() => {
                window.location.href = 'html/interfaz_general.html';
            }, 1000);
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